type Constructor<T> = new (...args: any[]) => T;

/**
 * Interface for options that can be passed to the @DatabaseSchema decorator.
 * These options define how a property should be mapped in a database schema.
 */
export interface IPropertySchemaOptions {
    isDomainAbstraction?: boolean; // True if this property is part of a domain abstraction (e.g., Entity, ValueObject, Enumeration)
    /**
     * The constructor function for the property's type (e.g., String, Number, Date, or another @DatabaseEntity decorated class).
     */
    type?: any;
    /**
     * True if this property should have a unique constraint in the database.
     */
    unique?: boolean;
    /**
     * True if this property is optional/nullable in the database.
     */
    optional?: boolean;
    /**
     * True if this property maps to the primary identifier of the entity (e.g., _id in MongoDB).
     */
    isIdentifier?: boolean;
    /**
     * An array of possible enum values for string or number enums, if not inferred.
     */
    enum?: (string | number)[];
    /**
     * The default value or a function that returns the default value for the property.
     */
    default?: any;
    // Add more options as needed for different database types (e.g., index, validation)
}

/**
 * Interface for options that can be passed to the @RelationshipProperty decorator.
 * These options define how a property contributes to an edge in a graph database.
 */
export interface IRelationshipPropertyOptions {
    /**
     * The type of the relationship (e.g., 'HAS_ORDER', 'CREATED_BY').
     */
    type: string;
    /**
     * The target @DatabaseEntity decorated class of the relationship, or a function returning it for lazy loading.
     */
    target: Constructor<any> | (() => Constructor<any>);
    /**
     * Optional: An array of property names from the source entity that should be copied onto the edge as properties.
     */
    properties?: string[];
    /**
     * Optional: The direction of the relationship. Defaults to 'OUTGOING'.
     * Primarily for graph databases (Neo4j relationship direction).
     */
    direction?: 'INCOMING' | 'OUTGOING' | 'BOTH';

    /**
     * Optional: The cardinality of the relationship in a relational context.
     * Used by relational ORMs (e.g., TypeORM) to infer relation type.
     */
    cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';

    /**
     * Optional: True if this side defines the foreign key or join table in a relational context.
     * Used by relational ORMs (e.g., TypeORM) to determine ownership.
     */
    owner?: boolean;

    /**
     * Optional: The name of the property on the target entity that represents the inverse side of the relationship.
     * Used by relational ORMs (e.g., TypeORM) for bidirectional relations.
     */
    inverse?: string;

    /**
     * Optional: Names of columns used for joining (e.g., foreign key column names).
     * Used by relational ORMs (e.g., TypeORM) for join columns.
     */
    columns?: string[];

    /**
     * Optional: Name of the join table for many-to-many relationships.
     * Used by relational ORMs (e.g., TypeORM) for join tables.
     */
    table?: string;

    /**
     * Optional: Cascade options for relational operations (insert, update, remove).
     * Used by relational ORMs (e.g., TypeORM).
     */
    cascade?: boolean | ('insert' | 'update' | 'remove' | 'soft-remove' | 'recover')[];

    /**
     * Optional: Eager loading option for relational relationships.
     * Used by relational ORMs (e.g., TypeORM).
     */
    eager?: boolean;
}

/**
 * Interface for the metadata collected by the @DatabaseSchema decorator.
 */
export interface IPropertySchemaMetadata extends IPropertySchemaOptions {
    /**
     * The name of the property on the class.
     */
    propertyKey: string | symbol;
    /**
     * Optional: Metadata for properties that define a relationship in a graph database.
     */
    relationship?: IRelationshipPropertyOptions;
}
