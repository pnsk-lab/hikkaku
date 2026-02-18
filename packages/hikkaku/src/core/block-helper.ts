import type * as sb3 from 'sb3-types'
import { getRootContext } from './composer'
import { InputType, Shadow } from './sb3-enum'
import type {
  CostumeReference,
  CostumeSource,
  HikkakuBlock,
  PrimitiveAvailableOnScratch,
  PrimitiveSource,
  SoundReference,
  SoundSource,
} from './types'

// Helper function to check if a block is a shadow block
function isShadowBlock(blockId: string): boolean {
  try {
    const ctx = getRootContext()
    const block = ctx.blocks[blockId]
    return block ? block.shadow : false
  } catch {
    return false
  }
}

// Overload signatures
export function fromPrimitiveSource<T extends PrimitiveAvailableOnScratch>(
  inputType: (typeof InputType)[keyof typeof InputType],
  source: PrimitiveSource<T>,
  defaultValue?: T,
): sb3.Input
export function fromPrimitiveSource<T extends PrimitiveAvailableOnScratch>(
  source: PrimitiveSource<T>,
): sb3.Input

// Implementation
export function fromPrimitiveSource<T extends PrimitiveAvailableOnScratch>(
  inputTypeOrSource:
    | (typeof InputType)[keyof typeof InputType]
    | PrimitiveSource<T>,
  sourceOrUndefined?: PrimitiveSource<T>,
  defaultValue?: T,
): sb3.Input {
  // Determine if we're using the new signature or old signature
  const isNewSignature = typeof inputTypeOrSource === 'number'
  const inputType = isNewSignature ? inputTypeOrSource : undefined
  const source = isNewSignature
    ? (sourceOrUndefined as PrimitiveSource<T>)
    : (inputTypeOrSource as PrimitiveSource<T>)

  if (typeof source === 'number') {
    return [Shadow.SameBlockShadow, [InputType.Number, source]]
  }
  if (typeof source === 'boolean') {
    // 不思議に見えますが、内部ではPositiveIntegerで扱われてます
    return [Shadow.SameBlockShadow, [InputType.PositiveInteger, source ? 1 : 0]]
  }
  if (typeof source === 'string') {
    return [Shadow.SameBlockShadow, [InputType.String, source]]
  }

  // When source is a HikkakuBlock
  if (isHikkakuBlock(source)) {
    // Check if this is a shadow block (like menu blocks)
    if (isShadowBlock(source.id)) {
      // Shadow blocks should use SameBlockShadow (preserve existing behavior for menus)
      return [Shadow.SameBlockShadow, source.id]
    }

    // If inputType is provided (new signature), use it to create proper shadow
    if (inputType !== undefined) {
      const def =
        defaultValue !== undefined ? defaultValue : getDefaultValue(inputType)
      return [Shadow.DiffBlockShadow, source.id, [inputType, def]]
    }

    // Old signature with non-shadow block: use Number as default
    // This provides backward compatibility while fixing the bug block issue
    return [Shadow.DiffBlockShadow, source.id, [InputType.Number, 0]]
  }

  // Fallback
  return [Shadow.SameBlockShadow, source.id]
}

// Helper function to get default values for each InputType
function getDefaultValue(
  inputType: (typeof InputType)[keyof typeof InputType],
): PrimitiveAvailableOnScratch {
  switch (inputType) {
    case InputType.Number:
    case InputType.PositiveInteger:
      return 0
    case InputType.String:
    case InputType.Broadcast:
      return ''
    case InputType.Color:
      return '#000000'
    default:
      return 0
  }
}

export const fromPrimitiveSourceColor = (
  color: PrimitiveSource<`#${string}` | (string & {})>,
): sb3.Input => {
  return fromPrimitiveSource(InputType.Color, color, '#000000')
}

export const unwrapCostumeSource = (
  source: CostumeSource,
): PrimitiveSource<string> => {
  if (isCostumeReference(source)) {
    return source.name
  }

  return source
}

export const unwrapSoundSource = (
  source: SoundSource,
): PrimitiveSource<string> => {
  if (isSoundReference(source)) {
    return source.name
  }

  return source
}

export const isHikkakuBlock = (block: unknown): block is HikkakuBlock => {
  return (
    typeof block === 'object' &&
    block !== null &&
    'isBlock' in block &&
    block.isBlock === true &&
    'id' in block &&
    typeof block.id === 'string'
  )
}

export const menuInput = <T extends PrimitiveAvailableOnScratch>(
  source: PrimitiveSource<T>,
  createMenu: (source?: T) => HikkakuBlock,
): sb3.Input => {
  if (isHikkakuBlock(source)) {
    const shadow = createMenu()
    return [Shadow.DiffBlockShadow, source.id, shadow.id]
  }

  const menu = createMenu(source)
  return fromPrimitiveSource(menu)
}

export const isCostumeReference = (
  source: unknown,
): source is CostumeReference => {
  return (
    typeof source === 'object' &&
    source !== null &&
    'type' in source &&
    source.type === 'costume'
  )
}

export const isSoundReference = (source: unknown): source is SoundReference => {
  return (
    typeof source === 'object' &&
    source !== null &&
    'type' in source &&
    source.type === 'sound'
  )
}
