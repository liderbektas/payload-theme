import { defineConfig } from 'vitest/config'

// The theme engine is pure and dependency-free, so a plain node environment
// is all the unit tests need.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
