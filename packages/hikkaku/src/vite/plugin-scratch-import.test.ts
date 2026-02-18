import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import * as path from 'node:path'
import { describe, expect, test } from 'vite-plus/test'
import { pluginScratchImport } from './plugin-scratch-import'

describe('vite/plugin-scratch-import', () => {
  test('resolves and loads scratch asset imports', async () => {
    const plugin = pluginScratchImport()
    const dir = await mkdtemp(path.join(tmpdir(), 'hikkaku-'))
    const importer = path.join(dir, 'main.ts')
    const asset = path.join(dir, 'cat.svg')
    await writeFile(importer, '')
    await writeFile(asset, '<svg></svg>')

    const resolved = plugin.resolveId?.('./cat.svg?scratch', importer, {})
    expect(typeof resolved).toBe('object')
    if (!resolved || typeof resolved === 'string') {
      throw new Error('expected resolved object')
    }

    const loaded = await plugin.load?.(resolved.id, {})
    expect(typeof loaded).toBe('string')
    expect(loaded).toContain('export default data')
    expect(loaded).toContain('md5ext')
  })
})
