import type { SlmConfig, TokenizerRuntimeMetadata } from './types'

interface TokenizerJSON {
  readonly model: {
    readonly vocab: Record<string, number>
    readonly merges: readonly [string, string][]
  }
  readonly added_tokens: ReadonlyArray<{
    readonly id: number
    readonly content: string
    readonly special: boolean
  }>
}

const TOKENIZER_REGEX =
  /('s|'t|'re|'ve|'m|'ll|'d)|[^\r\n\p{L}\p{N}]?\p{L}+|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n]*|\s*[\r\n]+|\s+(?!\S)|\s+/giu

const range = (from: number, toInclusive: number) =>
  Array.from({ length: toInclusive - from + 1 }, (_, index) => from + index)

export const createByteLevelMap = (): {
  encoder: string[]
  decoder: string[]
} => {
  const bytes = [
    ...range('!'.charCodeAt(0), '~'.charCodeAt(0)),
    ...range(0xa1, 0xac),
    ...range(0xae, 0xff),
  ]
  const chars = [...bytes]
  let next = 0
  for (let byte = 0; byte < 256; byte += 1) {
    if (bytes.includes(byte)) {
      continue
    }
    bytes.push(byte)
    chars.push(256 + next)
    next += 1
  }

  const encoder = Array<string>(256)
  const decoder = Array<string>(256)
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index]
    const charCode = chars[index]
    if (byte === undefined || charCode === undefined) {
      continue
    }
    encoder[byte] = String.fromCodePoint(charCode)
    decoder[byte] = String.fromCodePoint(byte)
  }
  return { encoder, decoder }
}

const utf8Encode = (text: string) => new TextEncoder().encode(text)

const findMergeForPair = (
  leftId: number,
  rightId: number,
  runtime: Pick<TokenizerRuntimeMetadata, 'bpeLookup'>,
) => {
  const rowStart = runtime.bpeLookup.mergeRowStarts[leftId]
  const rowEnd = runtime.bpeLookup.mergeRowEnds[leftId]
  if (
    rowStart === undefined ||
    rowEnd === undefined ||
    rowStart === 0 ||
    rowEnd === 0
  ) {
    return null
  }

  for (let cursor = rowStart - 1; cursor <= rowEnd - 1; cursor += 1) {
    if (runtime.bpeLookup.mergeRightIds[cursor] !== rightId) {
      continue
    }
    const rank = runtime.bpeLookup.mergeRanks[cursor]
    const resultId = runtime.bpeLookup.mergeResultIds[cursor]
    if (rank === undefined || resultId === undefined) {
      continue
    }
    return { rank, resultId }
  }
  return null
}

export const encodeOrdinaryText = (
  text: string,
  runtime: Pick<TokenizerRuntimeMetadata, 'byteTokenIds' | 'bpeLookup'>,
): number[] => {
  const tokenIds: number[] = []
  for (const match of text.matchAll(TOKENIZER_REGEX)) {
    const raw = match[0]
    if (!raw) {
      continue
    }
    const symbolIds = Array.from(utf8Encode(raw), (byte) => {
      const tokenId = runtime.byteTokenIds[byte]
      if (tokenId === undefined) {
        throw new Error(`Missing byte token id for byte ${byte}`)
      }
      return tokenId
    })

    while (symbolIds.length > 1) {
      let bestRank = Number.POSITIVE_INFINITY
      let bestIndex = -1
      let bestMergedId = -1
      for (let index = 0; index < symbolIds.length - 1; index += 1) {
        const left = symbolIds[index]
        const right = symbolIds[index + 1]
        if (left === undefined || right === undefined) {
          continue
        }
        const merge = findMergeForPair(left, right, runtime)
        if (merge && merge.rank < bestRank) {
          bestRank = merge.rank
          bestIndex = index
          bestMergedId = merge.resultId
        }
      }
      if (bestIndex < 0 || bestMergedId < 0) {
        break
      }
      symbolIds.splice(bestIndex, 2, bestMergedId)
    }

    for (const tokenId of symbolIds) {
      tokenIds.push(tokenId)
    }
  }
  return tokenIds
}

