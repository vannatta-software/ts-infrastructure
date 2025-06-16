# Persistence Framework

This document serves as a comprehensive user manual for the Persistence Framework, a core component within the `ts-infrastructure` monorepo.

## 1. Purpose

The Persistence Framework provides a robust and flexible solution for abstracting data storage and retrieval operations in TypeScript applications. It aims to decouple the application's business logic from the underlying database technologies, promoting a clean architecture and enhancing maintainability.

**Primary Goals and Benefits:**
*   **Database Agnostic Data Access**: Offers a unified interface for interacting with various database systems (e.g., MongoDB, PostgreSQL, Neo4j, In-Memory), allowing developers to switch or integrate different data stores with minimal code changes.
*   **Domain-Driven Design Alignment**: Integrates seamlessly with Domain-Driven Design (DDD) principles by providing mechanisms to persist `Entity` and `ValueObject` instances directly.
*   **Declarative Schema Definition**: Utilizes TypeScript decorators to define database schemas directly on domain models, reducing boilerplate and improving type safety.
*   **Simplified Data Operations**: Provides a standardized set of CRUD (Create, Read, Update, Delete) and query operations through the Repository pattern.
*   **Extensibility**: Designed to be easily extensible, allowing for the integration of new database technologies or custom persistence logic.

## 2. Core Concepts

### Repository Pattern
The framework heavily relies on the **Repository Pattern**, which abstracts the details of data persistence. Instead of directly interacting with a database, your application code interacts with a repository interface (`IRepository`), which then handles the communication with the specific data store. This promotes loose coupling and testability.

### Domain-Driven Design (DDD) Entities and Value Objects
The framework is built to work with domain models defined using `@vannatta-software/ts-utils-domain`.
*   **Entity**: Represents an object with a distinct identity that runs through time and different representations. Entities are typically decorated with `@DatabaseEntity` and their properties with `@DatabaseSchema`.
*   **ValueObject**: Represents a descriptive aspect of the domain with no conceptual identity. Value Objects can be embedded within Entities and their properties can also be decorated with `@DatabaseSchema`.

### Declarative Schema Definition with Decorators
The framework uses TypeScript decorators to define how your domain models map to database schemas. This metadata-driven approach simplifies schema management and ensures consistency.
*   `@DatabaseEntity`: A class decorator used to mark a class as a persistable entity or an embedded document. This decorator signals that the class should have a database schema generated for it.
*   `@DatabaseSchema`: A property decorator used to mark a class property for inclusion in database schemas. It allows you to define database-specific options for the property, such as `unique`, `optional`, `isIdentifier`, `enum`, and `default` values.
*   `@RelationshipProperty`: A property decorator specifically for defining relationships in graph databases (like Neo4j). It's used on properties that link to other `@DatabaseEntity` decorated classes and allows specifying the relationship `type`, `target` entity, and optional `properties` to be stored on the relationship itself.

### Database Context
The `DatabaseContext` acts as a central factory for obtaining various repository implementations. It encapsulates the logic for instantiating the correct repository based on the desired database technology and its specific configurations (e.g., Mongoose Models for MongoDB, Neo4j Driver, TypeORM DataSources for PostgreSQL).

## 3. Getting Started / Installation

This framework is part of the `ts-infrastructure` monorepo. To use it in your project:

1.  **Install the package**:
    ```bash
    npm install @vannatta-software/ts-infrastructure-persistence
    # or
    yarn add @vannatta-software/ts-infrastructure-persistence
    ```
2.  **Ensure `reflect-metadata` is imported**: The schema decorators rely on `reflect-metadata`. Make sure you have `import 'reflect-metadata';` at the top of your main entry file (e.g., `src/main.ts` or `src/index.ts`) or in a file that is imported early in your application's lifecycle.
3.  **Configure your `tsconfig.json`**: Ensure `experimentalDecorators` and `emitDecoratorMetadata` are set to `true`.
    ```json
    {
      "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        // ... other options
      }
    }
    ```

