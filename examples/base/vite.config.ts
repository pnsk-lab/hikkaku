import hikkaku from 'hikkaku/vite'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    hikkaku({
      entry: './src/main.ts',
    }),
  ],
})
