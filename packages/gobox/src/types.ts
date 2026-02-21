import type { ScopedValueFromType } from './value'
import { makeScopedValueFromType } from './value'

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

export interface GoboxTypeFactoryCommon<
  TScopedValue,
  TInitial,
  TSelf,
  TConfigure,
> {
  configure: TConfigure
  setDefaults(initial: TInitial): TSelf
  makeScopedValue(initial?: TInitial): TScopedValue
}

export type GoboxNumberTypeFactory = GoboxNumberType &
  GoboxTypeFactoryCommon<
    ScopedValueFromType<GoboxNumberType>,
    number,
    GoboxNumberTypeFactory,
    () => GoboxNumberTypeFactory
  >

export type GoboxStringTypeFactory = GoboxStringType &
  GoboxTypeFactoryCommon<
    ScopedValueFromType<GoboxStringType>,
    string,
    GoboxStringTypeFactory,
    () => GoboxStringTypeFactory
  >

export type GoboxBooleanTypeFactory = GoboxBooleanType &
  GoboxTypeFactoryCommon<
    ScopedValueFromType<GoboxBooleanType>,
    boolean,
    GoboxBooleanTypeFactory,
    () => GoboxBooleanTypeFactory
  >

type GoboxVectorConfigure = <TNextElement extends GoboxTypeAny>(
  element: TNextElement,
  length: number,
) => GoboxVectorTypeFactory<TNextElement>

export type GoboxVectorTypeFactory<
  TElement extends GoboxTypeAny = GoboxTypeAny,
> = GoboxVectorType<TElement> &
  GoboxTypeFactoryCommon<
    ScopedValueFromType<GoboxVectorType<TElement>>,
    GoboxTypeInitial<GoboxVectorType<TElement>>,
    GoboxVectorTypeFactory<TElement>,
    GoboxVectorConfigure
  >

export type GoboxStructTypeFactory<
  TFields extends Record<string, GoboxTypeAny>,
> = {
  (initial?: GoboxStructInitial<TFields>): GoboxStructType<TFields>
  new (initial?: GoboxStructInitial<TFields>): GoboxStructType<TFields>
  configure(
    initial?: GoboxStructInitial<TFields>,
  ): GoboxStructTypeFactory<TFields>
} & GoboxStructType<TFields> &
  GoboxTypeFactoryCommon<
    ScopedValueFromType<GoboxStructType<TFields>>,
    GoboxStructInitial<TFields>,
    GoboxStructTypeFactory<TFields>,
    (initial?: GoboxStructInitial<TFields>) => GoboxStructTypeFactory<TFields>
  >

export type GoboxPrimitiveTypeLike =
  | GoboxPrimitiveType
  | GoboxNumberTypeFactory
  | GoboxStringTypeFactory
  | GoboxBooleanTypeFactory

const freezeArray = <TItem>(values: ReadonlyArray<TItem>): TItem[] => {
  return Object.freeze([...values]) as TItem[]
}

const freezeRecord = <TRecord extends Record<string, unknown>>(
  value: TRecord,
): TRecord => {
  return Object.freeze(value)
}

const freezeType = <TType extends GoboxTypeAny>(type: TType): TType => {
  return Object.freeze(type)
}

const createNumberType = (initial = 0): GoboxNumberType => {
  return freezeType({
    tag: 'number',
    initial,
    width: 1,
    defaults: freezeArray([initial]),
  })
}

const createStringType = (initial = ''): GoboxStringType => {
  return freezeType({
    tag: 'string',
    initial,
    width: 1,
    defaults: freezeArray([initial]),
  })
}

const createBooleanType = (initial = false): GoboxBooleanType => {
  return freezeType({
    tag: 'boolean',
    initial,
    width: 1,
    defaults: freezeArray([initial ? 1 : 0]),
  })
}

