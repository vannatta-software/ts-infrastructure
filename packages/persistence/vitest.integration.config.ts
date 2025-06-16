import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/__tests__/mongo.prescriptive.integration.ts', 'src/__tests__/mongo.repository.integration.ts'], // Explicitly list MongoDB integration tests
    exclude: [], // Remove exclude pattern as per user's instruction
    setupFiles: [path.resolve(__dirname, 'src/__tests__/mongo-integration-setup.ts')], // Revert to single setup file
    testTimeout: 60000, // Increase timeout for integration tests
    hookTimeout: 60000, // Increase hook timeout
    environment: 'node',
  },
});
