import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Talks to the real siteverify endpoint, so it runs without the MSW setup.
export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['test/live/**/*.spec.ts'],
  },
});
