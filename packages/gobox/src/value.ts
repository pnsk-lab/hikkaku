import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuReporterBlock,
  HikkakuString,
  PrimitiveSource,
  PrimitiveToHikkakuType,
} from 'hikkaku'
import { __unstable_getBuildScopeFrame } from 'hikkaku'
import {
  add,
  callProcedure,
  defineProcedure,
  equals,
  getItemOfList,
  gt,
  procedureLabel,
  replaceItemOfList,
  whenFlagClicked,
} from 'hikkaku/blocks'
import type { FunctionArgSpec, GoboxFunctionDefinition } from './functions'
import { IMPL_CONSTRUCTOR_SYMBOL, IMPL_METHODS_SYMBOL } from './internal/impl'
import {
  allocateScopedPointer,
  type GoboxTargetRuntime,
  getRuntimeForCurrentTarget,
  pointerToIndexSource,
  type SlotPointer,
  withPointerOffset,
} from './internal/runtime'
import type {
  GoboxBooleanType,
  GoboxMemoryAtom,
  GoboxNumberType,
  GoboxPrimitiveType,
  GoboxPrimitiveTypeLike,
  GoboxStringType,
  GoboxStructType,
  GoboxTypeAny,
  GoboxValueOf,
  GoboxVectorType,
} from './types'

const POINTER_SYMBOL = Symbol('gobox.pointer')
const RUNTIME_SYMBOL = Symbol('gobox.runtime')
const TYPE_SYMBOL = Symbol('gobox.type')

interface ScopedInternal {
  [POINTER_SYMBOL]: SlotPointer
  [RUNTIME_SYMBOL]: GoboxTargetRuntime
  [TYPE_SYMBOL]: GoboxTypeAny
}

export interface ScopedNumberValue {
  get(): HikkakuReporterBlock<HikkakuNumber>
  set(value: PrimitiveSource<HikkakuNumber>): void
  borrow(): Pick<ScopedNumberValue, 'get'>
  borrowMut(): Pick<ScopedNumberValue, 'get' | 'set'>
}

export interface ScopedStringValue {
  get(): HikkakuReporterBlock<HikkakuString | HikkakuNumber>
  set(value: PrimitiveSource<HikkakuString | HikkakuNumber>): void
  borrow(): Pick<ScopedStringValue, 'get'>
  borrowMut(): Pick<ScopedStringValue, 'get' | 'set'>
}

export interface ScopedBooleanValue {
  get(): HikkakuReporterBlock<HikkakuBool>
  set(value: PrimitiveSource<HikkakuBool>): void
  borrow(): Pick<ScopedBooleanValue, 'get'>
  borrowMut(): Pick<ScopedBooleanValue, 'get' | 'set'>
}

export type ScopedValueFromType<TType extends GoboxTypeAny> =
  TType extends GoboxNumberType
    ? ScopedNumberValue
    : TType extends GoboxStringType
      ? ScopedStringValue
      : TType extends GoboxBooleanType
        ? ScopedBooleanValue
        : TType extends GoboxVectorType<infer TElement>
          ? ScopedVectorValue<TElement>
          : TType extends GoboxStructType<infer TFields>
            ? ScopedStructValue<TFields> & ScopedImplMethodsFromType<TType>
            : never

export interface ScopedVectorValue<TElement extends GoboxTypeAny> {
  readonly length: number
  at(index: number): ScopedValueFromType<TElement>
}

export type ScopedStructValue<TFields extends Record<string, GoboxTypeAny>> = {
  [K in keyof TFields]: ScopedValueFromType<TFields[K]>
}

type ImplMethodsFromType<TType extends GoboxTypeAny> = TType extends {
  readonly [IMPL_METHODS_SYMBOL]: infer TMethods extends Record<string, unknown>
}
  ? TMethods
  : never

type ScopedImplMethodsFromType<TType extends GoboxTypeAny> = [
  ImplMethodsFromType<TType>,
] extends [never]
  ? Record<never, never>
  : { readonly methods: ImplMethodsFromType<TType> }

const isFunctionDefinitionLike = (
  value: unknown,
): value is GoboxFunctionDefinition<
  FunctionArgSpec,
  GoboxPrimitiveTypeLike
> => {
  if (!value || typeof value !== 'object') {
    return false
  }
  return (
    'procedure' in value &&
    typeof (value as { call?: unknown }).call === 'function'
  )
}