## 4. Key Components & Usage

### `@DatabaseEntity()` Decorator

Marks a class as a persistable entity or embedded document.

```typescript
import { Entity } from '@vannatta-software/ts-utils-domain';
import { DatabaseEntity, DatabaseSchema } from '@vannatta-software/ts-infrastructure-persistence';

@DatabaseEntity()
class User extends Entity {
    @DatabaseSchema({ type: String, unique: true })
    email: string;

    @DatabaseSchema({ type: String, optional: true })
    firstName?: string;

    @DatabaseSchema({ type: String, optional: true })
    lastName?: string;
}
```

### `@DatabaseSchema(options?: IPropertySchemaOptions)` Decorator

Defines how a property maps to a database field.

**Options:**
*   `type`: The constructor function for the property's type (e.g., `String`, `Number`, `Date`, or another `@DatabaseEntity` decorated class for embedded documents/relationships).
*   `unique`: `true` if the property should have a unique constraint.
*   `optional`: `true` if the property is nullable.
*   `isIdentifier`: `true` if the property is the primary identifier.
*   `enum`: An array of possible enum values for string or number enums.
*   `default`: A default value or a function returning one.

**Example:**

```typescript
import { ValueObject } from '@vannatta-software/ts-utils-domain';
import { DatabaseEntity, DatabaseSchema } from '@vannatta-software/ts-infrastructure-persistence';

@DatabaseEntity() // Can also be used for ValueObjects that are embedded
class Address extends ValueObject {
    @DatabaseSchema({ type: String })
    street: string;

    @DatabaseSchema({ type: String })
    city: string;

    @DatabaseSchema({ type: String })
    zipCode: string;
}

@DatabaseEntity()
class Order extends Entity {
    @DatabaseSchema({ type: String, isIdentifier: true })
    orderId: string;

    @DatabaseSchema({ type: Number, default: 0 })
    totalAmount: number;

    @DatabaseSchema({ type: Date, default: () => new Date() })
    orderDate: Date;

    @DatabaseSchema({ type: Address }) // Embedding a ValueObject
    shippingAddress: Address;

    @DatabaseSchema({ type: [String], optional: true }) // Array of strings
    tags?: string[];
}
```

### `@RelationshipProperty(options: IRelationshipPropertyOptions)` Decorator

Used for defining relationships in graph databases (e.g., Neo4j).

**Options:**
*   `type`: The type of the relationship (e.g., `'HAS_ORDER'`, `'CREATED_BY'`).
*   `target`: The target `@DatabaseEntity` class of the relationship.
*   `properties` (optional): An array of property names from the source entity to copy onto the edge.
*   `direction` (optional): `'INCOMING'`, `'OUTGOING'` (default), or `'BOTH'`.

**Example (for Neo4j):**

```typescript
import { Entity } from '@vannatta-software/ts-utils-domain';
import { DatabaseEntity, DatabaseSchema, RelationshipProperty } from '@vannatta-software/ts-infrastructure-persistence';

@DatabaseEntity()
class Product extends Entity {
    @DatabaseSchema({ type: String, isIdentifier: true })
    productId: string;

    @DatabaseSchema({ type: String })
    name: string;
}

@DatabaseEntity()
class User extends Entity {
    @DatabaseSchema({ type: String, isIdentifier: true })
    userId: string;

    @DatabaseSchema({ type: String })
    username: string;

    @RelationshipProperty({ type: 'PURCHASED', target: Product, properties: ['purchaseDate'] })
    @DatabaseSchema({ type: [Product] }) // This property will hold an array of related Product entities
    purchasedProducts: Product[];

    // Example of a property that might be copied to the relationship
    purchaseDate?: Date;
}
```

### `IRepository<T extends Entity>` Interface

The contract for all repositories, defining standard data access operations.

