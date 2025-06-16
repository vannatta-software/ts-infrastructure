import { EntitySchema, ColumnOptions } from 'typeorm';
import { UniqueIdentifier, Entity, ValueObject, Enumeration } from '@vannatta-software/ts-utils-domain';
import { getDatabaseSchemaMetadata } from '../schema/database.schema';
import { IPropertySchemaMetadata } from '../schema/schema.interfaces';
import { DOMAIN_PRIMITIVE_TYPE_MAP } from '../schema/domain-type-mappings';
import 'reflect-metadata';

export class PostgresSchema {
    public static getTypeOrmEntity(entityClass: any, depth: number = 0): EntitySchema<any> {
        if (!entityClass || depth > 5) {
            return new EntitySchema({
                name: 'EmptyEntity', // Always return 'EmptyEntity' name when depth limit is reached
                target: entityClass,
                columns: {}
            });
        }

        const schemaMetadataMap = getDatabaseSchemaMetadata(entityClass);
        const columns: { [key: string]: any } = {};

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

            // Skip relationship properties as they are not direct columns in TypeORM for Postgres
            if (metadata.relationship) {
                return;
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
            if (metadata.isIdentifier) { // Add this to correctly set primary key from decorator
                columnOptions.primary = true;
            }

            columnOptions.type = columnType;

            if (metadata.optional !== undefined) {
                columnOptions.nullable = metadata.optional;
            }
            // Only apply default if it's not a primary identifier handled by TypeORM's default UUID generation
            if (metadata.default !== undefined && !(metadata.isIdentifier && columnType === String)) {
                columnOptions.default = metadata.default;
            }

            columns[key] = columnOptions;
        });

        const entitySchema = new EntitySchema({
            name: entityClass.name,
            target: entityClass,
            columns: columns,
        });
        return entitySchema;
    }
}