const bindImplMethods = <
  TMethods extends Record<string, unknown>,
  TSelf extends object,
>(
  methods: TMethods,
  self: TSelf,
): TMethods => {
  const bound: Record<string, unknown> = {}
  for (const [name, method] of Object.entries(methods)) {
    if (isFunctionDefinitionLike(method)) {
      const definition = method
      bound[name] = {
        ...definition,
        call: (args: unknown) =>
          (
            definition as unknown as {
              call(callArgs: unknown, callSelf: TSelf): unknown
            }
          ).call(args, self),
      }
      continue
    }
    bound[name] = method
  }
  return Object.freeze(bound) as TMethods
}

const withInternal = <TValue extends object>(
  value: TValue,
  runtime: GoboxTargetRuntime,
  pointer: SlotPointer,
  type: GoboxTypeAny,
): TValue => {
  Object.defineProperty(value, POINTER_SYMBOL, {
    value: pointer,
    enumerable: false,
  })
  Object.defineProperty(value, RUNTIME_SYMBOL, {
    value: runtime,
    enumerable: false,
  })
  Object.defineProperty(value, TYPE_SYMBOL, {
    value: type,
    enumerable: false,
  })
  return value
}

const asInternal = (value: unknown): ScopedInternal => {
  if (
    !value ||
    typeof value !== 'object' ||
    !(POINTER_SYMBOL in value) ||
    !(RUNTIME_SYMBOL in value) ||
    !(TYPE_SYMBOL in value)
  ) {
    throw new Error('value is not a scoped gobox value')
  }
  return value as ScopedInternal
}

const initDynamicDefaults = (
  runtime: GoboxTargetRuntime,
  pointer: SlotPointer,
  defaults: ReadonlyArray<string | number>,
): void => {
  if (pointer.kind === 'static') {
    return
  }
  defaults.forEach((defaultValue, index) => {
    replaceItemOfList(
      runtime.memoryList,
      pointerToIndexSource(pointer, index),
      defaultValue,
    )
  })
}

const createNumberValue = (
  runtime: GoboxTargetRuntime,
  pointer: SlotPointer,
  type: GoboxNumberType,
): ScopedNumberValue => {
  const value: ScopedNumberValue = {
    get: () => {
      return add(
        getItemOfList(
          runtime.memoryList,
          pointerToIndexSource(pointer),
        ) as PrimitiveSource<HikkakuNumber>,
        0,
      )
    },
    set: (next) => {
      replaceItemOfList(runtime.memoryList, pointerToIndexSource(pointer), next)
    },
    borrow: () => ({
      get: value.get,
    }),
    borrowMut: () => ({
      get: value.get,
      set: value.set,
    }),
  }
  return withInternal(value, runtime, pointer, type)
}

const createStringValue = (
  runtime: GoboxTargetRuntime,
  pointer: SlotPointer,
  type: GoboxStringType,
): ScopedStringValue => {
  const value: ScopedStringValue = {
    get: () => {
      return getItemOfList(runtime.memoryList, pointerToIndexSource(pointer))
    },
    set: (next) => {
      replaceItemOfList(runtime.memoryList, pointerToIndexSource(pointer), next)
    },
    borrow: () => ({
      get: value.get,
    }),
    borrowMut: () => ({
      get: value.get,
      set: value.set,
    }),
  }
  return withInternal(value, runtime, pointer, type)
}

const createBooleanValue = (
  runtime: GoboxTargetRuntime,
  pointer: SlotPointer,
  type: GoboxBooleanType,
): ScopedBooleanValue => {
  const value: ScopedBooleanValue = {
    get: () => {
      return gt(
        add(
          getItemOfList(
            runtime.memoryList,
            pointerToIndexSource(pointer),
          ) as PrimitiveSource<HikkakuNumber>,
          0,
        ),
        0,
      )
    },
    set: (next) => {
      if (typeof next === 'boolean') {
        replaceItemOfList(
          runtime.memoryList,
          pointerToIndexSource(pointer),
          next ? 1 : 0,
        )
        return
      }
      replaceItemOfList(
        runtime.memoryList,
        pointerToIndexSource(pointer),
        add(next as PrimitiveSource<HikkakuNumber>, 0),
      )
    },
    borrow: () => ({
      get: value.get,
    }),
    borrowMut: () => ({
      get: value.get,
      set: value.set,
    }),
  }
  return withInternal(value, runtime, pointer, type)
}

