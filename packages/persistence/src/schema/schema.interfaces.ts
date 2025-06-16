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
     * The target @DatabaseEntity decorated class of the relationship.
     */
    target: Constructor<any>;
    /**
     * Optional: An array of property names from the source entity that should be copied onto the edge as properties.
     */
    properties?: string[];
    /**
     * Optional: The direction of the relationship. Defaults to 'OUTGOING'.
     */
    direction?: 'INCOMING' | 'OUTGOING' | 'BOTH';
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
