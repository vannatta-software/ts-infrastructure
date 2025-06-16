import { UniqueIdentifier, Entity } from '@vannatta-software/ts-utils-domain';
import { DatabaseSchema, DatabaseEntity } from '../../schema/database.schema';

// DeepEntity: An entity for testing recursion limits
@DatabaseEntity()
export class DeepEntity extends Entity {
    @DatabaseSchema({ type: UniqueIdentifier, unique: true })
    public id: UniqueIdentifier;

    @DatabaseSchema({ type: String })
    public name: string;

    @DatabaseSchema({ type: DeepEntity, optional: true })
    public child?: DeepEntity;

    constructor(props: Partial<DeepEntity>) {
        super(props);
        this.id = props.id || UniqueIdentifier.generate();
        this.name = props.name || 'Default Deep Entity';
        this.child = props.child;
    }

    public static create(props: Partial<DeepEntity>): DeepEntity {
        return new DeepEntity(props);
    }

    public create(): void {
        // No-op for testing
    }

    public delete(): void {
        // No-op for testing
    }
}
