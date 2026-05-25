export type SafetensorsDType = 'F32' | 'BF16' | 'F16'

export interface SlmConfig {
  readonly attention_dropout?: number
  readonly bos_token_id: number
  readonly dynamic_mask_ratio: number
  readonly eos_token_id: number
  readonly expert_retrieval_size?: number
  readonly hidden_act: string
  readonly hidden_bias: boolean
  readonly hidden_dropout: number
  readonly hidden_size: number
  readonly initializer_range: number
  readonly intermediate_size: number
  readonly is_moe: boolean
  readonly keep_window_size?: number
  readonly max_position_embeddings: number
  readonly model_type: string
  readonly num_attention_heads: number
  readonly num_cdmoe_experts?: number
  readonly num_cdmoe_experts_per_head?: number
  readonly num_cdmoe_heads?: number
  readonly num_experts?: number
  readonly num_experts_per_tok?: number
  readonly num_hidden_layers: number
  readonly num_key_value_heads: number
  readonly pad_token_id: number
  readonly rms_norm_eps: number
  readonly rope_scaling?: {
    readonly factor: number
    readonly original_max_position_embeddings: number
    readonly rope_type: string
  }
  readonly rope_theta: number
  readonly tie_word_embeddings: boolean
  readonly torch_dtype?: string
  readonly use_cache: boolean
  readonly vocab_size: number
}

export interface SafetensorsTensorEntry {
  readonly name: string
  readonly dtype: SafetensorsDType
  readonly shape: readonly number[]
  readonly data_offsets: readonly [number, number]
}

export interface TensorRuntimeEntry {
  readonly name: string
  readonly dtype: SafetensorsDType
  readonly shape: readonly number[]
  readonly length: number
  readonly listId: string
  readonly listName: string
}

export interface ModelRuntimeMetadata {
  readonly model: SlmConfig
  readonly limits: {
    readonly maxPromptTokens: number
    readonly maxNewTokens: number
    readonly maxTotalTokens: number
  }
  readonly tensors: readonly TensorRuntimeEntry[]
}

export interface TokenizerRuntimeMetadata {
  readonly pattern: string
  readonly byteEncoder: readonly string[]
  readonly byteDecoder: readonly string[]
  readonly byteTokenIds: readonly number[]
  readonly vocabById: readonly string[]
  readonly bpeLookup: {
    readonly mergeRowStarts: readonly number[]
    readonly mergeRowEnds: readonly number[]
    readonly mergeRightIds: readonly number[]
    readonly mergeResultIds: readonly number[]
    readonly mergeRanks: readonly number[]
  }
  readonly specialTokens: Record<string, number>
  readonly chatTemplate: {
    readonly defaultDateString: string
    readonly defaultSystemMessage: string
    readonly prefixIds: readonly number[]
    readonly suffixIds: readonly number[]
  }
  readonly ropeTables: {
    readonly cos: readonly number[]
    readonly sin: readonly number[]
    readonly positions: number
    readonly headDim: number
  }
}
