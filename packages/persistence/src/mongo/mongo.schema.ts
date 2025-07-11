import { Schema } from 'mongoose';
import 'reflect-metadata';
import { UniqueIdentifier, Entity, Enumeration, ValueObject } from '@vannatta-software/ts-utils-domain'; // Import base domain types
import {
    getDatabaseSchemaMetadata, DatabaseEntity
} from '../schema/database.schema';
import { IPropertySchemaMetadata } from '../schema/schema.interfaces';
import { getDomainSchemaMetadata, getDatabaseTypeForDomainPrimitive } from '../schema/domain-type-mappings';


type ISchema = Record<string, any>

function isSchema(obj: any): obj is Schema {
    return obj.obj != undefined;
}

// Helper to get enum values from a ts-utils-domain Enumeration class
function getEnumerationClassValues(enumClass: any): (string | number)[] {
    const values: (string | number)[] = [];
    for (const key in enumClass) {
        const value = enumClass[key];
        // Check if the value is an instance of the enumClass itself (e.g., MyEnum.VALUE1 is an instance of MyEnum)
        if (value instanceof enumClass) {
            // Assuming Enumeration instances have a '_name' or '_id' property for their value
            if (typeof value._name === 'string') {
                values.push(value._name);
            } else if (typeof value._id === 'number' || typeof value._id === 'string') {
                values.push(value._id);
            }
        }
    }
    return values;
}


