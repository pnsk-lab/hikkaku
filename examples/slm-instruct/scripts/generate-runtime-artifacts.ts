import { mkdir } from 'node:fs/promises'
import { SafetensorsFile } from '../src/build/safetensors'
import { createTokenizerRuntimeMetadata } from '../src/build/tokenizer'
import type {
  SlmConfig,
  ModelRuntimeMetadata,
  TensorRuntimeEntry,
  TokenizerRuntimeMetadata,
} from '../src/build/types'

const artifactDir = new URL('../artifacts/', import.meta.url)
const runtimeDir = new URL('../artifacts/runtime/', import.meta.url)

const readEnv = (primary: string, legacy: string) =>
  process.env[primary] ?? process.env[legacy]

const parseLimit = (primaryName: string, legacyName: string, fallback: number) => {
  const raw = readEnv(primaryName, legacyName)
  if (!raw) {
    return fallback
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${primaryName}: ${raw}`)
  }
  return Math.floor(value)
}

const limits = {
  maxPromptTokens: parseLimit('SLM_MAX_PROMPT_TOKENS', 'DOGE_MAX_PROMPT_TOKENS', 128),
  maxNewTokens: parseLimit('SLM_MAX_NEW_TOKENS', 'DOGE_MAX_NEW_TOKENS', 8),
  maxTotalTokens: parseLimit('SLM_MAX_TOTAL_TOKENS', 'DOGE_MAX_TOTAL_TOKENS', 144),
} as const

if (limits.maxPromptTokens + limits.maxNewTokens > limits.maxTotalTokens) {
  throw new Error(
    `Invalid token limits: maxPromptTokens (${limits.maxPromptTokens}) + maxNewTokens (${limits.maxNewTokens}) exceeds maxTotalTokens (${limits.maxTotalTokens})`,
  )
}

await mkdir(runtimeDir, { recursive: true })

const config = (await Bun.file(
  new URL('config.json', artifactDir),
).json()) as SlmConfig
const tokenizer = (await Bun.file(
  new URL('tokenizer.json', artifactDir),
).json()) as Parameters<typeof createTokenizerRuntimeMetadata>[0]
const safetensors = await SafetensorsFile.fromFile(
  new URL('model.safetensors', artifactDir),
)

const tensors: TensorRuntimeEntry[] = safetensors.tensors.map(
  (tensor, index) => ({
    name: tensor.name,
    dtype: tensor.dtype,
    shape: tensor.shape,
    length: tensor.shape.reduce((acc, value) => acc * value, 1),
    listId: `slm_tensor_${index}`,
    listName: `tensor:${tensor.name}`,
  }),
)

const modelMetadata: ModelRuntimeMetadata = {
  model: config,
  limits,
  tensors,
}

const tokenizerMetadata: TokenizerRuntimeMetadata =
  createTokenizerRuntimeMetadata(tokenizer, config, limits)

await Bun.write(
  new URL('model-metadata.json', runtimeDir),
  JSON.stringify(modelMetadata, null, 2),
)
await Bun.write(
  new URL('tokenizer-metadata.json', runtimeDir),
  JSON.stringify(tokenizerMetadata),
)

console.log(`generated ${tensors.length} tensor registry entries`)
