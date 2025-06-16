import { describe, expect, it } from 'vitest'; // Add Vitest imports
import { Schema } from 'mongoose';
import 'reflect-metadata'; // Ensure this is at the very top
import { MongoSchema } from '../mongo/mongo.schema';
import { DatabaseEntity, DatabaseSchema, DatabaseSchemaMetadataKey } from '../schema/database.schema';

// Import new consolidated test entities
import { BasicEntity, BasicEmbeddedValueObject, BasicEnum, BasicNumericEnum, StringLiteralEnum } from './test-class/basic-schema-entities';
import { ArrayEntity } from './test-class/array-schema-entities';
import { BaseInheritanceEntity, DerivedInheritanceEntity } from './test-class/inheritance-schema-entities';
import { ComplexUserEntity, UserProfileEntity, OrderEntity, ProductEntity, CommentEntity, PostEntity } from './test-class/complex-relationship-entities';
import { DeepEntity } from './test-class/recursion-depth-entity';
import { MyEnumeration } from './test-class/enumeration-base-class';

describe('Mongo.Schema', () => {
    it('should create a basic Mongoose schema from a class with @DatabaseSchema', () => {
        const schema = MongoSchema.extract(BasicEntity);
        expect(schema).toBeInstanceOf(Schema);
        expect((schema.obj.name as any).type).toBe(String);
        expect((schema.obj.age as any).type).toBe(Number);
        expect((schema as any).options._id).toBe(true); // BasicEntity is an Entity, so _id should be true
    });

    it('should handle UniqueIdentifier properties and map to _id for Entity', () => {
        const schema = MongoSchema.extract(BasicEntity);
        // Test individual properties to avoid deep equality issues with Schema instance
        expect(schema.obj._id).toEqual({ type: String, default: expect.any(Function) });
        expect(schema.obj.name).toEqual({ type: String });
        expect(schema.obj.age).toEqual({ type: Number, optional: true });
        expect(schema.obj.isActive).toEqual({ type: Boolean, default: false });
        expect(schema.obj.createdAt).toEqual({ type: Date });
        expect(schema.obj.updatedAt).toEqual({ type: Date, optional: true });
        expect(schema.obj.uniqueIdProperty).toEqual({ type: String });
        expect(schema.obj.metadata).toEqual({ type: Object });
        expect(schema.obj.status).toEqual({ type: String, enum: Object.values(BasicEnum) });
        // expect(schema.obj.numericStatus).toEqual({ type: Number, enum: Object.values(BasicNumericEnum) });
        expect(schema.obj.literalStatus).toEqual({ type: String, enum: ['LITERAL_A', 'LITERAL_B'] });

        // Separate test for embeddedObject
        expect(schema.obj.embeddedObject).toBeInstanceOf(Schema);
        expect((schema.obj.embeddedObject as any).obj).toEqual({
            value: { type: String },
            count: { type: Number, optional: true },
        });
        expect((schema.obj.embeddedObject as any).options._id).toBe(false);
        const idDefault = (schema.obj as any)._id.default();
        expect(typeof idDefault).toBe('string');
        expect(idDefault.length).toBeGreaterThan(0);
        expect((schema as any).options._id).toBe(true);
    });

    it('should handle ignored properties (if implemented in IPropertySchemaOptions)', () => {
        @DatabaseEntity()
        class TestClassWithIgnoredProp {
            @DatabaseSchema({ type: String })
            name: string;
            ignoredProp: string; // Not decorated, should be ignored
        }

        const schema = MongoSchema.extract(TestClassWithIgnoredProp);
        expect((schema.obj.name as any).type).toBe(String);
        expect(schema.obj).not.toHaveProperty('ignoredProp');
    });

    it('should handle array properties', () => {
        const schema = MongoSchema.extract(ArrayEntity);
        expect(schema.obj.stringArray).toEqual([String]); // Reverted to standard [String]
        expect(schema.obj.numberArray).toEqual([Number]); // Reverted to standard [Number]
        expect(schema.obj.uniqueIdentifierArray).toEqual([String]); // Reverted to standard [String]
        expect(schema.obj.embeddedObjectArray).toEqual([expect.any(Schema)]); // Updated expectation
        const embeddedArraySchema = (schema.obj.embeddedObjectArray as any)[0]; // Adjusted access
        expect(embeddedArraySchema).toBeInstanceOf(Schema);
        expect(embeddedArraySchema.obj).toEqual({
            value: { type: String },
            count: { type: Number, optional: true },
        });
        expect((embeddedArraySchema as any).options._id).toBe(false);
    });

    it('should handle embedded schemas', () => {
        const schema = MongoSchema.extract(BasicEntity);
        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toHaveProperty('embeddedObject');
        const embeddedSchema = schema.obj.embeddedObject;
        expect(embeddedSchema).toBeInstanceOf(Schema);
        expect((embeddedSchema as any).obj).toEqual({
            value: { type: String },
            count: { type: Number, optional: true },
        });
        expect((embeddedSchema as any).options._id).toBe(false);
    });

    it('should handle array of embedded schemas', () => {
        const schema = MongoSchema.extract(ArrayEntity);
        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toHaveProperty('embeddedObjectArray');
        expect(schema.obj.embeddedObjectArray).toEqual([expect.any(Schema)]); // Updated expectation
        expect(Array.isArray(schema.obj.embeddedObjectArray)).toBe(true); // Check if it's an array directly
        const itemSchema = (schema.obj.embeddedObjectArray as any)[0]; // Adjusted access
        expect(itemSchema).toBeInstanceOf(Schema);
        expect(itemSchema.obj).toEqual({
            value: { type: String },
            count: { type: Number, optional: true },
        });
        expect((itemSchema as any).options._id).toBe(false);
    });

    it('should handle enumeration properties from concrete class', () => {
        const schema = MongoSchema.extract(BasicEntity);
        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toHaveProperty('status');
        const statusSchema = schema.obj.status;
        expect(statusSchema).toEqual({ type: String, enum: Object.values(BasicEnum) }); // Changed type to String (constructor)
    });

    it('should handle enumeration properties from Enumeration base class', () => {
        const schema = MongoSchema.extract(MyEnumeration);
        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toHaveProperty('id');
        expect(schema.obj).toHaveProperty('name');
        expect(schema.obj.id).toEqual({ type: Number });
        expect(schema.obj.name).toEqual({ type: String });
        expect((schema as any).options._id).toBe(false);
    });

    it('should handle string literal enum properties (explicit enum array still required)', () => {
        const schema = MongoSchema.extract(BasicEntity);
        expect(schema.obj).toEqual(
            expect.objectContaining({
                literalStatus: { type: String, enum: ['LITERAL_A', 'LITERAL_B'] },
            })
        );
    });

    it('should return empty schema for null/undefined targetClass', () => {
        const schema = MongoSchema.extract(null);
        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toEqual({});
        expect((schema as any).options._id).toBe(false);
    });

    it('should limit recursion depth', () => {
        const schemaAtDepth5 = MongoSchema.extract(DeepEntity, 5);
        expect(schemaAtDepth5).toBeInstanceOf(Schema);
        expect(schemaAtDepth5.obj).toHaveProperty('child');
        const nextSchemaAtDepth5 = (schemaAtDepth5.obj as any).child;
        expect(nextSchemaAtDepth5).toBeInstanceOf(Schema);
        expect(nextSchemaAtDepth5.obj).toEqual({});
        expect((nextSchemaAtDepth5 as any).options._id).toBe(false);

        const schemaAtDepth6 = MongoSchema.extract(DeepEntity, 6);
        expect(schemaAtDepth6).toBeInstanceOf(Schema);
        expect(schemaAtDepth6.obj).toEqual({});
        expect((schemaAtDepth6 as any).options._id).toBe(false);
    });

    it('should correctly create a schema for ComplexUser with nested types and unique property, including inherited properties', () => {
        const schema = MongoSchema.extract(ComplexUserEntity);

        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toBeDefined();

        expect(schema.obj._id).toEqual({ type: String, default: expect.any(Function) });
        expect(schema.obj.createdAt).toEqual({ type: Date });
        expect(schema.obj.updatedAt).toEqual({ type: Date, optional: true });
        expect((schema as any).options._id).toBe(true);

        expect(schema.obj.username).toEqual({ type: String });
        expect(schema.obj.email).toEqual({ type: String, optional: true });

        expect(schema.obj.address).toBeInstanceOf(Schema);
        expect((schema.obj.address as any).obj.value).toEqual({ type: String });
        expect((schema.obj.address as any).obj.count).toEqual({ type: Number, optional: true });
        expect((schema.obj.address as any).options._id).toBe(false);

        expect(schema.obj.role).toEqual({ type: String, enum: Object.values(BasicEnum) }); // Changed type to String (constructor)
        
        expect(schema.obj.profile).toBeInstanceOf(Schema);
        expect((schema.obj.profile as any).obj.bio).toEqual({ type: String });
        expect((schema.obj.profile as any).obj.website).toEqual({ type: String, optional: true });
        expect((schema.obj.profile as any).options._id).toBe(false); // UserProfileEntity is a ValueObject

        // Relationships are now mapped to an array of Strings (UniqueIdentifiers) in Mongo.Schema
        expect(schema.obj.orders).toEqual({ type: [String] });
        expect(schema.obj.likedProducts).toEqual({ type: [String] });
    });

    it('should handle inheritance correctly', () => {
        const baseSchema = MongoSchema.extract(BaseInheritanceEntity);
        expect(baseSchema.obj).toEqual(
            expect.objectContaining({
                _id: { type: String, default: expect.any(Function) },
                baseProperty: { type: String },
                baseOptionalProperty: { type: Number, optional: true },
                createdAt: { type: Date },
                updatedAt: { type: Date, optional: true },
            })
        );
        expect((baseSchema as any).options._id).toBe(true);

        const derivedSchema = MongoSchema.extract(DerivedInheritanceEntity);
        expect(derivedSchema.obj).toEqual(
            expect.objectContaining({
                _id: { type: String, default: expect.any(Function) },
                baseProperty: { type: String },
                baseOptionalProperty: { type: Number, optional: false }, // Overridden to be required in derived
                derivedProperty: { type: String },
                derivedBoolean: { type: Boolean, default: true },
                derivedEmbedded: expect.any(Schema), // Expect a Schema instance
                createdAt: { type: Date },
                updatedAt: { type: Date, optional: true },
            })
        );
        expect((derivedSchema as any).options._id).toBe(true);
        // Check the obj property of the derivedEmbedded schema separately
        expect((derivedSchema.obj.derivedEmbedded as any).obj).toEqual({
            value: { type: String },
            count: { type: Number, optional: true },
        });
        expect((derivedSchema.obj.derivedEmbedded as any).options._id).toBe(false);
    });
});

