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
  JsonValue,
} from './types.ts'

const hasAnyAssetEntry = (assets: Record<string, JsonValue>): boolean => {
  for (const _key in assets) {
    return true
  }
  return false
}

export const createHeadlessVM = ({
  projectJson,
  assets,
  options,
  initialNowMs,
  viewerLanguage,
  translateCache,
}: CreateHeadlessVMOptions): HeadlessVM => {
  const assetsJson =
    assets === undefined ||
    (typeof assets !== 'string' && !hasAnyAssetEntry(assets))
      ? undefined
      : toOptionalJsonString(assets, 'assets')

  const vm = unwrapResult(
    moonscratch.vm_new_from_json(
      toProjectJsonString(projectJson),
      assetsJson,
      toOptionsJson(options),
    ) as MoonResult<unknown, unknown>,
    'vm_new_from_json failed',
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

  return createHeadlessVM({
    projectJson,
    assets: resolvedAssets,
    options,
    initialNowMs,
    viewerLanguage,
    translateCache,
  })
}

export const createVMWithScratchAssets = createHeadlessVMWithScratchAssets

export { moonscratch }
