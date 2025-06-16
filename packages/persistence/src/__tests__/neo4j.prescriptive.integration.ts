import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Entity, UniqueIdentifier, IDomainEvent } from '@vannatta-software/ts-utils-domain';
import { Neo4jRepository } from '../neo4j/neo4j.repository';
import { Neo4jSchema } from '../neo4j/neo4j.schema';
import { defineSchema, DatabaseEntity } from '../schema/database.schema';
import { IPropertySchemaMetadata } from '../schema/schema.interfaces';
import { Mediator, ILogger } from '@vannatta-software/ts-utils-server'; // Import Mediator and ILogger
import { Driver, driver, auth, Session } from 'neo4j-driver'; // Import Driver, driver, auth, and Session

// Define a simple test domain event
class TestDomainEvent implements IDomainEvent {
    dateTimeOccurred: Date = new Date();
    constructor(public type: string, public payload: any) {}
}

// Define a base entity using defineSchema, extending the actual Entity
@DatabaseEntity()
class PrescriptiveUser extends Entity {
    name: string;
    email: string;

    constructor(props?: Partial<PrescriptiveUser> & { id?: string | UniqueIdentifier }) {
        const entityProps: Partial<Entity> = { ...props };
        if (props?.id && typeof props.id === 'string') {
            entityProps.id = new UniqueIdentifier(props.id);
        } else if (props?.id instanceof UniqueIdentifier) {
            entityProps.id = props.id;
        } else if (!props?.id) {
            entityProps.id = UniqueIdentifier.generate();
        }
        super(entityProps);

        this.name = props?.name || '';
        this.email = props?.email || '';
    }

    create(): void {
        this.addDomainEvent(new TestDomainEvent('UserCreated', { userId: this.id.value }));
    }

    delete(): void {
        this.addDomainEvent(new TestDomainEvent('UserDeleted', { userId: this.id.value }));
    }

    // Override toObject to return a plain object suitable for Neo4j
    toObject(): any {
        return {
            id: this.id.value, // Neo4j uses 'id' as a property, not '_id'
            name: this.name,
            email: this.email,
            createdAt: this.createdAt.toISOString(), // Convert Date to ISO string for Neo4j
            updatedAt: this.updatedAt.toISOString(), // Convert Date to ISO string for Neo4j
        };
    }

    get compositeUniqueKey(): string | null {
        return this.email;
    }
}

defineSchema(PrescriptiveUser, {
    id: { isIdentifier: true, type: UniqueIdentifier },
    name: { type: String },
    email: { type: String, unique: true },
    createdAt: { type: Date },
    updatedAt: { type: Date },
});

// Define a derived entity using defineSchema
@DatabaseEntity()
class PrescriptiveAdminUser extends PrescriptiveUser {
    adminLevel: number;
    permissions: string[];

    constructor(props?: Partial<PrescriptiveAdminUser> & { id?: string | UniqueIdentifier }) {
        super(props);
        this.adminLevel = props?.adminLevel || 0;
        this.permissions = props?.permissions || [];
    }
}

defineSchema(PrescriptiveAdminUser, {
    adminLevel: { type: Number },
    permissions: { type: [String] },
});

describe('Neo4jRepository with Prescriptive Schemas', () => {
    let driverInstance: Driver; // Use imported 'Driver' type
    let session: Session;
    let userRepository: Neo4jRepository<PrescriptiveUser>;
    let adminUserRepository: Neo4jRepository<PrescriptiveAdminUser>;

    beforeAll(async () => {
        // Manually create driver and session for clearing database, as Neo4jRepository manages its own driver
        driverInstance = driver('bolt://localhost:7687', auth.basic('neo4j', 'password'));
        session = driverInstance.session();

        // Clear the database before tests
        await session.run('MATCH (n) DETACH DELETE n');

        userRepository = new Neo4jRepository(PrescriptiveUser); // Removed Mediator and console
        userRepository.onHydrate((props: any) => {
            return new PrescriptiveUser({
                id: props.id,
                name: props.name,
                email: props.email,
                createdAt: new Date(props.createdAt),
                updatedAt: new Date(props.updatedAt),
            });
        });

        adminUserRepository = new Neo4jRepository(PrescriptiveAdminUser); // Removed Mediator and console
        adminUserRepository.onHydrate((props: any) => {
            return new PrescriptiveAdminUser({
                id: props.id,
                name: props.name,
                email: props.email,
                adminLevel: props.adminLevel,
                permissions: props.permissions,
                createdAt: new Date(props.createdAt),
                updatedAt: new Date(props.updatedAt),
            });
        });
    });

    afterAll(async () => {
        await session.close();
        await driverInstance.close();
    });

    it('should create and find a user with a prescriptive schema', async () => {
        const user = new PrescriptiveUser({ name: 'Alice', email: 'alice@example.com' });
        await userRepository.createNode(user);

        const foundUser = await userRepository.findNodeById(user.id.value);
        expect(foundUser).toBeDefined();
        expect(foundUser?.name).toBe('Alice');
        expect(foundUser?.email).toBe('alice@example.com');
        expect(foundUser?.id.value).toBe(user.id.value);
    });

    it('should create and find an admin user with inherited and new properties', async () => {
        const adminUser = new PrescriptiveAdminUser({
            name: 'Bob',
            email: 'bob@example.com',
            adminLevel: 10,
            permissions: ['read', 'write'],
        });
        await adminUserRepository.createNode(adminUser);

        const foundAdminUser = await adminUserRepository.findNodeById(adminUser.id.value);
        expect(foundAdminUser).toBeDefined();
        expect(foundAdminUser?.name).toBe('Bob');
        expect(foundAdminUser?.email).toBe('bob@example.com');
        expect(foundAdminUser?.adminLevel).toBe(10);
        expect(foundAdminUser?.permissions).toEqual(['read', 'write']);
        expect(foundAdminUser?.id.value).toBe(adminUser.id.value);
    });

    it('should update a user with a prescriptive schema', async () => {
        const user = new PrescriptiveUser({ name: 'Charlie', email: 'charlie@example.com' });
        await userRepository.createNode(user);

        const userToUpdate = await userRepository.findNodeById(user.id.value);
        expect(userToUpdate).toBeDefined();
        if (userToUpdate) {
            userToUpdate.name = 'Charles';
            await userRepository.updateNode(userToUpdate);
        }

        const foundUser = await userRepository.findNodeById(user.id.value);
        expect(foundUser).toBeDefined();
        expect(foundUser?.name).toBe('Charles');
        expect(foundUser?.email).toBe('charlie@example.com');
    });

    it('should delete a user with a prescriptive schema', async () => {
        const user = new PrescriptiveUser({ name: 'David', email: 'david@example.com' });
        await userRepository.createNode(user);

        await userRepository.deleteNode(user.id.value); // Pass ID string
        const foundUser = await userRepository.findNodeById(user.id.value);
        expect(foundUser).toBeNull();
    });

    it('should handle unique constraint for email', async () => {
        const user1 = new PrescriptiveUser({ name: 'Eve', email: 'eve@example.com' });
        const user2 = new PrescriptiveUser({ name: 'Frank', email: 'eve@example.com' });

        await userRepository.createNode(user1);
        await expect(userRepository.createNode(user2)).rejects.toThrow();
    });
});
