import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    include: ['./src/**/*.test.ts'],
    coverage: {
      reporter: ['lcov'],
    },
  },
})
