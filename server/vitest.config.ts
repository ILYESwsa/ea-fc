import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@bloxcraft/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url))
    }
  }
});
