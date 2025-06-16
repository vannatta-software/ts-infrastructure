import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose'; // Import mongoose
import { Entity, UniqueIdentifier, IDomainEvent } from '@vannatta-software/ts-utils-domain'; // Import Entity, UniqueIdentifier, IDomainEvent
import './mongo-integration-setup'; // Import the setup file
import { MongoRepository } from '../mongo/mongo.repository';
import { MongoSchema } from '../mongo/mongo.schema';
import { defineSchema, DatabaseEntity } from '../schema/database.schema';
import { IPropertySchemaMetadata } from '../schema/schema.interfaces';
import { ApiException } from '@vannatta-software/ts-utils-server'; // Import ApiException
import { MongoServerError } from 'mongodb'; // Import MongoServerError

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

    constructor(props?: Partial<PrescriptiveUser> & { id?: string | UniqueIdentifier }) { // Fix: id can be string or UniqueIdentifier
        const entityProps: Partial<Entity> = { ...props };
        if (props?.id && typeof props.id === 'string') {
            entityProps.id = new UniqueIdentifier(props.id); // Convert string ID to UniqueIdentifier for Entity constructor
        } else if (props?.id instanceof UniqueIdentifier) {
            entityProps.id = props.id;
        } else if (!props?.id) {
            entityProps.id = UniqueIdentifier.generate(); // Generate if not provided
        }
        super(entityProps); // Pass the prepared props to Entity's constructor

        this.name = props?.name || '';
        this.email = props?.email || '';
        // No need for this.setId() calls here, as super(entityProps) should handle it
    }

    // Implement abstract methods from Entity
    create(): void {
        // Logic for creating a user (e.g., add domain event)
        this.addDomainEvent(new TestDomainEvent('UserCreated', { userId: this.id.value })); // Fix: Use TestDomainEvent
    }

    delete(): void {
        // Logic for deleting a user (e.g., add domain event)
        this.addDomainEvent(new TestDomainEvent('UserDeleted', { userId: this.id.value })); // Fix: Use TestDomainEvent
    }

    // Implement compositeUniqueKey as required by Entity
    get compositeUniqueKey(): string | null { // Fix: Changed to getter
        return this.email; // Using email as a simple composite unique key for testing
    }
}

