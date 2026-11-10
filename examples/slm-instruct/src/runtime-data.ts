import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { once } from 'node:events'
import { join } from 'node:path'
import type { ListReference, Project } from 'hikkaku'
import { SafetensorsFile } from './build/safetensors'
import type {
  SlmConfig,
  ModelRuntimeMetadata,
  TensorRuntimeEntry,
  TokenizerRuntimeMetadata,
} from './build/types'

type ListValue = number | string
type StaticListValues =
  | readonly ListValue[]
  | Float32Array
  | (() => readonly ListValue[] | Float32Array)

export interface StaticListSpec {
  readonly ref: ListReference
  readonly values: StaticListValues
}

export interface RuntimeTensorSource {
  readonly offset: number
  readonly length: number
}

export interface ModelSourceMetadata {
  readonly repo: string
  readonly revision: string
  readonly files: readonly string[]
}

const MAX_PARAMETER_SOURCE_CHUNKS = 50

const manualList = (id: string, name: string): ListReference => ({
  id,
  name,
  type: 'list',
})

const readEnv = (primary: string, legacy: string) =>
  process.env[primary] ?? process.env[legacy]

const staticFloatPrecision = (() => {
  const raw = readEnv('SLM_STATIC_FLOAT_PRECISION', 'DOGE_STATIC_FLOAT_PRECISION')
  const rawValue = Number(raw ?? 6)
  if (!Number.isFinite(rawValue) || rawValue < 1) {
    throw new Error(
      `Invalid SLM_STATIC_FLOAT_PRECISION: ${raw ?? ''}`,
    )
  }
  return Math.floor(rawValue)
})()

const roundFloat = (value: number) =>
  Number(value.toPrecision(staticFloatPrecision))

export interface SlmRuntimeArtifacts {
  readonly model: SlmConfig
  readonly modelSource: ModelSourceMetadata
  readonly limits: ModelRuntimeMetadata['limits']
  readonly tensors: readonly TensorRuntimeEntry[]
  readonly tensorRefs: Record<string, ListReference>
  readonly tensorSources: Record<string, RuntimeTensorSource>
  readonly totalTensorValues: number
  readonly parameterSourceFileName: string
  readonly parameterSourceChunkCount: number
  readonly tokenizerMetadata: TokenizerRuntimeMetadata
  readonly tokenizerLists: {
    readonly inverseVocab: ListReference
    readonly byteEncoder: ListReference
    readonly byteDecoder: ListReference
    readonly byteTokenIds: ListReference
    readonly mergeRowStarts: ListReference
    readonly mergeRowEnds: ListReference
    readonly mergeRightIds: ListReference
    readonly mergeResultIds: ListReference
    readonly mergeRanks: ListReference
    readonly templatePrefix: ListReference
    readonly templateSuffix: ListReference
    readonly ropeCos: ListReference
    readonly ropeSin: ListReference
  }
  readonly staticStageLists: readonly StaticListSpec[]
  emitBuildAssets(outputDir: string): Promise<void>
}

