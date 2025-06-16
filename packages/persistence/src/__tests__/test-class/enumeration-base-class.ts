import { Enumeration } from '@vannatta-software/ts-utils-domain';
import { DatabaseSchema, DatabaseEntity } from '../../schema/database.schema';

// MyEnumeration: For testing the Enumeration base class
@DatabaseEntity()
export class MyEnumeration extends Enumeration {
    @DatabaseSchema({ type: String })
    public readonly name: string;

    @DatabaseSchema({ type: Number })
    public readonly id: number;

    public static readonly VALUE1 = new MyEnumeration('Value One', 1);
    public static readonly VALUE2 = new MyEnumeration('Value Two', 2);
    public static readonly VALUE3 = new MyEnumeration('Value Three', 3);

    private constructor(name: string, id: number) {
        super(); // Call super without arguments
        this.name = name;
        this.id = id;
    }
}