defineSchema(PrescriptiveUser, {
    id: { isIdentifier: true, type: UniqueIdentifier }, // Use UniqueIdentifier type
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

    constructor(props?: Partial<PrescriptiveAdminUser>) { // Fix: id can be string or UniqueIdentifier
        super(props); // Call PrescriptiveUser's constructor, which handles ID
        this.adminLevel = props?.adminLevel || 0;
        this.permissions = props?.permissions || [];
    }

    // Implement abstract methods from Entity (inherited from PrescriptiveUser)
    // No need to re-implement if PrescriptiveUser's implementation is generic enough
}

defineSchema(PrescriptiveAdminUser, {
    adminLevel: { type: Number },
    permissions: { type: [String] }, // Fix: Use [String] for array of strings
});

describe('MongoRepository with Prescriptive Schemas', () => {
    let userRepository: MongoRepository<PrescriptiveUser>;
    let adminUserRepository: MongoRepository<PrescriptiveAdminUser>;

    beforeAll(() => {
        // Create Mongoose Models from Prescriptive Schemas
        const userSchemaMongoose = MongoSchema.extract(PrescriptiveUser);
        const UserModel = mongoose.model<PrescriptiveUser>('PrescriptiveUser', userSchemaMongoose); // Fix: Add type argument
        userRepository = new MongoRepository(UserModel) as any; // Fix: Cast to any
        userRepository.onHydrate((doc: any) => new PrescriptiveUser({
            id: doc._id,
            name: doc.name,
            email: doc.email,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        }));

        const adminUserSchemaMongoose = MongoSchema.extract(PrescriptiveAdminUser);
        const AdminUserModel = mongoose.model<PrescriptiveAdminUser>('PrescriptiveAdminUser', adminUserSchemaMongoose); // Fix: Add type argument
        adminUserRepository = new MongoRepository(AdminUserModel) as any; // Fix: Cast to any
        adminUserRepository.onHydrate((doc: any) => new PrescriptiveAdminUser({
            id: doc._id,
            name: doc.name,
            email: doc.email,
            adminLevel: doc.adminLevel,
            permissions: doc.permissions,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        }));
    });

    it('should insert and find a user with a prescriptive schema', async () => {
        const userId = UniqueIdentifier.generate()
        const user = new PrescriptiveUser({ id: userId, name: 'Alice', email: 'alice@example.com' });
        await userRepository.insert(user);

        const foundUser = await userRepository.findById(userId.value); // Diagnostic: Use string literal, no cast on repo
        expect(foundUser).toBeDefined();
        expect(foundUser?.name).toBe('Alice');
        expect(foundUser?.email).toBe('alice@example.com');
        expect(foundUser?.id.value).toBe(userId.value); // Fix: Use value directly
    });

    it('should insert and find an admin user with inherited and new properties', async () => {
        const userId = UniqueIdentifier.generate()
        const adminUser = new PrescriptiveAdminUser({
            id: userId,
            name: 'Bob',
            email: 'bob@example.com',
            adminLevel: 10,
            permissions: ['read', 'write'],
        });
        await adminUserRepository.insert(adminUser);

        const foundAdminUser = await adminUserRepository.findById(adminUser.id.value); 
        expect(foundAdminUser).toBeDefined();
        expect(foundAdminUser?.name).toBe('Bob'); // Inherited
        expect(foundAdminUser?.email).toBe('bob@example.com'); // Inherited
        expect(foundAdminUser?.adminLevel).toBe(10); // New property
        expect(foundAdminUser?.permissions).toEqual(['read', 'write']); // New property
        expect(foundAdminUser?.id.value).toBe(adminUser.id.value);
    });

    it('should update a user with a prescriptive schema', async () => {
        const userId = UniqueIdentifier.generate()
        const user = new PrescriptiveUser({ id: userId, name: 'Charlie', email: 'charlie@example.com' });
        await userRepository.insert(user);

        // Fetch the entity, update its properties, then pass the instance to update
        const userToUpdate = await userRepository.findById(user.id.value); // Fix: Cast to string
        expect(userToUpdate).toBeDefined();
        if (userToUpdate) {
            userToUpdate.name = 'Charles';
            await userRepository.update(userToUpdate);
        }

        const foundUser = await userRepository.findById(user.id.value); // Fix: Cast to string
        expect(foundUser).toBeDefined();
        expect(foundUser?.name).toBe('Charles');
        expect(foundUser?.email).toBe('charlie@example.com'); // Corrected typo here
    });

    it('should delete a user with a prescriptive schema', async () => {
        const userId = UniqueIdentifier.generate()
        const user = new PrescriptiveUser({ id: userId, name: 'David', email: 'david@example.com' });
        await userRepository.insert(user);

        await userRepository.delete(user); // Pass the entity instance
        const foundUser = await userRepository.findById(user.id.value); // Fix: Cast to string
        expect(foundUser).toBeNull();
    });

    it('should handle unique constraint for email', async () => {
        const userId = UniqueIdentifier.generate()
        const userId1 = UniqueIdentifier.generate()
        const user1 = new PrescriptiveUser({ id: userId, name: 'Eve', email: 'eve@example.com' });
        const user2 = new PrescriptiveUser({ id: userId1, name: 'Frank', email: 'eve@example.com' });

        await userRepository.insert(user1);
        // Expect ApiException with UNIQUE_CONSTRAINT_VIOLATION code
        await expect(userRepository.insert(user2)).rejects.toThrow(
            expect.objectContaining({
                name: 'ApiException',
                errors: expect.objectContaining({
                    code: expect.arrayContaining(['UNIQUE_CONSTRAINT_VIOLATION']),
                }),
            })
        );
    });
});
