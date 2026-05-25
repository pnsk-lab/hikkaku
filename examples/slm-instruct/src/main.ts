import { type ListReference, Project, type VariableReference } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import {
  add,
  addToList,
  and,
  askAndWait,
  callProcedure,
  changeVariableBy,
  contains,
  defineProcedure,
  deleteAllOfList,
  deleteOfList,
  divide,
  equals,
  forEach,
  getAnswer,
  getBackdropNumberName,
  getItemNumOfList,
  getItemOfList,
  getVariable,
  gt,
  hideList,
  hideVariable,
  ifElse,
  ifThen,
  join,
  length,
  lengthOfList,
  letterOf,
  lt,
  mathop,
  mod,
  multiply,
  not,
  or,
  procedureBoolean,
  procedureLabel,
  procedureStringOrNumber,
  repeatUntil,
  replaceItemOfList,
  setVariableTo,
  showList,
  showVariable,
  stop,
  subtract,
  switchBackdropTo,
  whenFlagClicked,
  whenKeyPressed,
  waitUntil,
} from 'hikkaku/blocks'
import {
  loadSlmRuntimeArtifacts,
  withInjectedStageLists,
} from './runtime-data'

const readEnv = (primary: string, legacy: string) =>
  process.env[primary] ?? process.env[legacy]

const inferAssistantName = (repo: string) => {
  const repoName = repo.split('/').at(-1) ?? 'Assistant'
  const withoutTaskSuffix = repoName.replace(/-(Instruct|Chat)$/i, '')
  const parts = withoutTaskSuffix.split('-')
  const maybeSizeSuffix = parts.at(-1)
  if (maybeSizeSuffix && /\d/.test(maybeSizeSuffix) && parts.length > 1) {
    parts.pop()
  }
  return parts[0] || withoutTaskSuffix || 'Assistant'
}

const runtime = await loadSlmRuntimeArtifacts()

const project = new Project()
const stage = project.stage

const HIDDEN_SIZE = runtime.model.hidden_size
const NUM_HEADS = runtime.model.num_attention_heads
const NUM_KEY_VALUE_HEADS = runtime.model.num_key_value_heads
const NUM_KEY_VALUE_GROUPS = NUM_HEADS / NUM_KEY_VALUE_HEADS
const HEAD_DIM = HIDDEN_SIZE / NUM_HEADS
const KEY_VALUE_HIDDEN_SIZE = NUM_KEY_VALUE_HEADS * HEAD_DIM
const HALF_HEAD_DIM = HEAD_DIM / 2
const INTERMEDIATE_SIZE = runtime.model.intermediate_size
const NUM_LAYERS = runtime.model.num_hidden_layers
const MAX_TOTAL_TOKENS = runtime.limits.maxTotalTokens
const MAX_NEW_TOKENS = Number(
  readEnv('SLM_MAX_NEW_TOKENS', 'DOGE_MAX_NEW_TOKENS') ??
    runtime.limits.maxNewTokens,
)
const TOTAL_PARAMETER_VALUES = runtime.totalTensorValues
const PARAMETER_SOURCE_FILE_NAME = runtime.parameterSourceFileName
const PARAMETER_SOURCE_CHUNK_COUNT = runtime.parameterSourceChunkCount
const EOS_TOKEN_ID = runtime.model.eos_token_id
const RMS_EPSILON = runtime.model.rms_norm_eps
const IS_MOE = runtime.model.is_moe
const NUM_EXPERTS =
  runtime.model.num_experts ?? runtime.model.num_cdmoe_experts ?? 0
const MOE_TOP_K =
  runtime.model.num_experts_per_tok ??
  runtime.model.expert_retrieval_size ??
  runtime.model.num_cdmoe_experts_per_head ??
  0
const MOE_NUM_KEYS = IS_MOE ? Math.floor(Math.sqrt(NUM_EXPERTS)) : 0
const ATTENTION_SCALE = 1 / Math.sqrt(HEAD_DIM)
const NEGATIVE_INFINITY = -1e30
const ASCII_LOWER = 'abcdefghijklmnopqrstuvwxyz'
const ASCII_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SPACE_TAB = ' \t'
const NEWLINES = '\n\r'
const CASE_LOOKUP_BLANK_NAME = '__case_lookup_blank__'
const CASE_LOOKUP_LOWER_SUFFIX = '~lower'
const CASE_LOOKUP_BLANK_NUMBER = 1
const CASE_LOOKUP_LOWER_START_NUMBER = ASCII_UPPER.length + 2
const CASE_LOOKUP_UPPER_BYTE_LIST_OFFSET = 'A'.charCodeAt(0) - 1
const CASE_LOOKUP_LOWER_BYTE_LIST_OFFSET =
  'a'.charCodeAt(0) - CASE_LOOKUP_LOWER_START_NUMBER + 1
const USER_LABEL = 'You: '
const ASSISTANT_NAME =
  readEnv('SLM_ASSISTANT_NAME', 'DOGE_ASSISTANT_NAME') ??
  inferAssistantName(runtime.modelSource.repo)
const ASSISTANT_LABEL = `${ASSISTANT_NAME}: `
const NEW_CHAT_COMMAND = '/new'
const END_OF_TEXT_TOKEN_ID =
  runtime.tokenizerMetadata.specialTokens['<|end_of_text|>'] ?? 1
const START_HEADER_TOKEN_ID =
  runtime.tokenizerMetadata.specialTokens['<|start_header_id|>'] ?? 3
const END_HEADER_TOKEN_ID =
  runtime.tokenizerMetadata.specialTokens['<|end_header_id|>'] ?? 4

if (IS_MOE) {
  if (NUM_EXPERTS <= 0 || MOE_TOP_K <= 0) {
    throw new Error(
      `Invalid MoE config: numExperts=${NUM_EXPERTS} topK=${MOE_TOP_K}`,
    )
  }
  if (MOE_NUM_KEYS * MOE_NUM_KEYS !== NUM_EXPERTS) {
    throw new Error(
      `Unsupported MoE config: numExperts=${NUM_EXPERTS} is not a perfect square`,
    )
  }
}

const zeroes = (size: number) => Array(size).fill(0)
const read = (variable: VariableReference) => getVariable(variable)
const asNumber = <T>(value: T) => value as unknown as ReturnType<typeof add>
const asString = <T>(value: T) =>
  value as unknown as ReturnType<typeof letterOf>
const concatText = (...parts: unknown[]) => {
  let result = (parts[0] ?? '') as ReturnType<typeof join>
  for (let index = 1; index < parts.length; index += 1) {
    result = join(result, parts[index] as never)
  }
  return result
}

interface RuntimeTensor {
  readonly ref: ListReference
}

const parameterSource = stage.createList('modelParameters', [], {
  monitor: {
    visible: true,
    x: 5,
    y: 55,
    width: 470,
    height: 300,
  },
})

const tensor = (name: string): RuntimeTensor => {
  const source = runtime.tensorSources[name]
  const ref = runtime.tensorRefs[name]
  if (!source) {
    throw new Error(`Missing tensor source: ${name}`)
  }
  if (!ref) {
    throw new Error(`Missing tensor list reference: ${name}`)
  }
  return {
    ref,
  }
}

const tensorAny = (...names: string[]): RuntimeTensor => {
  for (const name of names) {
    const source = runtime.tensorSources[name]
    const ref = runtime.tensorRefs[name]
    if (source && ref) {
      return {
        ref,
      }
    }
  }
  throw new Error(`Missing tensor reference: ${names.join(' | ')}`)
}

const layerTensor = (
  layerIndex: number,
  ...suffixes: string[]
): RuntimeTensor =>
  tensorAny(...suffixes.map((suffix) => `model.layers.${layerIndex}.${suffix}`))

const tensorItem = (
  weight: RuntimeTensor,
  itemIndex: number | ReturnType<typeof read>,
) => getItemOfList(weight.ref, itemIndex)

const embeddingWeight = tensorAny(
  'model.word_embed.weight',
  'model.embed_tokens.weight',
)
const finalLayerNormWeight = tensorAny(
  'model.final_layernorm.weight',
  'model.norm.weight',
)

const layers = Array.from({ length: NUM_LAYERS }, (_, layerIndex) => ({
  preLayerNorm: layerTensor(
    layerIndex,
    'pre_layernorm.weight',
    'input_layernorm.weight',
  ),
  preResidual: layerTensor(layerIndex, 'pre_residual.weight', 'input_residual'),
  postLayerNorm: layerTensor(
    layerIndex,
    'post_layernorm.weight',
    'post_attention_layernorm.weight',
  ),
  postResidual: layerTensor(
    layerIndex,
    'post_residual.weight',
    'post_attention_residual',
  ),
  qProj: tensor(`model.layers.${layerIndex}.self_attn.q_proj.weight`),
  kProj: tensor(`model.layers.${layerIndex}.self_attn.k_proj.weight`),
  vProj: tensor(`model.layers.${layerIndex}.self_attn.v_proj.weight`),
  oProj: tensor(`model.layers.${layerIndex}.self_attn.o_proj.weight`),
  dtProj: tensor(`model.layers.${layerIndex}.self_attn.dt_proj.weight`),
  attnA: tensor(`model.layers.${layerIndex}.self_attn.A`),
  gateProj: layerTensor(
    layerIndex,
    'feed_forward.gate_proj.weight',
    'mlp.gate_proj.weight',
  ),
  upProj: layerTensor(
    layerIndex,
    'feed_forward.up_proj.weight',
    'mlp.up_proj.weight',
  ),
  downProj: layerTensor(
    layerIndex,
    'feed_forward.down_proj.weight',
    'mlp.down_proj.weight',
  ),
  routerGate: IS_MOE
    ? layerTensor(
        layerIndex,
        'feed_forward.router_gate.weight',
        'mlp.router_gate.weight',
      )
    : null,
  downEmbed: IS_MOE
    ? layerTensor(
        layerIndex,
        'feed_forward.down_embed.weight',
        'mlp.down_embed.weight',
      )
    : null,
  upEmbed: IS_MOE
    ? layerTensor(
        layerIndex,
        'feed_forward.up_embed.weight',
        'mlp.up_embed.weight',
      )
    : null,
}))

