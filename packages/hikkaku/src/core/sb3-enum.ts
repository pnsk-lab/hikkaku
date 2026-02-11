import {
  InputType as RawInputType,
  Shadow as RawShadow,
} from 'sb3-types/enum'

const shadow = RawShadow as unknown as Record<string, number>
const inputType = RawInputType as unknown as Record<string, number>

export const Shadow = {
  SameBlockShadow: (shadow.SameBlockShadow ?? shadow.UnObscured ?? 1) as 1,
  NoShadow: (shadow.NoShadow ?? shadow.No ?? 2) as 2,
  DiffBlockShadow: (shadow.DiffBlockShadow ?? shadow.Obscured ?? 3) as 3,
} as const

export const InputType = {
  Number: (inputType.Number ?? 4) as 4,
  PositiveInteger: (inputType.PositiveInteger ?? inputType.PossiveInteger ??
    6) as 6,
  String: (inputType.String ?? 10) as 10,
  Broadcast: (inputType.Broadcast ?? 11) as 11,
} as const
