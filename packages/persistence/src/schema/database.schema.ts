import 'reflect-metadata';
import { Constructor, IPropertySchemaOptions, IPropertySchemaMetadata, IRelationshipPropertyOptions } from './schema.interfaces';
import { getDomainSchemaMetadata } from './domain-type-mappings'; // Import the helper

/**
 * Symbol used as the metadata key for properties decorated with @DatabaseSchema.
 */
export const DatabaseSchemaMetadataKey = Symbol('DatabaseSchemaMetadata');

/**
 * Symbol used as the metadata key for properties decorated with @RelationshipProperty.
 */
export const RelationshipPropertyMetadataKey = Symbol('RelationshipPropertyMetadata');

/**
 * Decorator to mark a class property for inclusion in database schemas.
 * Collects metadata about the property's type and database-specific options.
 * This decorator should be used on properties of concrete application-level entities.
 */
export function DatabaseSchema(options?: IPropertySchemaOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        const properties: IPropertySchemaMetadata[] = Reflect.getOwnMetadata(DatabaseSchemaMetadataKey, target.constructor) || [];
        properties.push({ propertyKey, ...options });
        Reflect.defineMetadata(DatabaseSchemaMetadataKey, properties, target.constructor);
    };
}

/**
 * Decorator to mark a property as representing a relationship in a graph database.
 * This decorator should be used on properties of concrete application-level entities
 * that link to other @DatabaseEntity decorated classes.
 */
export function RelationshipProperty(options: IRelationshipPropertyOptions): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol) => {
        // Get existing schema metadata for this property, if any, using Reflect.getOwnMetadata
        const properties: IPropertySchemaMetadata[] = Reflect.getOwnMetadata(DatabaseSchemaMetadataKey, target.constructor) || [];
        const existingProperty = properties.find(p => p.propertyKey === propertyKey);

        if (existingProperty) {
            // If @DatabaseSchema was already applied, merge relationship options
            existingProperty.relationship = options;
        } else {
            // If @DatabaseSchema was not applied, create a new entry with relationship options
            properties.push({ propertyKey, relationship: options });
        }
        Reflect.defineMetadata(DatabaseSchemaMetadataKey, properties, target.constructor);
    };
}

/**
 * Decorator to mark a class as a root entity or embedded document for database schema generation.
 * This decorator primarily serves to identify classes that should have schemas generated for them.
 * It can be used on concrete application-level entities or embedded value objects.
 */
export function DatabaseEntity(): ClassDecorator {
    return (target: Function) => {
        // No specific metadata needed here for now, but can be extended later
        // For example, to define collection/table names, or global schema options.
    };
}

/**
 * Defines a prescriptive schema for a given class.
 * This function allows users to define schema properties as a plain object,
 * which then gets registered using the same metadata reflection mechanism
 * as the @DatabaseSchema and @RelationshipProperty decorators.
 *
 * @param target The class constructor for which the schema is being defined.
 * @param schemaDefinition A plain object where keys are property names and values are schema options.
 */
export function defineSchema<T>(
    target: Constructor<T>,
    schemaDefinition: {
        [key: string]: IPropertySchemaOptions & { relationship?: IRelationshipPropertyOptions };
    }
): void {
    const properties: IPropertySchemaMetadata[] = [];

    for (const propertyKey in schemaDefinition) {
        if (Object.prototype.hasOwnProperty.call(schemaDefinition, propertyKey)) {
            const options = schemaDefinition[propertyKey];
            properties.push({
                propertyKey,
                ...options,
            });
        }
    }

    // Get existing metadata for this specific class to merge with,
    // in case defineSchema is called multiple times or decorators are also used.
    const existingProperties: IPropertySchemaMetadata[] = Reflect.getOwnMetadata(DatabaseSchemaMetadataKey, target) || [];
    const mergedPropertiesMap = new Map<string, IPropertySchemaMetadata>();

    // Add existing properties first
    for (const prop of existingProperties) {
        mergedPropertiesMap.set(String(prop.propertyKey), prop);
    }

    // Add new properties, overriding existing ones if keys conflict
    for (const prop of properties) {
        mergedPropertiesMap.set(String(prop.propertyKey), { ...mergedPropertiesMap.get(String(prop.propertyKey)), ...prop });
    }

    Reflect.defineMetadata(DatabaseSchemaMetadataKey, Array.from(mergedPropertiesMap.values()), target);
}

/**
 * Helper function to retrieve all @DatabaseSchema metadata for a given class.
 * This function traverses the prototype chain to collect metadata from all superclasses.
 * @param target The class constructor to retrieve metadata for.
 * @returns An array of IPropertySchemaMetadata objects.
 */
export function getDatabaseSchemaMetadata(target: Function): IPropertySchemaMetadata[] {
    let allMetadata: IPropertySchemaMetadata[][] = [];
    let currentTarget = target;

    // Collect all metadata from the prototype chain, from derived to base
    while (currentTarget && currentTarget !== Object.prototype.constructor) {
        // Get metadata explicitly defined on the current class via @DatabaseSchema decorators
        const explicitMetadata = Reflect.getOwnMetadata(DatabaseSchemaMetadataKey, currentTarget) as IPropertySchemaMetadata[] | undefined;

        // Get metadata from domain type mappings (for base classes like Entity, ValueObject, Enumeration)
        const domainMetadata = getDomainSchemaMetadata(currentTarget);

        // Merge domain metadata with explicit metadata. Explicit metadata takes precedence.
        let currentClassMetadata: IPropertySchemaMetadata[] = [];
        const tempMap = new Map<string, IPropertySchemaMetadata>();

        // Add domain metadata first
        if (domainMetadata) {
            for (const prop of domainMetadata) {
                tempMap.set(String(prop.propertyKey), prop);
            }
        }

        // Add explicit metadata, overriding domain metadata if keys conflict
        if (explicitMetadata) {
            for (const prop of explicitMetadata) {
                tempMap.set(String(prop.propertyKey), { ...tempMap.get(String(prop.propertyKey)), ...prop });
            }
        }

        currentClassMetadata = Array.from(tempMap.values());

        if (currentClassMetadata.length > 0) {
            allMetadata.push(currentClassMetadata);
        }
        currentTarget = Object.getPrototypeOf(currentTarget);
    }

    let finalMergedMetadataMap = new Map<string, IPropertySchemaMetadata>();

    // Process metadata from base to derived (reverse order of collection in allMetadata)
    // This ensures properties in derived classes correctly override those in base classes.
    for (let i = allMetadata.length - 1; i >= 0; i--) {
        const metadataArray = allMetadata[i];
        for (const propMetadata of metadataArray) {
            finalMergedMetadataMap.set(
                String(propMetadata.propertyKey),
                { ...finalMergedMetadataMap.get(String(propMetadata.propertyKey)), ...propMetadata }
            );
        }
    }

    return Array.from(finalMergedMetadataMap.values());
}