export const decodeTokensToText = (
  tokenIds: readonly number[],
  runtime: Pick<
    TokenizerRuntimeMetadata,
    'vocabById' | 'byteEncoder' | 'byteDecoder'
  >,
): string => {
  const decoderBySymbol = new Map<string, string>()
  runtime.byteEncoder.forEach((symbol, index) => {
    const raw = runtime.byteDecoder[index]
    if (symbol !== undefined && raw !== undefined) {
      decoderBySymbol.set(symbol, raw)
    }
  })

  let text = ''
  for (const tokenId of tokenIds) {
    const piece = runtime.vocabById[tokenId]
    if (piece === undefined) {
      throw new Error(`Unknown token id: ${tokenId}`)
    }
    if (piece.startsWith('<|') && piece.endsWith('|>')) {
      text += piece
      continue
    }
    const bytes: number[] = []
    for (const symbol of Array.from(piece)) {
      const raw = decoderBySymbol.get(symbol)
      if (raw === undefined) {
        throw new Error(
          `Unknown byte decoder symbol: ${JSON.stringify(symbol)}`,
        )
      }
      bytes.push(raw.codePointAt(0) ?? 0)
    }
    text += new TextDecoder().decode(new Uint8Array(bytes))
  }
  return text
}

const buildChatTemplatePrefix = (dateString: string, systemMessage: string) =>
  [
    '<|begin_of_text|>',
    '<|start_header_id|>system<|end_header_id|>\n',
    `Cutting Knowledge Date: December 2024\n`,
    `Today Date: ${dateString}\n`,
    systemMessage,
    '<|end_of_text|>\n\n',
    '<|start_header_id|>user<|end_header_id|>\n',
  ].join('')

const buildChatTemplateSuffix = () =>
  [
    '<|end_of_text|>\n\n',
    '<|start_header_id|>assistant<|end_header_id|>\n',
  ].join('')

const specialIds = (tokenizer: TokenizerJSON) =>
  Object.fromEntries(
    tokenizer.added_tokens
      .filter((token) => token.special)
      .map((token) => [token.content, token.id]),
  )

const createBpeLookup = (
  tokenizer: TokenizerJSON,
  vocabById: readonly string[],
  byteEncoder: readonly string[],
) => {
  const vocabIdByPiece = new Map<string, number>()
  vocabById.forEach((piece, id) => {
    if (piece !== undefined) {
      vocabIdByPiece.set(piece, id)
    }
  })

  const byteTokenIds = byteEncoder.map((piece, byte) => {
    const tokenId = vocabIdByPiece.get(piece)
    if (tokenId === undefined) {
      throw new Error(`Missing token id for byte encoder piece ${byte}`)
    }
    return tokenId
  })

  const mergeEntriesByLeftId = new Map<
    number,
    Array<{ rightId: number; resultId: number; rank: number }>
  >()
  tokenizer.model.merges.forEach(([left, right], rank) => {
    const leftId = vocabIdByPiece.get(left)
    const rightId = vocabIdByPiece.get(right)
    const resultId = vocabIdByPiece.get(`${left}${right}`)
    if (
      leftId === undefined ||
      rightId === undefined ||
      resultId === undefined
    ) {
      throw new Error(
        `Failed to resolve merge ids for ${JSON.stringify([left, right])}`,
      )
    }
    const row = mergeEntriesByLeftId.get(leftId) ?? []
    row.push({ rightId, resultId, rank })
    mergeEntriesByLeftId.set(leftId, row)
  })

  const mergeRowStarts = Array<number>(vocabById.length).fill(0)
  const mergeRowEnds = Array<number>(vocabById.length).fill(0)
  const mergeRightIds: number[] = []
  const mergeResultIds: number[] = []
  const mergeRanks: number[] = []

  for (let leftId = 0; leftId < vocabById.length; leftId += 1) {
    const row = mergeEntriesByLeftId.get(leftId)
    if (!row || row.length === 0) {
      continue
    }
    mergeRowStarts[leftId] = mergeRightIds.length + 1
    for (const entry of row) {
      mergeRightIds.push(entry.rightId)
      mergeResultIds.push(entry.resultId)
      mergeRanks.push(entry.rank)
    }
    mergeRowEnds[leftId] = mergeRightIds.length
  }

  return {
    byteTokenIds,
    bpeLookup: {
      mergeRowStarts,
      mergeRowEnds,
      mergeRightIds,
      mergeResultIds,
      mergeRanks,
    },
  }
}

