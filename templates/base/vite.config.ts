import tailwindcss from '@tailwindcss/vite'
import hikkaku from 'hikkaku/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    hikkaku({
      entry: './src/main.ts',
    }),
  ],
})
