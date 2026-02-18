import type * as sb3 from 'sb3-types'
import { InputType, Shadow } from 'sb3-types/enum'
import { getRootContext, valueBlock } from './composer'
import type {
  CostumeReference,
  CostumeSource,
  HikkakuBlock,
  PrimitiveAvailableOnScratch,
  PrimitiveSource,
  SoundReference,
  SoundSource,
} from './types'

// WARN: 本当にこれが意味をなしているかは不明。AIが勝手に書いたので恒偽の可能性があります。
// Helper function to check if a block is a shadow block
function isShadowBlock(blockId: string): boolean {
  try {
    const ctx = getRootContext()
    const block = ctx.blocks[blockId]
    return block?.shadow ?? false
  } catch {
    return false
  }
}

// Helper function to get default values for each InputType
function getDefaultValue(
  inputType: PrimitiveInputType,
): PrimitiveAvailableOnScratch {
  switch (inputType) {
    case InputType.Number:
    case InputType.PositiveNumber:
    case InputType.Integer:
      return 0
    case InputType.Angle:
      return 90
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
type MappingToPrimitive<T extends PrimitiveInputType> =
  T extends InputType.Number
    ? number
    : T extends InputType.PositiveNumber
      ? number
      : T extends InputType.Integer
        ? number
        : T extends InputType.Angle
          ? number
          : T extends InputType.PositiveInteger
            ? number
            : T extends InputType.String
              ? string | number
              : T extends InputType.Broadcast
                ? string
                : T extends InputType.Color
                  ? string
                  : never
type PrimitiveInputType = sb3.InputPrimitive['0']
export function fromPrimitiveSource<T extends PrimitiveInputType>(
  inputType: T,
  source: PrimitiveSource<MappingToPrimitive<T>>,
  defaultValue?: MappingToPrimitive<T>,
): sb3.Input {
  defaultValue =
    defaultValue ?? (getDefaultValue(inputType) as MappingToPrimitive<T>)

  // When source is a HikkakuBlock
  if (isHikkakuBlock(source)) {
    // Check if this is a shadow block (like menu blocks)
    if (isShadowBlock(source.id)) {
      // Shadow blocks should use SameBlockShadow (preserve existing behavior for menus)
      return [Shadow.SameBlockShadow, source.id]
    }

    // Create proper shadow with specified InputType
    return [
      Shadow.DiffBlockShadow,
      source.id,
      createInput(inputType, defaultValue),
    ]
  }
  return [Shadow.SameBlockShadow, createInput(inputType, source)]
}

function createInput(
  inputType: PrimitiveInputType,
  value: string | number,
): sb3.InputPrimitive {
  switch (inputType) {
    case InputType.Number:
    case InputType.PositiveNumber:
    case InputType.Integer:
    case InputType.Angle:
    case InputType.PositiveInteger:
      return [inputType, Number(value)]
    case InputType.String:
      return [inputType, String(value)]
    case InputType.Broadcast:
      return [inputType, String(value), String(value) /* id */]
    case InputType.Color:
      return [inputType, String(value) as `#${string}`]
    case InputType.Variable:
    case InputType.List:
      throw new Error('unimplemented')
    default:
      inputType satisfies never
      throw new Error(`Unsupported input type: ${inputType}`)
  }
}

// Special helper for boolean conditions - no primitive shadow support in Scratch
export function fromBooleanSource(source: PrimitiveSource<boolean>): sb3.Input {
  if (typeof source === 'boolean') {
    if (source === true) {
      const TRUE = valueBlock('operator_not', {})
      return [Shadow.SameBlockShadow, TRUE.id]
    } else {
      const FALSE = valueBlock('operator_and', {})
      return [Shadow.SameBlockShadow, FALSE.id]
    }
  }

  // Boolean blocks should NOT have shadow primitives
  return [Shadow.SameBlockShadow, source.id]
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
  return fromPrimitiveSource(InputType.String, menu)
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
