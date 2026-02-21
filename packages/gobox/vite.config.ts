import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: [
      './src/index.ts',
      './src/types.ts',
      './src/functions.ts',
      './src/value.ts',
    ],
    dts: true,
  },
  test: {
    include: ['./src/**/*.test.ts'],
    coverage: {
      reporter: ['lcov', 'text-summary', 'json-summary', 'text'],
    },
  },
})
