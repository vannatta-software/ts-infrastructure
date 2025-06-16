import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Entity, UniqueIdentifier, IDomainEvent } from '@vannatta-software/ts-utils-domain';
import { Neo4jRepository } from '../neo4j/neo4j.repository';
import { Neo4jSchema } from '../neo4j/neo4j.schema';
import { defineSchema, DatabaseEntity } from '../schema/database.schema';
import { IPropertySchemaMetadata } from '../schema/schema.interfaces';
import { Mediator, ILogger, ApiException } from '@vannatta-software/ts-utils-server'; // Import Mediator, ILogger, and ApiException

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

describe('Neo4jRepository with Prescriptive Schemas - Simplified Test', () => {
    let userRepository: Neo4jRepository<PrescriptiveUser>;
    let adminUserRepository: Neo4jRepository<PrescriptiveAdminUser>;

    beforeAll(async () => {
        const driver = globalThis.neo4jDriver; // Access the globally exposed driver
        expect(driver).toBeDefined(); // Verify driver is available

        userRepository = new Neo4jRepository(PrescriptiveUser, driver);
        userRepository.onHydrate((props: any) => {
            return new PrescriptiveUser({
                id: props.id,
                name: props.name,
                email: props.email,
                createdAt: new Date(props.createdAt),
                updatedAt: new Date(props.updatedAt),
            });
        });

        adminUserRepository = new Neo4jRepository(PrescriptiveAdminUser, driver);
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

    it('should initialize repositories successfully', () => {
        expect(userRepository).toBeDefined();
        expect(adminUserRepository).toBeDefined();
    });
});
