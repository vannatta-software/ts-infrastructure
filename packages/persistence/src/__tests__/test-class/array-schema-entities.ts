import { UniqueIdentifier, Entity, ValueObject } from '@vannatta-software/ts-utils-domain';
import { DatabaseSchema, DatabaseEntity } from '../../schema/database.schema';
import { BasicEmbeddedValueObject } from './basic-schema-entities';

// ArrayEntity: An entity to test arrays of primitive types, UniqueIdentifiers, and embedded ValueObjects
@DatabaseEntity()
export class ArrayEntity extends Entity {
    @DatabaseSchema({ type: UniqueIdentifier, unique: true })
    public id: UniqueIdentifier;

    @DatabaseSchema({ type: [String] })
    public stringArray: string[];

    @DatabaseSchema({ type: [Number] })
    public numberArray: number[];

    @DatabaseSchema({ type: [UniqueIdentifier] })
    public uniqueIdentifierArray: UniqueIdentifier[];

    @DatabaseSchema({ type: [BasicEmbeddedValueObject] })
    public embeddedObjectArray: BasicEmbeddedValueObject[];

    constructor(props: Partial<ArrayEntity>) {
        super(props);
        this.id = props.id || UniqueIdentifier.generate();
        this.stringArray = props.stringArray || [];
        this.numberArray = props.numberArray || [];
        this.uniqueIdentifierArray = props.uniqueIdentifierArray.map(id => UniqueIdentifier.parse(id)) || [];    
        this.embeddedObjectArray = props.embeddedObjectArray.map(o => new BasicEmbeddedValueObject(o)) || [];
    }

    public create(): void {
        // No-op for testing
    }

    public delete(): void {
        // No-op for testing
    }
}
