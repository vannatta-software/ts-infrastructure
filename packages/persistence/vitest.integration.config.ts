import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.integration.test.ts'], // Only run integration tests
    setupFiles: [path.resolve(__dirname, 'src/__tests__/mongo-integration-setup.ts')],
    testTimeout: 60000, // Increase timeout for integration tests
    hookTimeout: 60000, // Increase hook timeout
    environment: 'node',
  },
});
