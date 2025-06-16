import { Entity, getUniqueProperties } from '@vannatta-software/ts-utils-domain';
import { Mediator, ApiException } from '@vannatta-software/ts-utils-server';
import { MongoPipeline } from './mongo.utils';
import { IRepository } from '../repository.interface';
import { Model } from 'mongoose';

export class MongoRepository<T extends Entity> implements IRepository<T> {
    private hydrateFn: ((document: any) => T) | undefined;

    constructor(
        protected model: Model<T>,
        private mediator?: Mediator // Make optional
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

        console.log('findById called with id:', id);
        console.log('Document found:', doc);

        return doc ? this.hydrate(doc) : null;
    }

    async insert(entity: T): Promise<void> {
        const docToSave = { ...entity.document, _id: entity.id.value }; // Reverted to entity.document as per user's instruction
        console.log('Doc to save:', docToSave); // Added console.log
        const newDoc = new this.model(docToSave);
        
        try {
            await newDoc.save();
        } catch (error: any) {
            console.log('Error caught in insert:', error); // Added console.log
            // Catch Mongoose unique index error (code 11000) and re-throw as ApiException
            if (error.code === 11000) {
                throw new ApiException(
                    `Entity with unique properties already exists.`,
                    { code: ['UNIQUE_CONSTRAINT_VIOLATION'], details: error.message }
                );
            }
            throw error; // Re-throw other errors
        }

        console.log('New document saved:', newDoc);
        entity.create(); // Call create lifecycle hook after successful save
        if (this.mediator) {
            this.mediator.publishEvents(entity);
        }
    }

    async update(entity: T): Promise<void> {
        const id = entity.id.value;
        const doc = entity.document; // Reverted to entity.document as per user's instruction

        if (!await this.model.exists({ _id: id })) {
            throw new ApiException(`Entity with ID ${id} not found for update.`, { code: ['ENTITY_NOT_FOUND'] });
        }

        // Removed manual unique property check, relying on Mongoose for unique constraints
        await this.model.findByIdAndUpdate(id, doc, { new: true, runValidators: true }).exec();
        if (this.mediator) {
            this.mediator.publishEvents(entity);
        }
    }

    async delete(entity: T): Promise<void> {
        console.log('Deleting entity with ID:', entity.id.value); // Added console.log
        const result = await this.model.findByIdAndDelete(entity.id.value).exec();
        console.log('Result of findByIdAndDelete:', result); // Added console.log
        if (!result) {
            throw new ApiException(`Entity with ID ${entity.id.value} not found for deletion.`, { code: ['ENTITY_NOT_FOUND'] });
        }
        entity.delete(); // Call delete lifecycle hook after successful deletion
        if (this.mediator) {
            this.mediator.publishEvents(entity);
        }
    }

    async search(queryObject: Record<string, any>): Promise<T[]> {
        console.log('Search query object (in repo):', queryObject); // Added console.log
        const docs = await this.model.find(queryObject).exec();
        console.log('Raw docs from find:', docs); // Added console.log
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
