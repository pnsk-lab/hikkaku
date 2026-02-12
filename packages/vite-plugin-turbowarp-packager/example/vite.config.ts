import hikkaku from 'hikkaku/vite'
import { defineConfig } from 'vite-plus'
import { pluginTurbowarpPackager } from '../src'

export default defineConfig({
  plugins: [
    hikkaku({
      entry: 'src.ts',
    }),
    pluginTurbowarpPackager(),
  ],
  build: {
    minify: false,
  },
})