const status = stage.createVariable('status', 'ready', {
  monitor: { mode: 'default', visible: false, x: 10, y: 10 },
})
const outputText = stage.createVariable('output', '', {
  monitor: { mode: 'default', visible: false, x: 20, y: 60 },
})
const generatedCount = stage.createVariable('generated', 0, {
  monitor: { mode: 'large', visible: false, x: 170, y: 8 },
})
const maxOutputTokensSetting = stage.createVariable(
  'max output tokens',
  MAX_NEW_TOKENS,
  {
    monitor: {
      mode: 'slider',
      visible: false,
      x: 300,
      y: 10,
      sliderMin: 1,
      sliderMax: MAX_TOTAL_TOKENS,
      isDiscrete: true,
    },
  },
)

const promptTokenIds = stage.createList('promptTokenIds', [])
const generatedTokenIds = stage.createList('generatedTokenIds', [])
const chunkTokenIds = stage.createList('chunkTokenIds', [])
const conversationTurns = stage.createList('conversationTurns', [])
const conversationView = stage.createList('conversation', [], {
  monitor: {
    visible: false,
    x: 5,
    y: 55,
    width: 470,
    height: 300,
  },
})

const hidden = stage.createList('hidden', zeroes(HIDDEN_SIZE))
const residual = stage.createList('residual', zeroes(HIDDEN_SIZE))
const norm = stage.createList('norm', zeroes(HIDDEN_SIZE))
const qVector = stage.createList('qVector', zeroes(HIDDEN_SIZE))
const kVector = stage.createList('kVector', zeroes(KEY_VALUE_HIDDEN_SIZE))
const vVector = stage.createList('vVector', zeroes(KEY_VALUE_HIDDEN_SIZE))
const attnScoreLists = Array.from({ length: NUM_HEADS }, (_, headIndex) =>
  stage.createList(`attnScoresHead${headIndex}`, zeroes(MAX_TOTAL_TOKENS)),
)
const attnHeadOutputs = Array.from({ length: NUM_HEADS }, (_, headIndex) =>
  stage.createList(`attnHead${headIndex}`, zeroes(HEAD_DIM)),
)
const attnContext = stage.createList('attnContext', zeroes(HIDDEN_SIZE))
const work256 = stage.createList('work256', zeroes(HIDDEN_SIZE))
const mlpGate = stage.createList('mlpGate', zeroes(INTERMEDIATE_SIZE))
const mlpUp = stage.createList('mlpUp', zeroes(INTERMEDIATE_SIZE))
const mlpInter = stage.createList('mlpInter', zeroes(INTERMEDIATE_SIZE))
const moeRouterX = stage.createList(
  'moeRouterX',
  zeroes(Math.max(MOE_NUM_KEYS, 1)),
)
const moeRouterY = stage.createList(
  'moeRouterY',
  zeroes(Math.max(MOE_NUM_KEYS, 1)),
)
const moeTopIndices = stage.createList(
  'moeTopIndices',
  zeroes(Math.max(MOE_TOP_K, 1)),
)
const moeTopScores = stage.createList(
  'moeTopScores',
  Array(Math.max(MOE_TOP_K, 1)).fill(NEGATIVE_INFINITY),
)
const moeExpertState = stage.createList('moeExpertState', zeroes(HIDDEN_SIZE))

const keyCaches = Array.from({ length: NUM_LAYERS }, (_, layerIndex) =>
  stage.createList(
    `keyCache${layerIndex}`,
    zeroes(MAX_TOTAL_TOKENS * KEY_VALUE_HIDDEN_SIZE),
  ),
)
const valueCaches = Array.from({ length: NUM_LAYERS }, (_, layerIndex) =>
  stage.createList(
    `valueCache${layerIndex}`,
    zeroes(MAX_TOTAL_TOKENS * KEY_VALUE_HIDDEN_SIZE),
  ),
)

const outputIndexForToken = (
  outputIndex: number | ReturnType<typeof read>,
  inputIndex: number | ReturnType<typeof read>,
  inputWidth: number,
) => add(multiply(add(outputIndex, -1), inputWidth), inputIndex)

const kvCacheIndex = (
  positionZeroBased: number | ReturnType<typeof read>,
  dimIndex: number | ReturnType<typeof read>,
) => add(multiply(positionZeroBased, KEY_VALUE_HIDDEN_SIZE), dimIndex)

const ropeIndex = (
  positionZeroBased: number | ReturnType<typeof read>,
  dimIndex: number | ReturnType<typeof read>,
) => add(multiply(positionZeroBased, HEAD_DIM), dimIndex)

const qIndex = (
  headOneBased: number | ReturnType<typeof read>,
  dimIndex: number | ReturnType<typeof read>,
) => add(multiply(add(headOneBased, -1), HEAD_DIM), dimIndex)

const kvIndex = (
  headOneBased: number | ReturnType<typeof read>,
  dimIndex: number | ReturnType<typeof read>,
) => add(multiply(add(headOneBased, -1), HEAD_DIM), dimIndex)

const isPresent = (
  value: ReturnType<typeof read> | ReturnType<typeof letterOf>,
) => gt(length(asString(value)), 0)
const isLower = (
  value: ReturnType<typeof read> | ReturnType<typeof letterOf>,
) => and(isPresent(value), contains(ASCII_LOWER, asString(value)))
const isUpper = (
  value: ReturnType<typeof read> | ReturnType<typeof letterOf>,
) => and(isPresent(value), contains(ASCII_UPPER, asString(value)))
const isLetter = (
  value: ReturnType<typeof read> | ReturnType<typeof letterOf>,
) => or(isLower(value), isUpper(value))
const isDigit = (
  value: ReturnType<typeof read> | ReturnType<typeof letterOf>,
) => and(isPresent(value), contains(DIGITS, asString(value)))
const isSpace = (
  value: ReturnType<typeof read> | ReturnType<typeof letterOf>,
) => and(isPresent(value), contains(SPACE_TAB, asString(value)))
const isNewline = (
  value: ReturnType<typeof read> | ReturnType<typeof letterOf>,
) => and(isPresent(value), contains(NEWLINES, asString(value)))
const isPunctuation = (
  value: ReturnType<typeof read> | ReturnType<typeof letterOf>,
) =>
  and(
    isPresent(value),
    and(
      not(isLetter(value)),
      and(not(isDigit(value)), and(not(isSpace(value)), not(isNewline(value)))),
    ),
  )

// Scratch list/text comparisons are case-insensitive, so use backdrop switching for ASCII letters.
stage.addCostume({ ...IMAGES.BLANK_SVG, name: CASE_LOOKUP_BLANK_NAME })
for (const letter of ASCII_UPPER) {
  stage.addCostume({ ...IMAGES.BLANK_SVG, name: letter })
}
for (const letter of ASCII_LOWER) {
  stage.addCostume({
    ...IMAGES.BLANK_SVG,
    name: `${letter}${CASE_LOOKUP_LOWER_SUFFIX}`,
  })
}

