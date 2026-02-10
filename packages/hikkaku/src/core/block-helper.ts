import type * as sb3 from 'sb3-types'
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
    return [1, [4, source]]
  }
  if (typeof source === 'boolean') {
    return [1, [6, source ? 1 : 0]]
  }
  if (typeof source === 'string') {
    if (source.includes('\f')) {
      throw new Error('Form feed character is not supported in Scratch strings.')
    }
    return [1, [10, source]]
  }

  return [1, source.id]
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
