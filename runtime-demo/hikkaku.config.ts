import { defineConfig } from '../src/config/mod.ts'

export default defineConfig({
  project: import.meta.resolve('./main.ts'),
  assetsDir: `${import.meta.dirname}/assets`,
})
