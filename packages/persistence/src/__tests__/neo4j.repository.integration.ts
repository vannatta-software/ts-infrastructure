import { UniqueIdentifier } from '@vannatta-software/ts-utils-domain';
import { BasicEntity, BasicEmbeddedValueObject, BasicEnum, BasicNumericEnum } from './test-class/basic-schema-entities';
import { Neo4jRepository } from '../neo4j/neo4j.repository';
import { describe, it, expect, beforeAll } from 'vitest';
import { ApiException } from '@vannatta-software/ts-utils-server'; // Removed Mediator import

describe('Neo4jRepository Integration Tests with BasicEntity', () => {
    let basicEntityRepository: Neo4jRepository<BasicEntity>;
    // Removed mockMediator declaration

    beforeAll(() => {
        const driver = globalThis.neo4jDriver; // Access the globally exposed driver

        // Removed mock Mediator creation

        basicEntityRepository = new Neo4jRepository<BasicEntity>(BasicEntity, driver); // Removed mockMediator
        basicEntityRepository.onHydrate((record: any) => {
            const hydratedProps: any = {
                id: record.id ? new UniqueIdentifier(record.id) : undefined, // Ensure ID is UniqueIdentifier
                name: record.name,
                age: record.age,
                isActive: record.isActive,
                status: record.status,
                literalStatus: record.literalStatus,
                embeddedObject: record.embeddedObject ? new BasicEmbeddedValueObject(JSON.parse(record.embeddedObject)) : undefined,
                metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
                createdAt: new Date(record.createdAt),
                updatedAt: new Date(record.updatedAt),
                uniqueIdProperty: record.uniqueIdProperty ? new UniqueIdentifier(record.uniqueIdProperty) : undefined, // Hydrate uniqueIdProperty
            };
            return new BasicEntity(hydratedProps);
        });
    });

    it('should create a BasicEntity and find it by ID', async () => {
        const entity = new BasicEntity({
            name: 'Test Basic Entity',
            age: 30,
            isActive: true,
            status: BasicEnum.ValueA,
            literalStatus: 'LITERAL_B',
            embeddedObject: new BasicEmbeddedValueObject({ value: 'embedded test', count: 10 }),
            metadata: { key: 'value' }
        });

        await basicEntityRepository.createNode(entity);

        const foundEntity = await basicEntityRepository.findNodeById(entity.id.value); // Changed from findById

        expect(foundEntity).toBeDefined();
        expect(foundEntity?.name).toBe('Test Basic Entity');
        expect(foundEntity?.age).toBe(30);
        expect(foundEntity?.isActive).toBe(true);
        expect(foundEntity?.status).toBe(BasicEnum.ValueA);
        expect(foundEntity?.literalStatus).toBe('LITERAL_B');
        expect(foundEntity?.embeddedObject.value).toBe('embedded test');
        expect(foundEntity?.embeddedObject.count).toBe(10);
        expect(foundEntity?.metadata.key).toBe('value');
        expect(foundEntity?.id.value).toBe(entity.id.value);
        expect(foundEntity?.uniqueIdProperty.value).toBe(entity.uniqueIdProperty.value);
    });

    it('should update a BasicEntity', async () => {
        const entity = new BasicEntity({ name: 'Update Test', age: 25 });
        await basicEntityRepository.createNode(entity);

        entity.name = 'Updated Name';
        entity.age = 35;
        await basicEntityRepository.updateNode(entity); // Changed from update

        const updatedEntity = await basicEntityRepository.findNodeById(entity.id.value); // Changed from findById
        expect(updatedEntity?.name).toBe('Updated Name');
        expect(updatedEntity?.age).toBe(35);
    });

    it('should delete a BasicEntity', async () => {
        const entity = new BasicEntity({ name: 'Delete Test', age: 40 });
        await basicEntityRepository.createNode(entity);

        await basicEntityRepository.deleteNode(entity.id.value); // Pass ID string
        const foundEntity = await basicEntityRepository.findNodeById(entity.id.value); // Changed from findById
        expect(foundEntity).toBeNull();
    });

    it('should find all BasicEntities', async () => {
        const entity1 = new BasicEntity({ name: 'All 1', age: 10 });
        const entity2 = new BasicEntity({ name: 'All 2', age: 20 });
        await basicEntityRepository.createNode(entity1);
        await basicEntityRepository.createNode(entity2);

        const allEntities = await basicEntityRepository.findNodes({}); // Find all with empty query
        expect(allEntities.length).toBe(2);
        expect(allEntities.some(e => e.name === 'All 1')).toBe(true);
        expect(allEntities.some(e => e.name === 'All 2')).toBe(true);
    });

    it('should search for BasicEntities by query', async () => {
        const entity1 = new BasicEntity({ name: 'Search 1', age: 15 });
        const entity2 = new BasicEntity({ name: 'Search 2', age: 25 });
        await basicEntityRepository.createNode(entity1);
        await basicEntityRepository.createNode(entity2);

        const foundEntities = await basicEntityRepository.findNodes({ name: 'Search 1' }); // Use findNodes for search
        expect(foundEntities.length).toBe(1);
        expect(foundEntities[0].name).toBe('Search 1');
    });

    it('should handle unique constraint for uniqueIdProperty', async () => {
        const entity1 = new BasicEntity({ name: 'Unique 1', uniqueIdProperty: UniqueIdentifier.generate() }); // Changed to generate()
        const entity2 = new BasicEntity({ name: 'Unique 2', uniqueIdProperty: entity1.uniqueIdProperty });

        await basicEntityRepository.createNode(entity1);
        await expect(basicEntityRepository.createNode(entity2)).rejects.toThrow(
            expect.objectContaining({
                code: 'Neo.ClientError.Schema.ConstraintValidationFailed', // Updated expected error code
            })
        );
    });
});
