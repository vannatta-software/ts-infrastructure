import { DatabaseEntity, DatabaseSchema } from '../../schema/database.schema';
import { Entity } from '@vannatta-software/ts-utils-domain';

@DatabaseEntity()
export class DeepClass extends Entity {
    @DatabaseSchema({ type: DeepClass })
    next: DeepClass;

    constructor(next: DeepClass) {
        super(); // DeepClass extends Entity, so it needs super() or super(partial)
        this.next = next;
    }

    create(): void { /* no-op for test */ }
    delete(): void { /* no-op for test */ }
}
