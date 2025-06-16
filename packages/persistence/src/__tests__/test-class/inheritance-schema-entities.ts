import { UniqueIdentifier, Entity } from '@vannatta-software/ts-utils-domain';
import { DatabaseSchema, DatabaseEntity, RelationshipProperty } from '../../schema/database.schema';
import { BasicEmbeddedValueObject } from './basic-schema-entities';

// BaseInheritanceEntity: A base entity with some properties
@DatabaseEntity()
export class BaseInheritanceEntity extends Entity {
    @DatabaseSchema({ type: UniqueIdentifier, unique: true, isIdentifier: true })
    public id: UniqueIdentifier;

    @DatabaseSchema({ type: String })
    public baseProperty: string;

    @DatabaseSchema({ type: Number, optional: true })
    public baseOptionalProperty?: number;

    constructor(props: Partial<BaseInheritanceEntity>) {
        super(props);
        this.id = props.id || UniqueIdentifier.generate();
        this.baseProperty = props.baseProperty || 'default base';
        this.baseOptionalProperty = props.baseOptionalProperty;
    }

    public static create(props: Partial<BaseInheritanceEntity>): BaseInheritanceEntity {
        return new BaseInheritanceEntity(props);
    }

    public create(): void {
        // No-op for testing
    }

    public delete(): void {
        // No-op for testing
    }
}

// DerivedInheritanceEntity: A derived entity inheriting from BaseInheritanceEntity
@DatabaseEntity()
export class DerivedInheritanceEntity extends BaseInheritanceEntity {
    @DatabaseSchema({ type: String })
    public derivedProperty: string;

    @DatabaseSchema({ type: Boolean, default: true })
    public derivedBoolean: boolean;

    @DatabaseSchema({ type: BasicEmbeddedValueObject })
    public derivedEmbedded: BasicEmbeddedValueObject;

    // Example of overriding a base property (optional to required)
    @DatabaseSchema({ type: Number, optional: false })
    public baseOptionalProperty!: number;

    constructor(props: Partial<DerivedInheritanceEntity>) {
        super(props);
        this.derivedProperty = props.derivedProperty || 'default derived';
        this.derivedBoolean = props.derivedBoolean ?? true;
        this.derivedEmbedded = props.derivedEmbedded || BasicEmbeddedValueObject.create({ value: 'derived embedded' });
    }

    public static create(props: Partial<DerivedInheritanceEntity>): DerivedInheritanceEntity {
        return new DerivedInheritanceEntity(props);
    }

    // No need to re-implement create() and delete() if they are already implemented in the base class
    // unless the derived class needs specific logic.
}
