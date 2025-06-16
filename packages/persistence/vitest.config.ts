import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    watch: false,
    globals: true,
    exclude: ['**/*.integration.ts', '**/*.integration.test.ts'], // Exclude all .integration.ts and .integration.test.ts files
  },
});
