import { defineConfig } from 'vite-plus'

export default defineConfig({
  root: './viewer',
  pack: {
    entry: 'js/index.ts',
    dts: true,
  },
  test: {
    include: ['../js/**/*.test.ts'],
  },
})