const createScopedValue = <TType extends GoboxTypeAny>(
  runtime: GoboxTargetRuntime,
  type: TType,
  pointer: SlotPointer,
): ScopedValueFromType<TType> => {
  switch (type.tag) {
    case 'number':
      return createNumberValue(
        runtime,
        pointer,
        type,
      ) as ScopedValueFromType<TType>
    case 'string':
      return createStringValue(
        runtime,
        pointer,
        type,
      ) as ScopedValueFromType<TType>
    case 'boolean':
      return createBooleanValue(
        runtime,
        pointer,
        type,
      ) as ScopedValueFromType<TType>
    case 'vector': {
      const vectorValue: ScopedVectorValue<GoboxTypeAny> = {
        length: type.length,
        at: (index: number) => {
          if (!Number.isInteger(index) || index < 0 || index >= type.length) {
            throw new Error(
              `vector index out of range: ${index} (length: ${type.length})`,
            )
          }
          return createScopedValue(
            runtime,
            type.element,
            withPointerOffset(pointer, index * type.element.width),
          )
        },
      }
      return withInternal(
        vectorValue,
        runtime,
        pointer,
        type,
      ) as ScopedValueFromType<TType>
    }
    case 'struct': {
      const structValue = {} as Record<string, unknown>
      for (const fieldName of type.fieldOrder) {
        const offset = type.fieldOffsets[fieldName]
        const fieldType = type.fields[fieldName]
        if (offset === undefined || !fieldType) {
          continue
        }
        structValue[String(fieldName)] = createScopedValue(
          runtime,
          fieldType,
          withPointerOffset(pointer, offset),
        )
      }
      const scopedStructValue = withInternal(
        structValue,
        runtime,
        pointer,
        type,
      ) as ScopedValueFromType<TType>
      const methods = (
        type as { [IMPL_METHODS_SYMBOL]?: Record<string, unknown> }
      )[IMPL_METHODS_SYMBOL]
      if (methods !== undefined) {
        Object.defineProperty(structValue, 'methods', {
          enumerable: true,
          value: bindImplMethods(methods, scopedStructValue),
        })
      }
      const constructor_ = (
        type as {
          [IMPL_CONSTRUCTOR_SYMBOL]?: (ctx: {
            self: ScopedValueFromType<TType>
          }) => void
        }
      )[IMPL_CONSTRUCTOR_SYMBOL]
      if (constructor_ !== undefined) {
        constructor_({
          self: scopedStructValue,
        })
      }
      return scopedStructValue
    }
    default: {
      const exhaustiveType: never = type
      void exhaustiveType
      throw new Error('unknown gobox type')
    }
  }
}

export const __unsafe_createScopedValueFromPointer = <
  TType extends GoboxTypeAny,
>(
  runtime: GoboxTargetRuntime,
  type: TType,
  pointer: SlotPointer,
): ScopedValueFromType<TType> => {
  return createScopedValue(runtime, type, pointer)
}

export const __unsafe_getPointerSource = (
  value: unknown,
): PrimitiveSource<HikkakuNumber> => {
  const internal = asInternal(value)
  return pointerToIndexSource(internal[POINTER_SYMBOL])
}

export const __unsafe_getRuntimeFromScopedValue = (
  value: unknown,
): GoboxTargetRuntime => {
  const internal = asInternal(value)
  return internal[RUNTIME_SYMBOL]
}

export const makeScopedValueFromType = <TType extends GoboxTypeAny>(
  type: TType,
  defaults: ReadonlyArray<GoboxMemoryAtom> = type.defaults,
): ScopedValueFromType<TType> => {
  const runtime = getRuntimeForCurrentTarget()
  const runtimeDefaults = [...defaults]
  const pointer = allocateScopedPointer(runtime, type.width, runtimeDefaults)
  initDynamicDefaults(runtime, pointer, runtimeDefaults)
  return createScopedValue(runtime, type, pointer)
}

interface SignalInternal<TValue extends number | string | boolean> {
  get(): PrimitiveSource<PrimitiveToHikkakuType<TValue>>
  set(value: PrimitiveSource<PrimitiveToHikkakuType<TValue>>): void
  subscribe(effect: ReturnType<typeof defineProcedure>): void
}

export interface GoboxSignal<TValue extends number | string | boolean> {
  get(): PrimitiveSource<PrimitiveToHikkakuType<TValue>>
  set(value: PrimitiveSource<PrimitiveToHikkakuType<TValue>>): void
}

