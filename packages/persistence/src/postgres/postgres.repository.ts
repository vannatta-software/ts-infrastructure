import { Entity, getUniqueProperties } from '@vannatta-software/ts-utils-domain';
import { Mediator, ApiException } from '@vannatta-software/ts-utils-server';
import { PostgresSchema } from './postgres.schema';
import { ILogger } from '@vannatta-software/ts-utils-server';
import { DataSource, Repository, ObjectLiteral, Not } from 'typeorm'; // Import Not
import { ClassType } from '@vannatta-software/ts-utils-server';
import { IRepository } from '../repository.interface';

export class PostgresRepository<T extends Entity> implements IRepository<T> {
    protected readonly logger: ILogger;
    private typeOrmRepository: Repository<ObjectLiteral>;
    private hydrateFn: ((document: any) => T) | undefined;

    constructor(
        private readonly mediator: Mediator,
        private readonly dataSource: DataSource,
        private readonly entityClass: ClassType<T>,
        logger: ILogger
    ) {
        this.logger = logger;
        const typeOrmEntity = PostgresSchema.getTypeOrmEntity(entityClass);
        this.typeOrmRepository = this.dataSource.getRepository(typeOrmEntity);
    }

    public onHydrate(hydrate: (document: any) => T) {
        this.hydrateFn = hydrate;
    }

    async findAll(): Promise<T[]> {
        const docs = await this.typeOrmRepository.find();
        return docs.map(doc => this.hydrate(doc));
    }

    async findById(id: string): Promise<T | null> {
        const doc = await this.typeOrmRepository.findOneBy({ id });
        return doc ? this.hydrate(doc) : null;
    }

    async insert(entity: T): Promise<void> {
        const uniqueProperties = getUniqueProperties(entity.constructor);
        if (uniqueProperties.length > 0) {
            const uniqueQuery: Record<string, any> = {};
            for (const prop of uniqueProperties) {
                uniqueQuery[prop] = (entity as any)[prop];
            }

            const existingCount = await this.typeOrmRepository.count({ where: uniqueQuery });
            if (existingCount > 0) {
                throw new ApiException(
                    `Entity with unique properties ${JSON.stringify(uniqueQuery)} already exists.`,
                    { code: ['UNIQUE_CONSTRAINT_VIOLATION'] }
                );
            }
        }

        entity.create();
        await this.typeOrmRepository.save(entity.document);
        this.mediator.publishEvents(entity);
    }

    async update(entity: T): Promise<void> {
        const id = entity.id.value;

        if (!await this.typeOrmRepository.existsBy({ id })) {
            throw new ApiException(`Entity with ID ${id} not found for update.`, { code: ['ENTITY_NOT_FOUND'] });
        }

        const uniqueProperties = getUniqueProperties(entity.constructor);
        if (uniqueProperties.length > 0) {
            const uniqueQuery: Record<string, any> = {};
            for (const prop of uniqueProperties) {
                uniqueQuery[prop] = (entity as any)[prop];
            }
            // Exclude the current entity by its ID
            uniqueQuery['id'] = Not(id);

            const existingCount = await this.typeOrmRepository.count({ where: uniqueQuery });
            if (existingCount > 0) {
                throw new ApiException(
                    `Entity with unique properties ${JSON.stringify(uniqueQuery)} already exists.`,
                    { code: ['UNIQUE_CONSTRAINT_VIOLATION'] }
                );
            }
        }

        await this.typeOrmRepository.save(entity.document);
        this.mediator.publishEvents(entity);
    }

    async delete(entity: T): Promise<void> {
        const id = entity.id.value;
        const deleteResult = await this.typeOrmRepository.delete(id);
        if (deleteResult.affected === 0) {
            throw new ApiException(`Entity with ID ${id} not found for deletion.`, { code: ['ENTITY_NOT_FOUND'] });
        }
        entity.delete();
        this.mediator.publishEvents(entity);
    }

    async search(queryObject: any): Promise<T[]> {
        const docs = await this.typeOrmRepository.find({ where: queryObject });
        return docs.map(doc => this.hydrate(doc));
    }

    async aggregate(pipeline: any): Promise<T[]> {
        // For TypeORM, a simple aggregation might just return all entities or apply a basic filter.
        // A full aggregation engine would require more specific TypeORM query builder usage or raw queries.
        // For now, we'll just return all entities.
        return this.findAll();
    }

    private hydrate(document: any): T {
        if (!this.hydrateFn) {
            throw new ApiException('Hydrate function not set. Call onHydrate() first.', { code: ['HYDRATE_FUNCTION_NOT_SET'] });
        }
        return this.hydrateFn(document);
    }
}