const createNumberFactory = (initial = 0): GoboxNumberTypeFactory => {
  const type = createNumberType(initial)
  return Object.freeze({
    ...type,
    configure(): GoboxNumberTypeFactory {
      return createNumberFactory(0)
    },
    setDefaults(nextInitial: number): GoboxNumberTypeFactory {
      return createNumberFactory(nextInitial)
    },
    makeScopedValue(
      nextInitial?: number,
    ): ScopedValueFromType<GoboxNumberType> {
      return makeScopedValueFromType(type, [nextInitial ?? type.initial])
    },
  }) as GoboxNumberTypeFactory
}

const createStringFactory = (initial = ''): GoboxStringTypeFactory => {
  const type = createStringType(initial)
  return Object.freeze({
    ...type,
    configure(): GoboxStringTypeFactory {
      return createStringFactory('')
    },
    setDefaults(nextInitial: string): GoboxStringTypeFactory {
      return createStringFactory(nextInitial)
    },
    makeScopedValue(
      nextInitial?: string,
    ): ScopedValueFromType<GoboxStringType> {
      return makeScopedValueFromType(type, [nextInitial ?? type.initial])
    },
  }) as GoboxStringTypeFactory
}

const createBooleanFactory = (initial = false): GoboxBooleanTypeFactory => {
  const type = createBooleanType(initial)
  return Object.freeze({
    ...type,
    configure(): GoboxBooleanTypeFactory {
      return createBooleanFactory(false)
    },
    setDefaults(nextInitial: boolean): GoboxBooleanTypeFactory {
      return createBooleanFactory(nextInitial)
    },
    makeScopedValue(
      nextInitial?: boolean,
    ): ScopedValueFromType<GoboxBooleanType> {
      return makeScopedValueFromType(type, [
        (nextInitial ?? type.initial) ? 1 : 0,
      ])
    },
  }) as GoboxBooleanTypeFactory
}

export const Num = createNumberFactory(0)
export const Str = createStringFactory('')
export const Bool = createBooleanFactory(false)

const createVectorType = <TElement extends GoboxTypeAny>(
  element: TElement,
  length: number,
  defaultsOverride?: ReadonlyArray<GoboxMemoryAtom>,
): GoboxVectorType<TElement> => {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error('vector length must be a non-negative integer')
  }
  const defaults: GoboxMemoryAtom[] =
    defaultsOverride !== undefined
      ? [...defaultsOverride]
      : (() => {
          const generatedDefaults: GoboxMemoryAtom[] = []
          for (let i = 0; i < length; i++) {
            generatedDefaults.push(...element.defaults)
          }
          return generatedDefaults
        })()
  return freezeType({
    tag: 'vector',
    element,
    length,
    width: element.width * length,
    defaults: freezeArray(defaults),
  })
}

const createVectorFactory = <TElement extends GoboxTypeAny>(
  element: TElement,
  length: number,
  defaultsOverride?: ReadonlyArray<GoboxMemoryAtom>,
): GoboxVectorTypeFactory<TElement> => {
  const type = createVectorType(element, length, defaultsOverride)
  return Object.freeze({
    ...type,
    configure<TNextElement extends GoboxTypeAny>(
      nextElement: TNextElement,
      nextLength: number,
    ): GoboxVectorTypeFactory<TNextElement> {
      return createVectorFactory(nextElement, nextLength)
    },
    setDefaults(
      initial: GoboxTypeInitial<GoboxVectorType<TElement>>,
    ): GoboxVectorTypeFactory<TElement> {
      return createVectorFactory(
        element,
        length,
        resolveDefaultsFromInitial(type, initial),
      )
    },
    makeScopedValue(
      initial?: GoboxTypeInitial<GoboxVectorType<TElement>>,
    ): ScopedValueFromType<GoboxVectorType<TElement>> {
      const defaults =
        initial === undefined
          ? type.defaults
          : resolveDefaultsFromInitial(type, initial)
      return makeScopedValueFromType(type, defaults)
    },
  }) as GoboxVectorTypeFactory<TElement>
}

