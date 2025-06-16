# `@vannatta-software/ts-utils-domain`

## Purpose

The `@vannatta-software/ts-utils-domain` library provides foundational building blocks for implementing Domain-Driven Design (DDD) principles in TypeScript applications. Its primary goals are to promote clean architecture, foster maintainable codebases, and enable the construction of robust and expressive domain models. By offering core abstractions like Entities, Value Objects, and Aggregate Roots, this framework helps developers encapsulate business logic, enforce invariants, and manage complexity effectively within their domain layer.

## Core Concepts

This framework is built upon several fundamental DDD concepts:

*   **Entity**: An object defined by its identity, rather than its attributes. An Entity has a unique identifier and a lifecycle, meaning its attributes can change over time while its identity remains constant. Entities are mutable.

*   **ValueObject**: An object that measures, quantifies, or describes a thing in the domain. Value Objects are immutable and are defined by the equality of their attributes. If any attribute changes, it is considered a different Value Object. They have no conceptual identity.

*   **AggregateRoot**: A special kind of Entity that serves as the root of an Aggregate. An Aggregate is a cluster of domain objects (Entities and Value Objects) that are treated as a single unit for data changes. The Aggregate Root guarantees the consistency of the entire Aggregate by controlling access to its internal objects and enforcing invariants.

*   **Enumeration**: A type-safe way to represent a fixed set of named values. This abstraction provides a robust alternative to traditional TypeScript enums or magic strings, offering methods for easy lookup, comparison, and iteration over defined instances.

*   **UniqueIdentifier**: A class that wraps a UUID string, providing a type-safe and robust way to handle unique identifiers for Entities and Aggregate Roots. It ensures consistency and provides utility methods for generation, parsing, and comparison of IDs.

*   **`@UniqueProperty` Decorator**: A decorator used to mark specific properties within an `Entity` or `AggregateRoot` that, when combined, form a unique composite key for that domain object. This is particularly useful for enforcing uniqueness constraints within collections or for mapping to database unique indices.

## Getting Started / Installation

To integrate `@vannatta-software/ts-utils-domain` into your project, install it via npm or yarn:

```bash
npm install @vannatta-software/ts-utils-domain reflect-metadata
# or
yarn add @vannatta-software/ts-utils-domain reflect-metadata
```

**Note:** This library uses decorators, which rely on `reflect-metadata`. Ensure you have `reflect-metadata` installed and imported once at the entry point of your application (e.g., `main.ts` or `app.ts`) to enable metadata reflection:

```typescript
import 'reflect-metadata';
// Your application code
```

Also, ensure your `tsconfig.json` has the following configurations:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Key Components & Usage

### `UniqueIdentifier`

The `UniqueIdentifier` class provides a robust way to manage unique identifiers, typically UUIDs, for your domain objects.

*   **Purpose**: To encapsulate the logic of generating, parsing, and comparing unique identifiers, ensuring type safety and consistency.
*   **Usage**:
    *   `UniqueIdentifier.generate()`: Creates a new `UniqueIdentifier` instance with a randomly generated UUID (v4).
    *   `new UniqueIdentifier(value: string)`: Creates an instance from an existing string value.
    *   `UniqueIdentifier.parse(value: string | UniqueIdentifier)`: Parses a string into a `UniqueIdentifier` or returns the instance if already one.
    *   `id.equals(otherId: UniqueIdentifier)`: Compares two `UniqueIdentifier` instances for equality based on their underlying values.

```typescript
import { UniqueIdentifier } from '@vannatta-software/ts-utils-domain';

// Generate a new unique ID
const userId = UniqueIdentifier.generate();
console.log(userId.value); // e.g., "a1b2c3d4-e5f6-7890-1234-567890abcdef"

// Create an ID from an existing string
const existingId = new UniqueIdentifier("some-pre-existing-uuid-string");

// Parse an ID (useful for input validation)
try {
    const parsedId = UniqueIdentifier.parse("another-valid-uuid-string");
    console.log(parsedId.value);
} catch (error) {
    console.error(error.message); // "Invalid UniqueIdentifier format."
}

// Compare IDs
const id1 = new UniqueIdentifier("123e4567-e89b-12d3-a456-426614174000");
const id2 = new UniqueIdentifier("123e4567-e89b-12d3-a456-426614174000");
const id3 = UniqueIdentifier.generate();

console.log(id1.equals(id2)); // true
console.log(id1.equals(id3)); // false
```

