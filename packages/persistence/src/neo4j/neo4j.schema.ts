import 'reflect-metadata';
import {
    getDatabaseSchemaMetadata,
    DatabaseSchemaMetadataKey,
    DatabaseEntity
} from '../schema/database.schema';
import {
    IPropertySchemaMetadata,
    IRelationshipPropertyOptions,
    IPropertySchemaOptions
} from '../schema/schema.interfaces';
import { UniqueIdentifier, Entity, ValueObject, Enumeration } from '@vannatta-software/ts-utils-domain';

/**
 * Interface for a Neo4j Node schema definition.
 */
export interface INeo4jNodeSchema {
    label: string;
    properties: {
        [propertyName: string]: {
            type: string; // Neo4j property type (e.g., 'string', 'number', 'boolean', 'array', 'object')
            isIdentifier?: boolean;
            unique?: boolean;
            optional?: boolean;
            enum?: (string | number)[];
            default?: any;
        };
    };
}

/**
 * Interface for a Neo4j Relationship schema definition.
 */
export interface INeo4jRelationshipSchema {
    sourceLabel: string;
    targetLabel: string;
    type: string; // The relationship type (e.g., 'HAS_ORDER')
    edgeProperties: string[]; // Names of properties from the source entity to put on the edge
    direction: 'INCOMING' | 'OUTGOING' | 'BOTH';
}

/**
 * Interface for the complete Neo4j schema definition, including nodes and relationships.
 */
export interface INeo4jSchemaDefinition {
    nodes: INeo4jNodeSchema[];
    relationships: INeo4jRelationshipSchema[];
}