export const Vector = createVectorFactory(Num, 0) as GoboxVectorTypeFactory

const buildStructType = <TFields extends Record<string, GoboxTypeAny>>(
  fields: TFields,
): GoboxStructType<TFields> => {
  const normalizedFields = { ...fields } as TFields
  const fieldOrder = Object.keys(normalizedFields) as Array<
    Extract<keyof TFields, string>
  >
  const offsets = {} as { [K in keyof TFields]: number }
  const defaults: GoboxMemoryAtom[] = []
  let cursor = 0
  for (const key of fieldOrder) {
    const type = normalizedFields[key]
    if (!type) {
      continue
    }
    offsets[key] = cursor
    defaults.push(...type.defaults)
    cursor += type.width
  }
  return freezeType({
    tag: 'struct',
    fields: freezeRecord(normalizedFields),
    fieldOrder: freezeArray(fieldOrder),
    fieldOffsets: freezeRecord(offsets),
    width: cursor,
    defaults: freezeArray(defaults),
  })
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

const createStructTypeWithDefaults = <
  TFields extends Record<string, GoboxTypeAny>,
>(
  base: GoboxStructType<TFields>,
  defaults: ReadonlyArray<GoboxMemoryAtom>,
): GoboxStructType<TFields> => {
  return freezeType({
    ...base,
    defaults: freezeArray(defaults),
  })
}

const createStructFactoryFromBase = <
  TFields extends Record<string, GoboxTypeAny>,
>(
  base: GoboxStructType<TFields>,
  defaults: ReadonlyArray<GoboxMemoryAtom> = base.defaults,
): GoboxStructTypeFactory<TFields> => {
  const current = createStructTypeWithDefaults(base, defaults)
  const factory = Object.assign(
    function Struct(
      initial?: GoboxStructInitial<TFields>,
    ): GoboxStructType<TFields> {
      if (initial === undefined) {
        return current
      }
      return createStructTypeWithDefaults(
        base,
        resolveDefaultsFromInitial(base, initial),
      )
    },
    current,
    {
      configure(
        initial?: GoboxStructInitial<TFields>,
      ): GoboxStructTypeFactory<TFields> {
        if (initial === undefined) {
          return createStructFactoryFromBase(base, base.defaults)
        }
        return createStructFactoryFromBase(
          base,
          resolveDefaultsFromInitial(base, initial),
        )
      },
      setDefaults(
        initial: GoboxStructInitial<TFields>,
      ): GoboxStructTypeFactory<TFields> {
        return createStructFactoryFromBase(
          base,
          resolveDefaultsFromInitial(base, initial),
        )
      },
      makeScopedValue(
        initial?: GoboxStructInitial<TFields>,
      ): ScopedValueFromType<GoboxStructType<TFields>> {
        const nextDefaults =
          initial === undefined
            ? current.defaults
            : resolveDefaultsFromInitial(base, initial)
        return makeScopedValueFromType(current, nextDefaults)
      },
    },
  ) as GoboxStructTypeFactory<TFields>
  return Object.freeze(factory) as GoboxStructTypeFactory<TFields>
}

export const defineStruct = <TFields extends Record<string, GoboxTypeAny>>(
  fields: TFields,
): GoboxStructTypeFactory<TFields> => {
  return createStructFactoryFromBase(buildStructType(fields))
}

export const struct = <TFields extends Record<string, GoboxTypeAny>>(
  fields: TFields,
): GoboxStructTypeFactory<TFields> => {
  return defineStruct(fields)
}

export { defineImpl, useImpl } from './functions'

export const isPrimitiveType = (
  type: GoboxTypeAny,
): type is GoboxPrimitiveType => {
  return (
    type.tag === 'number' || type.tag === 'string' || type.tag === 'boolean'
  )
}