### `ValueObject`

`ValueObject` is a cornerstone of DDD, representing descriptive aspects of your domain.

*   **Purpose**: To model concepts that are defined by their attributes rather than their identity. Value Objects are immutable and are defined by the equality of their attributes. If any attribute changes, it is considered a different Value Object. They have no conceptual identity.
*   **Usage**: Extend the `ValueObject` abstract class and implement the `getAtomicValues()` method, which should yield all the properties that define the Value Object's equality.

```typescript
import { ValueObject } from '@vannatta-software/ts-utils-domain';

interface AddressProps {
    street: string;
    city: string;
    zipCode: string;
}

class Address extends ValueObject {
    private constructor(private props: AddressProps) {
        super();
    }

    // Factory method for creation, allowing for validation or business rules
    static create(props: AddressProps): Address {
        // Example: Basic validation
        if (!props.street || !props.city || !props.zipCode) {
            throw new Error("Address properties cannot be empty.");
        }
        return new Address(props);
    }

    // Getters for immutability
    get street(): string { return this.props.street; }
    get city(): string { return this.props.city; }
    get zipCode(): string { return this.props.zipCode; }

    // Implement getAtomicValues to define equality
    protected *getAtomicValues(): IterableIterator<any> {
        yield this.props.street;
        yield this.props.city;
        yield this.props.zipCode;
    }

    // Custom method (example)
    getFullAddress(): string {
        return `${this.street}, ${this.city}, ${this.zipCode}`;
    }
}

// Usage Example
const address1 = Address.create({ street: "123 Main St", city: "Anytown", zipCode: "12345" });
const address2 = Address.create({ street: "123 Main St", city: "Anytown", zipCode: "12345" });
const address3 = Address.create({ street: "456 Oak Ave", city: "Otherville", zipCode: "67890" });

console.log(address1.equals(address2)); // true (same values)
console.log(address1.equals(address3)); // false (different values)
console.log(address1.getFullAddress()); // "123 Main St, Anytown, 12345"
```

### `Enumeration`

The `Enumeration` class provides a robust, type-safe alternative to traditional enums or string literals for fixed sets of values.

*   **Purpose**: To define a closed set of related constants with associated data (ID and name), offering enhanced type safety, readability, and utility methods for lookup and comparison.
*   **Usage**: Extend the `Enumeration` abstract class and define static `readonly` instances within your subclass.

```typescript
import { Enumeration } from '@vannatta-software/ts-utils-domain';

class OrderStatus extends Enumeration {
    // Define static readonly instances
    public static readonly PENDING = new OrderStatus({ id: 1, name: "Pending" });
    public static readonly SHIPPED = new OrderStatus({ id: 2, name: "Shipped" });
    public static readonly DELIVERED = new OrderStatus({ id: 3, name: "Delivered" });
    public static readonly CANCELLED = new OrderStatus({ id: 4, name: "Cancelled" });

    // Private constructor to prevent external instantiation
    private constructor(props: { id: number; name: string }) {
        super(props);
    }

    // Static factory methods for safe retrieval
    static fromName(name: string): OrderStatus {
        return Enumeration.fromName(OrderStatus, name) as OrderStatus;
    }

    static fromId(id: number): OrderStatus {
        return Enumeration.from(OrderStatus, id) as OrderStatus;
    }

    // Get all instances
    static getAll(): OrderStatus[] {
        return Enumeration.getAllInstances(OrderStatus) as OrderStatus[];
    }

    // Get all names
    static getNames(): string[] {
        return Enumeration.names(OrderStatus);
    }
}

// Usage Example
const pendingStatus = OrderStatus.PENDING;
console.log(pendingStatus.name); // "Pending"

const shippedStatus = OrderStatus.fromName("Shipped");
console.log(shippedStatus.id); // 2

const deliveredStatus = OrderStatus.fromId(3);
console.log(deliveredStatus.name); // "Delivered"

console.log(OrderStatus.getAll().map(s => s.name)); // ["Pending", "Shipped", "Delivered", "Cancelled"]
console.log(OrderStatus.getNames()); // ["Pending", "Shipped", "Delivered", "Cancelled"]

console.log(pendingStatus.equals(OrderStatus.fromId(1))); // true
```

