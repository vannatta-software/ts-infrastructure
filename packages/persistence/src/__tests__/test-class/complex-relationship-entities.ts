import { UniqueIdentifier, Entity, ValueObject } from '@vannatta-software/ts-utils-domain';
import { DatabaseSchema, DatabaseEntity, RelationshipProperty } from '../../schema/database.schema';
import { BasicEmbeddedValueObject, BasicEnum } from './basic-schema-entities';

// UserProfileEntity: An embedded entity for ComplexUserEntity
@DatabaseEntity()
export class UserProfileEntity extends ValueObject {
    @DatabaseSchema({ type: String })
    public bio: string;

    @DatabaseSchema({ type: String, optional: true })
    public website?: string;

    constructor(props: { bio: string; website?: string }) {
        super();
        this.bio = props.bio;
        this.website = props.website;
    }

    public static create(props: { bio: string; website?: string }): UserProfileEntity {
        return new UserProfileEntity(props);
    }

    public *getAtomicValues(): IterableIterator<any> {
        yield this.bio;
        yield this.website;
    }
}

// OrderEntity: A target for relationships
@DatabaseEntity()
export class OrderEntity extends Entity {
    @DatabaseSchema({ type: UniqueIdentifier, unique: true, isIdentifier: true })
    public id: UniqueIdentifier;

    @DatabaseSchema({ type: Number })
    public amount: number;

    @DatabaseSchema({ type: Date })
    public orderDate: Date;

    constructor(props: Partial<OrderEntity>) {
        super(props);
        this.id = props.id || UniqueIdentifier.generate();
        this.amount = props.amount || 0;
        this.orderDate = props.orderDate || new Date();
    }

    public static create(props: Partial<OrderEntity>): OrderEntity {
        return new OrderEntity(props);
    }

    public create(): void {
        // No-op for testing
    }

    public delete(): void {
        // No-op for testing
    }
}

// ProductEntity: A target for relationships
@DatabaseEntity()
export class ProductEntity extends Entity {
    @DatabaseSchema({ type: UniqueIdentifier, unique: true, isIdentifier: true })
    public id: UniqueIdentifier;

    @DatabaseSchema({ type: String })
    public name: string;

    @DatabaseSchema({ type: Number })
    public price: number;

    constructor(props: Partial<ProductEntity>) {
        super(props);
        this.id = props.id || UniqueIdentifier.generate();
        this.name = props.name || 'Default Product';
        this.price = props.price || 0;
    }

    public static create(props: Partial<ProductEntity>): ProductEntity {
        return new ProductEntity(props);
    }

    public create(): void {
        // No-op for testing
    }

    public delete(): void {
        // No-op for testing
    }
}

// CommentEntity: An embedded entity for PostEntity
@DatabaseEntity()
export class CommentEntity extends ValueObject {
    @DatabaseSchema({ type: UniqueIdentifier })
    public id: UniqueIdentifier;

    @DatabaseSchema({ type: String })
    public text: string;

    @DatabaseSchema({ type: String })
    public author: string;

    constructor(props: { id?: UniqueIdentifier; text: string; author: string }) {
        super();
        this.id = props.id || UniqueIdentifier.generate();
        this.text = props.text;
        this.author = props.author;
    }

    public static create(props: { id?: UniqueIdentifier; text: string; author: string }): CommentEntity {
        return new CommentEntity(props);
    }

    public *getAtomicValues(): IterableIterator<any> {
        yield this.id;
        yield this.text;
        yield this.author;
    }
}

// PostEntity: An entity with array of embedded entities and UniqueIdentifier tags
@DatabaseEntity()
export class PostEntity extends Entity {
    @DatabaseSchema({ type: UniqueIdentifier, unique: true, isIdentifier: true })
    public id: UniqueIdentifier;

    @DatabaseSchema({ type: String })
    public title: string;

    @DatabaseSchema({ type: String })
    public content: string;

    @DatabaseSchema({ type: [CommentEntity] })
    public comments: CommentEntity[];

    @DatabaseSchema({ type: [UniqueIdentifier] })
    public tags: UniqueIdentifier[];

    constructor(props: Partial<PostEntity>) {
        super(props);
        this.id = props.id || UniqueIdentifier.generate();
        this.title = props.title || 'Default Title';
        this.content = props.content || 'Default Content';
        this.comments = props.comments || [];
        this.tags = props.tags || [];
    }

    public static create(props: Partial<PostEntity>): PostEntity {
        return new PostEntity(props);
    }

    public create(): void {
        // No-op for testing
    }

    public delete(): void {
        // No-op for testing
    }
}

// ComplexUserEntity: A complex entity with embedded objects, enums, and relationships
@DatabaseEntity()
export class ComplexUserEntity extends Entity {
    @DatabaseSchema({ type: UniqueIdentifier, unique: true, isIdentifier: true })
    public id: UniqueIdentifier;

    @DatabaseSchema({ type: String })
    public username: string;

    @DatabaseSchema({ type: String, optional: true })
    public email?: string;

    @DatabaseSchema({ type: BasicEmbeddedValueObject })
    public address: BasicEmbeddedValueObject; // Using BasicEmbeddedValueObject for address

    @DatabaseSchema({ type: BasicEnum })
    public role: BasicEnum; // Using BasicEnum for role

    @DatabaseSchema({ type: UserProfileEntity })
    public profile: UserProfileEntity;

    @RelationshipProperty({ target: OrderEntity, type: 'HAS_ORDER', direction: 'OUTGOING' })
    public orders: OrderEntity[];

    @RelationshipProperty({ target: ProductEntity, type: 'LIKES', direction: 'OUTGOING' })
    public likedProducts: ProductEntity[];

    constructor(props: Partial<ComplexUserEntity>) {
        super(props);
        this.id = props.id || UniqueIdentifier.generate();
        this.username = props.username || 'default_user';
        this.email = props.email;
        this.address = props.address || BasicEmbeddedValueObject.create({ value: 'default address' });
        this.role = props.role || BasicEnum.ValueA;
        this.profile = props.profile || UserProfileEntity.create({ bio: 'default bio' });
        this.orders = props.orders || [];
        this.likedProducts = props.likedProducts || [];
    }

    public static create(props: Partial<ComplexUserEntity>): ComplexUserEntity {
        return new ComplexUserEntity(props);
    }

    public create(): void {
        // No-op for testing
    }

    public delete(): void {
        // No-op for testing
    }
}
