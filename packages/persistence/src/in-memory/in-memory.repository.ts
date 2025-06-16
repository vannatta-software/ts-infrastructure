import { Entity, getUniqueProperties } from '@vannatta-software/ts-utils-domain';
import { IRepository, Mediator, ApiException } from '@vannatta-software/ts-utils-server';

export class InMemoryRepository<T extends Entity> implements IRepository<T> {
    private entities = new Map<string, T>();
    private hydrateFn: ((document: any) => T) | undefined;

    constructor(private readonly mediator: Mediator) {
        // Mediator is injected to publish domain events
    }

    onHydrate(hydrate: (document: any) => T): void {
        this.hydrateFn = hydrate;
    }

    async findAll(): Promise<T[]> {
        return Array.from(this.entities.values());
    }

    async findById(id: string): Promise<T | null> {
        return this.entities.get(id) || null;
    }

    async insert(entity: T): Promise<void> {
        if (this.entities.has(entity.id.value)) {
            throw new ApiException(`Entity with ID ${entity.id.value} already exists.`, { code: ['ENTITY_ALREADY_EXISTS'] });
        }

        const uniqueProperties = getUniqueProperties(entity.constructor);
        if (uniqueProperties.length > 0) {
            const existingEntityWithSameUniqueKey = Array.from(this.entities.values()).find(
                (e) => e.compositeUniqueKey === entity.compositeUniqueKey
            );
            if (existingEntityWithSameUniqueKey) {
                throw new ApiException(
                    `Entity with unique properties ${entity.compositeUniqueKey} already exists.`,
                    { code: ['UNIQUE_CONSTRAINT_VIOLATION'] }
                );
            }
        }

        this.entities.set(entity.id.value, entity);
        await this.mediator.publishEvents(entity); // Publish events after insert
    }

    async update(entity: T): Promise<void> {
        if (!this.entities.has(entity.id.value)) {
            throw new ApiException(`Entity with ID ${entity.id.value} not found for update.`, { code: ['ENTITY_NOT_FOUND'] });
        }

        const uniqueProperties = getUniqueProperties(entity.constructor);
        if (uniqueProperties.length > 0) {
            const existingEntityWithSameUniqueKey = Array.from(this.entities.values()).find(
                (e) => e.compositeUniqueKey === entity.compositeUniqueKey && e.id.value !== entity.id.value
            );
            if (existingEntityWithSameUniqueKey) {
                throw new ApiException(
                    `Entity with unique properties ${entity.compositeUniqueKey} already exists.`,
                    { code: ['UNIQUE_CONSTRAINT_VIOLATION'] }
                );
            }
        }

        this.entities.set(entity.id.value, entity);
        await this.mediator.publishEvents(entity); // Publish events after update
    }

    async delete(entity: T): Promise<void> {
        if (!this.entities.has(entity.id.value)) {
            throw new ApiException(`Entity with ID ${entity.id.value} not found for deletion.`, { code: ['ENTITY_NOT_FOUND'] });
        }
        this.entities.delete(entity.id.value);
        await this.mediator.publishEvents(entity); // Publish events after delete
    }

    async search(queryObject: any): Promise<T[]> {
        // Simple search implementation for in-memory: checks for partial matches on string properties
        const results: T[] = [];
        const queryKeys = Object.keys(queryObject);

        if (queryKeys.length === 0) {
            return this.findAll(); // If no query, return all
        }

        for (const entity of this.entities.values()) {
            let match = true;
            for (const key of queryKeys) {
                const entityValue = (entity as any)[key];
                const queryValue = queryObject[key];

                if (typeof entityValue === 'string' && typeof queryValue === 'string') {
                    if (!entityValue.includes(queryValue)) {
                        match = false;
                        break;
                    }
                } else if (entityValue !== queryValue) {
                    match = false;
                    break;
                }
            }
            if (match) {
                results.push(entity);
            }
        }
        return results;
    }

    async aggregate(pipeline: any): Promise<T[]> {
        // For in-memory, a simple aggregation might just return all entities or filter based on a simple pipeline.
        // A full aggregation engine is out of scope for a simple InMemoryRepository.
        // For now, we'll just return all entities, or apply a basic filter if the pipeline is a function.
        if (typeof pipeline === 'function') {
            return Array.from(this.entities.values()).filter(pipeline);
        }
        return Array.from(this.entities.values());
    }
}