### `Entity` and `@UniqueProperty` Decorator

`Entity` forms the base for domain objects that require a distinct identity and lifecycle. The `@UniqueProperty` decorator enhances Entities by allowing the definition of composite unique keys.

*   **Purpose**:
    *   `Entity`: To model domain concepts that have a unique identity, can change over time, and may emit domain events.
    *   `@UniqueProperty`: To mark properties that contribute to the uniqueness of an Entity instance, enabling composite key generation and conflict detection.
*   **Usage**:
    *   Extend the `Entity` abstract class. It automatically handles `id` (as `UniqueIdentifier`), `createdAt`, `updatedAt`, and domain event management.
    *   Apply `@UniqueProperty()` to properties within your `Entity` subclass that, when combined, should be unique across a collection of similar entities.

```typescript
import { Entity, UniqueIdentifier, UniqueProperty } from '@vannatta-software/ts-utils-domain';

interface ProductProps {
    name: string;
    sku: string; // Stock Keeping Unit, often unique
    category: string;
    price: number;
}

class Product extends Entity {
    // Mark 'sku' as a unique property for composite key generation
    @UniqueProperty()
    public sku: string;

    @UniqueProperty() // You can mark multiple properties
    public category: string;

    public name: string;
    public price: number;

    private constructor(props: ProductProps, id?: UniqueIdentifier) {
        super({ id }); // Initialize base Entity properties
        this.name = props.name;
        this.sku = props.sku;
        this.category = props.category;
        this.price = props.price;
    }

    // Factory method for creating Product instances
    static create(props: ProductProps, id?: UniqueIdentifier): Product {
        // Add business rules or validation for product creation
        return new Product(props, id);
    }

    // Abstract methods from Entity must be implemented
    create(): void {
        console.log(`Product "${this.name}" (SKU: ${this.sku}) created.`);
        // Example: Add a domain event
        // this.addDomainEvent(new ProductCreatedEvent(this.id.value));
    }

    delete(): void {
        console.log(`Product "${this.name}" (SKU: ${this.sku}) deleted.`);
        // Example: Add a domain event
        // this.addDomainEvent(new ProductDeletedEvent(this.id.value));
    }

    // Example of a business method
    updatePrice(newPrice: number): void {
        if (newPrice <= 0) {
            throw new Error("Price must be positive.");
        }
        this.price = newPrice;
        this.updatedAt = new Date();
        console.log(`Price for ${this.name} updated to ${newPrice}.`);
    }
}

// Usage Example with UniqueProperty
const product1 = Product.create({ name: "Laptop", sku: "LAP-001", category: "Electronics", price: 1200 });
const product2 = Product.create({ name: "Mouse", sku: "MOU-001", category: "Electronics", price: 25 });
// This product has the same SKU and category as product1, demonstrating a conflict
const product3 = Product.create({ name: "Keyboard", sku: "LAP-001", category: "Electronics", price: 75 });

console.log(product1.compositeUniqueKey); // "LAP-001::Electronics"
console.log(product2.compositeUniqueKey); // "MOU-001::Electronics"
console.log(product3.compositeUniqueKey); // "LAP-001::Electronics"

const products = [product1, product2, product3];
// Check for conflicts based on properties marked with @UniqueProperty
console.log(Entity.hasConflicts(products)); // true, because product1 and product3 have the same composite unique key
```

