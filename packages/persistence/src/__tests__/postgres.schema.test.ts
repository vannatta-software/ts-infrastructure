import { describe, expect, it } from 'vitest'; // Add Vitest imports
import 'reflect-metadata'; // Ensure this is at the very top
import { EntitySchema } from 'typeorm'; // Import EntitySchema for assertions
import { PostgresSchema } from '../postgres/postgres.schema';

// Import new consolidated test entities
import { BasicEntity, BasicEmbeddedValueObject, BasicEnum, BasicNumericEnum, StringLiteralEnum } from './test-class/basic-schema-entities';
import { ArrayEntity } from './test-class/array-schema-entities';
import { BaseInheritanceEntity, DerivedInheritanceEntity } from './test-class/inheritance-schema-entities';
import { ComplexUserEntity, UserProfileEntity, OrderEntity, ProductEntity, CommentEntity, PostEntity } from './test-class/complex-relationship-entities';
import { DeepEntity } from './test-class/recursion-depth-entity';
import { MyEnumeration } from './test-class/enumeration-base-class';

describe('PostgresSchema', () => {
    it('should create a basic TypeORM entity from a class with @DatabaseSchema', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(BasicEntity);
        expect(TypeOrmEntitySchema).toBeInstanceOf(EntitySchema);
        expect(TypeOrmEntitySchema.options.name).toBe('BasicEntity');
        expect(TypeOrmEntitySchema.options.target).toBe(BasicEntity);

        expect(TypeOrmEntitySchema.options.columns.name).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.name.type).toBe(String);
        expect(TypeOrmEntitySchema.options.columns.age).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.age.type).toBe(Number);
    });

    it('should handle UniqueIdentifier properties and map to id as PrimaryColumn for Entity', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(BasicEntity);
        expect(TypeOrmEntitySchema.options.name).toBe('BasicEntity');
        expect(TypeOrmEntitySchema.options.target).toBe(BasicEntity);

        const idColumn = TypeOrmEntitySchema.options.columns.id;
        const uniqueIdPropertyColumn = TypeOrmEntitySchema.options.columns.uniqueIdProperty;
        const createdAtColumn = TypeOrmEntitySchema.options.columns.createdAt;
        const updatedAtColumn = TypeOrmEntitySchema.options.columns.updatedAt;

        expect(idColumn).toBeDefined();
        expect(idColumn.primary).toBe(true);
        expect(idColumn.type).toBe(String);
        expect(idColumn.unique).toBe(true); // UniqueIdentifier is unique

        expect(uniqueIdPropertyColumn).toBeDefined();
        expect(uniqueIdPropertyColumn.type).toBe(String);
        expect(uniqueIdPropertyColumn.unique).toBeUndefined(); // Not explicitly unique

        expect(createdAtColumn).toBeDefined();
        expect(createdAtColumn.type).toBe(Date);

        expect(updatedAtColumn).toBeDefined();
        expect(updatedAtColumn.type).toBe(Date);
        expect(updatedAtColumn.nullable).toBe(true);
    });

    it('should handle array properties', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(ArrayEntity);
        expect(TypeOrmEntitySchema.options.name).toBe('ArrayEntity');
        expect(TypeOrmEntitySchema.options.target).toBe(ArrayEntity);

        const stringArrayColumn = TypeOrmEntitySchema.options.columns.stringArray;
        expect(stringArrayColumn).toBeDefined();
        expect(stringArrayColumn.type).toBe('simple-array'); // TypeORM uses 'simple-array' for primitive arrays

        const numberArrayColumn = TypeOrmEntitySchema.options.columns.numberArray;
        expect(numberArrayColumn).toBeDefined();
        expect(numberArrayColumn.type).toBe('simple-array');

        const uniqueIdentifierArrayColumn = TypeOrmEntitySchema.options.columns.uniqueIdentifierArray;
        expect(uniqueIdentifierArrayColumn).toBeDefined();
        expect(uniqueIdentifierArrayColumn.type).toBe('simple-array'); // UniqueIdentifier array maps to string array

        const embeddedObjectArrayColumn = TypeOrmEntitySchema.options.columns.embeddedObjectArray;
        expect(embeddedObjectArrayColumn).toBeDefined();
        expect(embeddedObjectArrayColumn.type).toBe('jsonb'); // Array of embedded objects maps to jsonb
    });

    it('should handle embedded schemas as jsonb', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(BasicEntity);
        expect(TypeOrmEntitySchema.options.name).toBe('BasicEntity');
        expect(TypeOrmEntitySchema.options.target).toBe(BasicEntity);

        const embeddedObjectColumn = TypeOrmEntitySchema.options.columns.embeddedObject;
        expect(embeddedObjectColumn).toBeDefined();
        expect(embeddedObjectColumn.type).toBe('jsonb');
    });

    it('should handle array of embedded schemas as jsonb', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(ArrayEntity);
        expect(TypeOrmEntitySchema.options.name).toBe('ArrayEntity');
        expect(TypeOrmEntitySchema.options.target).toBe(ArrayEntity);

        const embeddedObjectArrayColumn = TypeOrmEntitySchema.options.columns.embeddedObjectArray;
        expect(embeddedObjectArrayColumn).toBeDefined();
        expect(embeddedObjectArrayColumn.type).toBe('jsonb');
    });

    it('should handle enumeration properties from concrete class (plain TS enum)', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(BasicEntity);
        expect(TypeOrmEntitySchema.options.name).toBe('BasicEntity');
        expect(TypeOrmEntitySchema.options.target).toBe(BasicEntity);

        const statusColumn = TypeOrmEntitySchema.options.columns.status;
        expect(statusColumn).toBeDefined();
        expect(statusColumn.type).toBe(String);
        expect(statusColumn.enum).toEqual(Object.values(BasicEnum));

        const numericStatusColumn = TypeOrmEntitySchema.options.columns.numericStatus;
        expect(numericStatusColumn).toBeDefined();
        expect(numericStatusColumn.type).toBe(Number);
        expect(numericStatusColumn.enum).toEqual(Object.values(BasicNumericEnum));
    });

    it('should handle enumeration properties from Enumeration base class', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(MyEnumeration);
        expect(TypeOrmEntitySchema.options.name).toBe('MyEnumeration');
        expect(TypeOrmEntitySchema.options.target).toBe(MyEnumeration);

        const idColumn = TypeOrmEntitySchema.options.columns.id;
        const nameColumn = TypeOrmEntitySchema.options.columns.name;

        expect(idColumn).toBeDefined();
        expect(idColumn.type).toBe(Number);
        expect(idColumn.primary).toBeUndefined();

        expect(nameColumn).toBeDefined();
        expect(nameColumn.type).toBe(String);
    });

    it('should handle string literal enum properties (explicit enum array still required)', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(BasicEntity);
        expect(TypeOrmEntitySchema.options.name).toBe('BasicEntity');
        expect(TypeOrmEntitySchema.options.target).toBe(BasicEntity);

        const literalStatusColumn = TypeOrmEntitySchema.options.columns.literalStatus;
        expect(literalStatusColumn).toBeDefined();
        expect(literalStatusColumn.type).toBe(String);
        expect(literalStatusColumn.enum).toEqual(['LITERAL_A', 'LITERAL_B']);
    });

    it('should return empty entity for null/undefined targetClass', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(null as any);
        expect(TypeOrmEntitySchema).toBeInstanceOf(EntitySchema);
        expect(TypeOrmEntitySchema.options.name).toBe('EmptyEntity');
        expect(TypeOrmEntitySchema.options.columns).toEqual({});
    });

    it('should limit recursion depth', () => {
        const TypeOrmEntitySchemaAtDepth5 = PostgresSchema.getTypeOrmEntity(DeepEntity, 5);
        expect(TypeOrmEntitySchemaAtDepth5.options.name).toBe('DeepEntity');
        expect(TypeOrmEntitySchemaAtDepth5.options.target).toBe(DeepEntity);
        const childColumnAtDepth5 = TypeOrmEntitySchemaAtDepth5.options.columns.child;
        expect(childColumnAtDepth5).toBeDefined();
        expect(childColumnAtDepth5.type).toBe('jsonb');

        const TypeOrmEntitySchemaAtDepth6 = PostgresSchema.getTypeOrmEntity(DeepEntity, 6);
        expect(TypeOrmEntitySchemaAtDepth6.options.name).toBe('EmptyEntity');
        expect(TypeOrmEntitySchemaAtDepth6.options.columns).toEqual({});
    });

    it('should handle inheritance correctly', () => {
        const baseSchema = PostgresSchema.getTypeOrmEntity(BaseInheritanceEntity);
        expect(baseSchema.options.name).toBe('BaseInheritanceEntity');
        expect(baseSchema.options.target).toBe(BaseInheritanceEntity);
        expect(baseSchema.options.columns.id).toBeDefined();
        expect(baseSchema.options.columns.id.primary).toBe(true);
        expect(baseSchema.options.columns.baseProperty).toBeDefined();
        expect(baseSchema.options.columns.baseProperty.type).toBe(String);
        expect(baseSchema.options.columns.baseOptionalProperty).toBeDefined();
        expect(baseSchema.options.columns.baseOptionalProperty.type).toBe(Number);
        expect(baseSchema.options.columns.baseOptionalProperty.nullable).toBe(true);

        const derivedSchema = PostgresSchema.getTypeOrmEntity(DerivedInheritanceEntity);
        expect(derivedSchema.options.name).toBe('DerivedInheritanceEntity');
        expect(derivedSchema.options.target).toBe(DerivedInheritanceEntity);
        expect(derivedSchema.options.columns.id).toBeDefined();
        expect(derivedSchema.options.columns.id.primary).toBe(true);
        expect(derivedSchema.options.columns.baseProperty).toBeDefined();
        expect(derivedSchema.options.columns.baseProperty.type).toBe(String);
        expect(derivedSchema.options.columns.baseOptionalProperty).toBeDefined();
        expect(derivedSchema.options.columns.baseOptionalProperty.type).toBe(Number);
        expect(derivedSchema.options.columns.baseOptionalProperty.nullable).toBe(false); // Overridden to be required
        expect(derivedSchema.options.columns.derivedProperty).toBeDefined();
        expect(derivedSchema.options.columns.derivedProperty.type).toBe(String);
        expect(derivedSchema.options.columns.derivedBoolean).toBeDefined();
        expect(derivedSchema.options.columns.derivedBoolean.type).toBe(Boolean);
        expect(derivedSchema.options.columns.derivedBoolean.default).toBe(true);
        expect(derivedSchema.options.columns.derivedEmbedded).toBeDefined();
        expect(derivedSchema.options.columns.derivedEmbedded.type).toBe('jsonb');
    });

    it('should correctly extract schema for ComplexUserEntity with nested types', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(ComplexUserEntity);
        expect(TypeOrmEntitySchema.options.name).toBe('ComplexUserEntity');
        expect(TypeOrmEntitySchema.options.target).toBe(ComplexUserEntity);

        expect(TypeOrmEntitySchema.options.columns.id).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.id.primary).toBe(true);
        expect(TypeOrmEntitySchema.options.columns.id.type).toBe(String);

        expect(TypeOrmEntitySchema.options.columns.username).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.username.type).toBe(String);

        expect(TypeOrmEntitySchema.options.columns.email).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.email.type).toBe(String);
        expect(TypeOrmEntitySchema.options.columns.email.nullable).toBe(true);

        expect(TypeOrmEntitySchema.options.columns.address).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.address.type).toBe('jsonb');

        expect(TypeOrmEntitySchema.options.columns.role).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.role.type).toBe(String);
        expect(TypeOrmEntitySchema.options.columns.role.enum).toEqual(Object.values(BasicEnum));

        expect(TypeOrmEntitySchema.options.columns.profile).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.profile.type).toBe('jsonb');

        // Relationships are not directly mapped as columns in TypeORM EntitySchema for Postgres
        expect(TypeOrmEntitySchema.options.columns.orders).toBeUndefined();
        expect(TypeOrmEntitySchema.options.columns.likedProducts).toBeUndefined();
    });

    it('should correctly extract schema for PostEntity with embedded comments and tags', () => {
        const TypeOrmEntitySchema = PostgresSchema.getTypeOrmEntity(PostEntity);
        expect(TypeOrmEntitySchema.options.name).toBe('PostEntity');
        expect(TypeOrmEntitySchema.options.target).toBe(PostEntity);

        expect(TypeOrmEntitySchema.options.columns.id).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.id.primary).toBe(true);
        expect(TypeOrmEntitySchema.options.columns.id.type).toBe(String);

        expect(TypeOrmEntitySchema.options.columns.title).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.title.type).toBe(String);

        expect(TypeOrmEntitySchema.options.columns.content).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.content.type).toBe(String);

        expect(TypeOrmEntitySchema.options.columns.comments).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.comments.type).toBe('jsonb'); // Array of embedded CommentEntity

        expect(TypeOrmEntitySchema.options.columns.tags).toBeDefined();
        expect(TypeOrmEntitySchema.options.columns.tags.type).toBe('simple-array'); // Array of UniqueIdentifier (string)
    });
});
