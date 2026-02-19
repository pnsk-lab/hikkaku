import type { HikkakuBlock, PrimitiveSource } from 'hikkaku'
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
import {
  allocateScopedPointer,
  type GoboxTargetRuntime,
  getRuntimeForCurrentTarget,
  pointerToIndexSource,
  type SlotPointer,
  withPointerOffset,
} from './internal/runtime'
import {
  boolean as booleanType,
  type GoboxBooleanType,
  type GoboxNumberType,
  type GoboxPrimitiveType,
  type GoboxStringType,
  type GoboxStructType,
  type GoboxTypeAny,
  type GoboxValueOf,
  type GoboxVectorType,
  isPrimitiveType,
  number as numberType,
  string as stringType,
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
  get(): HikkakuBlock
  set(value: PrimitiveSource<number>): void
  borrow(): Pick<ScopedNumberValue, 'get'>
  borrowMut(): Pick<ScopedNumberValue, 'get' | 'set'>
}

export interface ScopedStringValue {
  get(): HikkakuBlock
  set(value: PrimitiveSource<string | number>): void
  borrow(): Pick<ScopedStringValue, 'get'>
  borrowMut(): Pick<ScopedStringValue, 'get' | 'set'>
}

export interface ScopedBooleanValue {
  get(): HikkakuBlock
  set(value: PrimitiveSource<boolean>): void
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
            ? ScopedStructValue<TFields>
            : never

export interface ScopedVectorValue<TElement extends GoboxTypeAny> {
  readonly length: number
  at(index: number): ScopedValueFromType<TElement>
}

export type ScopedStructValue<TFields extends Record<string, GoboxTypeAny>> = {
  [K in keyof TFields]: ScopedValueFromType<TFields[K]>
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
        ) as PrimitiveSource<number>,
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
          ) as PrimitiveSource<number>,
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
        add(next as PrimitiveSource<number>, 0),
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
      return withInternal(
        structValue,
        runtime,
        pointer,
        type,
      ) as ScopedValueFromType<TType>
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
): PrimitiveSource<number> => {
  const internal = asInternal(value)
  return pointerToIndexSource(internal[POINTER_SYMBOL])
}

export const __unsafe_getRuntimeFromScopedValue = (
  value: unknown,
): GoboxTargetRuntime => {
  const internal = asInternal(value)
  return internal[RUNTIME_SYMBOL]
}

export const useScopedValue = <TType extends GoboxTypeAny>(
  type: TType,
): ScopedValueFromType<TType> => {
  const runtime = getRuntimeForCurrentTarget()
  const pointer = allocateScopedPointer(runtime, type.width, type.defaults)
  initDynamicDefaults(runtime, pointer, type.defaults)
  return createScopedValue(runtime, type, pointer)
}

interface SignalInternal<TValue extends number | string | boolean> {
  get(): PrimitiveSource<TValue>
  set(value: PrimitiveSource<TValue>): void
  subscribe(effect: ReturnType<typeof defineProcedure>): void
}

export interface GoboxSignal<TValue extends number | string | boolean> {
  get(): PrimitiveSource<TValue>
  set(value: PrimitiveSource<TValue>): void
}

let activeSignalCollector: Set<
  SignalInternal<number | string | boolean>
> | null = null

const toPrimitiveSignalType = (
  input: GoboxPrimitiveType | number | string | boolean,
): GoboxPrimitiveType => {
  if (typeof input === 'number') {
    return numberType(input)
  }
  if (typeof input === 'string') {
    return stringType(input)
  }
  if (typeof input === 'boolean') {
    return booleanType(input)
  }
  if (!isPrimitiveType(input)) {
    throw new Error('useSignal only supports primitive gobox types')
  }
  return input
}

const assertRunTopLevel = (name: string): void => {
  const scope = __unstable_getBuildScopeFrame()
  if (!scope || scope.kind !== 'run') {
    throw new Error(`${name} must be used at run() top-level`)
  }
}

export function useSignal(
  initialOrType: GoboxNumberType | number,
): GoboxSignal<number>
export function useSignal(
  initialOrType: GoboxStringType | string,
): GoboxSignal<string>
export function useSignal(
  initialOrType: GoboxBooleanType | boolean,
): GoboxSignal<boolean>
export function useSignal(
  initialOrType: GoboxPrimitiveType | number | string | boolean,
): GoboxSignal<number | string | boolean> {
  assertRunTopLevel('useSignal')

  const runtime = getRuntimeForCurrentTarget()
  const type = toPrimitiveSignalType(initialOrType)
  const value = useScopedValue(type)

  const subscribers: Array<ReturnType<typeof defineProcedure>> = []

  const signal: SignalInternal<number | string | boolean> = {
    get: () => {
      if (activeSignalCollector) {
        activeSignalCollector.add(signal)
      }
      return value.get() as PrimitiveSource<number | string | boolean>
    },
    set: (next) => {
      value.set(next as PrimitiveSource<never>)
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

export const isTrue = (value: PrimitiveSource<boolean>): HikkakuBlock => {
  return equals(value as PrimitiveSource<string | number>, 1)
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
