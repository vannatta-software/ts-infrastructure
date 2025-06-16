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
    public static extractSchema(target: Function): INeo4jSchemaDefinition {
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
            } else if (typeof propertyOptions.type === 'object' && propertyOptions.type !== null && Object.values(propertyOptions.type).some(val => typeof val === 'string' || typeof val === 'number')) {
                // Handle standard TypeScript enums (which are objects at runtime)
                // Determine if it's a string enum or numeric enum
                const enumValues = Object.values(propertyOptions.type).filter(value => typeof value === 'string' || typeof value === 'number') as (string | number)[];
                neo4jType = enumValues.some(val => typeof val === 'number') ? 'number' : 'string';
                // Directly assign enum values from the object
                propertyOptions.enum = enumValues;
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
                const relationshipKey = `${target.name}-${relOptions.type}-${relOptions.target.name}`; // Create a unique key for the relationship

                if (!seenRelationships.has(relationshipKey)) {
                    relationships.push({
                        sourceLabel: target.name,
                        targetLabel: relOptions.target.name,
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
            nodeSchema.properties[identifierKey] = {
                ...nodeSchema.properties[identifierKey],
                isIdentifier: true,
                unique: true, // Identifiers are typically unique
            };
        } else {
            // Fallback for entities without explicit @DatabaseSchema(isIdentifier: true)
            // Assume 'id' or '_id' if present and not explicitly handled
            if (nodeSchema.properties['id']) {
                nodeSchema.properties['id'].isIdentifier = true;
                nodeSchema.properties['id'].unique = true;
            } else if (nodeSchema.properties['_id']) {
                nodeSchema.properties['_id'].isIdentifier = true;
                nodeSchema.properties['_id'].unique = true;
            }
        }

        return {
            nodes: [nodeSchema],
            relationships: relationships,
        };
    }
}
