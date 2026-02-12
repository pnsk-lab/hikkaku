import crypto from 'node:crypto'
import { readFile } from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Plugin } from 'vite'

export const pluginScratchImport = (): Plugin => ({
  name: 'vite-plugin-hikkaku:scratch-import',
  enforce: 'pre',
  resolveId(source, importer, _options) {
    if (source.endsWith('?scratch')) {
      if (
        source.endsWith('.svg?scratch') ||
        source.endsWith('.png?scratch') ||
        source.endsWith('.wav?scratch') ||
        source.endsWith('.mp3?scratch')
      ) {
        const importerPath = pathToFileURL(importer ?? '')
        const url = new URL(source, importerPath)
        return {
          id: `\0scratch:${url}`,
        }
      }
    }
  },
  async load(id, _options) {
    if (id.startsWith('\0scratch:')) {
      const url = new URL(id.slice(9, -8))
      const ext = url.pathname.split('.').pop()
      if (!ext) {
        throw new Error(`Unsupported scratch asset type: ${url.pathname}`)
      }
      const file = await readFile(fileURLToPath(url))

      const hash = crypto.createHash('md5')
      hash.update(file)
      const md5 = hash.digest('hex')

      const data = {
        name: path.basename(url.pathname),
        _data: Buffer.from(file).toString('base64'),
        assetId: md5,
        dataFormat: ext,
        md5ext: `${md5}.${ext}`,
      }

      return `
        const data = ${JSON.stringify(data)}
        // to Uint8Array
        data._data = Uint8Array.from(atob(data._data), c => c.charCodeAt(0));

        export default data
      `
    }
  },
})
