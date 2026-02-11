import { InputType as RawInputType, Shadow as RawShadow } from 'sb3-types/enum'

const toNumericEnum = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (normalized.length === 0) {
      return fallback
    }
    const parsed = Number(normalized)
    if (Number.isInteger(parsed)) {
      return parsed
    }
  }
  return fallback
}

const shadow = RawShadow as unknown as Record<string, unknown>
const inputType = RawInputType as unknown as Record<string, unknown>

export const Shadow = {
  SameBlockShadow: toNumericEnum(
    shadow.SameBlockShadow ?? shadow.UnObscured,
    1,
  ) as 1,
  NoShadow: toNumericEnum(shadow.NoShadow ?? shadow.No, 2) as 2,
  DiffBlockShadow: toNumericEnum(
    shadow.DiffBlockShadow ?? shadow.Obscured,
    3,
  ) as 3,
} as const

export const InputType = {
  Number: toNumericEnum(inputType.Number, 4) as 4,
  PositiveInteger: toNumericEnum(
    inputType.PositiveInteger ?? inputType.PossiveInteger,
    6,
  ) as 6,
  String: toNumericEnum(inputType.String, 10) as 10,
  Broadcast: toNumericEnum(inputType.Broadcast, 11) as 11,
} as const
