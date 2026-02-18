import { InputType, Shadow } from 'sb3-types/enum'
import { fromBooleanSource, fromPrimitiveSource } from '../core/block-helper'
import { attachStack, block, valueBlock } from '../core/composer'
import type { HikkakuBlock, PrimitiveSource } from '../core/types'

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
 * Creates a label fragment used in `defineProcedure`.
 *
 * @param text Static text shown in the custom block signature.
 * @returns A procedure fragment describing a label segment.
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
 * Creates a boolean argument fragment used in `defineProcedure`.
 *
 * @param name Argument name shown in the custom block signature.
 * @returns A procedure fragment describing a boolean input.
 * @example
 * ```ts
 * import { procedureBoolean } from 'hikkaku/blocks'
 *
 * procedureBoolean('flag')
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
 * Creates a string/number argument fragment used in `defineProcedure`.
 *
 * @param name Argument name shown in the custom block signature.
 * @returns A procedure fragment describing a string/number input.
 * @example
 * ```ts
 * import { procedureStringOrNumber } from 'hikkaku/blocks'
 *
 * procedureStringOrNumber('value')
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

export interface ProcedureReferenceBase {
  isProcedureArgument: true

  name: string
  type: 'boolean' | 'stringOrNumber'
  id: string

  /**
   * Creates a reporter block for this argument reference.
   */
  getter(): HikkakuBlock
}
export interface ProcedureBooleanReference extends ProcedureReferenceBase {
  type: 'boolean'
}
export interface ProcedureStringOrNumberReference
  extends ProcedureReferenceBase {
  type: 'stringOrNumber'
}
export type ProcedureReference =
  | ProcedureBooleanReference
  | ProcedureStringOrNumberReference

export interface ProcedureDefinitionReference<
  T extends ProcedureProc[] = ProcedureProc[],
> {
  type: 'procedure'
  proccode: string
  warp: boolean
  argumentids: string[]
  arguments: ReferencesByProcs<T>
}

export type ProcedureCallInput = {
  reference: ProcedureReference
  value: PrimitiveSource<string | number | boolean>
}

export interface ProcedureDefinition<
  T extends ProcedureProc[] = ProcedureProc[],
> extends HikkakuBlock {
  reference: ProcedureDefinitionReference<T>
}

type ReferencesByProcs<T extends ProcedureProc[]> = {
  [K in OnlyArgProc<T[number]>['name']]: OnlyArgProc<T[number]> extends {
    type: infer U
  }
    ? U extends 'boolean'
      ? ProcedureBooleanReference
      : U extends 'stringOrNumber'
        ? ProcedureStringOrNumberReference
        : never
    : never
}

/**
 * Defines a custom procedure and returns its definition block.
 *
 * @param proclist List of procedure parts (labels and arguments) that define the procedure's signature.
 * @param stack Optional callback that composes the procedure body. Return `undefined` from this callback (implicit return is fine).
 * Argument references include `getter()` to create reporter blocks.
 * @param warp If `true`, run the procedure without screen refresh until completion.
 * @returns A procedure definition block with `reference` metadata for safe calls.
 * @example
 * ```ts
 * import { defineProcedure, procedureLabel, procedureStringOrNumber, say } from 'hikkaku/blocks'
 *
 * const greet = defineProcedure(
 *   [procedureLabel('greet'), procedureStringOrNumber('name')],
 *   ({ name }) => {
 *     say(name.getter())
 *   },
 * )
 * ```
 */
export const defineProcedure = <T extends ProcedureProc[]>(
  proclist: T,
  // specify returning undefined to avoid returning value in procedure body
  stack?: (references: ReferencesByProcs<T>) => undefined,
  /**
   * If true, the procedure will run without screen refresh until it completes.
   * This can make the procedure run faster, but the screen will not update until the procedure is done.
   */
  warp = false,
): ProcedureDefinition<T> => {
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

  const argumentProcs = proclist.filter((proc) => proc.type !== 'label')

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
      custom_block: [Shadow.SameBlockShadow, prototype.id],
    },
    topLevel: true,
  })
  const references = Object.fromEntries(
    argumentProcs.map((proc, index) => {
      const argumentid = argumentids[index]
      if (!argumentid) {
        throw new Error('Argument ID not found')
      }
      let reference: ProcedureReference
      if (proc.type === 'boolean') {
        const boolReference: ProcedureBooleanReference = {
          isProcedureArgument: true as const,
          name: proc.name,
          type: proc.type,
          id: argumentid,
          getter: () => argumentReporterBoolean(boolReference),
        }
        reference = boolReference
      } else if (proc.type === 'stringOrNumber') {
        const strNumReference: ProcedureStringOrNumberReference = {
          isProcedureArgument: true as const,
          name: proc.name,
          type: proc.type,
          id: argumentid,
          getter: () => argumentReporterStringNumber(strNumReference),
        }
        reference = strNumReference
      } else {
        throw new Error('Unknown procedure proc type')
      }
      return [proc.name, reference]
    }),
  ) as ReferencesByProcs<T>

  const reference: ProcedureDefinitionReference<T> = {
    type: 'procedure',
    proccode,
    argumentids,
    warp,
    arguments: references,
  }

  if (stack) {
    attachStack(definition.id, () => {
      stack(references)
    })
  }

  return {
    ...definition,
    reference,
  }
}

