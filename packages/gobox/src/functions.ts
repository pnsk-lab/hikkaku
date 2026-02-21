import type {
  HikkakuBool,
  HikkakuNumber,
  HikkakuReporterBlock,
  HikkakuString,
  PrimitiveSource,
} from 'hikkaku'
import { __unstable_getBuildScopeFrame } from 'hikkaku'
import {
  add,
  callProcedure,
  defineProcedure,
  equals,
  ifThen,
  procedureBoolean,
  procedureLabel,
  procedureStringOrNumber,
} from 'hikkaku/blocks'
import { IMPL_CONSTRUCTOR_SYMBOL, IMPL_METHODS_SYMBOL } from './internal/impl'
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
  makeScopedValueFromType,
  type ScopedValueFromType,
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
    ? PrimitiveSource<HikkakuBool>
    : TType extends GoboxNumberType
      ? PrimitiveSource<HikkakuNumber>
      : PrimitiveSource<HikkakuString | HikkakuNumber>

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

export interface DefineFunctionOptions<
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike,
> {
  name: string
  args: TArgs
  returns: TReturn
  warp?: boolean
  body: (ctx: {
    args: FunctionReaders<NormalizeFunctionArgs<NoInfer<TArgs>>>
    returning(
      value: PrimitiveInputForType<NormalizeFunctionReturn<NoInfer<TReturn>>>,
    ): GoboxReturningToken<NormalizeFunctionReturn<NoInfer<TReturn>>>
  }) => GoboxReturningToken<NormalizeFunctionReturn<NoInfer<TReturn>>> | void
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

type DefineFunctionInput<
  TArgs extends FunctionArgSpec = FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike = GoboxPrimitiveTypeLike,
> = Omit<DefineFunctionOptions<TArgs, TReturn>, 'name'> & {
  name?: string
}

type StructFields = Record<string, GoboxTypeAny>

class GoboxReturningToken<TReturn extends GoboxPrimitiveType> {
  readonly scopeId: number
  readonly value: PrimitiveInputForType<TReturn>

  constructor(scopeId: number, value: PrimitiveInputForType<TReturn>) {
    this.scopeId = scopeId
    this.value = value
  }
}

type StructInitial<TFields extends StructFields> = GoboxStructInitial<TFields>

type StructInstance<TFields extends StructFields> = GoboxStructType<TFields>

type ImplSelf<TFields extends StructFields> = ScopedValueFromType<
  StructInstance<TFields>
>

type UseImplFunctionInput<
  TFields extends StructFields,
  TArgs extends FunctionArgSpec = FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike = GoboxPrimitiveTypeLike,
> = Omit<DefineFunctionOptions<TArgs, TReturn>, 'name' | 'body'> & {
  name?: string
  body: (ctx: {
    self: ImplSelf<TFields>
    args: FunctionReaders<NormalizeFunctionArgs<NoInfer<TArgs>>>
    returning(
      value: PrimitiveInputForType<NormalizeFunctionReturn<NoInfer<TReturn>>>,
    ): GoboxReturningToken<NormalizeFunctionReturn<NoInfer<TReturn>>>
  }) => GoboxReturningToken<NormalizeFunctionReturn<NoInfer<TReturn>>> | void
}

type UseImplFunctionOptions<
  TFields extends StructFields,
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike,
> = Omit<UseImplFunctionInput<TFields, TArgs, TReturn>, 'name'> & {
  name: string
  selfType: StructInstance<TFields>
}

type NormalizeImplMethod<TFields extends StructFields, TMethod> =
  TMethod extends GoboxFunctionDefinition<infer TArgs, infer TReturn>
    ? GoboxFunctionDefinition<TArgs, TReturn>
    : TMethod extends UseImplFunctionInput<TFields, infer TArgs, infer TReturn>
      ? GoboxFunctionDefinition<TArgs, TReturn>
      : TMethod

type NormalizeImplMethods<
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
> = {
  [K in keyof TMethods as K extends 'constructor'
    ? never
    : K]: NormalizeImplMethod<TFields, TMethods[K]>
}

type ImplConstructorHandler<TFields extends StructFields> =
  | ((ctx: { self: ImplSelf<TFields> }) => void)
  | (() => void)

type ImplConstructorInput<TFields extends StructFields> = {
  constructor?: ImplConstructorHandler<TFields> | Function
}

type ImplConstructorCompatInput = {
  // Accept Object.prototype.constructor shape for tsgo compatibility.
  constructor?: Function
}

type ImplFunctionMethodsInput<
  TFields extends StructFields,
  TArgsMap extends Record<string, FunctionArgSpec>,
  TReturnMap extends { [K in keyof TArgsMap]: GoboxPrimitiveTypeLike },
> = {
  [K in keyof TArgsMap]:
    | GoboxFunctionDefinition<TArgsMap[K], TReturnMap[K]>
    | UseImplFunctionInput<TFields, TArgsMap[K], TReturnMap[K]>
} & ImplConstructorInput<TFields>

type ImplFunctionOptionMethodsInput<
  TFields extends StructFields,
  TArgsMap extends Record<string, FunctionArgSpec>,
  TReturnMap extends { [K in keyof TArgsMap]: GoboxPrimitiveTypeLike },
> = {
  [K in keyof TArgsMap]: UseImplFunctionInput<
    TFields,
    TArgsMap[K],
    TReturnMap[K]
  >
} & ImplConstructorInput<TFields>

type ImplFunctionDefinitionMethodsInput<
  TFields extends StructFields,
  TArgsMap extends Record<string, FunctionArgSpec>,
  TReturnMap extends { [K in keyof TArgsMap]: GoboxPrimitiveTypeLike },
> = {
  [K in keyof TArgsMap]: GoboxFunctionDefinition<TArgsMap[K], TReturnMap[K]>
} & ImplConstructorInput<TFields>

type ImplFunctionOptionSpec = {
  args: unknown
  returns: unknown
}

type ImplFunctionOptionMethodsFromSpec<
  TFields extends StructFields,
  TSpecs extends Record<string, ImplFunctionOptionSpec>,
> = {
  [K in keyof TSpecs]: TSpecs[K] extends {
    args: infer TArgs extends FunctionArgSpec
    returns: infer TReturn extends GoboxPrimitiveTypeLike
  }
    ? UseImplFunctionInput<TFields, TArgs, TReturn>
    : never
} & ImplConstructorInput<TFields>

type ImplFunctionInputLike =
  | GoboxFunctionDefinition<FunctionArgSpec, GoboxPrimitiveTypeLike>
  | DefineFunctionInput<FunctionArgSpec, GoboxPrimitiveTypeLike>

type ImplNonFunctionMethodsInput<TMethods extends Record<string, unknown>> = {
  [K in keyof TMethods as K extends 'constructor'
    ? never
    : K]: TMethods[K] extends ImplFunctionInputLike ? never : unknown
}

type ImplMethodCarrier<
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
> = {
  readonly [IMPL_METHODS_SYMBOL]: NormalizeImplMethods<TFields, TMethods>
}

export type GoboxImplTypeFactory<
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
> = {
  (
    initial?: StructInitial<TFields>,
  ): StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods>
  new (
    initial?: StructInitial<TFields>,
  ): StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods>
} & StructInstance<TFields> &
  ImplMethodCarrier<TFields, TMethods> & {
    configure(
      initial?: StructInitial<TFields>,
    ): GoboxImplTypeFactory<TFields, TMethods>
    setDefaults(
      initial: StructInitial<TFields>,
    ): GoboxImplTypeFactory<TFields, TMethods>
    makeScopedValue(
      initial?: StructInitial<TFields>,
    ): ScopedValueFromType<
      StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods>
    >
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
  return isPrimitiveType(value as GoboxTypeAny)
}

const isDefineFunctionInput = (
  value: unknown,
): value is DefineFunctionInput<FunctionArgSpec, GoboxPrimitiveTypeLike> => {
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

const normalizeImplMethods = <
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
>(
  selfType: StructInstance<TFields>,
  methods: TMethods,
): NormalizeImplMethods<TFields, TMethods> => {
  const normalized: Record<string, unknown> = {}

  for (const [methodName, methodValue] of Object.entries(methods)) {
    if (methodName === 'constructor') {
      continue
    }
    if (isFunctionDefinitionLike(methodValue)) {
      normalized[methodName] = methodValue
      continue
    }
    if (isDefineFunctionInput(methodValue)) {
      normalized[methodName] = useImplFunction({
        name: methodValue.name ?? methodName,
        selfType,
        args: methodValue.args,
        returns: methodValue.returns,
        warp: methodValue.warp,
        body: methodValue.body as UseImplFunctionInput<
          TFields,
          FunctionArgSpec,
          GoboxPrimitiveTypeLike
        >['body'],
      })
      continue
    }
    normalized[methodName] = methodValue
  }

  return Object.freeze(normalized) as NormalizeImplMethods<TFields, TMethods>
}

const withImplMethods = <
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
>(
  value: StructInstance<TFields>,
  resolveMethods: () => NormalizeImplMethods<TFields, TMethods>,
  constructorBody?: (ctx: { self: ImplSelf<TFields> }) => void,
): StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods> => {
  const withMethods = {
    ...value,
  } as StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods>
  Object.defineProperty(withMethods, IMPL_METHODS_SYMBOL, {
    enumerable: false,
    get: resolveMethods,
  })
  if (constructorBody !== undefined) {
    Object.defineProperty(withMethods, IMPL_CONSTRUCTOR_SYMBOL, {
      enumerable: false,
      value: constructorBody,
    })
  }
  return Object.freeze(withMethods)
}

const assertRunTopLevel = (name: string): void => {
  const scope = __unstable_getBuildScopeFrame()
  if (!scope || scope.kind !== 'run') {
    throw new Error(`${name} must be defined at run() top-level`)
  }
}

const coerceReporterByType = (
  type: GoboxPrimitiveType,
  reporter: HikkakuReporterBlock,
): PrimitiveSource<HikkakuString | HikkakuNumber | HikkakuBool> => {
  switch (type.tag) {
    case 'number':
      return add(reporter as PrimitiveSource<HikkakuNumber>, 0)
    case 'string':
      return reporter as PrimitiveSource<HikkakuString | HikkakuNumber>
    case 'boolean':
      return reporter as PrimitiveSource<HikkakuBool>
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

export const defineFunction = <
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike,
>(
  options: DefineFunctionOptions<TArgs, TReturn>,
): GoboxFunctionDefinition<TArgs, TReturn> => {
  assertRunTopLevel('defineFunction')

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
          getter(): HikkakuReporterBlock
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
        returnPointerReporter as PrimitiveSource<HikkakuNumber>,
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
        throw new Error(
          'defineFunction body must be built inside a stack scope',
        )
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
            'returning() must be used as `return returning(...)` in defineFunction body',
          )
        }
        if (!issuedTokens.includes(bodyResult)) {
          throw new Error(
            'returning() must be used as `return returning(...)` in defineFunction body',
          )
        }
        if (
          bodyResult.scopeId !== bodyScope.id ||
          issuedTokens.some((token) => token !== bodyResult)
        ) {
          throw new Error(
            'returning() must be called once at defineFunction body top-level and returned directly',
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
    const destination = makeScopedValueFromType(normalizedReturn)
    const pointerSource = __unsafe_getPointerSource(destination)

    const inputs: Record<
      string,
      PrimitiveSource<HikkakuString | HikkakuNumber | HikkakuBool>
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
      inputs[reference.id] = value as PrimitiveSource<
        HikkakuString | HikkakuNumber | HikkakuBool
      >
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

const useImplFunction = <
  TFields extends StructFields,
  TArgs extends FunctionArgSpec,
  TReturn extends GoboxPrimitiveTypeLike,
>(
  options: UseImplFunctionOptions<TFields, TArgs, TReturn>,
): GoboxFunctionDefinition<TArgs, TReturn> => {
  assertRunTopLevel('defineImpl')

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
  proclist.push(procedureStringOrNumber('__self_ptr'))

  const procedure = defineProcedure(
    proclist,
    (rawReferences) => {
      const references = rawReferences as Record<
        string,
        {
          getter(): HikkakuReporterBlock
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
        returnPointerReporter as PrimitiveSource<HikkakuNumber>,
        0,
      )
      const returnPointer: SlotPointer = {
        kind: 'expr',
        source: returnPointerSource,
        offset: 0,
      }
      const returnSlot = __unsafe_createScopedValueFromPointer(
        runtime,
        normalizedReturn,
        returnPointer,
      )

      const selfPointerReference = references.__self_ptr
      if (!selfPointerReference) {
        throw new Error('Missing __self_ptr argument reference')
      }
      const selfPointerReporter = selfPointerReference.getter()
      // Keep hidden self pointer argument connected even when body does not use self.
      ifThen(
        equals(
          selfPointerReporter as PrimitiveSource<HikkakuString | HikkakuNumber>,
          selfPointerReporter as PrimitiveSource<HikkakuString | HikkakuNumber>,
        ),
        () => {},
      )
      const selfPointerSource =
        selfPointerReporter as PrimitiveSource<HikkakuNumber>
      const selfPointer: SlotPointer = {
        kind: 'expr',
        source: selfPointerSource,
        offset: 0,
      }
      const self = __unsafe_createScopedValueFromPointer(
        runtime,
        options.selfType,
        selfPointer,
      ) as ImplSelf<TFields>

      const bodyScope = __unstable_getBuildScopeFrame()
      if (!bodyScope) {
        throw new Error(
          'defineFunction body must be built inside a stack scope',
        )
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
        self,
        args: readers,
        returning,
      })

      if (issuedTokens.length > 0) {
        if (!(bodyResult instanceof GoboxReturningToken)) {
          throw new Error(
            'returning() must be used as `return returning(...)` in defineFunction body',
          )
        }
        if (!issuedTokens.includes(bodyResult)) {
          throw new Error(
            'returning() must be used as `return returning(...)` in defineFunction body',
          )
        }
        if (
          bodyResult.scopeId !== bodyScope.id ||
          issuedTokens.some((token) => token !== bodyResult)
        ) {
          throw new Error(
            'returning() must be called once at defineFunction body top-level and returned directly',
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
    self?: ImplSelf<TFields>,
  ): ScopedValueFromType<NormalizedReturn> => {
    if (!self) {
      throw new Error('impl method call requires bound self')
    }
    const destination = makeScopedValueFromType(normalizedReturn)
    const pointerSource = __unsafe_getPointerSource(destination)
    const selfPointerSource = __unsafe_getPointerSource(self)

    const inputs: Record<
      string,
      PrimitiveSource<HikkakuString | HikkakuNumber | HikkakuBool>
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
      inputs[reference.id] = value as PrimitiveSource<
        HikkakuString | HikkakuNumber | HikkakuBool
      >
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

    const selfReference = (
      procedure as unknown as {
        reference: {
          arguments: Record<string, { id: string }>
        }
      }
    ).reference.arguments.__self_ptr
    if (!selfReference) {
      throw new Error('internal self pointer argument is missing')
    }
    inputs[selfReference.id] = selfPointerSource

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

const defineImplInternal = <
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: TMethods & ImplConstructorCompatInput,
): GoboxImplTypeFactory<TFields, TMethods> => {
  const base = type()
  if ((base.fieldOrder as ReadonlyArray<string>).includes('methods')) {
    throw new Error('impl struct field "methods" is reserved')
  }
  const constructorCandidate = Object.hasOwn(methods, 'constructor')
    ? (methods as ImplConstructorCompatInput).constructor
    : undefined
  if (
    constructorCandidate !== undefined &&
    typeof constructorCandidate !== 'function'
  ) {
    throw new Error('impl constructor must be a function')
  }
  const constructorBody =
    typeof constructorCandidate === 'function'
      ? (ctx: { self: ImplSelf<TFields> }) => {
          ;(constructorCandidate as (...args: unknown[]) => unknown)(ctx)
        }
      : undefined

  let cachedMethods: NormalizeImplMethods<TFields, TMethods> | undefined
  const resolveMethods = (): NormalizeImplMethods<TFields, TMethods> => {
    if (!cachedMethods) {
      cachedMethods = normalizeImplMethods(base, methods)
    }
    return cachedMethods
  }

  const withImplMetadata = (
    value: StructInstance<TFields>,
  ): StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods> => {
    return withImplMethods(value, resolveMethods, constructorBody)
  }

  const baseImplType = withImplMetadata(base)

  const implFactory = Object.assign(function Impl(
    initial?: StructInitial<TFields>,
  ): StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods> {
    const instance = type(initial) as StructInstance<TFields>
    return withImplMetadata(instance)
  }, baseImplType) as GoboxImplTypeFactory<TFields, TMethods>

  const typedMethods = methods as TMethods & ImplConstructorCompatInput
  implFactory.configure = ((
    initial?: StructInitial<TFields>,
  ): GoboxImplTypeFactory<TFields, TMethods> => {
    return defineImplInternal(type.configure(initial), typedMethods)
  }) as GoboxImplTypeFactory<TFields, TMethods>['configure']
  implFactory.setDefaults = ((
    initial: StructInitial<TFields>,
  ): GoboxImplTypeFactory<TFields, TMethods> => {
    return defineImplInternal(type.setDefaults(initial), typedMethods)
  }) as GoboxImplTypeFactory<TFields, TMethods>['setDefaults']
  implFactory.makeScopedValue = ((
    initial?: StructInitial<TFields>,
  ): ScopedValueFromType<
    StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods>
  > => {
    if (initial === undefined) {
      return makeScopedValueFromType(baseImplType) as ScopedValueFromType<
        StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods>
      >
    }
    return defineImplInternal(
      type.setDefaults(initial),
      typedMethods,
    ).makeScopedValue() as ScopedValueFromType<
      StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods>
    >
  }) as GoboxImplTypeFactory<TFields, TMethods>['makeScopedValue']

  Object.defineProperty(implFactory, IMPL_METHODS_SYMBOL, {
    enumerable: false,
    get: resolveMethods,
  })
  if (constructorBody !== undefined) {
    Object.defineProperty(implFactory, IMPL_CONSTRUCTOR_SYMBOL, {
      enumerable: false,
      value: constructorBody,
    })
  }
  return Object.freeze(implFactory) as GoboxImplTypeFactory<TFields, TMethods>
}

export function defineImpl<
  TFields extends StructFields,
  const TSpecs extends { [K in keyof TSpecs]: ImplFunctionOptionSpec },
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: ImplFunctionOptionMethodsFromSpec<TFields, TSpecs>,
): GoboxImplTypeFactory<
  TFields,
  ImplFunctionOptionMethodsFromSpec<TFields, TSpecs>
>

export function defineImpl<
  TFields extends StructFields,
  const TArgsMap extends Record<string, FunctionArgSpec>,
  const TReturnMap extends { [K in keyof TArgsMap]: GoboxPrimitiveTypeLike },
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: ImplFunctionOptionMethodsInput<TFields, TArgsMap, TReturnMap>,
): GoboxImplTypeFactory<
  TFields,
  ImplFunctionOptionMethodsInput<TFields, TArgsMap, TReturnMap>
>

export function defineImpl<
  TFields extends StructFields,
  const TArgsMap extends Record<string, FunctionArgSpec>,
  const TReturnMap extends { [K in keyof TArgsMap]: GoboxPrimitiveTypeLike },
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: ImplFunctionDefinitionMethodsInput<TFields, TArgsMap, TReturnMap>,
): GoboxImplTypeFactory<
  TFields,
  ImplFunctionDefinitionMethodsInput<TFields, TArgsMap, TReturnMap>
>

export function defineImpl<
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: TMethods &
    ImplConstructorCompatInput &
    ImplNonFunctionMethodsInput<TMethods>,
): GoboxImplTypeFactory<TFields, TMethods>

export function defineImpl<
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: TMethods & ImplConstructorCompatInput,
): GoboxImplTypeFactory<TFields, TMethods> {
  return defineImplInternal(type, methods)
}

export function useImpl<
  TFields extends StructFields,
  const TSpecs extends { [K in keyof TSpecs]: ImplFunctionOptionSpec },
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: ImplFunctionOptionMethodsFromSpec<TFields, TSpecs>,
): ScopedValueFromType<
  StructInstance<TFields> &
    ImplMethodCarrier<TFields, ImplFunctionOptionMethodsFromSpec<TFields, TSpecs>>
>

export function useImpl<
  TFields extends StructFields,
  const TArgsMap extends Record<string, FunctionArgSpec>,
  const TReturnMap extends { [K in keyof TArgsMap]: GoboxPrimitiveTypeLike },
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: ImplFunctionOptionMethodsInput<TFields, TArgsMap, TReturnMap>,
): ScopedValueFromType<
  StructInstance<TFields> &
    ImplMethodCarrier<
      TFields,
      ImplFunctionOptionMethodsInput<TFields, TArgsMap, TReturnMap>
    >
>

export function useImpl<
  TFields extends StructFields,
  const TArgsMap extends Record<string, FunctionArgSpec>,
  const TReturnMap extends { [K in keyof TArgsMap]: GoboxPrimitiveTypeLike },
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: ImplFunctionDefinitionMethodsInput<TFields, TArgsMap, TReturnMap>,
): ScopedValueFromType<
  StructInstance<TFields> &
    ImplMethodCarrier<
      TFields,
      ImplFunctionDefinitionMethodsInput<TFields, TArgsMap, TReturnMap>
    >
>

export function useImpl<
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: TMethods &
    ImplConstructorCompatInput &
    ImplNonFunctionMethodsInput<TMethods>,
): ScopedValueFromType<
  StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods>
>

export function useImpl<
  TFields extends StructFields,
  TMethods extends Record<string, unknown>,
>(
  type: GoboxStructTypeFactory<TFields>,
  methods: TMethods & ImplConstructorCompatInput,
): ScopedValueFromType<
  StructInstance<TFields> & ImplMethodCarrier<TFields, TMethods>
> {
  return defineImplInternal(type, methods).makeScopedValue()
}
