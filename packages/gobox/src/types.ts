export type GoboxMemoryAtom = number | string

interface GoboxTypeBase<TValue> {
  readonly width: number
  readonly defaults: GoboxMemoryAtom[]
  readonly __gobox_value?: TValue
}

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
  readonly fieldOrder: Array<keyof TFields>
  readonly fieldOffsets: { [K in keyof TFields]: number }
}

export interface GoboxTrait<TMethods extends Record<string, unknown>> {
  readonly tag: 'trait'
  readonly methodNames: Array<keyof TMethods>
}

interface GoboxStructLike extends GoboxTypeBase<unknown> {
  readonly tag: 'struct'
  readonly fields: Record<string, GoboxTypeAny>
  readonly fieldOrder: ReadonlyArray<PropertyKey>
  readonly fieldOffsets: Record<string, number>
}

interface GoboxTraitLike {
  readonly tag: 'trait'
  readonly methodNames: ReadonlyArray<PropertyKey>
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

export const number = (initial = 0): GoboxNumberType => {
  return {
    tag: 'number',
    initial,
    width: 1,
    defaults: [initial],
  }
}

export const string = (initial = ''): GoboxStringType => {
  return {
    tag: 'string',
    initial,
    width: 1,
    defaults: [initial],
  }
}

export const boolean = (initial = false): GoboxBooleanType => {
  return {
    tag: 'boolean',
    initial,
    width: 1,
    defaults: [initial ? 1 : 0],
  }
}

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

export const struct = <TFields extends Record<string, GoboxTypeAny>>(
  fields: TFields,
): GoboxStructType<TFields> => {
  const fieldOrder = Object.keys(fields) as Array<keyof TFields>
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

export const trait = <TMethods extends Record<string, unknown>>(
  methodNames: ReadonlyArray<keyof TMethods>,
): GoboxTrait<TMethods> => {
  return {
    tag: 'trait',
    methodNames: [...methodNames],
  }
}

export function useImpl<
  TStruct extends GoboxStructLike,
  TMethods extends Record<string, unknown>,
>(type: TStruct, methods: TMethods): TStruct & { methods: TMethods }
export function useImpl<
  TStruct extends GoboxStructLike,
  TTraitMethods extends Record<string, unknown>,
  TMethods extends TTraitMethods & Record<string, unknown>,
>(
  type: TStruct,
  traitDef: GoboxTrait<TTraitMethods>,
  methods: TMethods,
): TStruct & { methods: TMethods }
export function useImpl<
  TStruct extends GoboxStructLike,
  TMethods extends Record<string, unknown>,
>(
  type: TStruct,
  methodsOrTrait: TMethods | GoboxTraitLike,
  maybeMethods?: TMethods,
): TStruct & { methods: TMethods } {
  let methods: TMethods
  if (maybeMethods !== undefined) {
    const traitDef = methodsOrTrait as GoboxTraitLike
    methods = maybeMethods
    for (const methodName of traitDef.methodNames) {
      if (!(methodName in methods)) {
        throw new Error(`Missing trait method: ${String(methodName)}`)
      }
    }
  } else {
    methods = methodsOrTrait as TMethods
  }

  return {
    ...type,
    methods,
  }
}

export const isPrimitiveType = (
  type: GoboxTypeAny,
): type is GoboxPrimitiveType => {
  return (
    type.tag === 'number' || type.tag === 'string' || type.tag === 'boolean'
  )
}
