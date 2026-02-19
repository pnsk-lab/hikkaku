import type { HikkakuBlock, PrimitiveSource } from 'hikkaku'
import { __unstable_getBuildScopeFrame } from 'hikkaku'
import {
  add,
  callProcedure,
  defineProcedure,
  procedureBoolean,
  procedureLabel,
  procedureStringOrNumber,
} from 'hikkaku/blocks'
import {
  getRuntimeForCurrentTarget,
  type SlotPointer,
} from './internal/runtime'
import type {
  GoboxBooleanType,
  GoboxNumberType,
  GoboxPrimitiveType,
  GoboxTrait,
  GoboxTypeAny,
} from './types'
import {
  __unsafe_createScopedValueFromPointer,
  __unsafe_getPointerSource,
  type ScopedValueFromType,
  useScopedValue,
} from './value'

export type FunctionArgSpec = Record<string, GoboxPrimitiveType>

type PrimitiveInputForType<TType extends GoboxPrimitiveType> =
  TType extends GoboxBooleanType
    ? PrimitiveSource<boolean>
    : TType extends GoboxNumberType
      ? PrimitiveSource<number>
      : PrimitiveSource<string | number>

export type FunctionCallArgs<TArgs extends FunctionArgSpec> = {
  [K in keyof TArgs]: PrimitiveInputForType<TArgs[K]>
}

type PrimitiveReaderForType<TType extends GoboxPrimitiveType> = {
  get(): PrimitiveInputForType<TType>
}

export type FunctionReaders<TArgs extends FunctionArgSpec> = {
  [K in keyof TArgs]: PrimitiveReaderForType<TArgs[K]>
}

export interface UseFunctionOptions<
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveType,
> {
  name: string
  args: TArgs
  returns: TReturn
  warp?: boolean
  body: (ctx: {
    args: FunctionReaders<TArgs>
    returnValue: ScopedValueFromType<TReturn>
  }) => void
}

export interface GoboxFunctionDefinition<
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveType,
> {
  readonly name: string
  readonly args: TArgs
  readonly returns: TReturn
  readonly procedure: ReturnType<typeof defineProcedure>
  call(args: FunctionCallArgs<TArgs>): ScopedValueFromType<TReturn>
}

type UseFunctionInput<
  TArgs extends FunctionArgSpec = FunctionArgSpec,
  TReturn extends GoboxPrimitiveType = GoboxPrimitiveType,
> = Omit<UseFunctionOptions<TArgs, TReturn>, 'name'> & {
  name?: string
}

type NormalizeImplMethod<TMethod> =
  TMethod extends GoboxFunctionDefinition<infer TArgs, infer TReturn>
    ? GoboxFunctionDefinition<TArgs, TReturn>
    : TMethod extends UseFunctionInput<infer TArgs, infer TReturn>
      ? GoboxFunctionDefinition<TArgs, TReturn>
      : TMethod

type NormalizeImplMethods<TMethods extends Record<string, unknown>> = {
  [K in keyof TMethods]: NormalizeImplMethod<TMethods[K]>
}

type UseImplMethodInputFromTrait<TMethod> =
  TMethod extends GoboxFunctionDefinition<infer TArgs, infer TReturn>
    ? GoboxFunctionDefinition<TArgs, TReturn> | UseFunctionInput<TArgs, TReturn>
    : TMethod

type UseImplTraitInput<TTraitMethods extends Record<string, unknown>> = {
  [K in keyof TTraitMethods]: UseImplMethodInputFromTrait<TTraitMethods[K]>
}

interface ImplStructLike {
  readonly tag: 'struct'
  readonly fields: Record<string, GoboxTypeAny>
  readonly fieldOrder: ReadonlyArray<PropertyKey>
  readonly fieldOffsets: Record<string, number>
  readonly width: number
  readonly defaults: Array<number | string>
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object'
}

const isFunctionDefinitionLike = (
  value: unknown,
): value is GoboxFunctionDefinition<FunctionArgSpec, GoboxPrimitiveType> => {
  if (!isObjectRecord(value)) {
    return false
  }
  return 'procedure' in value && typeof value.call === 'function'
}

const isUseFunctionInput = (
  value: unknown,
): value is UseFunctionInput<FunctionArgSpec, GoboxPrimitiveType> => {
  if (!isObjectRecord(value)) {
    return false
  }
  return (
    !('procedure' in value) &&
    isObjectRecord(value.args) &&
    isObjectRecord(value.returns) &&
    typeof value.body === 'function'
  )
}

const normalizeImplMethods = <TMethods extends Record<string, unknown>>(
  methods: TMethods,
): NormalizeImplMethods<TMethods> => {
  const normalized: Record<string, unknown> = {}

  for (const [methodName, methodValue] of Object.entries(methods)) {
    if (isFunctionDefinitionLike(methodValue)) {
      normalized[methodName] = methodValue
      continue
    }
    if (isUseFunctionInput(methodValue)) {
      normalized[methodName] = useFunction({
        name: methodValue.name ?? methodName,
        args: methodValue.args,
        returns: methodValue.returns,
        warp: methodValue.warp,
        body: methodValue.body,
      })
      continue
    }
    normalized[methodName] = methodValue
  }

  return normalized as NormalizeImplMethods<TMethods>
}

const assertRunTopLevel = (name: string): void => {
  const scope = __unstable_getBuildScopeFrame()
  if (!scope || scope.kind !== 'run') {
    throw new Error(`${name} must be defined at run() top-level`)
  }
}

