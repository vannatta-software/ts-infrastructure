import { Entity, UniqueIdentifier, ValueObject } from '@vannatta-software/ts-utils-domain';

/**
 * Maps an entity's properties to a format suitable for Neo4j node/relationship properties.
 * Handles conversion of UniqueIdentifier to string and Date to ISO string.
 * Converts nested objects (ValueObjects, plain objects) to JSON strings.
 * Recursively handles arrays of these types.
 * @param entity The entity instance.
 * @returns A plain object with properties mapped for Neo4j.
 */
export function mapEntityToNeo4jProperties<T extends Entity>(entity: T | ValueObject): Record<string, any> {
    const properties: Record<string, any> = {};
    const document = (entity as any).document || entity; // Start with the entity's document or the object itself if it's a ValueObject

    for (const key in document) {
        if (Object.prototype.hasOwnProperty.call(document, key)) {
            const value = document[key];

            if (value instanceof UniqueIdentifier) {
                properties[key] = value.value; // Convert UniqueIdentifier to its string value
            } else if (value instanceof Date) {
                properties[key] = value.toISOString(); // Convert Date to ISO string
            } else if (value instanceof ValueObject) {
                // Convert embedded ValueObjects to JSON strings
                properties[key] = JSON.stringify(mapEntityToNeo4jProperties(value));
            } else if (Array.isArray(value)) {
                // Handle arrays, converting items if they are complex types
                properties[key] = value.map(item => {
                    if (item instanceof UniqueIdentifier) {
                        return item.value;
                    } else if (item instanceof Date) {
                        return item.toISOString();
                    } else if (item instanceof ValueObject) {
                        return JSON.stringify(mapEntityToNeo4jProperties(item));
                    }
                    return item;
                });
            } else if (typeof value === 'object' && value !== null) {
                // Handle plain objects (like metadata) by converting to JSON strings
                properties[key] = JSON.stringify(value);
            } else {
                properties[key] = value;
            }
        }
    }

    // Ensure 'id' property is always present and is the string value of UniqueIdentifier
    // This handles cases where the domain entity's ID property might be named differently
    // or if the base Entity class handles it as '_id' internally.
    if (entity instanceof Entity && entity.id instanceof UniqueIdentifier) {
        properties['id'] = entity.id.value;
    }

    return properties;
}
