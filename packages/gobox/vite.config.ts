import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: 'src/index.ts',
    dts: true,
  },
  test: {
    include: ['./src/**/*.test.ts'],
    coverage: {
      reporter: ['lcov'],
    },
  },
})