export class Neo4jSchema {
    public static extract(target: Function): INeo4jSchemaDefinition {
        const nodeSchema: INeo4jNodeSchema = {
            label: target.name, // Node label is the class name
            properties: {},
        };
        const relationships: INeo4jRelationshipSchema[] = [];
        const seenRelationships = new Set<string>(); // To track unique relationships

        const metadata = getDatabaseSchemaMetadata(target);

        for (const propMetadata of metadata) {
            const propertyKey = String(propMetadata.propertyKey);
            const propertyOptions: IPropertySchemaOptions = propMetadata;

            // --- Process Node Properties ---
            let neo4jType: string;

            // Determine Neo4j property type
            if (propertyOptions.type === UniqueIdentifier) {
                neo4jType = 'string';
            } else if (propertyOptions.type === String) {
                neo4jType = 'string';
            } else if (propertyOptions.type === Number) {
                neo4jType = 'number';
            } else if (propertyOptions.type === Boolean) {
                neo4jType = 'boolean';
            } else if (propertyOptions.type === Date) {
                neo4jType = 'datetime'; // Neo4j has a datetime type
            } else if (Array.isArray(propertyOptions.type)) {
                // Handle arrays. Determine the type of items in the array.
                const itemType = propertyOptions.type[0];
                if (itemType === UniqueIdentifier || itemType === String) {
                    neo4jType = 'string[]';
                } else if (itemType === Number) {
                    neo4jType = 'number[]';
                } else if (itemType === Boolean) {
                    neo4jType = 'boolean[]';
                } else if (itemType === Date) {
                    neo4jType = 'datetime[]';
                } else {
                    // Check if array items are embedded entities/value objects
                    const isEmbeddedItemEntity = itemType && typeof itemType === 'function' && Reflect.hasOwnMetadata(DatabaseSchemaMetadataKey, itemType);
                    const isDomainAbstractionItem = itemType && typeof itemType === 'function' && (itemType.prototype instanceof ValueObject || itemType.prototype instanceof Entity);
                    if (isEmbeddedItemEntity || isDomainAbstractionItem) {
                        neo4jType = 'object[]'; // Array of embedded objects
                    } else {
                        neo4jType = 'any[]'; // Fallback for unknown array item types
                    }
                }
            } else if (typeof propertyOptions.type === 'object' && propertyOptions.type !== null && !Array.isArray(propertyOptions.type) && !(propertyOptions.type.prototype instanceof ValueObject) && !(propertyOptions.type.prototype instanceof Entity)) {
                // Handle standard TypeScript enums (which are objects at runtime, but not arrays, ValueObjects, or Entities)
                const enumValues = Object.values(propertyOptions.type); // Get all values, including reverse mappings for numeric enums

                if (enumValues.length > 0) {
                    const hasNumericValues = enumValues.some(value => typeof value === 'number');
                    const hasStringValues = enumValues.some(value => typeof value === 'string');

                    let enumType = 'string'; // Default to string
                    if (hasNumericValues && !hasStringValues) {
                        enumType = 'number'; // Pure numeric enum
                    } else if (hasNumericValues && hasStringValues) {
                        // Mixed enum (numeric enum with reverse mappings) - Neo4j stores actual values
                        enumType = 'number'; // Assume number if actual values are numbers
                    }
                    neo4jType = enumType;
                    propertyOptions.enum = enumValues as (string | number)[]; // Assign all values
                } else {
                    neo4jType = 'any'; // Fallback if no enum values found
                }
            } else if (propertyOptions.type === Object) { // Explicitly handle Object type
                neo4jType = 'object';
            }
            else {
                // Check if it's an embedded object (ValueObject or Entity)
                const isEmbeddedEntity = propertyOptions.type && typeof propertyOptions.type === 'function' && Reflect.hasOwnMetadata(DatabaseSchemaMetadataKey, propertyOptions.type);
                const isDomainAbstraction = propertyOptions.type && typeof propertyOptions.type === 'function' && (propertyOptions.type.prototype instanceof ValueObject || propertyOptions.type.prototype instanceof Entity);

                if (isEmbeddedEntity || isDomainAbstraction) {
                    neo4jType = 'object'; // Store as a JSON object in Neo4j
                } else {
                    neo4jType = 'any'; // Fallback for unhandled types
                }
            }

            nodeSchema.properties[propertyKey] = {
                type: neo4jType,
                isIdentifier: propertyOptions.isIdentifier,
                unique: propertyOptions.unique,
                optional: propertyOptions.optional,
                enum: propertyOptions.enum, // This will now be populated for inferred enums
                default: propertyOptions.default,
            };

            // --- Process Relationship Properties (if applicable) ---
            if (propMetadata.relationship) {
                const relOptions: IRelationshipPropertyOptions = propMetadata.relationship;
                const relationshipKey = `${target.name}-${relOptions.type}-${(relOptions.target as Function)().name}`; // Create a unique key for the relationship

                if (!seenRelationships.has(relationshipKey)) {
                    relationships.push({
                        sourceLabel: target.name,
                        targetLabel: (relOptions.target as Function)().name, // Call the lazy reference function
                        type: relOptions.type,
                        edgeProperties: relOptions.properties || [],
                        direction: relOptions.direction || 'OUTGOING',
                    });
                    seenRelationships.add(relationshipKey);
                }
            }
        }

        // Ensure the primary identifier (_id or id) is correctly marked
        const identifierProp = metadata.find(p => p.isIdentifier);
        if (identifierProp) {
            const identifierKey = String(identifierProp.propertyKey);
            // If the domain identifier is '_id' but Neo4j convention is 'id'
            if (identifierKey === '_id') {
                nodeSchema.properties['id'] = {
                    type: 'string', // Assuming UniqueIdentifier maps to string
                    isIdentifier: true,
                    unique: true,
                    optional: false,
                    default: nodeSchema.properties[identifierKey]?.default, // Copy default if exists
                };
                delete nodeSchema.properties[identifierKey]; // Remove the _id property
            } else {
                // For other explicit identifiers
                nodeSchema.properties[identifierKey] = {
                    ...nodeSchema.properties[identifierKey],
                    isIdentifier: true,
                    unique: true,
                };
            }
        } else {
            // Fallback for entities without explicit @DatabaseSchema(isIdentifier: true)
            // Assume 'id' if present
            if (nodeSchema.properties['id']) {
                nodeSchema.properties['id'].isIdentifier = true;
                nodeSchema.properties['id'].unique = true;
            }
            // No need to check for '_id' here if we're mapping it to 'id' above.
        }

        return {
            nodes: [nodeSchema],
            relationships: relationships,
        };
    }
}
