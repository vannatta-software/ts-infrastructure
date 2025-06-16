import { Mediator, ILogger } from '@vannatta-software/ts-utils-server';
import { InMemoryRepository } from './in-memory/in-memory.repository';
import { MongoRepository } from './mongo/mongo.repository';
import { Neo4jRepository } from './neo4j/neo4j.repository';
import { PostgresRepository } from './postgres/postgres.repository';
import { Entity } from '@vannatta-software/ts-utils-domain';
import { Model } from 'mongoose';
import { Driver } from 'neo4j-driver';
import { DataSource } from 'typeorm';
import { ClassType } from '@vannatta-software/ts-utils-server';

export interface IDatabaseContext {
    inMemoryRepository<T extends Entity>(): InMemoryRepository<T>;
    mongoRepository<T extends Entity>(model: Model<T>): MongoRepository<T>;
    neo4jRepository<T extends Entity>(entityClass: ClassType<T>): Neo4jRepository<T>;
    postgresRepository<T extends Entity>(dataSource: DataSource, entityClass: ClassType<T>): PostgresRepository<T>;
}

export class DatabaseContext implements IDatabaseContext {
    constructor(
        private readonly mediator: Mediator,
        private readonly logger: ILogger,
        private readonly mongoModels: Map<string, Model<any>>, // Map of entity name to Mongoose Model
        private readonly neo4jDriver: Driver, // Neo4j Driver
        private readonly postgresDataSource: DataSource // TypeORM DataSource
    ) {}

    inMemoryRepository<T extends Entity>(): InMemoryRepository<T> {
        return new InMemoryRepository<T>(this.mediator);
    }

    mongoRepository<T extends Entity>(model: Model<T>): MongoRepository<T> {
        return new MongoRepository<T>(model, this.mediator);
    }

    neo4jRepository<T extends Entity>(entityClass: ClassType<T>): Neo4jRepository<T> {
        // Pass the neo4jDriver and logger to the Neo4jRepository
        return new Neo4jRepository<T>(this.mediator, entityClass, this.logger);
    }

    postgresRepository<T extends Entity>(dataSource: DataSource, entityClass: ClassType<T>): PostgresRepository<T> {
        // Pass the postgresDataSource and logger to the PostgresRepository
        return new PostgresRepository<T>(this.mediator, dataSource, entityClass, this.logger);
    }
}
