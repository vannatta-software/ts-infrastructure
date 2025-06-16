import { UniqueIdentifier, Entity, ValueObject, Enumeration } from '@vannatta-software/ts-utils-domain';
import { DatabaseSchema, DatabaseEntity } from '../../schema/database.schema';

// BasicEnum: A simple TypeScript enum and a string literal enum
export enum BasicEnum {
    ValueA = 'VALUE_A',
    ValueB = 'VALUE_B',
    ValueC = 'VALUE_C',
}

export enum BasicNumericEnum {
    One = 1,
    Two = 2,
}

export type StringLiteralEnum = 'LITERAL_A' | 'LITERAL_B';

// BasicEmbeddedValueObject: A simple ValueObject to be embedded
@DatabaseEntity()
export class BasicEmbeddedValueObject extends ValueObject {
    @DatabaseSchema({ type: String })
    public value: string;

    @DatabaseSchema({ type: Number, optional: true })
    public count?: number;

    constructor(props: { value: string; count?: number }) {
        super();
        this.value = props.value;
        this.count = props.count;
    }

    public static create(props: { value: string; count?: number }): BasicEmbeddedValueObject {
        return new BasicEmbeddedValueObject(props);
    }

    public *getAtomicValues(): IterableIterator<any> {
        yield this.value;
        yield this.count;
    }
}

// BasicEntity: A single entity to test all basic property types
@DatabaseEntity()
export class BasicEntity extends Entity {
    @DatabaseSchema({ type: String })
    public name: string;

    @DatabaseSchema({ type: Number, optional: true })
    public age?: number;

    @DatabaseSchema({ type: Boolean, default: false })
    public isActive: boolean;

    @DatabaseSchema({ type: Date })
    public createdAt: Date;

    @DatabaseSchema({ type: UniqueIdentifier })
    public uniqueIdProperty: UniqueIdentifier;

    @DatabaseSchema({ type: Object })
    public metadata: Record<string, any>;

    @DatabaseSchema({ type: BasicEmbeddedValueObject })
    public embeddedObject: BasicEmbeddedValueObject;

    @DatabaseSchema({ type: BasicEnum })
    public status: BasicEnum;

    // @DatabaseSchema({ type: BasicNumericEnum })
    // public numericStatus: BasicNumericEnum;

    @DatabaseSchema({ type: String, enum: ['LITERAL_A', 'LITERAL_B'] })
    public literalStatus: StringLiteralEnum;

    constructor(props: Partial<BasicEntity>) {
        super(props);

        this.name = props.name || 'Default Name';
        this.age = props.age;
        this.isActive = props.isActive ?? false;
        this.uniqueIdProperty = props.uniqueIdProperty ?
             UniqueIdentifier.parse(props.uniqueIdProperty) :
             UniqueIdentifier.generate();
        this.metadata = props.metadata || {};
        this.embeddedObject = props.embeddedObject || BasicEmbeddedValueObject.create({ value: 'default', count: 0 });
        this.status = props.status || BasicEnum.ValueA;
        // this.numericStatus = typeof props.numericStatus === 'string'
        //     ? parseInt(props.numericStatus, 10) as BasicNumericEnum
        //     : props.numericStatus || BasicNumericEnum.One;
        this.literalStatus = props.literalStatus || 'LITERAL_A';
    }

    // Instance method to satisfy abstract Entity.create()
    public create(): void {
        // No-op for testing purposes, or implement specific creation logic if needed
    }

    public delete(): void {
        // No-op for testing
    }
}
