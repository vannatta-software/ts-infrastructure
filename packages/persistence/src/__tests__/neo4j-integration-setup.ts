import * as neo4j from 'neo4j-driver';
import { beforeAll, beforeEach, afterAll } from 'vitest';

declare global {
  var neo4jDriver: neo4j.Driver;
}

let driver: neo4j.Driver;

beforeAll(async () => {
  console.log('[Neo4j Integration Test Setup] Connecting to Neo4j...');
  driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'testpassword'));
  globalThis.neo4jDriver = driver; // Expose driver globally
  await driver.verifyConnectivity();
  console.log('[Neo4j Integration Test Setup] Connected to Neo4j.');

  // Create unique constraint for BasicEntity.uniqueIdProperty once per test run
  // This should ideally be in a globalSetup that runs once for the entire Vitest process,
  // but for now, we'll keep it here and handle potential errors.
  let session = driver.session();
  try {
    await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (n:BasicEntity) REQUIRE n.uniqueIdProperty IS UNIQUE');
    console.log('[Neo4j Integration Test Setup] Unique constraint on BasicEntity.uniqueIdProperty created.');
  } catch (error) {
    // Log error but don't fail setup if constraint already exists or deadlock occurs
    console.error('[Neo4j Integration Test Setup] Failed to create unique constraint (might already exist or be a transient error):', error);
  } finally {
    await session.close();
  }
});

beforeEach(async () => {
  console.log('[Neo4j Integration Test Setup] Clearing database for each test...');
  const session = driver.session();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('[Neo4j Integration Test Setup] Database cleared for current test.');
  } finally {
    await session.close();
  }
});

afterAll(async () => {
  console.log('[Neo4j Integration Test Teardown] Closing Neo4j connection...');
  await driver.close();
  console.log('[Neo4j Integration Test Teardown] Neo4j connection closed.');
});