stage.run(() => {
  const tokenIndex = stage.createVariable('tokenIndex', 1)
  const outputIndex = stage.createVariable('outputIndex', 1)
  const inputIndex = stage.createVariable('inputIndex', 1)
  const _headIndex = stage.createVariable('headIndex', 1)
  const positionIndex = stage.createVariable('positionIndex', 1)
  const chunkTokenIndex = stage.createVariable('chunkTokenIndex', 1)
  const conversationTurnIndex = stage.createVariable('conversationTurnIndex', 1)
  const charIndex = stage.createVariable('charIndex', 1)
  const vocabIndex = stage.createVariable('vocabIndex', 1)
  const moeKeyIndex = stage.createVariable('moeKeyIndex', 1)
  const moeXIndex = stage.createVariable('moeXIndex', 1)
  const moeYIndex = stage.createVariable('moeYIndex', 1)
  const moeTopRank = stage.createVariable('moeTopRank', 1)

  const promptLength = stage.createVariable('promptLength', 0)
  const promptCharCount = stage.createVariable('promptCharCount', 0)
  const currentPosition = stage.createVariable('currentPosition', 0)
  const currentTokenId = stage.createVariable('currentTokenId', 0)
  const nextTokenId = stage.createVariable('nextTokenId', 0)
  const maxOutputTokens = stage.createVariable(
    'maxOutputTokens',
    MAX_NEW_TOKENS,
  )
  const remainingTokenBudget = stage.createVariable('remainingTokenBudget', 0)
  const stopChat = stage.createVariable('stopChat', 0)
  const chatStarted = stage.createVariable('chatStarted', 0)
  const assistantLineIndex = stage.createVariable('assistantLineIndex', 0)
  const tokenizationError = stage.createVariable('tokenizationError', 0)
  const chunkIndex = stage.createVariable('chunkIndex', 0)
  const chunkStartIndex = stage.createVariable('chunkStartIndex', 0)
  const chunkEndIndex = stage.createVariable('chunkEndIndex', 0)
  const chunkCharCount = stage.createVariable('chunkCharCount', 0)
  const mergeCount = stage.createVariable('mergeCount', 0)

  const currentChar = stage.createVariable('currentChar', '')
  const nextChar = stage.createVariable('nextChar', '')
  const thirdChar = stage.createVariable('thirdChar', '')
  const workingText = stage.createVariable('workingText', '')
  const leftTokenId = stage.createVariable('leftTokenId', 0)
  const rightTokenId = stage.createVariable('rightTokenId', 0)
  const mergedTokenId = stage.createVariable('mergedTokenId', 0)
  const byteLookupIndex = stage.createVariable('byteLookupIndex', 0)
  const rowStartIndex = stage.createVariable('rowStartIndex', 0)
  const rowEndIndex = stage.createVariable('rowEndIndex', 0)
  const mergeLookupIndex = stage.createVariable('mergeLookupIndex', 0)
  const pairLookupIndex = stage.createVariable('pairLookupIndex', 0)
  const bestPairIndex = stage.createVariable('bestPairIndex', 0)
  const bestPairRank = stage.createVariable('bestPairRank', 0)
  const caseLookupBackdropNumber = stage.createVariable(
    'caseLookupBackdropNumber',
    0,
  )

  const sumValue = stage.createVariable('sumValue', 0)
  const scaleValue = stage.createVariable('scaleValue', 0)
  const lowValue = stage.createVariable('lowValue', 0)
  const highValue = stage.createVariable('highValue', 0)
  const cosValue = stage.createVariable('cosValue', 0)
  const sinValue = stage.createVariable('sinValue', 0)
  const dotValue = stage.createVariable('dotValue', 0)
  const dtValue = stage.createVariable('dtValue', 0)
  const maxScore = stage.createVariable('maxScore', NEGATIVE_INFINITY)
  const currentScore = stage.createVariable('currentScore', 0)
  const currentWeight = stage.createVariable('currentWeight', 0)
  const bestLogit = stage.createVariable('bestLogit', NEGATIVE_INFINITY)
  const stopGeneration = stage.createVariable('stopGeneration', 0)
  const parameterValueIndex = stage.createVariable('parameterValueIndex', 0)
  const parameterChunkIndex = stage.createVariable('parameterChunkIndex', 0)
  const parametersLoaded = stage.createVariable('parametersLoaded', 0)
  const parameterParsedValue = stage.createVariable('parameterParsedValue', 0)
  const parameterValueReady = stage.createVariable('parameterValueReady', 0)
  const parameterValueText = stage.createVariable('parameterValueText', '')

  const setTokenizerStatus = (...parts: unknown[]) =>
    setVariableTo(status, concatText('tokenizing: ', ...parts))

  const hideRuntimeUi = defineProcedure(
    [procedureLabel('hide runtime ui')],
    () => {
      hideVariable(status)
      hideVariable(generatedCount)
      hideVariable(maxOutputTokensSetting)
      hideList(conversationView)
      return undefined
    },
    true,
  )

  const showRuntimeUi = defineProcedure(
    [procedureLabel('show runtime ui')],
    () => {
      showVariable(status)
      showVariable(generatedCount)
      showVariable(maxOutputTokensSetting)
      showList(conversationView)
      return undefined
    },
    true,
  )

  const showParameterImportUi = defineProcedure(
    [procedureLabel('show parameter import ui')],
    () => {
      callProcedure(hideRuntimeUi, {})
      setVariableTo(parametersLoaded, 0)
      setVariableTo(
        status,
        concatText(
          'Import ',
          PARAMETER_SOURCE_FILE_NAME,
          ' into ',
          parameterSource.name,
          ' (',
          PARAMETER_SOURCE_CHUNK_COUNT,
          ' items), then press space',
        ),
      )
      return undefined
    },
    true,
  )

  const resetParameterParser = defineProcedure(
    [procedureLabel('reset parameter parser')],
    () => {
      setVariableTo(parameterChunkIndex, 1)
      setVariableTo(workingText, getItemOfList(parameterSource, 1))
      setVariableTo(charIndex, 1)
      setVariableTo(parameterValueIndex, 0)
      setVariableTo(parameterValueText, '')
      return undefined
    },
    true,
  )

  const readNextParameterValue = defineProcedure(
    [procedureLabel('read next parameter value')],
    () => {
      setVariableTo(parameterValueReady, 0)
      setVariableTo(parameterValueText, '')
      repeatUntil(equals(read(parameterValueReady), 1), () => {
        ifElse(
          gt(read(charIndex), length(read(workingText))),
          () => {
            ifElse(
              gt(length(read(parameterValueText)), 0),
              () => {
                setVariableTo(
                  parameterParsedValue,
                  add(0, read(parameterValueText)),
                )
                setVariableTo(parameterValueReady, 1)
                changeVariableBy(parameterValueIndex, 1)
                setVariableTo(parameterValueText, '')
              },
              () => {
                ifElse(
                  lt(read(parameterChunkIndex), lengthOfList(parameterSource)),
                  () => {
                    changeVariableBy(parameterChunkIndex, 1)
                    setVariableTo(
                      workingText,
                      getItemOfList(parameterSource, read(parameterChunkIndex)),
                    )
                    setVariableTo(charIndex, 1)
                  },
                  () => {
                    setVariableTo(status, 'Parameter parse ended early')
                    stop('this script')
                  },
                )
              },
            )
          },
          () => {
            setVariableTo(currentChar, letterOf(read(charIndex), read(workingText)))
            ifElse(
              equals(read(currentChar), '/'),
              () => {
                ifThen(gt(length(read(parameterValueText)), 0), () => {
                  setVariableTo(
                    parameterParsedValue,
                    add(0, read(parameterValueText)),
                  )
                  setVariableTo(parameterValueReady, 1)
                  changeVariableBy(parameterValueIndex, 1)
                  setVariableTo(parameterValueText, '')
                })
              },
              () => {
                setVariableTo(
                  parameterValueText,
                  join(read(parameterValueText), read(currentChar)),
                )
              },
            )
            changeVariableBy(charIndex, 1)
          },
        )
      })
      return undefined
    },
    true,
  )

  const expandParametersIntoTensorLists = defineProcedure(
    [procedureLabel('expand parameters into tensor lists')],
    () => {
      ifElse(
        equals(read(parametersLoaded), 1),
        () => {},
        () => {
          ifElse(
            and(
              gt(lengthOfList(parameterSource), 0),
              lt(lengthOfList(parameterSource), add(PARAMETER_SOURCE_CHUNK_COUNT, 1)),
            ),
            () => {
              callProcedure(showRuntimeUi, {})
              setVariableTo(generatedCount, 0)
              setVariableTo(status, 'Expanding parameters')
              callProcedure(resetParameterParser, {})
              for (const tensorEntry of runtime.tensors) {
                const runtimeTensor = tensor(tensorEntry.name)
                deleteAllOfList(runtimeTensor.ref)
                forEach(outputIndex, tensorEntry.length, () => {
                  callProcedure(readNextParameterValue, {})
                  addToList(runtimeTensor.ref, read(parameterParsedValue))
                })
              }
              ifElse(
                equals(read(parameterValueIndex), TOTAL_PARAMETER_VALUES),
                () => {
                  hideList(parameterSource)
                  setVariableTo(parametersLoaded, 1)
                  setVariableTo(status, 'Waiting for prompt')
                },
                () => {
                  callProcedure(showParameterImportUi, {})
                },
              )
            },
            () => {
              callProcedure(showParameterImportUi, {})
            },
          )
        },
      )
      return undefined
    },
    true,
  )

  const resolveAsciiLetterByteLookupIndex = defineProcedure(
    [
      procedureLabel('resolve ascii letter byte lookup index'),
      procedureStringOrNumber('char'),
    ],
    ({ char }) => {
      const charValue = asString(char.getter())
      setVariableTo(byteLookupIndex, 0)
      switchBackdropTo(CASE_LOOKUP_BLANK_NAME)
      switchBackdropTo(charValue)
      setVariableTo(caseLookupBackdropNumber, getBackdropNumberName('number'))
      ifThen(
        equals(read(caseLookupBackdropNumber), CASE_LOOKUP_BLANK_NUMBER),
        () => {
          switchBackdropTo(join(charValue, CASE_LOOKUP_LOWER_SUFFIX))
          setVariableTo(
            caseLookupBackdropNumber,
            getBackdropNumberName('number'),
          )
        },
      )
      ifThen(
        gt(read(caseLookupBackdropNumber), CASE_LOOKUP_BLANK_NUMBER),
        () => {
          ifElse(
            lt(read(caseLookupBackdropNumber), CASE_LOOKUP_LOWER_START_NUMBER),
            () => {
              setVariableTo(
                byteLookupIndex,
                add(
                  read(caseLookupBackdropNumber),
                  CASE_LOOKUP_UPPER_BYTE_LIST_OFFSET,
                ),
              )
            },
            () => {
              setVariableTo(
                byteLookupIndex,
                add(
                  read(caseLookupBackdropNumber),
                  CASE_LOOKUP_LOWER_BYTE_LIST_OFFSET,
                ),
              )
            },
          )
        },
      )
      return undefined
    },
    true,
  )

  const clearFixedList = (
    list: ListReference,
    size: number,
    loopVariable: VariableReference,
  ) => {
    forEach(loopVariable, size, () => {
      replaceItemOfList(list, read(loopVariable), 0)
    })
  }

  const copyVector = (
    destination: ListReference,
    source: ListReference,
    size: number,
    loopVariable: VariableReference,
  ) => {
    forEach(loopVariable, size, () => {
      replaceItemOfList(
        destination,
        read(loopVariable),
        getItemOfList(source, read(loopVariable)),
      )
    })
  }

  const emitRmsNorm = (
    destination: ListReference,
    source: ListReference,
    weight: RuntimeTensor,
    size: number,
  ) => {
    setVariableTo(sumValue, 0)
    forEach(outputIndex, size, () => {
      changeVariableBy(
        sumValue,
        multiply(
          getItemOfList(source, read(outputIndex)),
          getItemOfList(source, read(outputIndex)),
        ),
      )
    })
    setVariableTo(
      scaleValue,
      divide(1, mathop('sqrt', add(divide(read(sumValue), size), RMS_EPSILON))),
    )
    forEach(outputIndex, size, () => {
      replaceItemOfList(
        destination,
        read(outputIndex),
        multiply(
          multiply(getItemOfList(source, read(outputIndex)), read(scaleValue)),
          tensorItem(weight, read(outputIndex)),
        ),
      )
    })
  }

  const emitMatVec = (
    destination: ListReference,
    source: ListReference,
    weight: RuntimeTensor,
    outputWidth: number,
    inputWidth: number,
  ) => {
    forEach(outputIndex, outputWidth, () => {
      setVariableTo(sumValue, 0)
      forEach(inputIndex, inputWidth, () => {
        changeVariableBy(
          sumValue,
          multiply(
            tensorItem(
              weight,
              outputIndexForToken(
                read(outputIndex),
                read(inputIndex),
                inputWidth,
              ),
            ),
            getItemOfList(source, read(inputIndex)),
          ),
        )
      })
      replaceItemOfList(destination, read(outputIndex), read(sumValue))
    })
  }

  const emitWeightedResidual = (
    destination: ListReference,
    base: ListReference,
    update: ListReference,
    weight: RuntimeTensor,
    size: number,
  ) => {
    forEach(outputIndex, size, () => {
      replaceItemOfList(
        destination,
        read(outputIndex),
        add(
          multiply(
            tensorItem(weight, read(outputIndex)),
            getItemOfList(base, read(outputIndex)),
          ),
          getItemOfList(update, read(outputIndex)),
        ),
      )
    })
  }

  const emitSiluTimes = (
    destination: ListReference,
    gate: ListReference,
    up: ListReference,
    size: number,
  ) => {
    forEach(outputIndex, size, () => {
      setVariableTo(sumValue, getItemOfList(gate, read(outputIndex)))
      replaceItemOfList(
        destination,
        read(outputIndex),
        multiply(
          multiply(
            read(sumValue),
            divide(1, add(1, mathop('e ^', multiply(-1, read(sumValue))))),
          ),
          getItemOfList(up, read(outputIndex)),
        ),
      )
    })
  }

  const emitMoeExpertMix = (
    destination: ListReference,
    source: ListReference,
    routerGate: RuntimeTensor,
    downEmbed: RuntimeTensor,
    upEmbed: RuntimeTensor,
  ) => {
    forEach(moeKeyIndex, MOE_NUM_KEYS, () => {
      setVariableTo(sumValue, 0)
      forEach(outputIndex, HIDDEN_SIZE, () => {
        changeVariableBy(
          sumValue,
          multiply(
            tensorItem(
              routerGate,
              outputIndexForToken(
                read(moeKeyIndex),
                read(outputIndex),
                HIDDEN_SIZE,
              ),
            ),
            getItemOfList(source, read(outputIndex)),
          ),
        )
      })
      replaceItemOfList(moeRouterX, read(moeKeyIndex), read(sumValue))

      setVariableTo(sumValue, 0)
      forEach(outputIndex, HIDDEN_SIZE, () => {
        changeVariableBy(
          sumValue,
          multiply(
            tensorItem(
              routerGate,
              outputIndexForToken(
                add(read(moeKeyIndex), MOE_NUM_KEYS),
                read(outputIndex),
                HIDDEN_SIZE,
              ),
            ),
            getItemOfList(source, read(outputIndex)),
          ),
        )
      })
      replaceItemOfList(moeRouterY, read(moeKeyIndex), read(sumValue))
    })

    forEach(moeTopRank, MOE_TOP_K, () => {
      replaceItemOfList(moeTopScores, read(moeTopRank), NEGATIVE_INFINITY)
      replaceItemOfList(moeTopIndices, read(moeTopRank), 0)
    })

    forEach(moeXIndex, MOE_NUM_KEYS, () => {
      forEach(moeYIndex, MOE_NUM_KEYS, () => {
        setVariableTo(
          currentScore,
          add(
            getItemOfList(moeRouterX, read(moeXIndex)),
            getItemOfList(moeRouterY, read(moeYIndex)),
          ),
        )
        setVariableTo(
          currentTokenId,
          add(
            multiply(add(read(moeXIndex), -1), MOE_NUM_KEYS),
            add(read(moeYIndex), -1),
          ),
        )
        ifThen(
          gt(read(currentScore), getItemOfList(moeTopScores, MOE_TOP_K)),
          () => {
            replaceItemOfList(moeTopScores, MOE_TOP_K, read(currentScore))
            replaceItemOfList(moeTopIndices, MOE_TOP_K, read(currentTokenId))
            setVariableTo(moeTopRank, MOE_TOP_K)
            repeatUntil(equals(read(moeTopRank), 1), () => {
              ifElse(
                gt(
                  getItemOfList(moeTopScores, read(moeTopRank)),
                  getItemOfList(moeTopScores, add(read(moeTopRank), -1)),
                ),
                () => {
                  setVariableTo(
                    lowValue,
                    getItemOfList(moeTopScores, read(moeTopRank)),
                  )
                  setVariableTo(
                    highValue,
                    getItemOfList(moeTopScores, add(read(moeTopRank), -1)),
                  )
                  replaceItemOfList(
                    moeTopScores,
                    read(moeTopRank),
                    read(highValue),
                  )
                  replaceItemOfList(
                    moeTopScores,
                    add(read(moeTopRank), -1),
                    read(lowValue),
                  )
                  setVariableTo(
                    leftTokenId,
                    getItemOfList(moeTopIndices, read(moeTopRank)),
                  )
                  setVariableTo(
                    rightTokenId,
                    getItemOfList(moeTopIndices, add(read(moeTopRank), -1)),
                  )
                  replaceItemOfList(
                    moeTopIndices,
                    read(moeTopRank),
                    read(rightTokenId),
                  )
                  replaceItemOfList(
                    moeTopIndices,
                    add(read(moeTopRank), -1),
                    read(leftTokenId),
                  )
                  changeVariableBy(moeTopRank, -1)
                },
                () => {
                  setVariableTo(moeTopRank, 1)
                },
              )
            })
          },
        )
      })
    })

    setVariableTo(maxScore, NEGATIVE_INFINITY)
    forEach(moeTopRank, MOE_TOP_K, () => {
      ifThen(
        gt(getItemOfList(moeTopScores, read(moeTopRank)), read(maxScore)),
        () => {
          setVariableTo(maxScore, getItemOfList(moeTopScores, read(moeTopRank)))
        },
      )
    })

    setVariableTo(sumValue, 0)
    forEach(moeTopRank, MOE_TOP_K, () => {
      setVariableTo(
        currentScore,
        mathop(
          'e ^',
          subtract(
            getItemOfList(moeTopScores, read(moeTopRank)),
            read(maxScore),
          ),
        ),
      )
      replaceItemOfList(moeTopScores, read(moeTopRank), read(currentScore))
      changeVariableBy(sumValue, read(currentScore))
    })

    clearFixedList(destination, HIDDEN_SIZE, outputIndex)
    forEach(moeTopRank, MOE_TOP_K, () => {
      setVariableTo(
        currentWeight,
        divide(getItemOfList(moeTopScores, read(moeTopRank)), read(sumValue)),
      )
      setVariableTo(
        currentTokenId,
        getItemOfList(moeTopIndices, read(moeTopRank)),
      )
      setVariableTo(dotValue, 0)
      forEach(outputIndex, HIDDEN_SIZE, () => {
        changeVariableBy(
          dotValue,
          multiply(
            tensorItem(
              downEmbed,
              add(
                multiply(read(currentTokenId), HIDDEN_SIZE),
                read(outputIndex),
              ),
            ),
            getItemOfList(source, read(outputIndex)),
          ),
        )
      })
      setVariableTo(
        currentScore,
        multiply(
          multiply(
            read(dotValue),
            divide(1, add(1, mathop('e ^', multiply(-1, read(dotValue))))),
          ),
          read(currentWeight),
        ),
      )
      forEach(outputIndex, HIDDEN_SIZE, () => {
        replaceItemOfList(
          destination,
          read(outputIndex),
          add(
            getItemOfList(destination, read(outputIndex)),
            multiply(
              read(currentScore),
              tensorItem(
                upEmbed,
                add(
                  multiply(read(currentTokenId), HIDDEN_SIZE),
                  read(outputIndex),
                ),
              ),
            ),
          ),
        )
      })
    })
  }

  const emitRotaryForQAndK = (position: ReturnType<typeof read> | number) => {
    for (let head = 1; head <= NUM_HEADS; head += 1) {
      forEach(outputIndex, HALF_HEAD_DIM, () => {
        setVariableTo(
          lowValue,
          getItemOfList(qVector, qIndex(head, read(outputIndex))),
        )
        setVariableTo(
          highValue,
          getItemOfList(
            qVector,
            add(qIndex(head, read(outputIndex)), HALF_HEAD_DIM),
          ),
        )
        setVariableTo(
          cosValue,
          getItemOfList(
            runtime.tokenizerLists.ropeCos,
            ropeIndex(position, read(outputIndex)),
          ),
        )
        setVariableTo(
          sinValue,
          getItemOfList(
            runtime.tokenizerLists.ropeSin,
            ropeIndex(position, read(outputIndex)),
          ),
        )
        replaceItemOfList(
          qVector,
          qIndex(head, read(outputIndex)),
          subtract(
            multiply(read(lowValue), read(cosValue)),
            multiply(read(highValue), read(sinValue)),
          ),
        )
        replaceItemOfList(
          qVector,
          add(qIndex(head, read(outputIndex)), HALF_HEAD_DIM),
          add(
            multiply(read(highValue), read(cosValue)),
            multiply(read(lowValue), read(sinValue)),
          ),
        )
      })
    }

    for (let head = 1; head <= NUM_KEY_VALUE_HEADS; head += 1) {
      forEach(outputIndex, HALF_HEAD_DIM, () => {
        setVariableTo(lowValue, getItemOfList(kVector, kvIndex(head, read(outputIndex))))
        setVariableTo(
          highValue,
          getItemOfList(
            kVector,
            add(kvIndex(head, read(outputIndex)), HALF_HEAD_DIM),
          ),
        )
        setVariableTo(
          cosValue,
          getItemOfList(
            runtime.tokenizerLists.ropeCos,
            ropeIndex(position, read(outputIndex)),
          ),
        )
        setVariableTo(
          sinValue,
          getItemOfList(
            runtime.tokenizerLists.ropeSin,
            ropeIndex(position, read(outputIndex)),
          ),
        )
        replaceItemOfList(
          kVector,
          kvIndex(head, read(outputIndex)),
          subtract(
            multiply(read(lowValue), read(cosValue)),
            multiply(read(highValue), read(sinValue)),
          ),
        )
        replaceItemOfList(
          kVector,
          add(kvIndex(head, read(outputIndex)), HALF_HEAD_DIM),
          add(
            multiply(read(highValue), read(cosValue)),
            multiply(read(lowValue), read(sinValue)),
          ),
        )
      })
    }
  }

  const emitAttentionHead = (
    headNumber: number,
    scoreList: ListReference,
    outputList: ListReference,
    layerIndex: number,
    position: ReturnType<typeof read> | number,
  ) => {
    const layer = layers[layerIndex]!
    const keyCache = keyCaches[layerIndex]!
    const valueCache = valueCaches[layerIndex]!
    const keyValueHeadNumber =
      Math.floor((headNumber - 1) / NUM_KEY_VALUE_GROUPS) + 1
    setVariableTo(maxScore, NEGATIVE_INFINITY)
    forEach(positionIndex, add(position, 1), () => {
      setVariableTo(dotValue, 0)
      forEach(outputIndex, HEAD_DIM, () => {
        changeVariableBy(
          dotValue,
          multiply(
            getItemOfList(qVector, qIndex(headNumber, read(outputIndex))),
            getItemOfList(
              keyCache,
              kvCacheIndex(
                add(read(positionIndex), -1),
                kvIndex(keyValueHeadNumber, read(outputIndex)),
              ),
            ),
          ),
        )
      })

      setVariableTo(dtValue, 0)
      forEach(outputIndex, KEY_VALUE_HIDDEN_SIZE, () => {
        changeVariableBy(
          dtValue,
          multiply(
            tensorItem(
              layer.dtProj,
              outputIndexForToken(
                headNumber,
                read(outputIndex),
                KEY_VALUE_HIDDEN_SIZE,
              ),
            ),
            getItemOfList(
              valueCache,
              kvCacheIndex(add(read(positionIndex), -1), read(outputIndex)),
            ),
          ),
        )
      })

      setVariableTo(
        currentScore,
        add(
          multiply(read(dotValue), ATTENTION_SCALE),
          mathop(
            'e ^',
            multiply(
              tensorItem(layer.attnA, headNumber),
              mathop('ln', add(1, mathop('e ^', read(dtValue)))),
            ),
          ),
        ),
      )
      replaceItemOfList(scoreList, read(positionIndex), read(currentScore))
      ifThen(gt(read(currentScore), read(maxScore)), () => {
        setVariableTo(maxScore, read(currentScore))
      })
    })

    setVariableTo(sumValue, 0)
    forEach(positionIndex, add(position, 1), () => {
      setVariableTo(
        currentScore,
        mathop(
          'e ^',
          subtract(
            getItemOfList(scoreList, read(positionIndex)),
            read(maxScore),
          ),
        ),
      )
      replaceItemOfList(scoreList, read(positionIndex), read(currentScore))
      changeVariableBy(sumValue, read(currentScore))
    })

    clearFixedList(outputList, HEAD_DIM, outputIndex)
    forEach(positionIndex, add(position, 1), () => {
      setVariableTo(
        currentWeight,
        divide(getItemOfList(scoreList, read(positionIndex)), read(sumValue)),
      )
      forEach(outputIndex, HEAD_DIM, () => {
        replaceItemOfList(
          outputList,
          read(outputIndex),
          add(
            getItemOfList(outputList, read(outputIndex)),
            multiply(
              read(currentWeight),
              getItemOfList(
                valueCache,
                kvCacheIndex(
                  add(read(positionIndex), -1),
                  kvIndex(keyValueHeadNumber, read(outputIndex)),
                ),
              ),
            ),
          ),
        )
      })
    })
  }

  const encodeChunk = defineProcedure(
    [procedureLabel('encode chunk'), procedureStringOrNumber('chunk')],
    ({ chunk }) => {
      const chunkValue = asString(chunk.getter())
      ifThen(
        and(not(equals(chunkValue, '')), equals(read(tokenizationError), 0)),
        () => {
          deleteAllOfList(chunkTokenIds)
          setTokenizerStatus(
            'chunk ',
            read(chunkIndex),
            ' chars ',
            read(chunkStartIndex),
            '-',
            read(chunkEndIndex),
            '/',
            read(promptCharCount),
            ' len ',
            read(chunkCharCount),
            ' promptTokens ',
            lengthOfList(promptTokenIds),
            ' byteScan',
          )
          forEach(charIndex, length(chunkValue), () => {
            setVariableTo(currentChar, letterOf(read(charIndex), chunkValue))
            ifElse(
              or(isLower(read(currentChar)), isUpper(read(currentChar))),
              () => {
                callProcedure(resolveAsciiLetterByteLookupIndex, {
                  [resolveAsciiLetterByteLookupIndex.reference.arguments.char
                    .id]: read(currentChar),
                })
              },
              () => {
                setVariableTo(
                  byteLookupIndex,
                  getItemNumOfList(
                    runtime.tokenizerLists.byteDecoder,
                    read(currentChar),
                  ),
                )
              },
            )
            ifElse(
              gt(read(byteLookupIndex), 0),
              () => {
                addToList(
                  chunkTokenIds,
                  getItemOfList(
                    runtime.tokenizerLists.byteTokenIds,
                    read(byteLookupIndex),
                  ),
                )
              },
              () => {
                setVariableTo(tokenizationError, 1)
                setVariableTo(
                  status,
                  concatText(
                    'tokenizing: error unsupported char global ',
                    add(read(chunkStartIndex), add(read(charIndex), -1)),
                    '/',
                    read(promptCharCount),
                    ' chunk ',
                    read(chunkIndex),
                    ' char ',
                    read(charIndex),
                    '/',
                    read(chunkCharCount),
                  ),
                )
              },
            )
          })

          repeatUntil(
            or(
              equals(read(tokenizationError), 1),
              lt(lengthOfList(chunkTokenIds), 2),
            ),
            () => {
              setVariableTo(bestPairIndex, 0)
              setVariableTo(bestPairRank, 999999999)
              setVariableTo(mergedTokenId, 0)
              changeVariableBy(mergeCount, 1)
              setTokenizerStatus(
                'chunk ',
                read(chunkIndex),
                ' chars ',
                read(chunkStartIndex),
                '-',
                read(chunkEndIndex),
                '/',
                read(promptCharCount),
                ' merge ',
                read(mergeCount),
                ' symbols ',
                lengthOfList(chunkTokenIds),
                ' promptTokens ',
                lengthOfList(promptTokenIds),
              )
              forEach(
                chunkTokenIndex,
                add(lengthOfList(chunkTokenIds), -1),
                () => {
                  setVariableTo(
                    leftTokenId,
                    getItemOfList(chunkTokenIds, read(chunkTokenIndex)),
                  )
                  setVariableTo(
                    rowStartIndex,
                    getItemOfList(
                      runtime.tokenizerLists.mergeRowStarts,
                      add(read(leftTokenId), 1),
                    ),
                  )
                  ifThen(gt(read(rowStartIndex), 0), () => {
                    setVariableTo(
                      rightTokenId,
                      getItemOfList(
                        chunkTokenIds,
                        add(read(chunkTokenIndex), 1),
                      ),
                    )
                    setVariableTo(
                      rowEndIndex,
                      getItemOfList(
                        runtime.tokenizerLists.mergeRowEnds,
                        add(read(leftTokenId), 1),
                      ),
                    )
                    forEach(
                      mergeLookupIndex,
                      add(subtract(read(rowEndIndex), read(rowStartIndex)), 1),
                      () => {
                        setVariableTo(
                          pairLookupIndex,
                          add(
                            read(rowStartIndex),
                            add(read(mergeLookupIndex), -1),
                          ),
                        )
                        ifThen(
                          and(
                            equals(
                              getItemOfList(
                                runtime.tokenizerLists.mergeRightIds,
                                read(pairLookupIndex),
                              ),
                              read(rightTokenId),
                            ),
                            lt(
                              getItemOfList(
                                runtime.tokenizerLists.mergeRanks,
                                read(pairLookupIndex),
                              ),
                              read(bestPairRank),
                            ),
                          ),
                          () => {
                            setVariableTo(
                              bestPairRank,
                              getItemOfList(
                                runtime.tokenizerLists.mergeRanks,
                                read(pairLookupIndex),
                              ),
                            )
                            setVariableTo(bestPairIndex, read(chunkTokenIndex))
                            setVariableTo(
                              mergedTokenId,
                              getItemOfList(
                                runtime.tokenizerLists.mergeResultIds,
                                read(pairLookupIndex),
                              ),
                            )
                          },
                        )
                      },
                    )
                  })
                },
              )
              ifElse(
                gt(read(bestPairIndex), 0),
                () => {
                  replaceItemOfList(
                    chunkTokenIds,
                    read(bestPairIndex),
                    read(mergedTokenId),
                  )
                  deleteOfList(chunkTokenIds, add(read(bestPairIndex), 1))
                },
                () => {
                  stop('this script')
                },
              )
            },
          )

          forEach(chunkTokenIndex, lengthOfList(chunkTokenIds), () => {
            addToList(
              promptTokenIds,
              getItemOfList(chunkTokenIds, read(chunkTokenIndex)),
            )
          })
          setTokenizerStatus(
            'chunk ',
            read(chunkIndex),
            ' done chars ',
            read(chunkStartIndex),
            '-',
            read(chunkEndIndex),
            '/',
            read(promptCharCount),
            ' merges ',
            read(mergeCount),
            ' addedTokens ',
            lengthOfList(chunkTokenIds),
            ' totalTokens ',
            lengthOfList(promptTokenIds),
          )
        },
      )
      return undefined
    },
    true,
  )

  const appendTextToPrompt = defineProcedure(
    [procedureLabel('append text to prompt'), procedureStringOrNumber('text')],
    ({ text }) => {
      const promptText = asString(text.getter())
      setVariableTo(chunkIndex, 0)
      setVariableTo(promptCharCount, length(promptText))
      setVariableTo(positionIndex, 1)
      repeatUntil(
        or(
          gt(read(positionIndex), length(promptText)),
          equals(read(tokenizationError), 1),
        ),
        () => {
          setVariableTo(chunkStartIndex, read(positionIndex))
          setVariableTo(currentChar, letterOf(read(positionIndex), promptText))
          setVariableTo(
            nextChar,
            letterOf(add(read(positionIndex), 1), promptText),
          )
          setVariableTo(
            thirdChar,
            letterOf(add(read(positionIndex), 2), promptText),
          )
          setVariableTo(workingText, '')

          ifElse(
            and(
              equals(read(currentChar), "'"),
              or(
                contains('sStTmMdD', read(nextChar)),
                or(
                  and(
                    contains('rR', read(nextChar)),
                    contains('eE', read(thirdChar)),
                  ),
                  or(
                    and(
                      contains('vV', read(nextChar)),
                      contains('eE', read(thirdChar)),
                    ),
                    and(
                      contains('lL', read(nextChar)),
                      contains('lL', read(thirdChar)),
                    ),
                  ),
                ),
              ),
            ),
            () => {
              ifElse(
                contains('sStTmMdD', read(nextChar)),
                () => {
                  setVariableTo(workingText, join("'", read(nextChar)))
                  changeVariableBy(positionIndex, 2)
                },
                () => {
                  setVariableTo(
                    workingText,
                    join(join("'", read(nextChar)), read(thirdChar)),
                  )
                  changeVariableBy(positionIndex, 3)
                },
              )
            },
            () => {
              ifElse(
                or(
                  isLetter(read(currentChar)),
                  and(
                    isPunctuation(read(currentChar)),
                    isLetter(read(nextChar)),
                  ),
                ),
                () => {
                  ifThen(
                    and(
                      isPunctuation(read(currentChar)),
                      isLetter(read(nextChar)),
                    ),
                    () => {
                      setVariableTo(workingText, read(currentChar))
                      changeVariableBy(positionIndex, 1)
                    },
                  )
                  repeatUntil(
                    or(
                      gt(read(positionIndex), length(promptText)),
                      not(isLetter(letterOf(read(positionIndex), promptText))),
                    ),
                    () => {
                      setVariableTo(
                        workingText,
                        join(
                          asString(read(workingText)),
                          letterOf(read(positionIndex), promptText),
                        ),
                      )
                      changeVariableBy(positionIndex, 1)
                    },
                  )
                },
                () => {
                  ifElse(
                    isDigit(read(currentChar)),
                    () => {
                      repeatUntil(
                        or(
                          gt(read(positionIndex), length(promptText)),
                          or(
                            equals(length(asString(read(workingText))), 3),
                            not(
                              isDigit(
                                letterOf(read(positionIndex), promptText),
                              ),
                            ),
                          ),
                        ),
                        () => {
                          setVariableTo(
                            workingText,
                            join(
                              asString(read(workingText)),
                              letterOf(read(positionIndex), promptText),
                            ),
                          )
                          changeVariableBy(positionIndex, 1)
                        },
                      )
                    },
                    () => {
                      ifElse(
                        and(
                          isSpace(read(currentChar)),
                          isPunctuation(read(nextChar)),
                        ),
                        () => {
                          setVariableTo(workingText, read(currentChar))
                          changeVariableBy(positionIndex, 1)
                          repeatUntil(
                            or(
                              gt(read(positionIndex), length(promptText)),
                              not(
                                isPunctuation(
                                  letterOf(read(positionIndex), promptText),
                                ),
                              ),
                            ),
                            () => {
                              setVariableTo(
                                workingText,
                                join(
                                  asString(read(workingText)),
                                  letterOf(read(positionIndex), promptText),
                                ),
                              )
                              changeVariableBy(positionIndex, 1)
                            },
                          )
                          repeatUntil(
                            or(
                              gt(read(positionIndex), length(promptText)),
                              not(
                                isNewline(
                                  letterOf(read(positionIndex), promptText),
                                ),
                              ),
                            ),
                            () => {
                              setVariableTo(
                                workingText,
                                join(
                                  asString(read(workingText)),
                                  letterOf(read(positionIndex), promptText),
                                ),
                              )
                              changeVariableBy(positionIndex, 1)
                            },
                          )
                        },
                        () => {
                          ifElse(
                            isPunctuation(read(currentChar)),
                            () => {
                              repeatUntil(
                                or(
                                  gt(read(positionIndex), length(promptText)),
                                  not(
                                    isPunctuation(
                                      letterOf(read(positionIndex), promptText),
                                    ),
                                  ),
                                ),
                                () => {
                                  setVariableTo(
                                    workingText,
                                    join(
                                      asString(read(workingText)),
                                      letterOf(read(positionIndex), promptText),
                                    ),
                                  )
                                  changeVariableBy(positionIndex, 1)
                                },
                              )
                              repeatUntil(
                                or(
                                  gt(read(positionIndex), length(promptText)),
                                  not(
                                    isNewline(
                                      letterOf(read(positionIndex), promptText),
                                    ),
                                  ),
                                ),
                                () => {
                                  setVariableTo(
                                    workingText,
                                    join(
                                      asString(read(workingText)),
                                      letterOf(read(positionIndex), promptText),
                                    ),
                                  )
                                  changeVariableBy(positionIndex, 1)
                                },
                              )
                            },
                            () => {
                              setVariableTo(workingText, read(currentChar))
                              changeVariableBy(positionIndex, 1)
                              repeatUntil(
                                or(
                                  gt(read(positionIndex), length(promptText)),
                                  not(
                                    or(
                                      isSpace(
                                        letterOf(
                                          read(positionIndex),
                                          promptText,
                                        ),
                                      ),
                                      isNewline(
                                        letterOf(
                                          read(positionIndex),
                                          promptText,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                () => {
                                  setVariableTo(
                                    workingText,
                                    join(
                                      asString(read(workingText)),
                                      letterOf(read(positionIndex), promptText),
                                    ),
                                  )
                                  changeVariableBy(positionIndex, 1)
                                },
                              )
                            },
                          )
                        },
                      )
                    },
                  )
                },
              )
            },
          )

          setVariableTo(chunkEndIndex, add(read(positionIndex), -1))
          setVariableTo(chunkCharCount, length(asString(read(workingText))))
          changeVariableBy(chunkIndex, 1)
          setVariableTo(mergeCount, 0)
          callProcedure(encodeChunk, {
            [encodeChunk.reference.arguments.chunk.id]: read(workingText),
          })
        },
      )
      return undefined
    },
    true,
  )

  const appendAssistantHeader = defineProcedure(
    [procedureLabel('append assistant header')],
    () => {
      forEach(
        tokenIndex,
        lengthOfList(runtime.tokenizerLists.templateSuffix),
        () => {
          addToList(
            promptTokenIds,
            getItemOfList(
              runtime.tokenizerLists.templateSuffix,
              read(tokenIndex),
            ),
          )
        },
      )
      return undefined
    },
    true,
  )

  const appendUserHeader = defineProcedure(
    [procedureLabel('append user header')],
    () => {
      addToList(promptTokenIds, END_OF_TEXT_TOKEN_ID)
      callProcedure(appendTextToPrompt, {
        [appendTextToPrompt.reference.arguments.text.id]: '\n\n',
      })
      addToList(promptTokenIds, START_HEADER_TOKEN_ID)
      callProcedure(appendTextToPrompt, {
        [appendTextToPrompt.reference.arguments.text.id]: 'user',
      })
      addToList(promptTokenIds, END_HEADER_TOKEN_ID)
      callProcedure(appendTextToPrompt, {
        [appendTextToPrompt.reference.arguments.text.id]: '\n',
      })
      return undefined
    },
    true,
  )

  const buildPromptFromConversation = defineProcedure(
    [procedureLabel('build prompt from conversation')],
    () => {
      deleteAllOfList(promptTokenIds)
      setVariableTo(tokenizationError, 0)
      setTokenizerStatus(
        'building prompt turns ',
        lengthOfList(conversationTurns),
      )

      forEach(
        tokenIndex,
        lengthOfList(runtime.tokenizerLists.templatePrefix),
        () => {
          addToList(
            promptTokenIds,
            getItemOfList(
              runtime.tokenizerLists.templatePrefix,
              read(tokenIndex),
            ),
          )
        },
      )

      forEach(conversationTurnIndex, lengthOfList(conversationTurns), () => {
        ifThen(gt(read(conversationTurnIndex), 1), () => {
          ifElse(
            equals(mod(read(conversationTurnIndex), 2), 1),
            () => {
              callProcedure(appendUserHeader, {})
            },
            () => {
              callProcedure(appendAssistantHeader, {})
            },
          )
        })
        callProcedure(appendTextToPrompt, {
          [appendTextToPrompt.reference.arguments.text.id]: getItemOfList(
            conversationTurns,
            read(conversationTurnIndex),
          ),
        })
      })

      callProcedure(appendAssistantHeader, {})
      ifThen(equals(read(tokenizationError), 0), () => {
        setTokenizerStatus(
          'done turns ',
          lengthOfList(conversationTurns),
          ' totalTokens ',
          lengthOfList(promptTokenIds),
        )
      })
      return undefined
    },
    true,
  )

  const layerProcedures = layers.map((layer, layerIndex) =>
    defineProcedure(
      [
        procedureLabel(`layer ${layerIndex}`),
        procedureStringOrNumber('position'),
      ],
      ({ position }) => {
        const positionValue = asNumber(position.getter())
        copyVector(residual, hidden, HIDDEN_SIZE, outputIndex)
        emitRmsNorm(norm, hidden, layer.preLayerNorm, HIDDEN_SIZE)
        emitMatVec(qVector, norm, layer.qProj, HIDDEN_SIZE, HIDDEN_SIZE)
        emitMatVec(
          kVector,
          norm,
          layer.kProj,
          KEY_VALUE_HIDDEN_SIZE,
          HIDDEN_SIZE,
        )
        emitMatVec(
          vVector,
          norm,
          layer.vProj,
          KEY_VALUE_HIDDEN_SIZE,
          HIDDEN_SIZE,
        )
        emitRotaryForQAndK(positionValue)

        forEach(outputIndex, KEY_VALUE_HIDDEN_SIZE, () => {
          replaceItemOfList(
            keyCaches[layerIndex]!,
            kvCacheIndex(positionValue, read(outputIndex)),
            getItemOfList(kVector, read(outputIndex)),
          )
          replaceItemOfList(
            valueCaches[layerIndex]!,
            kvCacheIndex(positionValue, read(outputIndex)),
            getItemOfList(vVector, read(outputIndex)),
          )
        })

        for (let head = 1; head <= NUM_HEADS; head += 1) {
          emitAttentionHead(
            head,
            attnScoreLists[head - 1]!,
            attnHeadOutputs[head - 1]!,
            layerIndex,
            positionValue,
          )

          forEach(outputIndex, HEAD_DIM, () => {
            replaceItemOfList(
              attnContext,
              add(multiply(head - 1, HEAD_DIM), read(outputIndex)),
              getItemOfList(attnHeadOutputs[head - 1]!, read(outputIndex)),
            )
          })
        }

        emitMatVec(work256, attnContext, layer.oProj, HIDDEN_SIZE, HIDDEN_SIZE)
        emitWeightedResidual(
          hidden,
          residual,
          work256,
          layer.preResidual,
          HIDDEN_SIZE,
        )

        copyVector(residual, hidden, HIDDEN_SIZE, outputIndex)
        emitRmsNorm(norm, hidden, layer.postLayerNorm, HIDDEN_SIZE)
        emitMatVec(
          mlpGate,
          norm,
          layer.gateProj,
          INTERMEDIATE_SIZE,
          HIDDEN_SIZE,
        )
        emitMatVec(mlpUp, norm, layer.upProj, INTERMEDIATE_SIZE, HIDDEN_SIZE)
        emitSiluTimes(mlpInter, mlpGate, mlpUp, INTERMEDIATE_SIZE)
        emitMatVec(
          work256,
          mlpInter,
          layer.downProj,
          HIDDEN_SIZE,
          INTERMEDIATE_SIZE,
        )
        if (IS_MOE) {
          emitMoeExpertMix(
            moeExpertState,
            norm,
            layer.routerGate!,
            layer.downEmbed!,
            layer.upEmbed!,
          )
          forEach(outputIndex, HIDDEN_SIZE, () => {
            replaceItemOfList(
              work256,
              read(outputIndex),
              add(
                getItemOfList(work256, read(outputIndex)),
                getItemOfList(moeExpertState, read(outputIndex)),
              ),
            )
          })
        }
        emitWeightedResidual(
          hidden,
          residual,
          work256,
          layer.postResidual,
          HIDDEN_SIZE,
        )
        return undefined
      },
      true,
    ),
  )

  const runStep = defineProcedure(
    [
      procedureLabel('run step'),
      procedureStringOrNumber('token'),
      procedureStringOrNumber('position'),
      procedureBoolean('computeLogits'),
    ],
    ({ token, position, computeLogits }) => {
      const tokenValue = asNumber(token.getter())
      forEach(outputIndex, HIDDEN_SIZE, () => {
        replaceItemOfList(
          hidden,
          read(outputIndex),
          tensorItem(
            embeddingWeight,
            add(multiply(tokenValue, HIDDEN_SIZE), read(outputIndex)),
          ),
        )
      })

      for (const layerProcedure of layerProcedures) {
        callProcedure(layerProcedure, {
          [layerProcedure.reference.arguments.position.id]: position.getter(),
        })
      }

      ifThen(computeLogits.getter(), () => {
        emitRmsNorm(norm, hidden, finalLayerNormWeight, HIDDEN_SIZE)
        setVariableTo(bestLogit, NEGATIVE_INFINITY)
        setVariableTo(nextTokenId, 0)
        forEach(vocabIndex, runtime.model.vocab_size, () => {
          setVariableTo(sumValue, 0)
          forEach(outputIndex, HIDDEN_SIZE, () => {
            changeVariableBy(
              sumValue,
              multiply(
                tensorItem(
                  embeddingWeight,
                  outputIndexForToken(
                    read(vocabIndex),
                    read(outputIndex),
                    HIDDEN_SIZE,
                  ),
                ),
                getItemOfList(norm, read(outputIndex)),
              ),
            )
          })
          ifThen(gt(read(sumValue), read(bestLogit)), () => {
            setVariableTo(bestLogit, read(sumValue))
            setVariableTo(nextTokenId, add(read(vocabIndex), -1))
          })
        })
      })
      return undefined
    },
    true,
  )

  const appendTokenToOutput = defineProcedure(
    [
      procedureLabel('append token to output'),
      procedureStringOrNumber('token'),
    ],
    ({ token }) => {
      setVariableTo(currentTokenId, asNumber(token.getter()))
      ifThen(not(equals(read(currentTokenId), EOS_TOKEN_ID)), () => {
        setVariableTo(
          workingText,
          getItemOfList(
            runtime.tokenizerLists.inverseVocab,
            add(read(currentTokenId), 1),
          ),
        )
        forEach(charIndex, length(read(workingText)), () => {
          setVariableTo(
            currentChar,
            letterOf(read(charIndex), read(workingText)),
          )
          ifElse(
            or(isLower(read(currentChar)), isUpper(read(currentChar))),
            () => {
              callProcedure(resolveAsciiLetterByteLookupIndex, {
                [resolveAsciiLetterByteLookupIndex.reference.arguments.char.id]:
                  read(currentChar),
              })
            },
            () => {
              setVariableTo(
                byteLookupIndex,
                getItemNumOfList(
                  runtime.tokenizerLists.byteEncoder,
                  read(currentChar),
                ),
              )
            },
          )
          ifElse(
            gt(read(byteLookupIndex), 0),
            () => {
              setVariableTo(
                outputText,
                join(
                  read(outputText),
                  getItemOfList(
                    runtime.tokenizerLists.byteDecoder,
                    read(byteLookupIndex),
                  ),
                ),
              )
            },
            () => {
              setVariableTo(
                outputText,
                join(read(outputText), read(currentChar)),
              )
            },
          )
        })
      })
      return undefined
    },
    true,
  )

  const _decodeOutput = defineProcedure(
    [procedureLabel('decode output')],
    () => {
      setVariableTo(outputText, '')
      forEach(tokenIndex, lengthOfList(generatedTokenIds), () => {
        callProcedure(appendTokenToOutput, {
          [appendTokenToOutput.reference.arguments.token.id]: getItemOfList(
            generatedTokenIds,
            read(tokenIndex),
          ),
        })
      })
      return undefined
    },
    true,
  )

  const appendConversationLine = defineProcedure(
    [
      procedureLabel('append conversation line'),
      procedureStringOrNumber('label'),
      procedureStringOrNumber('text'),
    ],
    ({ label, text }) => {
      addToList(
        conversationView,
        join(asString(label.getter()), asString(text.getter())),
      )
      return undefined
    },
    true,
  )

  const syncAssistantConversationLine = defineProcedure(
    [procedureLabel('sync assistant conversation line')],
    () => {
      ifThen(gt(read(assistantLineIndex), 0), () => {
        replaceItemOfList(
          conversationView,
          read(assistantLineIndex),
          join(ASSISTANT_LABEL, read(outputText)),
        )
      })
      return undefined
    },
    true,
  )

  const generate = defineProcedure(
    [procedureLabel('generate')],
    () => {
      deleteAllOfList(generatedTokenIds)
      setVariableTo(generatedCount, 0)
      setVariableTo(stopGeneration, 0)
      setVariableTo(outputText, '')
      callProcedure(syncAssistantConversationLine, {})
      setVariableTo(status, 'Prefilling transformer')
      setVariableTo(promptLength, lengthOfList(promptTokenIds))

      forEach(tokenIndex, read(promptLength), () => {
        setVariableTo(
          currentTokenId,
          getItemOfList(promptTokenIds, read(tokenIndex)),
        )
        callProcedure(runStep, {
          [runStep.reference.arguments.token.id]: read(currentTokenId),
          [runStep.reference.arguments.position.id]: add(read(tokenIndex), -1),
          [runStep.reference.arguments.computeLogits.id]: equals(
            read(tokenIndex),
            read(promptLength),
          ),
        })
      })

      setVariableTo(currentPosition, read(promptLength))
      setVariableTo(
        remainingTokenBudget,
        subtract(MAX_TOTAL_TOKENS, read(promptLength)),
      )
      ifElse(
        gt(read(maxOutputTokensSetting), read(remainingTokenBudget)),
        () => {
          setVariableTo(maxOutputTokens, read(remainingTokenBudget))
        },
        () => {
          setVariableTo(maxOutputTokens, read(maxOutputTokensSetting))
        },
      )
      setVariableTo(
        status,
        concatText(
          'Greedy decoding ',
          lengthOfList(generatedTokenIds),
          '/',
          read(maxOutputTokens),
          ' tokens',
        ),
      )
      repeatUntil(
        or(
          equals(read(stopGeneration), 1),
          gt(lengthOfList(generatedTokenIds), add(read(maxOutputTokens), -1)),
        ),
        () => {
          addToList(generatedTokenIds, read(nextTokenId))
          setVariableTo(generatedCount, lengthOfList(generatedTokenIds))
          callProcedure(appendTokenToOutput, {
            [appendTokenToOutput.reference.arguments.token.id]:
              read(nextTokenId),
          })
          callProcedure(syncAssistantConversationLine, {})
          setVariableTo(
            status,
            concatText(
              'Greedy decoding ',
              lengthOfList(generatedTokenIds),
              '/',
              read(maxOutputTokens),
              ' tokens',
            ),
          )
          ifElse(
            equals(read(nextTokenId), EOS_TOKEN_ID),
            () => {
              setVariableTo(stopGeneration, 1)
            },
            () => {
              callProcedure(runStep, {
                [runStep.reference.arguments.token.id]: read(nextTokenId),
                [runStep.reference.arguments.position.id]:
                  read(currentPosition),
                [runStep.reference.arguments.computeLogits.id]: true,
              })
              changeVariableBy(currentPosition, 1)
            },
          )
        },
      )

      setVariableTo(status, 'Done')
      return undefined
    },
    true,
  )

  const runChatSession = defineProcedure(
    [procedureLabel('run chat session')],
    () => {
      setVariableTo(status, 'Waiting for prompt')
      repeatUntil(equals(read(stopChat), 1), () => {
        setVariableTo(status, 'Waiting for prompt')
        askAndWait('You (blank to end chat)')
        ifElse(
          equals(length(getAnswer()), 0),
          () => {
            setVariableTo(status, 'Chat ended')
            setVariableTo(stopChat, 1)
          },
          () => {
            ifThen(
              equals(getAnswer(), NEW_CHAT_COMMAND),
              () => {
                deleteAllOfList(promptTokenIds)
                deleteAllOfList(generatedTokenIds)
                deleteAllOfList(conversationTurns)
                deleteAllOfList(conversationView)
                setVariableTo(outputText, '')
                setVariableTo(assistantLineIndex, 0)
                setVariableTo(generatedCount, 0)
                setVariableTo(
                  status,
                  'Context reset',
                )
              },
            )
            ifThen(
              not(equals(getAnswer(), NEW_CHAT_COMMAND)),
              () => {
                addToList(conversationTurns, getAnswer())
                callProcedure(appendConversationLine, {
                  [appendConversationLine.reference.arguments.label.id]:
                    USER_LABEL,
                  [appendConversationLine.reference.arguments.text.id]:
                    getAnswer(),
                })
                callProcedure(buildPromptFromConversation, {})
                ifThen(equals(read(tokenizationError), 1), () => {
                  stop('this script')
                })
                ifThen(
                  gt(lengthOfList(promptTokenIds), runtime.limits.maxPromptTokens),
                  () => {
                    setVariableTo(
                      status,
                      concatText(
                        'Prompt too long ',
                        lengthOfList(promptTokenIds),
                        '/',
                        runtime.limits.maxPromptTokens,
                        ' tokens',
                      ),
                    )
                    stop('this script')
                  },
                )
                callProcedure(appendConversationLine, {
                  [appendConversationLine.reference.arguments.label.id]:
                    ASSISTANT_LABEL,
                  [appendConversationLine.reference.arguments.text.id]: '',
                })
                setVariableTo(assistantLineIndex, lengthOfList(conversationView))
                callProcedure(generate, {})
                addToList(conversationTurns, read(outputText))
                setVariableTo(assistantLineIndex, 0)
              },
            )
          },
        )
      })
      return undefined
    },
    true,
  )

  whenFlagClicked(() => {
    setVariableTo(outputText, '')
    setVariableTo(stopChat, 0)
    setVariableTo(chatStarted, 0)
    setVariableTo(assistantLineIndex, 0)
    setVariableTo(generatedCount, 0)
    deleteAllOfList(promptTokenIds)
    deleteAllOfList(generatedTokenIds)
    deleteAllOfList(conversationTurns)
    deleteAllOfList(conversationView)
    ifElse(
      equals(read(parametersLoaded), 1),
      () => {
        hideList(parameterSource)
        callProcedure(showRuntimeUi, {})
        setVariableTo(chatStarted, 1)
        setVariableTo(status, 'Waiting for prompt')
        callProcedure(runChatSession, {})
      },
      () => {
        callProcedure(showParameterImportUi, {})
      },
    )
  })

  whenKeyPressed('space', () => {
    callProcedure(expandParametersIntoTensorLists, {})
    ifThen(
      and(equals(read(parametersLoaded), 1), equals(read(chatStarted), 0)),
      () => {
        setVariableTo(chatStarted, 1)
        callProcedure(runChatSession, {})
      },
    )
  })
})

export default withInjectedStageLists(
  project,
  runtime.staticStageLists,
  runtime.emitBuildAssets,
)
