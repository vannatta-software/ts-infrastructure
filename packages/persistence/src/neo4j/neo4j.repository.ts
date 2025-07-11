import { Entity, getUniqueProperties } from '@vannatta-software/ts-utils-domain';
import { Neo4jSchema } from './neo4j.schema';
import { Mediator, ILogger, ApiException } from '@vannatta-software/ts-utils-server';
import { Driver, Session } from 'neo4j-driver'; // Removed auth, driver imports
import { mapEntityToNeo4jProperties } from './neo4j.utils'; // Import the utility function

export class Neo4jRepository<T extends Entity> {
    private hydrateFn: ((record: any) => T) | undefined;

    constructor(
        private readonly entityClass: new (...args: any[]) => T,
        private readonly driver: Driver, // Accept external Driver instance
        private readonly mediator?: Mediator,
    ) {}

    public onHydrate(hydrate: (record: any) => T) {
        this.hydrateFn = hydrate;
    }

    private async getSession(): Promise<Session> {
        return this.driver.session();
    }

    async createNode(entity: T, labels?: string[]): Promise<void> {
        const session = await this.getSession();
        try {
            const uniqueProperties = getUniqueProperties(entity.constructor);
            if (uniqueProperties.length > 0) {
                const uniqueMatchClauses = uniqueProperties.map(prop => `${prop}: $${prop}`).join(', ');
                const uniqueParams: Record<string, any> = {};
                for (const prop of uniqueProperties) {
                    uniqueParams[prop] = (entity as any)[prop];
                }

                const checkQuery = `MATCH (n:${this.entityClass.name} {${uniqueMatchClauses}}) RETURN n`;
                const existingNode = await session.run(checkQuery, uniqueParams);

                if (existingNode.records.length > 0) {
                    throw new ApiException(
                        `Entity with unique properties ${JSON.stringify(uniqueParams)} already exists.`,
                        { code: ['UNIQUE_CONSTRAINT_VIOLATION'] }
                    );
                }
            }

            const nodeLabels = labels && labels.length > 0 ? labels.map(l => `\`${l}\``).join(':') : this.entityClass.name;
            const properties = mapEntityToNeo4jProperties(entity); // Use the utility function
            const query = `CREATE (n:${nodeLabels} $properties) RETURN n`;
            console.log(`[Neo4jRepository] createNode Query: ${query}, Properties: ${JSON.stringify(properties)}`);
            await session.run(query, { properties });
            entity.create();
            this.mediator?.publishEvents(entity); // Changed to optional chaining
        } finally {
            await session.close();
        }
    }

    async updateNode(entity: T): Promise<void> {
        const session = await this.getSession();
        try {
            console.log(`[Neo4jRepository] updateNode - Checking existing node for ID: ${entity.id.value}`);
            const existingNodeCheck = await session.run(`MATCH (n {id: $id}) RETURN n`, { id: entity.id.value });
            if (existingNodeCheck.records.length === 0) {
                throw new ApiException(`Entity with ID ${entity.id.value} not found for update.`, { code: ['ENTITY_NOT_FOUND'] });
            }

            const uniqueProperties = getUniqueProperties(entity.constructor);
            if (uniqueProperties.length > 0) {
                const uniqueMatchClauses = uniqueProperties.map(prop => `${prop}: $${prop}`).join(', ');
                const uniqueParams: Record<string, any> = {};
                for (const prop of uniqueProperties) {
                    uniqueParams[prop] = (entity as any)[prop];
                }

                const checkQuery = `MATCH (n:${this.entityClass.name} {${uniqueMatchClauses}}) WHERE n.id <> $id RETURN n`;
                const existingNode = await session.run(checkQuery, { ...uniqueParams, id: entity.id.value });

                if (existingNode.records.length > 0) {
                    throw new ApiException(
                        `Entity with unique properties ${JSON.stringify(uniqueParams)} already exists.`,
                        { code: ['UNIQUE_CONSTRAINT_VIOLATION'] }
                    );
                }
            }

            const properties = mapEntityToNeo4jProperties(entity); // Use the utility function
            const query = `MATCH (n {id: $id}) SET n = $properties RETURN n`;
            console.log(`[Neo4jRepository] updateNode Query: ${query}, ID: ${entity.id.value}, Properties: ${JSON.stringify(properties)}`);
            await session.run(query, { id: entity.id.value, properties });
            this.mediator?.publishEvents(entity); // Changed to optional chaining
        } finally {
            await session.close();
        }
    }