/**
 * Calls a custom procedure.
 * Supports three call styles:
 * 1) Low-level: `callProcedure(proccode, argumentIds, inputs?, warp?)`
 * 2) Reference + array: `callProcedure(definitionOrReference, [{ reference, value }], warp?)`
 * 3) Reference + object: `callProcedure(definitionOrReference, { [argumentId]: value }, warp?)`
 *
 * @param proccodeOrReference Procedure code or the definition/reference returned by `defineProcedure`.
 * @param argumentIdsOrInputs Argument IDs for low-level calls, or argument inputs for reference-based calls.
 * @param inputsOrWarp Optional low-level inputs object or a warp override for reference-based calls.
 * @param warp Warp flag used by low-level calls.
 * @returns A `procedures_call` block.
 * @example
 * ```ts
 * import { callProcedure, defineProcedure, procedureLabel, procedureStringOrNumber } from 'hikkaku/blocks'
 *
 * const greet = defineProcedure([
 *   procedureLabel('greet'),
 *   procedureStringOrNumber('name'),
 * ])
 *
 * callProcedure(greet, [
 *   { reference: greet.reference.arguments.name, value: 'Ada' },
 * ])
 * ```
 */
export const callProcedure = (
  proccodeOrReference:
    | string
    | ProcedureDefinitionReference
    | ProcedureDefinition,
  argumentIdsOrInputs:
    | string[]
    | ProcedureCallInput[]
    | Record<string, PrimitiveSource<string | number | boolean>>,
  inputsOrWarp?:
    | Record<string, PrimitiveSource<string | number | boolean>>
    | boolean,
  warp = false,
) => {
  let proccode = ''
  let argumentIds: string[] = []
  let inputs: Record<string, PrimitiveSource<string | number | boolean>> = {}
  let procedureReference: ProcedureDefinitionReference | null = null

  if (typeof proccodeOrReference === 'string') {
    proccode = proccodeOrReference
    argumentIds = argumentIdsOrInputs as string[]
    inputs = (typeof inputsOrWarp === 'object' ? inputsOrWarp : undefined) ?? {}
    warp = typeof inputsOrWarp === 'boolean' ? inputsOrWarp : warp
  } else {
    procedureReference =
      'reference' in proccodeOrReference
        ? proccodeOrReference.reference
        : proccodeOrReference

    proccode = procedureReference.proccode
    argumentIds = procedureReference.argumentids
    warp =
      typeof inputsOrWarp === 'boolean' ? inputsOrWarp : procedureReference.warp

    if (
      Array.isArray(argumentIdsOrInputs) &&
      argumentIdsOrInputs.every(
        (input): input is ProcedureCallInput =>
          typeof input === 'object' &&
          input !== null &&
          'reference' in input &&
          'value' in input,
      )
    ) {
      for (const input of argumentIdsOrInputs) {
        inputs[input.reference.id] = input.value
      }
    } else if (!Array.isArray(argumentIdsOrInputs)) {
      inputs = argumentIdsOrInputs
    }
  }

  // Build argument type map for proper input conversion
  const argumentTypeMap: Record<string, 'boolean' | 'stringOrNumber'> = {}
  if (procedureReference) {
    for (const arg of Object.values(procedureReference.arguments)) {
      argumentTypeMap[arg.id] = arg.type
    }
  }

  const resolvedInputs: Record<
    string,
    ReturnType<typeof fromPrimitiveSource>
  > = {}
  for (const [key, value] of Object.entries(inputs)) {
    if (argumentTypeMap[key] === 'boolean') {
      resolvedInputs[key] = fromBooleanSource(value as PrimitiveSource<boolean>)
    } else {
      resolvedInputs[key] = fromPrimitiveSource(
        InputType.String,
        value as PrimitiveSource<string | number>,
        '',
      )
    }
  }
  return block('procedures_call', {
    inputs: resolvedInputs,
    mutation: {
      tagName: 'mutation',
      children: [],
      proccode,
      argumentids: JSON.stringify(argumentIds),
      warp,
    },
  })
}

/**
 * Creates a reporter block for a string/number procedure argument.
 *
 * @param reference String/number argument reference from `defineProcedure`.
 * @returns A reporter block that reads the current argument value.
 * @example
 * ```ts
 * import { argumentReporterStringNumber } from 'hikkaku/blocks'
 *
 * argumentReporterStringNumber({
 *   isProcedureArgument: true,
 *   name: 'value',
 *   type: 'stringOrNumber',
 *   id: 'var-id',
 *   getter: () => valueBlock('argument_reporter_string_number', { fields: { VALUE: ['value', null] } }),
 * })
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
 * Creates a reporter block for a boolean procedure argument.
 *
 * @param reference Boolean argument reference from `defineProcedure`.
 * @returns A reporter block that reads the current argument value.
 * @example
 * ```ts
 * import { argumentReporterBoolean } from 'hikkaku/blocks'
 *
 * argumentReporterBoolean({
 *   isProcedureArgument: true,
 *   name: 'flag',
 *   type: 'boolean',
 *   id: 'flag-id',
 *   getter: () => valueBlock('argument_reporter_boolean', { fields: { VALUE: ['flag', null] } }),
 * })
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
