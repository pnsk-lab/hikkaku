import { fromPrimitiveSource } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type { PrimitiveSource } from '../core/types'

export type ProcedureArgumentDefault = string | boolean

export interface ProcedureProcLabel {
  type: 'label'
  text: string
}
export interface ProcedureProcBoolean<T = string> {
  type: 'boolean'
  name: T
}
export interface ProcedureProcStringOrNumber<T = string> {
  type: 'stringOrNumber'
  name: T
}
export type ProcedureProc =
  | ProcedureProcLabel
  | ProcedureProcBoolean
  | ProcedureProcStringOrNumber

/**
 * Label fragment for custom block.
 *
 * Input: `text`.
 * Output: Procedure signature fragment object used to define custom block labels (not a Scratch block).
 *
 * @param text See function signature for accepted input values.
 * @returns Procedure signature fragment object used to define custom block labels.
 * @example
 * ```ts
 * import { procedureLabel } from 'hikkaku/blocks'
 *
 * procedureLabel('Hello')
 * ```
 */
export const procedureLabel = (text: string): ProcedureProcLabel => {
  return {
    type: 'label',
    text,
  }
}

/**
 * Boolean argument fragment.
 *
 * Input: `name`.
 * Output: Procedure signature fragment object used to define boolean arguments in custom blocks (not a Scratch block).
 *
 * @param name See function signature for accepted input values.
 * @returns Procedure signature fragment object used to define boolean arguments in custom blocks.
 * @example
 * ```ts
 * import { procedureBoolean } from 'hikkaku/blocks'
 *
 * procedureBoolean(undefined as any)
 * ```
 */
export const procedureBoolean = <T extends string>(
  name: T,
): ProcedureProcBoolean<T> => {
  return {
    type: 'boolean',
    name,
  }
}

/**
 * String/number argument fragment.
 *
 * Input: `name`.
 * Output: Procedure signature fragment object used to define string/number arguments in custom blocks (not a Scratch block).
 *
 * @param name See function signature for accepted input values.
 * @returns Procedure signature fragment object used to define string/number arguments in custom blocks.
 * @example
 * ```ts
 * import { procedureStringOrNumber } from 'hikkaku/blocks'
 *
 * procedureStringOrNumber(undefined as any)
 * ```
 */
export const procedureStringOrNumber = <T extends string>(
  name: T,
): ProcedureProcStringOrNumber<T> => {
  return {
    type: 'stringOrNumber',
    name,
  }
}

type OnlyArgProc<T> = T extends { type: 'label' } ? never : T
type ProcedureArgumentProc = OnlyArgProc<ProcedureProc>
type ProcedureArgumentName<T extends readonly ProcedureProc[]> = OnlyArgProc<
  T[number]
>['name']
type ProcedureArgumentProcByName<
  T extends readonly ProcedureProc[],
  Name extends ProcedureArgumentName<T>,
> = Extract<OnlyArgProc<T[number]>, { name: Name }>

export interface ProcedureReferenceBase {
  isProcedureArgument: true

  name: string
  type: 'boolean' | 'stringOrNumber'
  id: string
}
export interface ProcedureBooleanReference extends ProcedureReferenceBase {
  type: 'boolean'
}
export interface ProcedureStringOrNumberReference
  extends ProcedureReferenceBase {
  type: 'stringOrNumber'
}
export type ProcedureArgumentReference =
  | ProcedureBooleanReference
  | ProcedureStringOrNumberReference
export type ProcedureReference = ProcedureArgumentReference

type ProcedureArgumentReferenceByProc<T extends ProcedureArgumentProc> =
  T extends ProcedureProcBoolean
    ? ProcedureBooleanReference
    : T extends ProcedureProcStringOrNumber
      ? ProcedureStringOrNumberReference
      : never

type ReferencesByProcs<T extends readonly ProcedureProc[]> = {
  [Name in ProcedureArgumentName<T>]: ProcedureArgumentReferenceByProc<
    ProcedureArgumentProcByName<T, Name>
  >
}

type ProcedureCallInputByReference<T extends ProcedureArgumentReference> =
  T extends ProcedureBooleanReference
    ? PrimitiveSource<boolean>
    : PrimitiveSource<string | number>

export type ProcedureCallInputs<T extends readonly ProcedureProc[]> = {
  [Name in keyof ReferencesByProcs<T>]: ProcedureCallInputByReference<
    ReferencesByProcs<T>[Name]
  >
}

export interface ProcedureDefinitionReference<
  T extends readonly ProcedureProc[] = ProcedureProc[],
> {
  type: 'procedure'
  id: string
  proccode: string
  argumentIds: string[]
  arguments: ReferencesByProcs<T>
  warp: boolean
}

/**
 * Defines a custom procedure.
 *
 * Input: `proclist`, `stack?`, `warp?`.
 * Output: Procedure definition reference.
 *
 * @param proclist List of procedure parts (labels and arguments) that define the procedure's signature.
 * @param stack Optional callback that receives references to the procedure arguments and composes the body of the procedure.
 * @param warp Optional flag (default `false`). If true, the procedure will run without screen refresh until it completes.
 * @returns Procedure definition reference that can be passed to {@link callProcedure}.
 * @example
 * ```ts
 * import { defineProcedure } from 'hikkaku/blocks'
 *
 * defineProcedure(list as any, () => {}, true)
 * ```
 */
