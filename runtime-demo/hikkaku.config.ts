import { defineConfig } from '../src/config/mod.ts'
import project from './main.ts'

export default defineConfig({
  project,
  assetsDir: `${import.meta.dirname}/assets`
})