let activeSignalCollector: Set<
  SignalInternal<number | string | boolean>
> | null = null

type PrimitiveSignalDescriptor = {
  tag: GoboxPrimitiveType['tag']
  get(): PrimitiveSource<HikkakuBool | HikkakuNumber | HikkakuString>
  set(value: PrimitiveSource<HikkakuBool | HikkakuNumber | HikkakuString>): void
}

const toPrimitiveSignalDescriptor = (
  input: ScopedNumberValue | ScopedStringValue | ScopedBooleanValue,
): PrimitiveSignalDescriptor => {
  const internal = asInternal(input)
  const type = internal[TYPE_SYMBOL]
  switch (type.tag) {
    case 'number': {
      const scoped = input as ScopedNumberValue
      return {
        tag: type.tag,
        get: () => scoped.get() as PrimitiveSource<HikkakuNumber>,
        set: (value) => {
          scoped.set(value as PrimitiveSource<HikkakuNumber>)
        },
      }
    }
    case 'string': {
      const scoped = input as ScopedStringValue
      return {
        tag: type.tag,
        get: () =>
          scoped.get() as PrimitiveSource<HikkakuString | HikkakuNumber>,
        set: (value) => {
          scoped.set(value as PrimitiveSource<HikkakuString | HikkakuNumber>)
        },
      }
    }
    case 'boolean': {
      const scoped = input as ScopedBooleanValue
      return {
        tag: type.tag,
        get: () => scoped.get() as PrimitiveSource<HikkakuBool>,
        set: (value) => {
          scoped.set(value as PrimitiveSource<HikkakuBool>)
        },
      }
    }
    default:
      throw new Error('useSignal only supports scoped primitive gobox values')
  }
}

const assertRunTopLevel = (name: string): void => {
  const scope = __unstable_getBuildScopeFrame()
  if (!scope || scope.kind !== 'run') {
    throw new Error(`${name} must be used at run() top-level`)
  }
}

export function useSignal(value: ScopedNumberValue): GoboxSignal<number>
export function useSignal(value: ScopedStringValue): GoboxSignal<string>
export function useSignal(value: ScopedBooleanValue): GoboxSignal<boolean>
export function useSignal(
  value: ScopedNumberValue | ScopedStringValue | ScopedBooleanValue,
): GoboxSignal<number | string | boolean> {
  assertRunTopLevel('useSignal')
  const descriptor = toPrimitiveSignalDescriptor(value)

  const subscribers: Array<ReturnType<typeof defineProcedure>> = []

  const signal: SignalInternal<number | string | boolean> = {
    get: () => {
      if (activeSignalCollector) {
        activeSignalCollector.add(signal)
      }
      return descriptor.get() as PrimitiveSource<
        HikkakuNumber | HikkakuString | HikkakuBool
      >
    },
    set: (next) => {
      descriptor.set(
        next as PrimitiveSource<HikkakuBool | HikkakuNumber | HikkakuString>,
      )
      for (const subscriber of subscribers) {
        callProcedure(subscriber, [])
      }
    },
    subscribe: (effect) => {
      subscribers.push(effect)
    },
  }

  return signal
}

export const useEffect = (handler: () => void): void => {
  assertRunTopLevel('useEffect')
  const runtime = getRuntimeForCurrentTarget()

  const dependencies = new Set<SignalInternal<number | string | boolean>>()
  activeSignalCollector = dependencies
  const procedureName = `__gobox_effect_${runtime.signalCounter}`
  runtime.signalCounter += 1
  const effect = defineProcedure(
    [procedureLabel(procedureName)],
    () => {
      handler()
      return undefined
    },
    false,
  )
  try {
    whenFlagClicked(() => {
      callProcedure(effect, [])
    })
  } finally {
    activeSignalCollector = null
  }

  for (const dependency of dependencies) {
    dependency.subscribe(effect)
  }
}

export const isTrue = (
  value: PrimitiveSource<HikkakuBool>,
): HikkakuReporterBlock<HikkakuBool> => {
  return equals(value as PrimitiveSource<HikkakuString | HikkakuNumber>, 1)
}

export type {
  GoboxBooleanType,
  GoboxNumberType,
  GoboxStringType,
  GoboxStructType,
  GoboxTypeAny,
  GoboxVectorType,
  GoboxValueOf,
}
