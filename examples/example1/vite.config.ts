import { defineConfig } from 'vite'
import hikkaku from 'hikkaku/vite'

export default defineConfig({
  plugins: [
    hikkaku({
      entry: './src/main.ts'
    })
  ]
})