export const createTokenizerRuntimeMetadata = (
  tokenizer: TokenizerJSON,
  config: SlmConfig,
  limits: {
    maxPromptTokens: number
    maxNewTokens: number
    maxTotalTokens: number
  },
): TokenizerRuntimeMetadata => {
  const { encoder, decoder } = createByteLevelMap()
  const vocabById = Array<string>(config.vocab_size)
  for (const [piece, id] of Object.entries(tokenizer.model.vocab)) {
    vocabById[id] = piece
  }
  const { byteTokenIds, bpeLookup } = createBpeLookup(
    tokenizer,
    vocabById,
    encoder,
  )

  const defaultDateString = 'December 2024'
  const defaultSystemMessage = ''
  const runtimeBase = {
    pattern: TOKENIZER_REGEX.source,
    byteEncoder: encoder,
    byteDecoder: decoder,
    byteTokenIds,
    vocabById,
    bpeLookup,
    specialTokens: specialIds(tokenizer),
    chatTemplate: {
      defaultDateString,
      defaultSystemMessage,
      prefixIds: [] as number[],
      suffixIds: [] as number[],
    },
    ropeTables: {
      cos: [] as number[],
      sin: [] as number[],
      positions: limits.maxTotalTokens,
      headDim: config.hidden_size / config.num_attention_heads,
    },
  } satisfies TokenizerRuntimeMetadata

  runtimeBase.chatTemplate.prefixIds = tokenizeTemplateText(
    buildChatTemplatePrefix(defaultDateString, defaultSystemMessage),
    runtimeBase,
    runtimeBase.specialTokens,
  )
  runtimeBase.chatTemplate.suffixIds = tokenizeTemplateText(
    buildChatTemplateSuffix(),
    runtimeBase,
    runtimeBase.specialTokens,
  )

  const rope = createRopeTables(config, limits.maxTotalTokens)
  runtimeBase.ropeTables = rope
  return runtimeBase
}

const tokenizeTemplateText = (
  text: string,
  runtime: Pick<TokenizerRuntimeMetadata, 'byteTokenIds' | 'bpeLookup'>,
  specialTokenIds: Record<string, number>,
) => {
  const orderedSpecialTokens = Object.keys(specialTokenIds).sort(
    (left, right) => right.length - left.length,
  )
  const result: number[] = []
  let cursor = 0
  while (cursor < text.length) {
    let matched = false
    for (const special of orderedSpecialTokens) {
      if (!text.startsWith(special, cursor)) {
        continue
      }
      result.push(specialTokenIds[special] ?? 0)
      cursor += special.length
      matched = true
      break
    }
    if (matched) {
      continue
    }
    let next = cursor + 1
    while (next < text.length) {
      const specialAhead = orderedSpecialTokens.some((special) =>
        text.startsWith(special, next),
      )
      if (specialAhead) {
        break
      }
      next += 1
    }
    result.push(...encodeOrdinaryText(text.slice(cursor, next), runtime))
    cursor = next
  }
  return result
}

const createRopeTables = (config: SlmConfig, positions: number) => {
  const headDim = config.hidden_size / config.num_attention_heads
  const half = headDim / 2
  const cos: number[] = []
  const sin: number[] = []
  for (let position = 0; position < positions; position += 1) {
    for (let index = 0; index < half; index += 1) {
      const invFreq = 1 / config.rope_theta ** ((2 * index) / headDim)
      const angle = position * invFreq
      const cosValue = Math.cos(angle)
      const sinValue = Math.sin(angle)
      cos.push(cosValue)
      sin.push(sinValue)
    }
    for (let index = 0; index < half; index += 1) {
      const src = position * headDim + index
      cos.push(cos[src] ?? 0)
      sin.push(sin[src] ?? 0)
    }
  }
  return {
    cos,
    sin,
    positions,
    headDim,
  }
}
