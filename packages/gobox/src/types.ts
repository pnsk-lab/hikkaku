export type GoboxMemoryAtom = number | string

export interface GoboxType<TValue> {
  readonly width: number
  readonly defaults: GoboxMemoryAtom[]
  readonly __gobox_value?: TValue
}

interface GoboxTypeBase<TValue> extends GoboxType<TValue> {}

export interface GoboxNumberType extends GoboxTypeBase<number> {
  readonly tag: 'number'
  readonly initial: number
}

export interface GoboxStringType extends GoboxTypeBase<string> {
  readonly tag: 'string'
  readonly initial: string
}

export interface GoboxBooleanType extends GoboxTypeBase<boolean> {
  readonly tag: 'boolean'
  readonly initial: boolean
}

export interface GoboxVectorType<TElement extends GoboxTypeAny>
  extends GoboxTypeBase<Array<GoboxValueOf<TElement>>> {
  readonly tag: 'vector'
  readonly element: TElement
  readonly length: number
}

export interface GoboxStructType<TFields extends Record<string, GoboxTypeAny>>
  extends GoboxTypeBase<{ [K in keyof TFields]: GoboxValueOf<TFields[K]> }> {
  readonly tag: 'struct'
  readonly fields: TFields
  readonly fieldOrder: Array<Extract<keyof TFields, string>>
  readonly fieldOffsets: { [K in keyof TFields]: number }
}

export type GoboxNumberTypeFactory = {
  (initial?: number): GoboxNumberType
  new (initial?: number): GoboxNumberType
} & GoboxNumberType
export type GoboxStringTypeFactory = {
  (initial?: string): GoboxStringType
  new (initial?: string): GoboxStringType
} & GoboxStringType
export type GoboxBooleanTypeFactory = {
  (initial?: boolean): GoboxBooleanType
  new (initial?: boolean): GoboxBooleanType
} & GoboxBooleanType
export type GoboxPrimitiveTypeLike =
  | GoboxPrimitiveType
  | GoboxNumberTypeFactory
  | GoboxStringTypeFactory
  | GoboxBooleanTypeFactory

export type GoboxTypeAny =
  | GoboxNumberType
  | GoboxStringType
  | GoboxBooleanType
  | GoboxVectorType<GoboxTypeAny>
  | GoboxStructType<Record<string, GoboxTypeAny>>

export type GoboxPrimitiveType =
  | GoboxNumberType
  | GoboxStringType
  | GoboxBooleanType

export type GoboxTypeInitial<TType extends GoboxTypeAny> =
  TType extends GoboxNumberType
    ? number
    : TType extends GoboxStringType
      ? string
      : TType extends GoboxBooleanType
        ? boolean
        : TType extends GoboxVectorType<infer TElement>
          ? Array<GoboxTypeInitial<TElement>>
          : TType extends GoboxStructType<infer TFields>
            ? { [K in keyof TFields]?: GoboxTypeInitial<TFields[K]> }
            : never

export type GoboxStructInitial<TFields extends Record<string, GoboxTypeAny>> = {
  [K in keyof TFields]?: GoboxTypeInitial<TFields[K]>
}

export type GoboxStructTypeFactory<
  TFields extends Record<string, GoboxTypeAny>,
> = {
  (initial?: GoboxStructInitial<TFields>): GoboxStructType<TFields>
  new (initial?: GoboxStructInitial<TFields>): GoboxStructType<TFields>
} & GoboxStructType<TFields>

export type GoboxValueOf<TType extends GoboxTypeAny> =
  TType extends GoboxNumberType
    ? number
    : TType extends GoboxStringType
      ? string
      : TType extends GoboxBooleanType
        ? boolean
        : TType extends GoboxVectorType<infer TElement>
          ? Array<GoboxValueOf<TElement>>
          : TType extends GoboxStructType<infer TFields>
            ? { [K in keyof TFields]: GoboxValueOf<TFields[K]> }
            : never

export const Num = Object.assign(
  function Num(initial = 0): GoboxNumberType {
    return {
      tag: 'number',
      initial,
      width: 1,
      defaults: [initial],
    }
  },
  {
    tag: 'number',
    initial: 0,
    width: 1,
    defaults: [0],
  },
) as GoboxNumberTypeFactory

