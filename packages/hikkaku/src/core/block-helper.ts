import type * as sb3 from 'sb3-types'
import { InputType, Shadow } from 'sb3-types/enum'
import type {
  CostumeSource,
  PrimitiveAvailableOnScratch,
  PrimitiveSource,
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

export const fromCostumeSource = (source: CostumeSource): sb3.Input => {
  if (
    typeof source === 'object' &&
    source !== null &&
    'type' in source &&
    source.type === 'costume'
  ) {
    return fromPrimitiveSource(source.name)
  }

  return fromPrimitiveSource(source as PrimitiveSource<string>)
}

export const fromSoundSource = (source: SoundSource): sb3.Input => {
  if (
    typeof source === 'object' &&
    source !== null &&
    'type' in source &&
    source.type === 'sound'
  ) {
    return fromPrimitiveSource(source.name)
  }

  return fromPrimitiveSource(source as PrimitiveSource<string>)
}
