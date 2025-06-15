// This is the entry point for the @vannatta-software/ts-infrastructure-clients package.
// It will export interfaces and abstract classes for various external API clients.

// Example: Interface for a generic document store
export interface IRepository {
    save(entity: any): Promise<void>;
    findById(id: string): Promise<any | null>;
}

// Example: Interface for a generic repository
export interface IDocumentStore {
    find(query: any): Promise<any[]>;
    delete(id: string): Promise<void>;
}

// You can also export common types or base classes that might be useful for implementations.