export const Str = Object.assign(
  function Str(initial = ''): GoboxStringType {
    return {
      tag: 'string',
      initial,
      width: 1,
      defaults: [initial],
    }
  },
  {
    tag: 'string',
    initial: '',
    width: 1,
    defaults: [''],
  },
) as GoboxStringTypeFactory

export const Bool = Object.assign(
  function Bool(initial = false): GoboxBooleanType {
    return {
      tag: 'boolean',
      initial,
      width: 1,
      defaults: [initial ? 1 : 0],
    }
  },
  {
    tag: 'boolean',
    initial: false,
    width: 1,
    defaults: [0],
  },
) as GoboxBooleanTypeFactory

export const vector = <TElement extends GoboxTypeAny>(
  element: TElement,
  length: number,
): GoboxVectorType<TElement> => {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error('vector length must be a non-negative integer')
  }
  const defaults: GoboxMemoryAtom[] = []
  for (let i = 0; i < length; i++) {
    defaults.push(...element.defaults)
  }
  return {
    tag: 'vector',
    element,
    length,
    width: element.width * length,
    defaults,
  }
}

const buildStructType = <TFields extends Record<string, GoboxTypeAny>>(
  fields: TFields,
): GoboxStructType<TFields> => {
  const fieldOrder = Object.keys(fields) as Array<
    Extract<keyof TFields, string>
  >
  const offsets = {} as { [K in keyof TFields]: number }
  const defaults: GoboxMemoryAtom[] = []
  let cursor = 0
  for (const key of fieldOrder) {
    const type = fields[key]
    if (!type) {
      continue
    }
    offsets[key] = cursor
    defaults.push(...type.defaults)
    cursor += type.width
  }
  return {
    tag: 'struct',
    fields,
    fieldOrder,
    fieldOffsets: offsets,
    width: cursor,
    defaults,
  }
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const resolveDefaultsFromInitial = (
  type: GoboxTypeAny,
  initial: unknown,
): GoboxMemoryAtom[] => {
  if (initial === undefined) {
    return [...type.defaults]
  }

  switch (type.tag) {
    case 'number':
      if (typeof initial !== 'number') {
        throw new Error('number initializer must be a number')
      }
      return [initial]
    case 'string':
      if (typeof initial !== 'string') {
        throw new Error('string initializer must be a string')
      }
      return [initial]
    case 'boolean':
      if (typeof initial !== 'boolean') {
        throw new Error('boolean initializer must be a boolean')
      }
      return [initial ? 1 : 0]
    case 'vector': {
      if (!Array.isArray(initial) || initial.length !== type.length) {
        throw new Error('vector initializer length must match vector length')
      }
      const defaults: GoboxMemoryAtom[] = []
      for (const item of initial) {
        defaults.push(...resolveDefaultsFromInitial(type.element, item))
      }
      return defaults
    }
    case 'struct': {
      if (!isObjectRecord(initial)) {
        throw new Error('struct initializer must be an object')
      }
      const defaults: GoboxMemoryAtom[] = []
      for (const key of type.fieldOrder) {
        const fieldType = type.fields[key]
        if (!fieldType) {
          continue
        }
        defaults.push(
          ...resolveDefaultsFromInitial(
            fieldType,
            initial[String(key)] as unknown,
          ),
        )
      }
      return defaults
    }
    default: {
      const exhaustiveType: never = type
      void exhaustiveType
      throw new Error('unsupported type initializer')
    }
  }
}

export const defineStruct = <TFields extends Record<string, GoboxTypeAny>>(
  fields: TFields,
): GoboxStructTypeFactory<TFields> => {
  const base = buildStructType(fields)
  return Object.assign(function Struct(
    initial?: GoboxStructInitial<TFields>,
  ): GoboxStructType<TFields> {
    if (initial === undefined) {
      return base
    }
    return {
      ...base,
      defaults: resolveDefaultsFromInitial(base, initial),
    }
  }, base) as GoboxStructTypeFactory<TFields>
}

export const struct = <TFields extends Record<string, GoboxTypeAny>>(
  fields: TFields,
): GoboxStructType<TFields> => {
  return defineStruct(fields)()
}

export { defineImpl, useImpl } from './functions'

export const isPrimitiveType = (
  type: GoboxTypeAny,
): type is GoboxPrimitiveType => {
  return (
    type.tag === 'number' || type.tag === 'string' || type.tag === 'boolean'
  )
}
