import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import * as path from 'node:path'
import { describe, expect, test } from 'vite-plus/test'
import { pluginScratchImport } from './plugin-scratch-import'

type ResolvedImport = {
  id: string
  [key: string]: unknown
}

type ResolveIdHook = (
  source: string,
  importer: string | undefined,
  options: {
    kind?:
      | 'dynamic-import'
      | 'hot-accept'
      | 'import-rule'
      | 'import-statement'
      | 'new-url'
      | 'require-call'
      | 'url-token'
      | undefined
    custom?: unknown
    ssr?: boolean
    isEntry: boolean
  },
) =>
  | Promise<ResolvedImport | false | null | string>
  | ResolvedImport
  | false
  | null
  | string
type ResolveIdResult = Awaited<ReturnType<ResolveIdHook>>

type LoadHook = (
  id: string,
  options?: { ssr?: boolean },
) => Promise<LoadReturn> | LoadReturn
type LoadReturn =
  | string
  | null
  | { code: string; map?: unknown; format?: unknown }

type LoadHookResult = Awaited<ReturnType<LoadHook>>

const isResolvedImport = (
  value: ResolveIdResult | undefined,
): value is ResolvedImport => {
  return typeof value === 'object' && value !== null && 'id' in value
}

const isLoadResult = (
  value: LoadHookResult | undefined,
): value is { code: string } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'string'
  )
}

describe('vite/plugin-scratch-import', () => {
  test('resolves and loads scratch asset imports', async () => {
    const plugin = pluginScratchImport()
    const dir = await mkdtemp(path.join(tmpdir(), 'hikkaku-'))
    const importer = path.join(dir, 'main.ts')
    const asset = path.join(dir, 'cat.svg')
    await writeFile(importer, '')
    await writeFile(asset, '<svg></svg>')

    const resolveIdHook = plugin.resolveId as
      | ResolveIdHook
      | { handler: ResolveIdHook }
      | undefined
    const resolveIdTarget =
      typeof resolveIdHook === 'function'
        ? resolveIdHook
        : resolveIdHook &&
            typeof resolveIdHook === 'object' &&
            'handler' in resolveIdHook
          ? resolveIdHook.handler
          : undefined
    const resolveIdResult = await resolveIdTarget?.(
      './cat.svg?scratch',
      importer,
      { isEntry: false },
    )
    if (!isResolvedImport(resolveIdResult)) {
      throw new Error('expected resolved object')
    }
    const resolvedId = resolveIdResult.id

    const loadHook = plugin.load as LoadHook | { handler: LoadHook } | undefined
    const loadTarget =
      typeof loadHook === 'function' ? loadHook : loadHook?.handler
    const loadedResult = await loadTarget?.(resolvedId, {})
    if (!isLoadResult(loadedResult) && typeof loadedResult !== 'string') {
      throw new Error('expected loaded result')
    }
    const loaded =
      typeof loadedResult === 'string' ? loadedResult : loadedResult.code
    expect(typeof loaded).toBe('string')
    expect(loaded).toContain('export default data')
    expect(loaded).toContain('md5ext')
  })
})
