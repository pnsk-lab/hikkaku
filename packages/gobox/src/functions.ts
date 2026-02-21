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
  GoboxBooleanTypeFactory,
  GoboxNumberType,
  GoboxNumberTypeFactory,
  GoboxPrimitiveType,
  GoboxPrimitiveTypeLike,
  GoboxStringType,
  GoboxStringTypeFactory,
  GoboxStructInitial,
  GoboxStructType,
  GoboxStructTypeFactory,
  GoboxTypeAny,
} from './types'
import { isPrimitiveType } from './types'
import {
  __unsafe_createScopedValueFromPointer,
  __unsafe_getPointerSource,
  type ScopedValueFromType,
  useScopedValue,
} from './value'

export type FunctionArgSpec = Record<string, GoboxPrimitiveTypeLike>

type NormalizeFunctionArgType<TType extends GoboxPrimitiveTypeLike> =
  TType extends GoboxNumberTypeFactory
    ? GoboxNumberType
    : TType extends GoboxStringTypeFactory
      ? GoboxStringType
      : TType extends GoboxBooleanTypeFactory
        ? GoboxBooleanType
        : TType

type NormalizeFunctionArgs<TArgs extends FunctionArgSpec> = {
  [K in keyof TArgs]: NormalizeFunctionArgType<TArgs[K]>
}

type NormalizeFunctionReturn<TReturn extends GoboxPrimitiveTypeLike> =
  NormalizeFunctionArgType<TReturn>

type PrimitiveInputForType<TType extends GoboxPrimitiveType> =
  TType extends GoboxBooleanType
    ? PrimitiveSource<boolean>
    : TType extends GoboxNumberType
      ? PrimitiveSource<number>
      : PrimitiveSource<string | number>

export type FunctionCallArgs<TArgs extends Record<string, GoboxPrimitiveType>> =
  {
    [K in keyof TArgs]: PrimitiveInputForType<TArgs[K]>
  }

type PrimitiveReaderForType<TType extends GoboxPrimitiveType> = {
  get(): PrimitiveInputForType<TType>
}

export type FunctionReaders<TArgs extends Record<string, GoboxPrimitiveType>> =
  {
    [K in keyof TArgs]: PrimitiveReaderForType<TArgs[K]>
  }

export interface UseFunctionOptions<
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike,
> {
  name: string
  args: TArgs
  returns: TReturn
  warp?: boolean
  body: (ctx: {
    args: FunctionReaders<NormalizeFunctionArgs<TArgs>>
    returning(
      value: PrimitiveInputForType<NormalizeFunctionReturn<TReturn>>,
    ): GoboxReturningToken<NormalizeFunctionReturn<TReturn>>
  }) => GoboxReturningToken<NormalizeFunctionReturn<TReturn>> | undefined
}

export interface GoboxFunctionDefinition<
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike,
> {
  readonly name: string
  readonly args: TArgs
  readonly returns: TReturn
  readonly procedure: ReturnType<typeof defineProcedure>
  call(
    args: FunctionCallArgs<NormalizeFunctionArgs<TArgs>>,
  ): ScopedValueFromType<NormalizeFunctionReturn<TReturn>>
}

type UseFunctionInput<
  TArgs extends FunctionArgSpec = FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike = GoboxPrimitiveTypeLike,
> = Omit<UseFunctionOptions<TArgs, TReturn>, 'name'> & {
  name?: string
}

type UseFunctionInputLike<
  TArgs extends FunctionArgSpec = FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike = GoboxPrimitiveTypeLike,
> = {
  name?: string
  args: TArgs
  returns: TReturn
  body: unknown
}

type NormalizeImplMethod<TMethod> =
  TMethod extends GoboxFunctionDefinition<infer TArgs, infer TReturn>
    ? GoboxFunctionDefinition<TArgs, TReturn>
    : TMethod extends UseFunctionInputLike<infer TArgs, infer TReturn>
      ? GoboxFunctionDefinition<TArgs, TReturn>
      : TMethod

type NormalizeImplMethods<TMethods extends Record<string, unknown>> = {
  [K in keyof TMethods]: NormalizeImplMethod<TMethods[K]>
}

