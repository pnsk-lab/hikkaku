import { defineConfig } from 'vite-plus'

export default defineConfig({
  lint: {
    ignorePatterns: ['**/dist/**', '**/node_modules/**', '**/*.d.ts', '**/_build/**'],
  },
  fmt: {
    semi: false,
    singleQuote: true,
  },
  pack: {
    entry: 'js/index.ts',
    dts: true,
  },
  test: {},
})