```typescript
import { Entity } from '@vannatta-software/ts-utils-domain';

export interface IRepository<T extends Entity> {
    onHydrate(hydrate: (document: any) => T): void; // Callback for hydrating documents into domain entities
    findAll(): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    insert(entity: T): Promise<void>;
    update(entity: T): Promise<void>;
    delete(entity: T): Promise<void>;
    search(queryObject: any): Promise<T[]>; // Generic search
    aggregate(pipeline: any): Promise<T[]>; // Generic aggregation
}
```

### `DatabaseContext` Class

The entry point for obtaining specific database repository instances.

```typescript
import { DatabaseContext } from '@vannatta-software/ts-infrastructure-persistence';
import { Mediator, ILogger, ClassType } from '@vannatta-software/ts-utils-server';
import { Entity } from '@vannatta-software/ts-utils-domain';
import { Model } from 'mongoose'; // For MongoDB
import { Driver } from 'neo4j-driver'; // For Neo4j
import { DataSource } from 'typeorm'; // For PostgreSQL

// Assume these are initialized elsewhere in your application
const mediator: Mediator = new Mediator();
const logger: ILogger = { info: console.log, error: console.error, warn: console.warn, debug: console.debug };
const mongoModels: Map<string, Model<any>> = new Map(); // Your Mongoose models
const neo4jDriver: Driver = /* initialized Neo4j driver */;
const postgresDataSource: DataSource = /* initialized TypeORM DataSource */;

const dbContext = new DatabaseContext(
    mediator,
    logger,
    mongoModels,
    neo4jDriver,
    postgresDataSource
);

// --- Usage Examples ---

// In-Memory Repository
class MyEntity extends Entity { /* ... */ }
const inMemoryRepo = dbContext.inMemoryRepository<MyEntity>();
await inMemoryRepo.insert(new MyEntity({ /* ... */ }));

// MongoDB Repository
// Assuming you have a Mongoose model for User
// const UserModel: Model<User> = /* your Mongoose User model */;
// const mongoRepo = dbContext.mongoRepository<User>(UserModel);
// await mongoRepo.insert(new User({ /* ... */ }));

// Neo4j Repository
// const neo4jRepo = dbContext.neo4jRepository<User>(User);
// await neo4jRepo.insert(new User({ /* ... */ }));

// PostgreSQL Repository
// const postgresRepo = dbContext.postgresRepository<User>(postgresDataSource, User);
// await postgresRepo.insert(new User({ /* ... */ }));
```

### Specific Repository Implementations

The framework provides concrete implementations of `IRepository` for various databases:

*   `InMemoryRepository`: For testing or simple in-memory data storage.
*   `MongoRepository`: For MongoDB, leveraging Mongoose.
*   `Neo4jRepository`: For Neo4j graph database, using the official Neo4j Driver.
*   `PostgresRepository`: For PostgreSQL, integrating with TypeORM.

Each repository handles the specific data mapping and query translation for its respective database, abstracting these details from your domain logic.

## 5. Advanced Topics

### Schema Inheritance
The `@DatabaseSchema` and `@RelationshipProperty` decorators support inheritance. When `getDatabaseSchemaMetadata` is called on a derived class, it automatically collects and merges metadata from all superclasses in the prototype chain. This means you can define common properties and relationships in base classes and extend them in derived entities, maintaining a consistent schema definition across your inheritance hierarchy.

### Integration with `ts-utils-domain` and `ts-utils-server`
The Persistence Framework is designed to integrate seamlessly with other packages in the `@vannatta-software/ts-utils-*` ecosystem:
*   **`@vannatta-software/ts-utils-domain`**: Provides the `Entity` and `ValueObject` base classes, which are fundamental to defining your domain models that will be persisted.
*   **`@vannatta-software/ts-utils-server`**: Provides `Mediator` for eventing/command handling within the application and `ILogger` for consistent logging, both of which are injected into the `DatabaseContext` and individual repositories.

## 6. Best Practices & Common Pitfalls

