import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: 'js/index.ts',
    dts: true,
  },
  test: {
    include: ['./js/**/*.test.ts'],
    benchmark: {
      include: ['./benchmarks/**/*.bench.ts'],
    },
  },
})
