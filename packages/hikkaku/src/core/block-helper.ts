import type * as sb3 from 'sb3-types'
import { InputType, Shadow } from 'sb3-types/enum'
import { getRootContext } from './composer'
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

// Helper function to get default values for each InputType
function getDefaultValue(inputType: InputType): PrimitiveAvailableOnScratch {
  switch (inputType) {
    case InputType.Number:
    case InputType.PositiveNumber:
    case InputType.WholeNumber:
    case InputType.Integer:
    case InputType.Angle:
      return 0
    case InputType.PositiveInteger:
      return 1
    case InputType.String:
    case InputType.Broadcast:
      return ''
    case InputType.Color:
      return '#000000'
    default:
      return 0
  }
}

export function fromPrimitiveSource<T extends PrimitiveAvailableOnScratch>(
  inputType: InputType,
  source: PrimitiveSource<T>,
  defaultValue?: T,
): sb3.Input {
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

    // Create proper shadow with specified InputType
    const def =
      defaultValue !== undefined ? defaultValue : getDefaultValue(inputType)
    return [Shadow.DiffBlockShadow, source.id, [inputType, def]]
  }

  // Fallback
  return [Shadow.SameBlockShadow, source.id]
}

// Special helper for boolean conditions - no primitive shadow support in Scratch
export function fromBooleanSource(source: PrimitiveSource<boolean>): sb3.Input {
  if (typeof source === 'boolean') {
    // Primitive boolean values are represented as PositiveInteger
    return [Shadow.SameBlockShadow, [InputType.PositiveInteger, source ? 1 : 0]]
  }

  // Boolean blocks should NOT have shadow primitives
  // Use SameBlockShadow without fallback
  if (isHikkakuBlock(source)) {
    return [Shadow.SameBlockShadow, source.id]
  }

  // Fallback
  return [Shadow.SameBlockShadow, source.id]
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