    async deleteNode(id: string): Promise<void> {
        const session = await this.getSession();
        try {
            console.log(`[Neo4jRepository] deleteNode - Checking existing node for ID: ${id}`);
            const existingNode = await this.findNodeById(id);
            if (!existingNode) {
                throw new ApiException(`Entity with ID ${id} not found for deletion.`, { code: ['ENTITY_NOT_FOUND'] });
            }
            const query = `MATCH (n {id: $id}) DETACH DELETE n`;
            console.log(`[Neo4jRepository] deleteNode Query: ${query}, ID: ${id}`);
            await session.run(query, { id });
        } finally {
            await session.close();
        }
    }

    async findNodeById(id: string): Promise<T | null> {
        const session = await this.getSession();
        try {
            const query = `MATCH (n {id: $id}) RETURN n`;
            console.log(`[Neo4jRepository] findNodeById Query: ${query}, ID: ${id}`);
            const result = await session.run(query, { id });
            if (result.records.length > 0) {
                const properties = result.records[0].get('n').properties;
                console.log(`[Neo4jRepository] findNodeById - Found properties: ${JSON.stringify(properties)}`);
                return this.hydrate(properties);
            }
            console.log(`[Neo4jRepository] findNodeById - No node found for ID: ${id}`);
            return null;
        } finally {
            await session.close();
        }
    }

    async findNodes(queryObject: Record<string, any>, labels?: string[]): Promise<T[]> {
        const session = await this.getSession();
        try {
            const nodeLabels = labels && labels.length > 0 ? labels.map(l => `\`${l}\``).join(':') : this.entityClass.name;
            const matchClause = labels && labels.length > 0 ? `MATCH (n:${nodeLabels})` : `MATCH (n)`;

            let whereClause = '';
            const params: Record<string, any> = {};
            if (Object.keys(queryObject).length > 0) {
                whereClause = 'WHERE ' + Object.keys(queryObject).map(key => {
                    params[key] = queryObject[key];
                    return `n.${key} = $${key}`;
                }).join(' AND ');
            }

            const query = `${matchClause} ${whereClause} RETURN n`;
            console.log(`[Neo4jRepository] findNodes Query: ${query}, Params: ${JSON.stringify(params)}`);
            const result = await session.run(query, params);
            const hydratedResults = result.records.map(record => {
                const properties = record.get('n').properties;
                console.log(`[Neo4jRepository] findNodes - Found properties: ${JSON.stringify(properties)}`);
                return this.hydrate(properties);
            });
            console.log(`[Neo4jRepository] findNodes - Found ${hydratedResults.length} entities.`);
            return hydratedResults;
        } finally {
            await session.close();
        }
    }

    async createRelationship(fromId: string, toId: string, type: string, properties?: Record<string, any>): Promise<void> {
        const session = await this.getSession();
        try {
            const query = `
                MATCH (a {id: $fromId}), (b {id: $toId})
                CREATE (a)-[r:\`${type}\` $properties]->(b)
                RETURN r
            `;
            await session.run(query, { fromId, toId, type, properties: properties || {} });
        } finally {
            await session.close();
        }
    }

    async deleteRelationship(fromId: string, toId: string, type: string): Promise<void> {
        const session = await this.getSession();
        try {
            const query = `
                MATCH (a {id: $fromId})-[r:\`${type}\`]->(b {id: $toId})
                DELETE r
            `;
            await session.run(query, { fromId, toId, type });
        } finally {
            await session.close();
        }
    }

    async traverse(startNodeId: string, relationshipType: string, direction: 'in' | 'out' | 'both', depth?: number): Promise<T[]> {
        const session = await this.getSession();
        try {
            let relationshipPattern: string;
            switch (direction) {
                case 'in':
                    relationshipPattern = `<-[r:\`${relationshipType}\`]-`;
                    break;
                case 'out':
                    relationshipPattern = `-[r:\`${relationshipType}\`]->`;
                    break;
                case 'both':
                    relationshipPattern = `-[r:\`${relationshipType}\`]-`;
                    break;
            }

            const depthClause = depth ? `*1..${depth}` : '';
            const query = `
                MATCH (startNode {id: $startNodeId})${relationshipPattern}${depthClause}(endNode)
                RETURN endNode
            `;
            const result = await session.run(query, { startNodeId });
            return result.records.map(record => this.hydrate(record.get('endNode').properties));
        } finally {
            await session.close();
        }
    }

    async runQuery(query: string, params?: Record<string, any>): Promise<any[]> {
        const session = await this.getSession();
        try {
            const result = await session.run(query, params);
            return result.records.map(record => record.toObject());
        } finally {
            await session.close();
        }
    }

    private hydrate(record: any): T {
        if (!this.hydrateFn) {
            throw new ApiException('Hydrate function not set. Call onHydrate() first.', { code: ['HYDRATE_FUNCTION_NOT_SET'] });
        }
        return this.hydrateFn(record);
    }
}
