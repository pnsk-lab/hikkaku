import { moonscratch } from './bindings.ts'
import { HeadlessVM } from './headless-vm.ts'
import type { MoonResult } from './internal-types.ts'
import { toJsonString, toOptionalJsonString, unwrapResult } from './json.ts'
import { toOptionsJson } from './options.ts'
import { resolveMissingScratchAssets } from './scratch-assets.ts'
import type {
  CreateHeadlessVMOptions,
  CreateHeadlessVMWithScratchAssetsOptions,
} from './types.ts'

export const createHeadlessVM = ({
  projectJson,
  assets = {},
  options,
  viewerLanguage,
  translateCache,
}: CreateHeadlessVMOptions): HeadlessVM => {
  const vm = unwrapResult(
    moonscratch.vm_new_from_json(
      toJsonString(projectJson, 'projectJson', true),
      toOptionalJsonString(assets, 'assets'),
      toOptionsJson(options),
    ) as MoonResult<unknown, unknown>,
    'vm_new_from_json failed',
  )

  const runtime = new HeadlessVM(vm)
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
    viewerLanguage,
    translateCache,
  })
}

export const createVMWithScratchAssets = createHeadlessVMWithScratchAssets

export { moonscratch }
