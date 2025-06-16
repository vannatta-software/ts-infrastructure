import { Entity, getUniqueProperties } from '@vannatta-software/ts-utils-domain';
import { Mediator, ApiException } from '@vannatta-software/ts-utils-server';
import { MongoPipeline } from './mongo.utils';
import { IRepository } from '../repository.interface';
import { Model } from 'mongoose';

export class MongoRepository<T extends Entity> implements IRepository<T> {
    private hydrateFn: ((document: any) => T) | undefined;

    constructor(
        protected model: Model<T>,
        private mediator: Mediator
    ) {}

    public onHydrate(hydrate: (document: any) => T) {
        this.hydrateFn = hydrate;
    }

    async findAll(): Promise<T[]> {
        const docs = await this.model.find({}).exec();
        return docs.map(doc => this.hydrate(doc));
    }

    async findById(id: string): Promise<T | null> {
        const doc = await this.model.findById(id).exec();

        return doc ? this.hydrate(doc) : null;
    }

    async insert(entity: T): Promise<void> {
        const uniqueProperties = getUniqueProperties(entity.constructor);
        if (uniqueProperties.length > 0) {
            const uniqueQuery: Record<string, any> = {};
            for (const prop of uniqueProperties) {
                uniqueQuery[prop] = (entity as any)[prop];
            }

            const existingDoc = await this.model.findOne(uniqueQuery).exec();
            if (existingDoc) {
                throw new ApiException(
                    `Entity with unique properties ${JSON.stringify(uniqueQuery)} already exists.`,
                    { code: ['UNIQUE_CONSTRAINT_VIOLATION'] }
                );
            }
        }

        const newDoc = new this.model(entity.document);
        await newDoc.save();
        entity.create(); // Call create lifecycle hook after successful save
        this.mediator.publishEvents(entity);
    }

    async update(entity: T): Promise<void> {
        const id = entity.id.value;
        const doc = entity.document;

        if (!await this.model.exists({ _id: id })) {
            throw new ApiException(`Entity with ID ${id} not found for update.`, { code: ['ENTITY_NOT_FOUND'] });
        }

        const uniqueProperties = getUniqueProperties(entity.constructor);
        if (uniqueProperties.length > 0) {
            const uniqueQuery: Record<string, any> = {};
            for (const prop of uniqueProperties) {
                uniqueQuery[prop] = (entity as any)[prop];
            }
            // Exclude the current entity by its ID
            uniqueQuery['_id'] = { $ne: id };

            const existingDoc = await this.model.findOne(uniqueQuery).exec();
            if (existingDoc) {
                throw new ApiException(
                    `Entity with unique properties ${JSON.stringify(uniqueQuery)} already exists.`,
                    { code: ['UNIQUE_CONSTRAINT_VIOLATION'] }
                );
            }
        }

        await this.model.findByIdAndUpdate(id, doc, { new: true }).exec();
        this.mediator.publishEvents(entity);
    }

    async delete(entity: T): Promise<void> {
        const result = await this.model.findByIdAndDelete(entity.id.value).exec();
        if (!result) {
            throw new ApiException(`Entity with ID ${entity.id.value} not found for deletion.`, { code: ['ENTITY_NOT_FOUND'] });
        }
        entity.delete(); // Call delete lifecycle hook after successful deletion
        this.mediator.publishEvents(entity);
    }

    async search(queryObject: Record<string, any>): Promise<T[]> {
        const docs = await this.model.find(queryObject).exec();
        return docs.map(doc => this.hydrate(doc));
    }

    private hydrate(document: any): T {
        if (!this.hydrateFn) {
            throw new ApiException('Hydrate function not set. Call onHydrate() first.', { code: ['HYDRATE_FUNCTION_NOT_SET'] });
        }
        return this.hydrateFn(document);
    }

    async aggregate(pipeline: MongoPipeline<T>): Promise<T[]> {
        const docs = await this.model.aggregate(pipeline.build()).exec();
        return docs.map(doc => this.hydrate(doc));
    }
}
