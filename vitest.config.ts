import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    // Match the project's "@/..." path alias so lib modules that use it resolve in tests.
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
