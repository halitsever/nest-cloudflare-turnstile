import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Nest DI reads constructor types from emitDecoratorMetadata, which only SWC reproduces here.
  plugins: [swc.vite()],
  test: {
    include: ['test/**/*.spec.ts'],
    setupFiles: ['test/setup.ts'],
  },
});