### `AggregateRoot`

An `AggregateRoot` is a specialized `Entity` that acts as a consistency boundary for a group of related domain objects.

*   **Purpose**: To ensure that changes to objects within an Aggregate are consistent and adhere to business rules. All external references to objects within an Aggregate should go through its Root.
*   **Usage**: Extend the `AggregateRoot` abstract class. It inherits all capabilities from `Entity` and serves as the entry point for operations on its contained objects.

```typescript
import { AggregateRoot, UniqueIdentifier, ValueObject, UniqueProperty } from '@vannatta-software/ts-utils-domain';
import { OrderStatus } from './path/to/OrderStatus'; // Assuming OrderStatus Enumeration is defined

// 1. Define a ValueObject for OrderLine
interface OrderLineProps {
    productId: UniqueIdentifier;
    quantity: number;
    unitPrice: number;
}

class OrderLine extends ValueObject {
    private constructor(private props: OrderLineProps) {
        super();
    }

    static create(props: OrderLineProps): OrderLine {
        if (props.quantity <= 0 || props.unitPrice <= 0) {
            throw new Error("Quantity and unit price must be positive.");
        }
        return new OrderLine(props);
    }

    get productId(): UniqueIdentifier { return this.props.productId; }
    get quantity(): number { return this.props.quantity; }
    get unitPrice(): number { return this.props.unitPrice; }

    protected *getAtomicValues(): IterableIterator<any> {
        yield this.props.productId.value;
        yield this.props.quantity;
        yield this.props.unitPrice;
    }

    get total(): number {
        return this.quantity * this.unitPrice;
    }
}

// 2. Define the Order Aggregate Root
interface OrderProps {
    customerId: UniqueIdentifier;
    orderLines: OrderLine[];
    status: OrderStatus; // Using the OrderStatus Enumeration
}

class Order extends AggregateRoot {
    public customerId: UniqueIdentifier;
    public orderLines: OrderLine[];
    public status: OrderStatus;

    private constructor(props: OrderProps, id?: UniqueIdentifier) {
        super({ id });
        this.customerId = props.customerId;
        this.orderLines = props.orderLines;
        this.status = props.status;
    }

    static create(props: OrderProps, id?: UniqueIdentifier): Order {
        if (props.orderLines.length === 0) {
            throw new Error("An order must have at least one line item.");
        }
        // Add more business rules for order creation
        return new Order(props, id);
    }

    addOrderLine(line: OrderLine): void {
        this.orderLines.push(line);
        this.updatedAt = new Date();
        // Add domain event: this.addDomainEvent(new OrderLineAddedEvent(this.id.value, line));
    }

    updateStatus(newStatus: OrderStatus): void {
        // Example business rule: Cannot change status from DELIVERED
        if (this.status.equals(OrderStatus.DELIVERED)) {
            throw new Error("Cannot change status of a delivered order.");
        }
        this.status = newStatus;
        this.updatedAt = new Date();
        // Add domain event: this.addDomainEvent(new OrderStatusUpdatedEvent(this.id.value, newStatus));
    }

    get totalAmount(): number {
        return this.orderLines.reduce((sum, line) => sum + line.total, 0);
    }

    create(): void {
        console.log(`Order ${this.id.value} created for customer ${this.customerId.value}`);
        // this.addDomainEvent(new OrderCreatedEvent(this.id.value));
    }

    delete(): void {
        console.log(`Order ${this.id.value} deleted.`);
        // this.addDomainEvent(new OrderDeletedEvent(this.id.value));
    }
}

// Example Composition: Building an Order Aggregate
const customerId = UniqueIdentifier.generate();
const productAId = UniqueIdentifier.generate();
const productBId = UniqueIdentifier.generate();

const line1 = OrderLine.create({ productId: productAId, quantity: 2, unitPrice: 50.00 });
const line2 = OrderLine.create({ productId: productBId, quantity: 1, unitPrice: 150.00 });

const order = Order.create({
    customerId: customerId,
    orderLines: [line1, line2],
    status: OrderStatus.PENDING
});

console.log(`Order ID: ${order.id.value}`);
console.log(`Order Status: ${order.status.name}`); // Pending
console.log(`Order Total Amount: $${order.totalAmount}`); // $250.00

order.updateStatus(OrderStatus.SHIPPED);
console.log(`New Order Status: ${order.status.name}`); // Shipped

// Attempt to add another line
const line3 = OrderLine.create({ productId: UniqueIdentifier.generate(), quantity: 3, unitPrice: 10.00 });
order.addOrderLine(line3);
console.log(`Order Total Amount after adding line: $${order.totalAmount}`); // $280.00
```