const coerceReporterByType = (
  type: GoboxPrimitiveType,
  reporter: HikkakuBlock,
): PrimitiveSource<string | number | boolean> => {
  switch (type.tag) {
    case 'number':
      return add(reporter as PrimitiveSource<number>, 0)
    case 'string':
      return reporter as PrimitiveSource<string | number>
    case 'boolean':
      return reporter as PrimitiveSource<boolean>
    default: {
      const exhaustiveType: never = type
      void exhaustiveType
      throw new Error('unsupported primitive type')
    }
  }
}

export const useFunction = <
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveType,
>(
  options: UseFunctionOptions<TArgs, TReturn>,
): GoboxFunctionDefinition<TArgs, TReturn> => {
  assertRunTopLevel('useFunction')

  const runtime = getRuntimeForCurrentTarget()
  const argEntries = Object.entries(options.args) as Array<
    [keyof TArgs, TArgs[keyof TArgs]]
  >

  const proclist: Array<
    | ReturnType<typeof procedureLabel>
    | ReturnType<typeof procedureBoolean>
    | ReturnType<typeof procedureStringOrNumber>
  > = [procedureLabel(options.name)]

  for (const [name, type] of argEntries) {
    if (type.tag === 'boolean') {
      proclist.push(procedureBoolean(String(name)))
    } else {
      proclist.push(procedureStringOrNumber(String(name)))
    }
  }
  proclist.push(procedureStringOrNumber('__ret_ptr'))

  const procedure = defineProcedure(
    proclist,
    (rawReferences) => {
      const references = rawReferences as Record<
        string,
        {
          getter(): HikkakuBlock
        }
      >

      const readers = {} as FunctionReaders<TArgs>
      for (const [name, type] of argEntries) {
        const reference = references[String(name)]
        if (!reference) {
          throw new Error(
            `Missing function argument reference: ${String(name)}`,
          )
        }
        readers[name] = {
          get: () =>
            coerceReporterByType(
              type,
              reference.getter(),
            ) as PrimitiveReaderForType<
              TArgs[typeof name]
            >['get'] extends () => infer T
              ? T
              : never,
        } as FunctionReaders<TArgs>[typeof name]
      }

      const returnPointerReference = references.__ret_ptr
      if (!returnPointerReference) {
        throw new Error('Missing __ret_ptr argument reference')
      }
      const returnPointerReporter = returnPointerReference.getter()
      const returnPointerSource = add(
        returnPointerReporter as PrimitiveSource<number>,
        0,
      )
      const pointer: SlotPointer = {
        kind: 'expr',
        source: returnPointerSource,
        offset: 0,
      }
      const returnValue = __unsafe_createScopedValueFromPointer(
        runtime,
        options.returns,
        pointer,
      )

      options.body({
        args: readers,
        returnValue,
      })
      return undefined
    },
    options.warp ?? false,
  )

  const call = (
    args: FunctionCallArgs<TArgs>,
  ): ScopedValueFromType<TReturn> => {
    const destination = useScopedValue(options.returns)
    const pointerSource = __unsafe_getPointerSource(destination)

    const inputs: Record<
      string,
      PrimitiveSource<string | number | boolean>
    > = {}

    for (const [name, value] of Object.entries(args)) {
      const reference = (
        procedure as unknown as {
          reference: {
            arguments: Record<string, { id: string }>
          }
        }
      ).reference.arguments[name]
      if (!reference) {
        throw new Error(`Unknown function argument: ${name}`)
      }
      inputs[reference.id] = value as PrimitiveSource<string | number | boolean>
    }

    const retReference = (
      procedure as unknown as {
        reference: {
          arguments: Record<string, { id: string }>
        }
      }
    ).reference.arguments.__ret_ptr

    if (!retReference) {
      throw new Error('internal return pointer argument is missing')
    }

    inputs[retReference.id] = pointerSource

    callProcedure(procedure, inputs)
    return destination
  }

  const definition: GoboxFunctionDefinition<TArgs, TReturn> = {
    name: options.name,
    args: options.args,
    returns: options.returns,
    procedure,
    call,
  }

  return definition
}

export function useImpl<
  TStruct extends ImplStructLike,
  TMethods extends Record<string, unknown>,
>(
  type: TStruct,
  methods: TMethods,
): TStruct & { methods: NormalizeImplMethods<TMethods> }
export function useImpl<
  TStruct extends ImplStructLike,
  TTraitMethods extends Record<string, unknown>,
  TMethods extends UseImplTraitInput<TTraitMethods> & Record<string, unknown>,
>(
  type: TStruct,
  traitDef: GoboxTrait<TTraitMethods>,
  methods: TMethods,
): TStruct & { methods: NormalizeImplMethods<TMethods> }
export function useImpl<
  TStruct extends ImplStructLike,
  TMethods extends Record<string, unknown>,
>(
  type: TStruct,
  methodsOrTrait: TMethods | GoboxTrait<Record<string, unknown>>,
  maybeMethods?: TMethods,
): TStruct & { methods: NormalizeImplMethods<TMethods> } {
  let methods: TMethods
  if (maybeMethods !== undefined) {
    const traitDef = methodsOrTrait as GoboxTrait<Record<string, unknown>>
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
    methods: normalizeImplMethods(methods),
  }
}