class GoboxReturningToken<TReturn extends GoboxPrimitiveType> {
  readonly scopeId: number
  readonly value: PrimitiveInputForType<TReturn>

  constructor(scopeId: number, value: PrimitiveInputForType<TReturn>) {
    this.scopeId = scopeId
    this.value = value
  }
}

type StructFieldsFromFactory<TStruct extends GoboxStructTypeFactory<any>> =
  TStruct extends GoboxStructTypeFactory<infer TFields> ? TFields : never

type StructInitialFromFactory<TStruct extends GoboxStructTypeFactory<any>> =
  GoboxStructInitial<StructFieldsFromFactory<TStruct>>

type StructInstanceFromFactory<TStruct extends GoboxStructTypeFactory<any>> =
  GoboxStructType<StructFieldsFromFactory<TStruct>>

export type GoboxImplTypeFactory<
  TStruct extends GoboxStructTypeFactory<any>,
  TMethods extends Record<string, unknown>,
> = {
  (
    initial?: StructInitialFromFactory<TStruct>,
  ): StructInstanceFromFactory<TStruct> & {
    methods: NormalizeImplMethods<TMethods>
  }
  new (
    initial?: StructInitialFromFactory<TStruct>,
  ): StructInstanceFromFactory<TStruct> & {
    methods: NormalizeImplMethods<TMethods>
  }
} & StructInstanceFromFactory<TStruct> & {
    methods: NormalizeImplMethods<TMethods>
  }

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object'
}

const isFunctionDefinitionLike = (
  value: unknown,
): value is GoboxFunctionDefinition<
  FunctionArgSpec,
  GoboxPrimitiveTypeLike
> => {
  if (!isObjectRecord(value)) {
    return false
  }
  return 'procedure' in value && typeof value.call === 'function'
}

const isPrimitiveTypeLike = (
  value: unknown,
): value is GoboxPrimitiveTypeLike => {
  return typeof value === 'function' || isPrimitiveType(value as GoboxTypeAny)
}

const isUseFunctionInput = (
  value: unknown,
): value is UseFunctionInput<FunctionArgSpec, GoboxPrimitiveTypeLike> => {
  if (!isObjectRecord(value)) {
    return false
  }
  return (
    !('procedure' in value) &&
    isObjectRecord(value.args) &&
    isPrimitiveTypeLike(value.returns) &&
    typeof value.body === 'function'
  )
}

const normalizePrimitiveType = <TType extends GoboxPrimitiveTypeLike>(
  type: TType,
): NormalizeFunctionReturn<TType> => {
  if (typeof type === 'function') {
    return type() as NormalizeFunctionReturn<TType>
  }
  return type as NormalizeFunctionReturn<TType>
}

