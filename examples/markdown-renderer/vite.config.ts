import hikkaku from 'hikkaku/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    hikkaku({
      entry: './src/main.ts',
    }),
  ],
})
