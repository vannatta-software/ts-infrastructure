import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: [
        'src/__tests__/neo4j.prescriptive.integration.ts', 
        'src/__tests__/neo4j.repository.integration.ts'
    ],
    exclude: [],
    setupFiles: [path.resolve(__dirname, 'src/__tests__/neo4j-integration-setup.ts')],
    testTimeout: 30000,
    hookTimeout: 30000,
    environment: 'node',
  },
});
