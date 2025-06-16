import { Entity, UniqueIdentifier } from '@vannatta-software/ts-utils-domain';

export interface IRepository<T extends Entity> {
    onHydrate(hydrate: (document: any) => T): void;
    findAll(): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    insert(entity: T): Promise<void>;
    update(entity: T): Promise<void>;
    delete(entity: T): Promise<void>;
    search(queryObject: any): Promise<T[]>;
    aggregate(pipeline: any): Promise<T[]>;
}
