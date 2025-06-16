import { describe, it, expect } from 'vitest';
import { defineSchema, getDatabaseSchemaMetadata, DatabaseEntity } from '../schema/database.schema';
import { IPropertySchemaMetadata } from '../schema/schema.interfaces';

// Define a base entity using defineSchema
@DatabaseEntity()
class BasePrescriptiveEntity {
    id: string;
    createdAt: Date;
}

defineSchema(BasePrescriptiveEntity, {
    id: { isIdentifier: true, type: String },
    createdAt: { type: Date, default: () => new Date() },
});

// Define a derived entity using defineSchema
@DatabaseEntity()
class DerivedPrescriptiveEntity extends BasePrescriptiveEntity {
    name: string;
    description?: string;
}

defineSchema(DerivedPrescriptiveEntity, {
    name: { type: String },
    description: { type: String, optional: true },
});

// Define another derived entity to test relationship
@DatabaseEntity()
class RelatedPrescriptiveEntity {
    relatedId: string;
    value: number;
}

defineSchema(RelatedPrescriptiveEntity, {
    relatedId: { isIdentifier: true, type: String },
    value: { type: Number },
});

@DatabaseEntity()
class EntityWithRelationship extends BasePrescriptiveEntity {
    title: string;
    relatedItem: RelatedPrescriptiveEntity;
}

defineSchema(EntityWithRelationship, {
    title: { type: String },
    relatedItem: {
        type: Object, // Or appropriate type for single object relationship
        relationship: {
            type: 'HAS_RELATED_ITEM',
            target: () => RelatedPrescriptiveEntity,
            direction: 'OUTGOING',
            cardinality: 'one-to-one',
        },
    },
});


describe('Prescriptive Schema Definition', () => {
    it('should correctly define schema for a base class', () => {
        const metadata = getDatabaseSchemaMetadata(BasePrescriptiveEntity);
        expect(metadata).toHaveLength(2);

        const idProp = metadata.find(p => p.propertyKey === 'id');
        expect(idProp).toBeDefined();
        expect(idProp?.isIdentifier).toBe(true);
        expect(idProp?.type).toBe(String);

        const createdAtProp = metadata.find(p => p.propertyKey === 'createdAt');
        expect(createdAtProp).toBeDefined();
        expect(createdAtProp?.type).toBe(Date);
        expect(createdAtProp?.default).toBeInstanceOf(Function);
    });

    it('should correctly inherit and define schema for a derived class', () => {
        const metadata = getDatabaseSchemaMetadata(DerivedPrescriptiveEntity);
        expect(metadata).toHaveLength(4); // id, createdAt, name, description

        const idProp = metadata.find(p => p.propertyKey === 'id');
        expect(idProp).toBeDefined();
        expect(idProp?.isIdentifier).toBe(true); // Inherited

        const nameProp = metadata.find(p => p.propertyKey === 'name');
        expect(nameProp).toBeDefined();
        expect(nameProp?.type).toBe(String);

        const descriptionProp = metadata.find(p => p.propertyKey === 'description');
        expect(descriptionProp).toBeDefined();
        expect(descriptionProp?.optional).toBe(true);
    });

    it('should handle relationships defined prescriptively', () => {
        const metadata = getDatabaseSchemaMetadata(EntityWithRelationship);
        expect(metadata).toHaveLength(4); // id, title, relatedItem, createdAt

        const relatedItemProp = metadata.find(p => p.propertyKey === 'relatedItem');
        expect(relatedItemProp).toBeDefined();
        expect(relatedItemProp?.relationship).toBeDefined();
        expect(relatedItemProp?.relationship?.type).toBe('HAS_RELATED_ITEM');
        expect(relatedItemProp?.relationship?.cardinality).toBe('one-to-one');
    });

    it('should allow overriding inherited properties', () => {
        // Define a derived class that overrides a property from BasePrescriptiveEntity
        @DatabaseEntity()
        class OverridingEntity extends BasePrescriptiveEntity {
            id: string; // Override id to be optional
        }

        defineSchema(OverridingEntity, {
            id: { isIdentifier: true, type: String, optional: true }, // Make id optional
        });

        const metadata = getDatabaseSchemaMetadata(OverridingEntity);
        const idProp = metadata.find(p => p.propertyKey === 'id');
        expect(idProp).toBeDefined();
        expect(idProp?.isIdentifier).toBe(true);
        expect(idProp?.optional).toBe(true); // Should be overridden
    });
});
