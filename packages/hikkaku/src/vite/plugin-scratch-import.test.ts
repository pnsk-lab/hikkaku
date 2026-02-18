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

    const callHook = <T extends (...args: any[]) => any>(
      hook:
        | T
        | ({
            handler: T
          } & Record<string, unknown>)
        | undefined,
      ...args: Parameters<T>
    ) => {
      const fn =
        typeof hook === 'function'
          ? hook
          : hook && 'handler' in hook
            ? hook.handler
            : undefined
      return fn?.(...args)
    }

    const resolveIdResult = await callHook(
      plugin.resolveId,
      './cat.svg?scratch',
      importer,
      { isEntry: false },
    )
    const resolved = resolveIdResult
    expect(typeof resolved).toBe('object')
    if (!resolved || typeof resolved === 'string' || 'id' in resolved === false) {
      throw new Error('expected resolved object')
    }

    const loadedResult = await callHook(plugin.load, resolved.id, {})
    const loaded =
      typeof loadedResult === 'string'
        ? loadedResult
        : loadedResult?.code ?? null
    expect(typeof loaded).toBe('string')
    expect(loaded).toContain('export default data')
    expect(loaded).toContain('md5ext')
  })
})