const normalizeFunctionArgs = <TArgs extends FunctionArgSpec>(
  args: TArgs,
): NormalizeFunctionArgs<TArgs> => {
  const normalized = {} as NormalizeFunctionArgs<TArgs>
  for (const [name, type] of Object.entries(args) as Array<
    [keyof TArgs, TArgs[keyof TArgs]]
  >) {
    normalized[name] = normalizePrimitiveType(type)
  }
  return normalized
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

const fallbackPrimitiveByType = <TType extends GoboxPrimitiveType>(
  type: TType,
): PrimitiveInputForType<TType> => {
  switch (type.tag) {
    case 'number':
      return 0 as PrimitiveInputForType<TType>
    case 'string':
      return '' as PrimitiveInputForType<TType>
    case 'boolean':
      return false as PrimitiveInputForType<TType>
    default: {
      const exhaustiveType: never = type
      void exhaustiveType
      throw new Error('unsupported primitive type')
    }
  }
}

const setScopedPrimitiveValue = <TType extends GoboxPrimitiveType>(
  scopedValue: ScopedValueFromType<TType>,
  next: PrimitiveInputForType<TType>,
): void => {
  ;(scopedValue as unknown as { set(value: PrimitiveSource<never>): void }).set(
    next as PrimitiveSource<never>,
  )
}

export const useFunction = <
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike,
>(
  options: UseFunctionOptions<TArgs, TReturn>,
): GoboxFunctionDefinition<TArgs, TReturn> => {
  assertRunTopLevel('useFunction')

  const runtime = getRuntimeForCurrentTarget()
  const normalizedArgs = normalizeFunctionArgs(options.args)
  const normalizedReturn = normalizePrimitiveType(options.returns)
  type NormalizedArgs = NormalizeFunctionArgs<TArgs>
  type NormalizedReturn = NormalizeFunctionReturn<TReturn>
  const argEntries = Object.entries(normalizedArgs) as Array<
    [keyof NormalizedArgs, NormalizedArgs[keyof NormalizedArgs]]
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

      const readers = {} as FunctionReaders<NormalizedArgs>
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
              NormalizedArgs[typeof name]
            >['get'] extends () => infer T
              ? T
              : never,
        } as FunctionReaders<NormalizedArgs>[typeof name]
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
      const returnSlot = __unsafe_createScopedValueFromPointer(
        runtime,
        normalizedReturn,
        pointer,
      )
      const bodyScope = __unstable_getBuildScopeFrame()
      if (!bodyScope) {
        throw new Error('useFunction body must be built inside a stack scope')
      }
      let nextReturn = fallbackPrimitiveByType(normalizedReturn)
      const issuedTokens: Array<GoboxReturningToken<NormalizedReturn>> = []

      const returning = (
        value: PrimitiveInputForType<NormalizedReturn>,
      ): GoboxReturningToken<NormalizedReturn> => {
        const currentScope = __unstable_getBuildScopeFrame()
        const token = new GoboxReturningToken(currentScope?.id ?? -1, value)
        issuedTokens.push(token)
        return token
      }

      const bodyResult = options.body({
        args: readers,
        returning,
      })

      if (issuedTokens.length > 0) {
        if (!(bodyResult instanceof GoboxReturningToken)) {
          throw new Error(
            'returning() must be used as `return returning(...)` in useFunction body',
          )
        }
        if (!issuedTokens.includes(bodyResult)) {
          throw new Error(
            'returning() must be used as `return returning(...)` in useFunction body',
          )
        }
        if (
          bodyResult.scopeId !== bodyScope.id ||
          issuedTokens.some((token) => token !== bodyResult)
        ) {
          throw new Error(
            'returning() must be called once at useFunction body top-level and returned directly',
          )
        }
        nextReturn = bodyResult.value
      }
      setScopedPrimitiveValue(returnSlot, nextReturn)
      return undefined
    },
    options.warp ?? false,
  )

  const call = (
    args: FunctionCallArgs<NormalizedArgs>,
  ): ScopedValueFromType<NormalizedReturn> => {
    const destination = useScopedValue(normalizedReturn)
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

export const defineImpl = <
  TStruct extends GoboxStructTypeFactory<any>,
  TMethods extends Record<string, unknown>,
>(
  type: TStruct,
  methods: TMethods,
): GoboxImplTypeFactory<TStruct, TMethods> => {
  const base = type()
  let cachedMethods: NormalizeImplMethods<TMethods> | undefined
  const resolveMethods = (): NormalizeImplMethods<TMethods> => {
    if (!cachedMethods) {
      cachedMethods = normalizeImplMethods(methods)
    }
    return cachedMethods
  }
  const implFactory = Object.assign(function Impl(
    initial?: StructInitialFromFactory<TStruct>,
  ): StructInstanceFromFactory<TStruct> & {
    methods: NormalizeImplMethods<TMethods>
  } {
    const instance = type(
      initial,
    ) as unknown as StructInstanceFromFactory<TStruct>
    return {
      ...instance,
      methods: resolveMethods(),
    }
  }, base)
  Object.defineProperty(implFactory, 'methods', {
    enumerable: true,
    get: resolveMethods,
  })
  return implFactory as GoboxImplTypeFactory<TStruct, TMethods>
}

export const useImpl = <
  TStruct extends GoboxStructTypeFactory<any>,
  TMethods extends Record<string, unknown>,
>(
  type: TStruct,
  methods: TMethods,
): StructInstanceFromFactory<TStruct> & {
  methods: NormalizeImplMethods<TMethods>
} => {
  return defineImpl(type, methods)()
}