export const defineProcedure = <T extends ProcedureProc[]>(
  proclist: T,
  stack?: (references: ReferencesByProcs<T>) => void,
  /**
   * If true, the procedure will run without screen refresh until it completes.
   * This can make the procedure run faster, but the screen will not update until the procedure is done.
   */
  warp = false,
) => {
  const proccode = proclist
    .map((proc) => {
      switch (proc.type) {
        case 'label':
          return proc.text
        case 'boolean':
          return '%b'
        case 'stringOrNumber':
          return '%s'
        default:
          throw new Error('Unknown procedure proc type')
      }
    })
    .join(' ')

  const argumentProcs = proclist.filter(
    (proc): proc is ProcedureArgumentProc => proc.type !== 'label',
  )
  const seenArgumentNames = new Set<string>()
  for (const proc of argumentProcs) {
    if (seenArgumentNames.has(proc.name)) {
      throw new Error(`Duplicate procedure argument name: ${proc.name}`)
    }
    seenArgumentNames.add(proc.name)
  }

  const argumentids = argumentProcs.map(() => {
    // Generate a random ID for each argument
    return Math.random().toString(36).substring(2, 15)
  })
  const argumentnames = argumentProcs.map((proc) => {
    return proc.name
  })
  const argumentdefaults = argumentProcs.map((proc) => {
    switch (proc.type) {
      case 'boolean':
        return 'false'
      case 'stringOrNumber':
        return ''
      default:
        throw new Error('Unknown procedure proc type')
    }
  })

  const prototype = block('procedures_prototype', {
    mutation: {
      tagName: 'mutation',
      children: [],
      proccode,
      argumentids: JSON.stringify(argumentids),
      argumentnames: JSON.stringify(argumentnames),
      argumentdefaults: JSON.stringify(argumentdefaults) as unknown as (
        | string
        | boolean
      )[],
      warp: warp.toString() as 'true' | 'false',
    },
    isShadow: true,
  })

  const definition = block('procedures_definition', {
    inputs: {
      custom_block: [1, prototype.id],
    },
    topLevel: true,
  })
  const references = Object.fromEntries(
    argumentProcs.map((proc, index) => {
      return [
        proc.name,
        {
          isProcedureArgument: true,
          name: proc.name,
          type: proc.type,
          id: argumentids[index],
        } as ProcedureArgumentReference,
      ]
    }),
  ) as ReferencesByProcs<T>

  if (stack) {
    attachStack(definition.id, () => {
      stack(references)
    })
  }

  return {
    type: 'procedure',
    id: definition.id,
    proccode,
    argumentIds: argumentids,
    arguments: references,
    warp,
  } satisfies ProcedureDefinitionReference<T>
}

/**
 * Calls a custom procedure.
 *
 * Input: `procedure`, `inputs`, `warp?`.
 * Output: Scratch statement block definition that is appended to the current script stack.
 *
 * @param procedure See function signature for accepted input values.
 * @param inputs See function signature for accepted input values.
 * @param warp Optional override for procedure warp mode. Defaults to the procedure definition warp flag.
 * @returns Scratch statement block definition that is appended to the current script stack.
 * @example
 * ```ts
 * import { callProcedure } from 'hikkaku/blocks'
 *
 * callProcedure(procedure as any, {} as any)
 * ```
 */
export const callProcedure = <T extends readonly ProcedureProc[]>(
  procedure: ProcedureDefinitionReference<T>,
  inputs: ProcedureCallInputs<T>,
  warp = procedure.warp,
) => {
  const resolvedInputs: Record<
    string,
    ReturnType<typeof fromPrimitiveSource>
  > = {}

  const argumentNames = Object.keys(procedure.arguments)
  for (const argumentName of argumentNames) {
    if (!(argumentName in inputs)) {
      throw new Error(`Missing procedure argument input: ${argumentName}`)
    }
  }
  for (const inputName of Object.keys(inputs)) {
    if (!(inputName in procedure.arguments)) {
      throw new Error(`Unknown procedure argument input: ${inputName}`)
    }
  }

  for (const [argumentName, argumentReference] of Object.entries(
    procedure.arguments,
  ) as [string, ProcedureArgumentReference][]) {
    const value = (
      inputs as Record<string, PrimitiveSource<string | number | boolean>>
    )[argumentName]
    if (value === undefined) {
      throw new Error(`Missing procedure argument input: ${argumentName}`)
    }
    resolvedInputs[argumentReference.id] = fromPrimitiveSource(value)
  }

  return block('procedures_call', {
    inputs: resolvedInputs,
    mutation: {
      tagName: 'mutation',
      children: [],
      proccode: procedure.proccode,
      argumentids: JSON.stringify(procedure.argumentIds),
      warp,
    },
  })
}

/**
 * Reporter for string/number argument.
 *
 * Input: `reference`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param reference See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { argumentReporterStringNumber } from 'hikkaku/blocks'
 *
 * argumentReporterStringNumber(reference as any)
 * ```
 */
export const argumentReporterStringNumber = (
  reference: ProcedureStringOrNumberReference,
) => {
  return valueBlock('argument_reporter_string_number', {
    fields: {
      VALUE: [reference.name, null],
    },
  })
}

/**
 * Reporter for boolean argument.
 *
 * Input: `reference`.
 * Output: Scratch reporter block definition that can be used as an input value in other blocks.
 *
 * @param reference See function signature for accepted input values.
 * @returns Scratch reporter block definition that can be used as an input value in other blocks.
 * @example
 * ```ts
 * import { argumentReporterBoolean } from 'hikkaku/blocks'
 *
 * argumentReporterBoolean(reference as any)
 * ```
 */
export const argumentReporterBoolean = (
  reference: ProcedureBooleanReference,
) => {
  return valueBlock('argument_reporter_boolean', {
    fields: {
      VALUE: [reference.name, null],
    },
    isShadow: false,
  })
}