export const loadSlmRuntimeArtifacts =
  async (): Promise<SlmRuntimeArtifacts> => {
    const artifactRoot = join(process.cwd(), 'artifacts')
    const runtimeRoot = join(artifactRoot, 'runtime')
    const parameterSourceFileName = 'model-parameters.txt'

    const modelMetadata = (await Bun.file(
      join(runtimeRoot, 'model-metadata.json'),
    ).json()) as ModelRuntimeMetadata
    const tokenizerMetadata = (await Bun.file(
      join(runtimeRoot, 'tokenizer-metadata.json'),
    ).json()) as TokenizerRuntimeMetadata
    const modelSource = (await Bun.file(
      join(artifactRoot, 'model-source.json'),
    ).json()) as ModelSourceMetadata
    const safetensors = await SafetensorsFile.fromFile(
      join(artifactRoot, 'model.safetensors'),
    )

    const tensorRefs = Object.fromEntries(
      modelMetadata.tensors.map((tensor) => [
        tensor.name,
        manualList(tensor.listId, tensor.listName),
      ]),
    ) as Record<string, ListReference>

    const tokenizerLists = {
      inverseVocab: manualList(
        'slm_tok_inverse_vocab',
        'tokenizer:inverseVocab',
      ),
      byteEncoder: manualList('slm_tok_byte_encoder', 'tokenizer:byteEncoder'),
      byteDecoder: manualList('slm_tok_byte_decoder', 'tokenizer:byteDecoder'),
      byteTokenIds: manualList(
        'slm_tok_byte_token_ids',
        'tokenizer:byteTokenIds',
      ),
      mergeRowStarts: manualList(
        'slm_tok_merge_row_starts',
        'tokenizer:mergeRowStarts',
      ),
      mergeRowEnds: manualList(
        'slm_tok_merge_row_ends',
        'tokenizer:mergeRowEnds',
      ),
      mergeRightIds: manualList(
        'slm_tok_merge_right_ids',
        'tokenizer:mergeRightIds',
      ),
      mergeResultIds: manualList(
        'slm_tok_merge_result_ids',
        'tokenizer:mergeResultIds',
      ),
      mergeRanks: manualList('slm_tok_merge_ranks', 'tokenizer:mergeRanks'),
      templatePrefix: manualList(
        'slm_tok_template_prefix',
        'tokenizer:templatePrefix',
      ),
      templateSuffix: manualList(
        'slm_tok_template_suffix',
        'tokenizer:templateSuffix',
      ),
      ropeCos: manualList('slm_tok_rope_cos', 'rope:cos'),
      ropeSin: manualList('slm_tok_rope_sin', 'rope:sin'),
    } as const

    const serializeTensorValue = (value: number) => String(roundFloat(value))

    let totalTensorValues = 0
    const tensorSources = Object.fromEntries(
      modelMetadata.tensors.map((tensor) => {
        const source: RuntimeTensorSource = {
          offset: totalTensorValues,
          length: tensor.length,
        }
        totalTensorValues += tensor.length
        return [tensor.name, source]
      }),
    ) as Record<string, RuntimeTensorSource>
    const parameterSourceChunkCount = Math.min(
      MAX_PARAMETER_SOURCE_CHUNKS,
      Math.max(1, totalTensorValues),
    )
    const parameterValuesPerChunk = Math.ceil(
      totalTensorValues / parameterSourceChunkCount,
    )

    const staticStageLists: StaticListSpec[] = [
      ...modelMetadata.tensors.map((tensor) => ({
        ref: tensorRefs[tensor.name]!,
        values: [],
      })),
      {
        ref: tokenizerLists.inverseVocab,
        values: tokenizerMetadata.vocabById,
      },
      {
        ref: tokenizerLists.byteTokenIds,
        values: tokenizerMetadata.byteTokenIds,
      },
      {
        ref: tokenizerLists.mergeRowStarts,
        values: tokenizerMetadata.bpeLookup.mergeRowStarts,
      },
      {
        ref: tokenizerLists.mergeRowEnds,
        values: tokenizerMetadata.bpeLookup.mergeRowEnds,
      },
      {
        ref: tokenizerLists.mergeRightIds,
        values: tokenizerMetadata.bpeLookup.mergeRightIds,
      },
      {
        ref: tokenizerLists.mergeResultIds,
        values: tokenizerMetadata.bpeLookup.mergeResultIds,
      },
      {
        ref: tokenizerLists.mergeRanks,
        values: tokenizerMetadata.bpeLookup.mergeRanks,
      },
      {
        ref: tokenizerLists.byteEncoder,
        values: tokenizerMetadata.byteEncoder,
      },
      {
        ref: tokenizerLists.byteDecoder,
        values: tokenizerMetadata.byteDecoder,
      },
      {
        ref: tokenizerLists.templatePrefix,
        values: tokenizerMetadata.chatTemplate.prefixIds,
      },
      {
        ref: tokenizerLists.templateSuffix,
        values: tokenizerMetadata.chatTemplate.suffixIds,
      },
      {
        ref: tokenizerLists.ropeCos,
        values: tokenizerMetadata.ropeTables.cos.map(roundFloat),
      },
      {
        ref: tokenizerLists.ropeSin,
        values: tokenizerMetadata.ropeTables.sin.map(roundFloat),
      },
    ]

    const emitBuildAssets = async (outputDir: string) => {
      await mkdir(outputDir, { recursive: true })
      const outputPath = join(outputDir, parameterSourceFileName)
      const stream = createWriteStream(outputPath, { encoding: 'utf8' })

      const writeChunk = async (chunk: string) => {
        if (!stream.write(chunk)) {
          await once(stream, 'drain')
        }
      }

      let firstValue = true
      let chunk = ''
      let chunkIndex = 1
      let lineValueCount = 0
      const flushBuffer = async () => {
        if (chunk.length === 0) {
          return
        }
        await writeChunk(chunk)
        chunk = ''
      }

      try {
        for (const tensor of modelMetadata.tensors) {
          const data = safetensors.getTensorData(tensor.name)
          for (const value of data) {
            const serializedValue = serializeTensorValue(value)
            const fragment = firstValue
              ? serializedValue
              : lineValueCount === 0
                ? `\n${serializedValue}`
                : `/${serializedValue}`
            const needsBufferFlush =
              chunk.length > 0 && chunk.length + fragment.length > 1_000_000
            if (needsBufferFlush) {
              await flushBuffer()
            }
            firstValue = false
            chunk += fragment
            lineValueCount += 1
            if (
              lineValueCount >= parameterValuesPerChunk &&
              chunkIndex < parameterSourceChunkCount
            ) {
              await flushBuffer()
              lineValueCount = 0
              chunkIndex += 1
            }
          }
        }
        await flushBuffer()
      } finally {
        stream.end()
        await once(stream, 'finish')
      }
    }

    return {
      model: modelMetadata.model,
      modelSource,
      limits: modelMetadata.limits,
      tensors: modelMetadata.tensors,
      tensorRefs,
      tensorSources,
      totalTensorValues,
      parameterSourceFileName,
      parameterSourceChunkCount,
      tokenizerMetadata,
      tokenizerLists,
      staticStageLists,
      emitBuildAssets,
    }
  }

interface ScratchProjectLike {
  toScratch(): ReturnType<Project['toScratch']>
  getAdditionalAssets(): ReturnType<Project['getAdditionalAssets']>
  emitBuildAssets?(outputDir: string): Promise<void>
}

export const withInjectedStageLists = (
  baseProject: Project,
  stageLists: readonly StaticListSpec[],
  emitBuildAssets?: (outputDir: string) => Promise<void>,
): ScratchProjectLike => {
  return {
    toScratch() {
      const scratch = baseProject.toScratch()
      const stage = scratch.targets.find((target) => target.isStage)
      if (!stage) {
        throw new Error('Stage target not found')
      }
      for (const { ref, values } of stageLists) {
        const resolved = typeof values === 'function' ? values() : values
        stage.lists[ref.id] = [ref.name, Array.from(resolved)]
      }
      return scratch
    },
    getAdditionalAssets() {
      return baseProject.getAdditionalAssets()
    },
    emitBuildAssets,
  }
}