### Best Practices
*   **Separate Domain from Persistence**: Always define your domain entities in a separate layer (e.g., using `@vannatta-software/ts-utils-domain`) and use the persistence framework to map them to the database. Avoid mixing database-specific logic directly into your domain models.
*   **Consistent Schema Decorators**: Apply `@DatabaseEntity`, `@DatabaseSchema`, and `@RelationshipProperty` consistently across your domain models to ensure accurate schema generation.
*   **Use `IRepository` Interface**: Program against the `IRepository` interface rather than concrete repository implementations. This makes your code more flexible and easier to test.
*   **Centralize `DatabaseContext` Initialization**: Initialize your `DatabaseContext` and its underlying database connections (Mongoose, Neo4j Driver, TypeORM DataSource) in a central location (e.g., your application's bootstrap file or a dependency injection container).
*   **Handle Hydration**: Ensure you provide the `onHydrate` callback to your repositories if your domain entities require specific re-instantiation logic from raw database documents.

### Common Pitfalls
*   **Missing `reflect-metadata` import**: Forgetting `import 'reflect-metadata';` will cause decorators to not function correctly, leading to missing schema metadata.
*   **Incorrect `tsconfig.json`**: Not enabling `experimentalDecorators` and `emitDecoratorMetadata` will prevent TypeScript from emitting the necessary metadata for the decorators.
*   **Mismatched Schema Definitions**: Ensure that the types specified in `@DatabaseSchema` options accurately reflect the actual TypeScript types of your properties to avoid runtime errors or unexpected data mapping issues.
*   **Improper Relationship Definition**: For graph databases, ensure `target` in `@RelationshipProperty` points to the correct `@DatabaseEntity` class and `type` is descriptive.
*   **Forgetting `onHydrate`**: If your entities have complex constructors or require specific logic to be re-instantiated from plain objects returned by the database, you must provide an `onHydrate` callback to the repository.

## 7. Visual Overview

```mermaid
graph TD
    subgraph Domain Layer
        E[Entity]
        VO[ValueObject]
    end

    subgraph Persistence Framework
        DBE[DatabaseEntity Decorator]
        DBS[DatabaseSchema Decorator]
        RP[RelationshipProperty Decorator]
        IR[IRepository Interface]
        DBC[DatabaseContext Class]
    end

    subgraph Database Implementations
        IMR[InMemoryRepository]
        MR[MongoRepository]
        NR[Neo4jRepository]
        PR[PostgresRepository]
    end

    E -- decorated by --> DBE
    VO -- decorated by --> DBE
    E -- properties decorated by --> DBS
    VO -- properties decorated by --> DBS
    E -- relationships decorated by --> RP

    DBE -- defines metadata for --> IR
    DBS -- defines metadata for --> IR
    RP -- defines metadata for --> IR

    DBC -- provides --> IMR
    DBC -- provides --> MR
    DBC -- provides --> NR
    DBC -- provides --> PR

    IR <|-- IMR
    IR <|-- MR
    IR <|-- NR
    IR <|-- PR

    MR -- uses --> MongoDB[(MongoDB)]
    NR -- uses --> Neo4j[(Neo4j)]
    PR -- uses --> PostgreSQL[(PostgreSQL)]

    style E fill:#f9f,stroke:#333,stroke-width:2px
    style VO fill:#f9f,stroke:#333,stroke-width:2px
    style DBE fill:#ccf,stroke:#333,stroke-width:2px
    style DBS fill:#ccf,stroke:#333,stroke-width:2px
    style RP fill:#ccf,stroke:#333,stroke-width:2px
    style IR fill:#bbf,stroke:#333,stroke-width:2px
    style DBC fill:#bbf,stroke:#333,stroke-width:2px
    style IMR fill:#eef,stroke:#333,stroke-width:2px
    style MR fill:#eef,stroke:#333,stroke-width:2px
    style NR fill:#eef,stroke:#333,stroke-width:2px
    style PR fill:#eef,stroke:#333,stroke-width:2px
    style MongoDB fill:#afa,stroke:#333,stroke-width:2px
    style Neo4j fill:#afa,stroke:#333,stroke-width:2px
    style PostgreSQL fill:#afa,stroke:#333,stroke-width:2px
