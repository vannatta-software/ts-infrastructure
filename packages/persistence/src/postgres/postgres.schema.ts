import { EntitySchema, ColumnOptions } from 'typeorm';
import { UniqueIdentifier, Entity, ValueObject, Enumeration } from '@vannatta-software/ts-utils-domain';
import { getDatabaseSchemaMetadata } from '../schema/database.schema';
import { IPropertySchemaMetadata } from '../schema/schema.interfaces';
import { DOMAIN_PRIMITIVE_TYPE_MAP } from '../schema/domain-type-mappings';
import 'reflect-metadata';

export class PostgresSchema {
    public static extract(entityClass: any, depth: number = 0): EntitySchema<any> {
        if (!entityClass || depth > 5) {
            return new EntitySchema({
                name: 'EmptyEntity', // Always return 'EmptyEntity' name when depth limit is reached
                target: entityClass,
                columns: {}
            });
        }

        const schemaMetadataMap = getDatabaseSchemaMetadata(entityClass);
        const columns: { [key: string]: any } = {};
        const relations: { [key: string]: any } = {}; // Initialize relations object

        // Base Entity properties (id, createdAt, updatedAt) are handled by their respective @DatabaseSchema decorators
        // and the general property processing loop below.
        // The 'id' property's primary key status is set by metadata.isIdentifier.

        // Handle base Enumeration properties (id, name)
        if (entityClass.prototype instanceof Enumeration) {
            columns['id'] = { type: Number };
            columns['name'] = { type: String };
        }

        Array.from(schemaMetadataMap.values()).flat().forEach((metadata: IPropertySchemaMetadata) => {
            const key = metadata.propertyKey as string;

            // Handle relationship properties
            if (metadata.relationship) {
                const relationOptions: any = {
                    target: metadata.relationship.target,
                    inverseSide: metadata.relationship.inverse,
                    cascade: metadata.relationship.cascade,
                    eager: metadata.relationship.eager,
                };

                switch (metadata.relationship.cardinality) {
                    case 'one-to-one':
                        relationOptions.type = 'one-to-one';
                        if (metadata.relationship.owner) {
                            relationOptions.joinColumn = metadata.relationship.columns ? { name: metadata.relationship.columns[0] } : true;
                        }
                        break;
                    case 'one-to-many':
                        relationOptions.type = 'one-to-many';
                        break;
                    case 'many-to-one':
                        relationOptions.type = 'many-to-one';
                        if (metadata.relationship.owner) { // ManyToOne is always the owning side in TypeORM
                            relationOptions.joinColumn = metadata.relationship.columns ? { name: metadata.relationship.columns[0] } : true;
                        }
                        break;
                    case 'many-to-many':
                        relationOptions.type = 'many-to-many';
                        if (metadata.relationship.owner) {
                            relationOptions.joinTable = metadata.relationship.table ? { name: metadata.relationship.table } : true;
                            if (metadata.relationship.columns && metadata.relationship.columns.length >= 2) {
                                relationOptions.joinTable = {
                                    ...relationOptions.joinTable,
                                    joinColumn: { name: metadata.relationship.columns[0] },
                                    inverseJoinColumn: { name: metadata.relationship.columns[1] },
                                };
                            }
                        }
                        break;
                    default:
                        // If cardinality is not specified or unknown, skip or log a warning
                        console.warn(`Unknown or unspecified cardinality for relationship property '${key}'. Skipping relation generation.`);
                        return; // Skip this property if cardinality is not handled
                }
                relations[key] = relationOptions;
                return; // Skip column processing for relationship properties
            }

            let columnType: any;
            let columnOptions: ColumnOptions = {};

            const domainPrimitiveType = DOMAIN_PRIMITIVE_TYPE_MAP.get(metadata.type);


            if (domainPrimitiveType) {
                columnType = domainPrimitiveType;
                if (metadata.default !== undefined) {
                    columnOptions.default = metadata.default;
                }
            } else {
                const isDomainAbstraction = metadata.type && typeof metadata.type === 'function' && (metadata.type.prototype instanceof ValueObject || metadata.type.prototype instanceof Entity);
                const isArrayOfDomainAbstraction = Array.isArray(metadata.type) && metadata.type[0] && typeof metadata.type[0] === 'function' && (metadata.type[0].prototype instanceof ValueObject || metadata.type[0].prototype instanceof Entity);

                // Handle standard TypeScript enums (which are objects at runtime)
                if (typeof metadata.type === 'object' && metadata.type !== null && Object.values(metadata.type).some(val => typeof val === 'string' || typeof val === 'number')) {
                    const enumValues = Object.values(metadata.type);
                    const isNumericEnum = enumValues.some(val => typeof val === 'number'); // Check if any value is a number
                    columnType = isNumericEnum ? Number : String; // Store as number or string in DB
                    columnOptions.enum = enumValues.filter(value => typeof value === 'string' || typeof value === 'number');
                }
                // Handle embedded objects or arrays of embedded objects
                else if (isDomainAbstraction || isArrayOfDomainAbstraction) {
                    columnType = 'jsonb';
                } else {
                    switch (metadata.type) {
                        case String: columnType = String; break;
                        case Number: columnType = Number; break;
                        case Boolean: columnType = Boolean; break;
                        case Date: columnType = Date; break;
                        case Object: columnType = 'jsonb'; break;
                        default:
                            if (Array.isArray(metadata.type)) {
                                const arrayType = metadata.type[0];
                                if (typeof arrayType === 'function' && arrayType.prototype instanceof Enumeration) {
                                    columnType = String; // Array of Enumerations (stored as strings)
                                } else {
                                    columnType = 'simple-array'; // TypeORM uses 'simple-array' for primitive arrays
                                }
                            } else if (typeof metadata.type === 'function' && metadata.type.prototype instanceof Enumeration) {
                                columnType = String; // Single Enumeration (stored as string)
                            } else {
                                columnType = String; // Fallback for unknown types, or types that should be string
                            }
                    }
                }
            }

            // Apply unique, enum, and primary options after determining columnType
            if (metadata.unique) {
                columnOptions.unique = true;
            }
            if (metadata.enum) {
                columnOptions.enum = metadata.enum;
            }
            if (metadata.isIdentifier) {
                columnOptions.primary = true;
                columnOptions.unique = true; // UniqueIdentifier properties are inherently unique
            }

            columnOptions.type = columnType;

            if (metadata.optional !== undefined) {
                columnOptions.nullable = metadata.optional;
            }
            // Only apply default if it's not a primary identifier handled by TypeORM's default UUID generation
            if (metadata.default !== undefined && !(metadata.isIdentifier && columnType === String)) {
                columnOptions.default = metadata.default;
            }

            // If the property is an identifier and its key is '_id', map it to 'id' for TypeORM
            const finalKey = (metadata.isIdentifier && key === '_id') ? 'id' : key;
            columns[finalKey] = columnOptions;
        });

        const entitySchema = new EntitySchema({
            name: entityClass.name,
            target: entityClass,
            columns: columns,
            relations: relations, // Pass relations to EntitySchema
        });
        return entitySchema;
    }
}
