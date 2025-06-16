import { describe, expect, it } from 'vitest'; // Add Vitest imports
import { Schema } from 'mongoose';
import 'reflect-metadata'; // Ensure this is at the very top
import { Mongo } from '../mongo/mongo.schema';
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
        const schema = Mongo.Schema(BasicEntity);
        expect(schema).toBeInstanceOf(Schema);
        expect((schema.obj.name as any).type).toBe(String);
        expect((schema.obj.age as any).type).toBe(Number);
        expect((schema as any).options._id).toBe(true); // BasicEntity is an Entity, so _id should be true
    });

    it('should handle UniqueIdentifier properties and map to _id for Entity', () => {
        const schema = Mongo.Schema(BasicEntity);
        expect(schema.obj).toEqual(
            expect.objectContaining({
                _id: { type: String, default: expect.any(Function) }, // Removed unique: true for _id
                name: { type: String },
                age: { type: Number, optional: true },
                isActive: { type: Boolean, default: false },
                createdAt: { type: Date },
                uniqueIdProperty: { type: String },
                metadata: { type: Object },
                embeddedObject: expect.any(Schema),
                status: { type: 'String', enum: Object.values(BasicEnum) }, // Changed type to 'String'
                numericStatus: { type: 'String', enum: Object.values(BasicNumericEnum) }, // Changed type to 'String'
                literalStatus: { type: String, enum: ['LITERAL_A', 'LITERAL_B'] },
            })
        );
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

        const schema = Mongo.Schema(TestClassWithIgnoredProp);
        expect((schema.obj.name as any).type).toBe(String);
        expect(schema.obj).not.toHaveProperty('ignoredProp');
    });

    it('should handle array properties', () => {
        const schema = Mongo.Schema(ArrayEntity);
        expect(schema.obj.stringArray).toEqual([String]);
        expect(schema.obj.numberArray).toEqual([Number]);
        expect(schema.obj.uniqueIdentifierArray).toEqual([String]);
        expect(schema.obj.embeddedObjectArray).toEqual({ type: [expect.any(Schema)] });
        const embeddedArraySchema = (schema.obj.embeddedObjectArray as any).type[0];
        expect(embeddedArraySchema).toBeInstanceOf(Schema);
        expect(embeddedArraySchema.obj).toEqual({
            value: { type: String },
            count: { type: Number, optional: true },
        });
        expect((embeddedArraySchema as any).options._id).toBe(false);
    });

    it('should handle embedded schemas', () => {
        const schema = Mongo.Schema(BasicEntity);
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
        const schema = Mongo.Schema(ArrayEntity);
        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toHaveProperty('embeddedObjectArray');
        expect(schema.obj.embeddedObjectArray).toEqual({ type: [expect.any(Schema)] });
        expect(Array.isArray((schema.obj.embeddedObjectArray as any).type)).toBe(true);
        const itemSchema = (schema.obj.embeddedObjectArray as any).type[0];
        expect(itemSchema).toBeInstanceOf(Schema);
        expect(itemSchema.obj).toEqual({
            value: { type: String },
            count: { type: Number, optional: true },
        });
        expect((itemSchema as any).options._id).toBe(false);
    });

    it('should handle enumeration properties from concrete class', () => {
        const schema = Mongo.Schema(BasicEntity);
        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toHaveProperty('status');
        const statusSchema = schema.obj.status;
        expect(statusSchema).toEqual({ type: 'String', enum: Object.values(BasicEnum) }); // Changed type to 'String'
    });

    it('should handle enumeration properties from Enumeration base class', () => {
        const schema = Mongo.Schema(MyEnumeration);
        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toHaveProperty('id');
        expect(schema.obj).toHaveProperty('name');
        expect(schema.obj.id).toEqual({ type: Number });
        expect(schema.obj.name).toEqual({ type: String });
        expect((schema as any).options._id).toBe(false);
    });

    it('should handle string literal enum properties (explicit enum array still required)', () => {
        const schema = Mongo.Schema(BasicEntity);
        expect(schema.obj).toEqual(
            expect.objectContaining({
                literalStatus: { type: String, enum: ['LITERAL_A', 'LITERAL_B'] },
            })
        );
    });

    it('should return empty schema for null/undefined targetClass', () => {
        const schema = Mongo.Schema(null);
        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toEqual({});
        expect((schema as any).options._id).toBe(false);
    });

    it('should limit recursion depth', () => {
        const schemaAtDepth5 = Mongo.Schema(DeepEntity, 5);
        expect(schemaAtDepth5).toBeInstanceOf(Schema);
        expect(schemaAtDepth5.obj).toHaveProperty('child');
        const nextSchemaAtDepth5 = (schemaAtDepth5.obj as any).child;
        expect(nextSchemaAtDepth5).toBeInstanceOf(Schema);
        expect(nextSchemaAtDepth5.obj).toEqual({});
        expect((nextSchemaAtDepth5 as any).options._id).toBe(false);

        const schemaAtDepth6 = Mongo.Schema(DeepEntity, 6);
        expect(schemaAtDepth6).toBeInstanceOf(Schema);
        expect(schemaAtDepth6.obj).toEqual({});
        expect((schemaAtDepth6 as any).options._id).toBe(false);
    });

    it('should correctly create a schema for ComplexUser with nested types and unique property, including inherited properties', () => {
        const schema = Mongo.Schema(ComplexUserEntity);

        expect(schema).toBeInstanceOf(Schema);
        expect(schema.obj).toBeDefined();

        expect(schema.obj._id).toEqual({ type: String, default: expect.any(Function) }); // Removed unique: true
        expect(schema.obj.createdAt).toEqual({ type: Date });
        expect(schema.obj.updatedAt).toEqual({ type: Date, optional: true });
        expect((schema as any).options._id).toBe(true);

        expect(schema.obj.username).toEqual({ type: String });
        expect(schema.obj.email).toEqual({ type: String, optional: true });

        expect(schema.obj.address).toBeInstanceOf(Schema);
        expect((schema.obj.address as any).obj.value).toEqual({ type: String });
        expect((schema.obj.address as any).obj.count).toEqual({ type: Number, optional: true });
        expect((schema.obj.address as any).options._id).toBe(false);

        expect(schema.obj.role).toEqual({ type: 'String', enum: Object.values(BasicEnum) }); // Changed type to 'String'
        
        expect(schema.obj.profile).toBeInstanceOf(Schema);
        expect((schema.obj.profile as any).obj.bio).toEqual({ type: String });
        expect((schema.obj.profile as any).obj.website).toEqual({ type: String, optional: true });
        expect((schema.obj.profile as any).options._id).toBe(false); // UserProfileEntity is a ValueObject

        // Relationships are now mapped to an array of Strings (UniqueIdentifiers) in Mongo.Schema
        expect(schema.obj.orders).toEqual({ type: [String] });
        expect(schema.obj.likedProducts).toEqual({ type: [String] });
    });

    it('should handle inheritance correctly', () => {
        const baseSchema = Mongo.Schema(BaseInheritanceEntity);
        expect(baseSchema.obj).toEqual(
            expect.objectContaining({
                _id: { type: String, default: expect.any(Function) }, // Removed unique: true
                baseProperty: { type: String },
                baseOptionalProperty: { type: Number, optional: true },
                createdAt: { type: Date },
                updatedAt: { type: Date, optional: true },
            })
        );
        expect((baseSchema as any).options._id).toBe(true);

        const derivedSchema = Mongo.Schema(DerivedInheritanceEntity);
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

        const extracted = Mongo.extractSchema(testSchema);
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
        const extracted = Mongo.extractSchema(emptySchema);
        expect(extracted).toEqual({});
    });

    it('should handle null/undefined schema', () => {
        expect(Mongo.extractSchema(null as any)).toEqual({});
        expect(Mongo.extractSchema(undefined as any)).toEqual({});
    });

    it('should handle schema with array of embedded schemas', () => {
        const itemSchema = new Schema({
            itemValue: { type: String },
        });
        const listSchema = new Schema({
            items: { type: [itemSchema] },
        });

        const extracted = Mongo.extractSchema(listSchema);
        expect(extracted).toHaveProperty('items');
        expect((extracted.items as any)).toHaveProperty('type');
        expect(Array.isArray((extracted.items as any).type)).toBe(true);

        const extractedItemSchema = (extracted.items as any).type[0];
        expect(extractedItemSchema).toHaveProperty('obj');
        expect(extractedItemSchema.obj).toHaveProperty('itemValue');
        expect(((extractedItemSchema as any).obj as any).itemValue.type).toBe(String);
    });
});