describe('Mongo.extractSchema', () => {
    it('should extract a plain object from a Mongoose schema', () => {
        const embeddedSchema = new Schema({
            value: { type: String },
        });
        const testSchema = new Schema({
            name: { type: String },
            age: { type: Number },
            embedded: embeddedSchema,
        });

        const extracted = MongoSchema.extractProperties(testSchema);
        expect(extracted).toHaveProperty('name');
        expect(extracted).toHaveProperty('age');
        expect(extracted).toHaveProperty('embedded');

        expect((extracted.name as any).type).toBe(String);
        expect((extracted.age as any).type).toBe(Number);

        const extractedEmbedded = (extracted.embedded as any);
        expect(extractedEmbedded).toHaveProperty('value');
        expect((extractedEmbedded.value as any).type).toBe(String);
    });

    it('should handle empty schema', () => {
        const emptySchema = new Schema({});
        const extracted = MongoSchema.extractProperties(emptySchema);
        expect(extracted).toEqual({});
    });

    it('should handle null/undefined schema', () => {
        expect(MongoSchema.extractProperties(null as any)).toEqual({});
        expect(MongoSchema.extractProperties(undefined as any)).toEqual({});
    });

    it('should handle schema with array of embedded schemas', () => {
        const itemSchema = new Schema({
            itemValue: { type: String },
        });
        const listSchema = new Schema({
            items: { type: [itemSchema] },
        });

        const extracted = MongoSchema.extractProperties(listSchema);
        expect(extracted).toHaveProperty('items');
        expect((extracted.items as any)).toHaveProperty('type');
        expect(Array.isArray((extracted.items as any).type)).toBe(true);

        const extractedItemSchema = (extracted.items as any).type[0];
        expect(extractedItemSchema).toHaveProperty('obj');
        expect(extractedItemSchema.obj).toHaveProperty('itemValue');
        expect(((extractedItemSchema as any).obj as any).itemValue.type).toBe(String);
    });
});
