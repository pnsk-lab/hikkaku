import { fromImageBytes } from '../assets/create.ts'
import { parseJson } from './json.ts'
import type {
  CreateHeadlessVMOptions,
  DecodeImageBytes,
  FetchAsset,
  JsonValue,
  ProjectJson,
  ResolveMissingScratchAssetsOptions,
} from './types.ts'
import { isObjectRecord } from './value-guards.ts'

const DEFAULT_SCRATCH_CDN_BASE_URL =
  'https://cdn.scratch.mit.edu/internalapi/asset'

type AssetObject = {
  width: number
  height: number
  rgbaBase64: string
}

type CostumeRef = {
  assetId: string
  md5ext: string
}

const hasOwn = (record: Record<string, JsonValue>, key: string): boolean =>
  Object.hasOwn(record, key)

const normalizeAssets = (
  assets: CreateHeadlessVMOptions['assets'],
): Record<string, JsonValue> => {
  if (assets === undefined) {
    return {}
  }

  if (typeof assets === 'string') {
    const parsed = parseJson<unknown>(assets, 'assets')
    if (!isObjectRecord(parsed)) {
      throw new Error('assets must be a JSON object')
    }
    return { ...(parsed as Record<string, JsonValue>) }
  }

  return { ...assets }
}

const normalizeProject = (
  projectJson: string | ProjectJson,
): Record<string, unknown> => {
  const parsed =
    typeof projectJson === 'string'
      ? parseJson<unknown>(projectJson, 'projectJson')
      : projectJson
  if (!isObjectRecord(parsed)) {
    throw new Error('projectJson must be a JSON object')
  }
  return parsed
}

const collectCostumeRefs = (project: Record<string, unknown>): CostumeRef[] => {
  const refs: CostumeRef[] = []
  const targets = project.targets
  if (!Array.isArray(targets)) {
    return refs
  }

  for (const target of targets) {
    if (!isObjectRecord(target)) {
      continue
    }
    const costumes = target.costumes
    if (!Array.isArray(costumes)) {
      continue
    }

    for (const costume of costumes) {
      if (!isObjectRecord(costume)) {
        continue
      }
      const rawMd5ext = costume.md5ext
      const md5ext = typeof rawMd5ext === 'string' ? rawMd5ext.trim() : ''
      if (md5ext.length === 0) {
        continue
      }
      const rawAssetId = costume.assetId
      const assetId = typeof rawAssetId === 'string' ? rawAssetId.trim() : ''
      refs.push({ assetId, md5ext })
    }
  }

  return refs
}

const normalizeCdnBaseUrl = (input: string | undefined): string => {
  const base = (input ?? DEFAULT_SCRATCH_CDN_BASE_URL).trim()
  if (base.length === 0) {
    throw new Error('scratchCdnBaseUrl must not be empty')
  }
  return base.endsWith('/') ? base.slice(0, -1) : base
}

const defaultFetchAsset = (): FetchAsset => {
  const fetchAsset = (globalThis as { fetch?: unknown }).fetch
  if (typeof fetchAsset !== 'function') {
    throw new Error('global fetch is not available; pass fetchAsset option')
  }
  return fetchAsset as FetchAsset
}

const validateDecodedAsset = (
  md5ext: string,
  decoded: AssetObject,
): AssetObject => {
  if (!Number.isFinite(decoded.width) || decoded.width <= 0) {
    throw new Error(`decodeImageBytes returned invalid width for ${md5ext}`)
  }
  if (!Number.isFinite(decoded.height) || decoded.height <= 0) {
    throw new Error(`decodeImageBytes returned invalid height for ${md5ext}`)
  }
  if (
    typeof decoded.rgbaBase64 !== 'string' ||
    decoded.rgbaBase64.length === 0
  ) {
    throw new Error(
      `decodeImageBytes returned invalid rgbaBase64 for ${md5ext}`,
    )
  }
  return decoded
}

const toJsonAsset = (asset: AssetObject): Record<string, JsonValue> => ({
  width: asset.width,
  height: asset.height,
  rgbaBase64: asset.rgbaBase64,
})

const buildAssetUrl = (baseUrl: string, md5ext: string): string =>
  `${baseUrl}/${encodeURIComponent(md5ext)}/get/`

export const resolveMissingScratchAssets = async ({
  projectJson,
  assets,
  scratchCdnBaseUrl,
  fetchAsset,
  decodeImageBytes,
}: ResolveMissingScratchAssetsOptions): Promise<Record<string, JsonValue>> => {
  const resolvedAssets = normalizeAssets(assets)
  const refs = collectCostumeRefs(normalizeProject(projectJson))
  if (refs.length === 0) {
    return resolvedAssets
  }

  const baseUrl = normalizeCdnBaseUrl(scratchCdnBaseUrl)
  const fetchFn = fetchAsset ?? defaultFetchAsset()
  const decodeFn: DecodeImageBytes = decodeImageBytes ?? fromImageBytes
  const cache = new Map<string, Record<string, JsonValue>>()

  for (const { assetId, md5ext } of refs) {
    if (assetId.length > 0 && hasOwn(resolvedAssets, assetId)) {
      const asset = resolvedAssets[assetId]
      if (asset === undefined) {
        continue
      }
      if (!hasOwn(resolvedAssets, md5ext)) {
        resolvedAssets[md5ext] = asset
      }
      continue
    }
    if (hasOwn(resolvedAssets, md5ext)) {
      const asset = resolvedAssets[md5ext]
      if (asset === undefined) {
        continue
      }
      if (assetId.length > 0 && !hasOwn(resolvedAssets, assetId)) {
        resolvedAssets[assetId] = asset
      }
      continue
    }

    let loaded = cache.get(md5ext)
    if (!loaded) {
      const url = buildAssetUrl(baseUrl, md5ext)
      const response = await fetchFn(url)
      if (!response.ok) {
        throw new Error(
          `failed to download Scratch asset ${md5ext}: ${response.status} ${response.statusText}`,
        )
      }
      const bytes = await response.arrayBuffer()
      const decoded = validateDecodedAsset(md5ext, await decodeFn(bytes))
      loaded = toJsonAsset(decoded)
      cache.set(md5ext, loaded)
    }

    resolvedAssets[md5ext] = loaded
    if (assetId.length > 0) {
      resolvedAssets[assetId] = loaded
    }
  }

  return resolvedAssets
}
