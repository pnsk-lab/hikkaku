import { defineConfig } from 'vite'
import hikkaku from './src/vite/index'

export default defineConfig({
  plugins: [
    hikkaku({
      entry: './example/main.ts'
    })
  ]
})
