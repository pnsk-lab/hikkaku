import type * as sb3 from 'sb3-types'
import { InputType, Shadow } from 'sb3-types/enum'
import type {
  CostumeReference,
  CostumeSource,
  HikkakuBlock,
  PrimitiveAvailableOnScratch,
  PrimitiveSource,
  SoundReference,
  SoundSource,
} from './types'

export const fromPrimitiveSource = <T extends PrimitiveAvailableOnScratch>(
  source: PrimitiveSource<T>,
): sb3.Input => {
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

  return [Shadow.SameBlockShadow, source.id]
}
//TODO ちゃんとやる fromPrimitiveSourceごとリファクタする。fromPrimitiveSource(InputType.Color,source)みたいな感じで
export const fromPrimitiveSourceColor = (
  color: PrimitiveSource<`#${string}`>,
): sb3.Input => {
  if (typeof color === 'string') {
    return [Shadow.SameBlockShadow, [InputType.Color, color]]
  }
  return fromPrimitiveSource(color)
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
