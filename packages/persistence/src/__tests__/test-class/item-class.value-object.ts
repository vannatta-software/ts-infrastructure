import { DatabaseEntity, DatabaseSchema } from '../../schema/database.schema';
import { ValueObject } from '@vannatta-software/ts-utils-domain';

export interface ItemProps {
    itemValue: string;
}

@DatabaseEntity()
export class Item extends ValueObject {
    @DatabaseSchema({ type: String })
    itemValue: string;

    constructor(partial?: Partial<ItemProps>) {
        super();
        this.itemValue = partial?.itemValue ?? '';
    }

    protected *getAtomicValues(): IterableIterator<any> {
        yield this.itemValue;
    }
}
