import { copyFile } from 'node:fs/promises'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/blocks/index.ts',
    'src/client/index.ts',
    'src/vite/index.ts',
    'src/assets/index.ts',
    'src/types.d.ts',
  ],
  dts: true,
  async onSuccess() {
    const packageJSON = await Bun.file('./package.json').json()
    packageJSON.exports = Object.fromEntries(
      Object.entries(packageJSON.exports).map(([key, value]) => {
        if (typeof value === 'string') {
          return [
            key,
            {
              import: value
                .replace(/\.ts$/, '.mjs')
                .replace(/^\.\/src\//, './'),
              types: value
                .replace(/^\.\/src\//, './')
                .replace(/(\.d)?\.ts$/, '.d.mts'),
            },
          ]
        }
        throw new Error('Unexpected export format')
      }),
    )
    await Bun.write('./dist/package.json', JSON.stringify(packageJSON, null, 2))
    await copyFile('./README.md', './dist/README.md')
  },
})
