import { moonscratch } from './bindings.ts'
import { HeadlessVM } from './headless-vm.ts'
import type { MoonResult } from './internal-types.ts'
import {
  toOptionalJsonString,
  toProjectJsonString,
  unwrapResult,
} from './json.ts'
import { toOptionsJson } from './options.ts'
import { resolveMissingScratchAssets } from './scratch-assets.ts'
import type {
  CreateHeadlessVMOptions,
  CreateHeadlessVMWithScratchAssetsOptions,
  CreatePrecompiledProjectOptions,
  JsonValue,
  PrecompiledProject,
} from './types.ts'

type BoundMoonscratchFactory = {
  vm_compile_from_json?: (
    projectJson: string,
    assetsJson?: string,
  ) => MoonResult<unknown, unknown>
  vm_new_from_compiled?: (
    precompiled: unknown,
    optionsJson?: string,
  ) => MoonResult<unknown, unknown>
}

const hasAnyAssetEntry = (assets: Record<string, JsonValue>): boolean => {
  for (const _key in assets) {
    return true
  }
  return false
}

const toAssetsJson = (
  assets: string | Record<string, JsonValue> | undefined,
): string | undefined => {
  return assets === undefined ||
    (typeof assets !== 'string' && !hasAnyAssetEntry(assets))
    ? undefined
    : toOptionalJsonString(assets, 'assets')
}

export const createPrecompiledProject = ({
  projectJson,
  assets,
}: CreatePrecompiledProjectOptions): PrecompiledProject => {
  const binding = moonscratch as unknown as BoundMoonscratchFactory
  if (typeof binding.vm_compile_from_json !== 'function') {
    throw new Error(
      'vm_compile_from_json is unavailable in this build. Please rebuild moonscratch JS bindings.',
    )
  }
  const compiled = unwrapResult(
    binding.vm_compile_from_json(
      toProjectJsonString(projectJson),
      toAssetsJson(assets),
    ),
    'vm_compile_from_json failed',
  )
  return { raw: compiled }
}

export const createHeadlessVM = ({
  precompiled,
  options,
  initialNowMs,
  viewerLanguage,
  translateCache,
}: CreateHeadlessVMOptions): HeadlessVM => {
  const binding = moonscratch as unknown as BoundMoonscratchFactory
  if (typeof binding.vm_new_from_compiled !== 'function') {
    throw new Error(
      'vm_new_from_compiled is unavailable in this build. Please rebuild moonscratch JS bindings.',
    )
  }
  const vm = unwrapResult(
    binding.vm_new_from_compiled(precompiled.raw, toOptionsJson(options)),
    'vm_new_from_compiled failed',
  )

  const runtime = new HeadlessVM(vm)
  runtime.setTime(initialNowMs ?? Date.now())
  if (viewerLanguage !== undefined) {
    runtime.setViewerLanguage(viewerLanguage)
  }
  if (translateCache !== undefined) {
    runtime.setTranslateCache(translateCache)
  }
  return runtime
}

export const createVM = createHeadlessVM

export const createHeadlessVMWithScratchAssets = async ({
  projectJson,
  assets = {},
  options,
  initialNowMs,
  viewerLanguage,
  translateCache,
  scratchCdnBaseUrl,
  fetchAsset,
  decodeImageBytes,
}: CreateHeadlessVMWithScratchAssetsOptions): Promise<HeadlessVM> => {
  const resolvedAssets = await resolveMissingScratchAssets({
    projectJson,
    assets,
    scratchCdnBaseUrl,
    fetchAsset,
    decodeImageBytes,
  })

  const precompiled = createPrecompiledProject({
    projectJson,
    assets: resolvedAssets,
  })

  return createHeadlessVM({
    precompiled,
    options,
    initialNowMs,
    viewerLanguage,
    translateCache,
  })
}

export const createVMWithScratchAssets = createHeadlessVMWithScratchAssets

export { moonscratch }