## Advanced Topics

*   **Domain Events**: The `Entity` class provides mechanisms (`addDomainEvent`, `removeDomainEvent`, `clearDomainEvents`, `domainEvents` getter) to manage `IDomainEvent` instances. These events represent something significant that happened in the domain and can be used for decoupled communication within the application or to external systems.
*   **Composition of Domain Elements**: The true power of this framework lies in how these core building blocks are composed. `ValueObject` and `Enumeration` instances are typically used as properties within `Entities` and `AggregateRoots`, allowing for rich, expressive, and behavior-rich domain models that accurately reflect business concepts.

## Best Practices & Common Pitfalls

*   **Value Objects vs. Entities**:
    *   **Use Value Objects** for descriptive attributes that don't have a conceptual identity and are compared by their values (e.g., `Address`, `Money`, `DateRange`). They should be immutable.
    *   **Use Entities** for things that have a distinct identity and lifecycle, even if their attributes change (e.g., `User`, `Product`, `Order`).
*   **Aggregate Boundaries**:
    *   Keep aggregates small and focused. A single transaction should typically modify only one aggregate instance.
    *   The `AggregateRoot` is the only object that clients should reference directly from outside the aggregate. Internal objects within an aggregate should only be accessed via the root.
    *   Enforce all business rules and invariants related to the aggregate through the Aggregate Root.
*   **Immutability**: Ensure `ValueObject` implementations are truly immutable. Any "change" to a Value Object should result in the creation of a new instance rather than modifying the existing one.
*   **Domain Events**: Use domain events to signal that something significant has happened within the domain. This allows for decoupled side effects and integration with other parts of the system or external services.
*   **`@UniqueProperty`**: Use this decorator judiciously for properties that truly contribute to the unique identification of an entity within a collection, especially when defining composite keys for data storage or in-memory uniqueness checks.

## Visual Overview

The following Mermaid class diagram illustrates the relationships between the core domain elements:

```mermaid
classDiagram
    direction LR
    class UniqueIdentifier {
        +value: string
        +generate(): UniqueIdentifier
        +parse(value): UniqueIdentifier
        +equals(other): boolean
    }

    class ValueObject {
        +equals(obj): boolean
        #getAtomicValues(): IterableIterator<any>
    }

    class Enumeration {
        +id: number
        +name: string
        +static fromName(name): T
        +static from(id): T
        +equals(other): boolean
    }

    class Entity {
        +id: UniqueIdentifier
        +createdAt: Date
        +updatedAt: Date
        +domainEvents: IDomainEvent[]
        +equals(obj): boolean
        +compositeUniqueKey: string
        +static hasConflicts(entities): boolean
        +abstract create(): void
        +abstract delete(): void
    }

    class AggregateRoot {
        // Inherits from Entity
    }

    class UniquePropertyDecorator {
        <<decorator>>
    }

    Entity <|-- AggregateRoot : inherits
    Entity "1" *-- "1" UniqueIdentifier : has
    Entity "1" *-- "0..*" UniquePropertyDecorator : uses
    AggregateRoot "1" *-- "0..*" ValueObject : contains
    AggregateRoot "1" *-- "0..*" Enumeration : uses
