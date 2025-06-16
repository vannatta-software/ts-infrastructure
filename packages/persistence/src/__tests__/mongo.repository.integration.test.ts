import { UniqueIdentifier } from '@vannatta-software/ts-utils-domain';
import { BasicEntity, BasicEmbeddedValueObject, BasicEnum, BasicNumericEnum } from './test-class/basic-schema-entities'; // Import existing entities
import { MongoRepository } from '../mongo/mongo.repository';
import mongoose, { Model } from 'mongoose';
import { describe, it, expect, beforeAll } from 'vitest';
import { Mongo } from '../mongo/mongo.schema';

describe('MongoRepository Integration Tests with BasicEntity', () => {
    let basicEntityRepository: MongoRepository<BasicEntity>;
    let BasicEntityModel: Model<BasicEntity>;

    beforeAll(() => {
        const basicEntitySchema = Mongo.Schema(BasicEntity);

        BasicEntityModel = mongoose.model<BasicEntity>('BasicEntity', basicEntitySchema);
        
        basicEntityRepository = new MongoRepository<BasicEntity>(BasicEntityModel);
        basicEntityRepository.onHydrate((document: any) => new BasicEntity(document));
    });

        it('should insert a BasicEntity and find it by ID', async () => {
            const entity = new BasicEntity({
                name: 'Test Basic Entity',
                age: 30,
                isActive: true,
                status: BasicEnum.ValueA,
                // numericStatus: BasicNumericEnum.Two,
                literalStatus: 'LITERAL_B',
                embeddedObject: new BasicEmbeddedValueObject({ value: 'embedded test', count: 10 }),
                metadata: { key: 'value' }
            });

            await basicEntityRepository.insert(entity);

            const foundEntity = await basicEntityRepository.findById(entity.id.value);

            expect(foundEntity).toBeDefined();
            expect(foundEntity?.name).toBe('Test Basic Entity');
            expect(foundEntity?.age).toBe(30);
            expect(foundEntity?.isActive).toBe(true);
            expect(foundEntity?.status).toBe(BasicEnum.ValueA);
            // expect(foundEntity?.numericStatus).toBe(BasicNumericEnum.Two);
            expect(foundEntity?.literalStatus).toBe('LITERAL_B');
            expect(foundEntity?.embeddedObject.value).toBe('embedded test');
            expect(foundEntity?.embeddedObject.count).toBe(10);
            expect(foundEntity?.metadata.key).toBe('value');
            expect(foundEntity?.id.value).toBe(entity.id.value);
            expect(foundEntity?.uniqueIdProperty.value).toBe(entity.uniqueIdProperty.value);
        });

        it('should update a BasicEntity', async () => {
            const entity = new BasicEntity({ name: 'Update Test', age: 25 });
            await basicEntityRepository.insert(entity);

            entity.name = 'Updated Name';
            entity.age = 35;
            await basicEntityRepository.update(entity);

            const updatedEntity = await basicEntityRepository.findById(entity.id.value);
            expect(updatedEntity?.name).toBe('Updated Name');
            expect(updatedEntity?.age).toBe(35);
        });

        it('should delete a BasicEntity', async () => {
            const entity = new BasicEntity({ name: 'Delete Test', age: 40 });
            await basicEntityRepository.insert(entity);

            await basicEntityRepository.delete(entity);

            const foundEntity = await basicEntityRepository.findById(entity.id.value);
            expect(foundEntity).toBeNull();
        });

        it('should find all BasicEntities', async () => {
            const entity1 = new BasicEntity({ name: 'All 1', age: 10 });
            const entity2 = new BasicEntity({ name: 'All 2', age: 20 });
            await basicEntityRepository.insert(entity1);
            await basicEntityRepository.insert(entity2);

            const allEntities = await basicEntityRepository.findAll();
            expect(allEntities.length).toBe(2);
            expect(allEntities.some(e => e.name === 'All 1')).toBe(true);
            expect(allEntities.some(e => e.name === 'All 2')).toBe(true);
        });

        it('should search for BasicEntities by query', async () => {
            const entity1 = new BasicEntity({ name: 'Search 1', age: 15 });
            const entity2 = new BasicEntity({ name: 'Search 2', age: 25 });
            await basicEntityRepository.insert(entity1);
            await basicEntityRepository.insert(entity2);

            const foundEntities = await basicEntityRepository.search({ name: 'Search 1' });
            expect(foundEntities.length).toBe(1);
            expect(foundEntities[0].name).toBe('Search 1');
        });
    });