export class MongoSchema {
    public static extract(targetClass: any, depth = 0): Schema {
        if (!targetClass || depth > 5) return new Schema({}, { _id: false });
        
        const schema: ISchema = {};
        const processedKeys = new Set<string | symbol>(); // To prevent duplicate properties from inheritance

        // 1. Get metadata from @DatabaseSchema decorators (from concrete class and its superclasses)
        const decoratedProps = getDatabaseSchemaMetadata(targetClass);

        // 2. Get metadata for base domain types if the targetClass inherits from them
        let domainBaseProps: IPropertySchemaMetadata[] = [];
        if (targetClass.prototype instanceof Entity) {
            domainBaseProps = [...domainBaseProps, ...getDomainSchemaMetadata(Entity)];
        }
        if (targetClass.prototype instanceof Enumeration) {
            domainBaseProps = [...domainBaseProps, ...getDomainSchemaMetadata(Enumeration)];
        }
        if (targetClass.prototype instanceof ValueObject) {
            domainBaseProps = [...domainBaseProps, ...getDomainSchemaMetadata(ValueObject)];
        }

        // Combine and process decorated properties first, then domain base properties.
        // This ensures decorated properties (from concrete class/subclasses) override base domain properties.
        const allProps = [...decoratedProps, ...domainBaseProps];

        allProps.forEach((options: IPropertySchemaMetadata) => {
            const key = options.propertyKey;

            let typeDefinition: any;
            let isHandledByInference = false; // Flag to indicate if inference has set typeDefinition

            // Pre-process options.type for arrays containing UniqueIdentifier
            // This ensures Mongoose sees [String] directly for UniqueIdentifier arrays
            if (Array.isArray(options.type) && options.type[0] === UniqueIdentifier) {
                options.type = [String];
            }
            // Pre-process options.type for arrays containing ValueObjects or Entities
            // This ensures Mongoose sees [SchemaInstance] directly for embedded object arrays
            if (Array.isArray(options.type) && typeof options.type[0] === 'function' && (options.type[0].prototype instanceof ValueObject || options.type[0].prototype instanceof Entity)) {
                options.type = [MongoSchema.extract(options.type[0], depth + 1)];
            }

            // Handle Relationship properties
            if (options.relationship) {
                // Assuming relationships are typically references to other entities by their UniqueIdentifier (string)
                // For now, let's assume it's an array of UniqueIdentifiers for simplicity, as seen in ComplexUserEntity
                typeDefinition = { type: [String] };
                isHandledByInference = true;
            }

            // --- INFERENCE LOGIC ---
            // 1. Handle ts-utils-domain Enumeration classes
            if (typeof options.type === 'function' && options.type.prototype instanceof Enumeration) {
                const enumSchemaType = getDatabaseTypeForDomainPrimitive(UniqueIdentifier) || String; // Enumeration ID type
                typeDefinition = { type: enumSchemaType, enum: getEnumerationClassValues(options.type) };
                isHandledByInference = true;
            }
            // 2. Handle arrays (after pre-processing for specific types like UniqueIdentifier and embedded objects)
            else if (Array.isArray(options.type)) { // Handle all arrays here
                const arrayItemType = options.type[0]; // This will now be String, Number, or Schema instance

                if (arrayItemType === String) {
                    typeDefinition = [String];
                    isHandledByInference = true;
                } else if (arrayItemType === Number) {
                    typeDefinition = [Number];
                    isHandledByInference = true;
                } else if (arrayItemType instanceof Schema) { // If it's already a Schema instance from pre-processing
                    typeDefinition = [arrayItemType]; // Mongoose accepts array of schemas directly
                    isHandledByInference = true;
                } else if (typeof arrayItemType === 'function' && arrayItemType.prototype instanceof Enumeration) {
                    // Array of Enumeration instances (stored as strings or numbers based on enum type)
                    const enumSchemaType = getDatabaseTypeForDomainPrimitive(UniqueIdentifier) || String;
                    typeDefinition = [{ type: enumSchemaType, enum: getEnumerationClassValues(arrayItemType) }];
                    isHandledByInference = true;
                } else {
                    // Fallback for arrays of primitive types (String, Number, Boolean, Date)
                    typeDefinition = options.type;
                    isHandledByInference = true;
                }
            }
            // 3. Handle standard TypeScript enums (which are objects at runtime)
            else if (typeof options.type === 'object' && options.type !== null) {
                const enumValues = Object.values(options.type); // Get all values, including reverse mappings for numeric enums

                if (enumValues.length > 0) {
                    // Determine if it's a numeric enum by checking if any value is a number
                    const hasNumericValues = enumValues.some(value => typeof value === 'number');
                    const hasStringValues = enumValues.some(value => typeof value === 'string');

                    let enumType:any = String; // Default to String
                    if (hasNumericValues && !hasStringValues) {
                        enumType = Number; // Pure numeric enum
                    } else if (hasNumericValues && hasStringValues) {
                        // Mixed enum (numeric enum with reverse mappings) - Mongoose usually stores as Number if actual values are numbers
                        // The test expects type: Number for BasicNumericEnum, so we'll stick to that.
                        enumType = Number;
                    }

                    typeDefinition = {
                        type: enumType,
                        enum: enumValues // Use all values for the enum array
                    };
                    isHandledByInference = true;
                }
            }
            // 4. Handle Embedded Objects/Single Entities
            else if (typeof options.type === 'function' && (options.type.prototype instanceof ValueObject || options.type.prototype instanceof Entity)) { // Single embedded entity
                typeDefinition = MongoSchema.extract(options.type, depth + 1);
                isHandledByInference = true;
            }

            // If not handled by specific inference, determine finalSchemaType and then typeDefinition
            if (!isHandledByInference) {
                let finalSchemaType: any = options.type;

                // Explicitly map UniqueIdentifier to String if it's the type
                if (finalSchemaType === UniqueIdentifier) {
                    finalSchemaType = String;
                }

                // Handle Arrays of Primitives (e.g., [String], [Number]) - this block might be redundant now
                if (Array.isArray(finalSchemaType)) {
                    typeDefinition = finalSchemaType; // Mongoose accepts [String], [Number] directly
                }
                // Fallback for Primitive types or other complex types
                else {
                    typeDefinition = { type: finalSchemaType };
                }
            } // This closing brace was missing, now it's correct.

            // Apply unique, optional, default, and explicit enum from options
            // These should apply regardless of how typeDefinition was initially set
            if (options.unique !== undefined) {
                typeDefinition.unique = options.unique;
            }
            if (options.optional !== undefined) {
                typeDefinition.optional = options.optional;
            }
            if (options.default !== undefined) {
                typeDefinition.default = options.default;
            }
            if (options.enum !== undefined) { // Explicit enum from decorator takes precedence
                typeDefinition.enum = options.enum;
            }
            schema[String(key)] = typeDefinition; // Explicitly convert key to string
            processedKeys.add(String(key)); // Explicitly convert symbol to string
        });

        // Determine _id option for the Mongoose Schema constructor
        // Entities should generally have _id: true. ValueObjects and Enumerations should have _id: false.
        let shouldHaveId = false;
        if (targetClass.prototype instanceof Entity) {
            shouldHaveId = true;
        } else if (targetClass.prototype instanceof ValueObject || targetClass.prototype instanceof Enumeration) {
            shouldHaveId = false;
        }
        const schemaOptions = { _id: shouldHaveId };

        return new Schema(schema, schemaOptions);
    }

    public static extractProperties(schema: Schema): ISchema {
        if (!schema || !schema.obj) return {};

        let result: ISchema = {};

        Object.entries(schema.obj).forEach((entry) => {
            const key = entry[0];
            const value = entry[1];

            if (isSchema(value)) {
                result[key] = MongoSchema.extractProperties(value as Schema);
                return;
            }

            result[key] = value;
        })

        return result;
    }
}
