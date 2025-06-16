import mongoose from 'mongoose';
import { beforeAll, beforeEach, afterAll } from 'vitest';

beforeAll(async () => {
  console.log('[MongoDB Integration Test Setup] Connecting to MongoDB...');
  await mongoose.connect('mongodb://testuser:testpassword@localhost:27017/testdb?authSource=admin');
  console.log('[MongoDB Integration Test Setup] Connected to MongoDB.');
});

beforeEach(async () => {
  console.log('[MongoDB Integration Test Setup] Clearing database...');
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
  console.log('[MongoDB Integration Test Setup] Database cleared.');
});

afterAll(async () => {
  console.log('[MongoDB Integration Test Teardown] Dropping database and closing connection...');
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  console.log('[MongoDB Integration Test Teardown] Database dropped and connection closed.');
});
