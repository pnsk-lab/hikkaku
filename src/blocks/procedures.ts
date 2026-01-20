import { fromPrimitiveSource } from "../compiler/block-helper"
import { block } from "../compiler/composer"
import type { PrimitiveSource } from "../compiler/types"

export type ProcedureArgumentDefault = string | boolean

export const defineProcedure = (
  proccode: string,
  argumentNames: string[],
  argumentDefaults: ProcedureArgumentDefault[],
  warp = false,
  stack?: () => void
) => {
  const prototype = block('procedures_prototype', {
    mutation: {
      tagName: 'mutation',
      children: [],
      proccode,
      argumentnames: JSON.stringify(argumentNames),
      argumentdefaults: argumentDefaults,
      warp
    }
  })
  const definition = block('procedures_definition', {
    inputs: {
      custom_block: [1, prototype.id]
    },
    topLevel: true
  })
  stack?.()
  return definition
}

export const callProcedure = (
  proccode: string,
  argumentIds: string[],
  inputs: Record<string, PrimitiveSource<string | number | boolean>>,
  warp = false
) => {
  const resolvedInputs: Record<string, ReturnType<typeof fromPrimitiveSource>> = {}
  for (const [key, value] of Object.entries(inputs)) {
    resolvedInputs[key] = fromPrimitiveSource(value)
  }
  return block('procedures_call', {
    inputs: resolvedInputs,
    mutation: {
      tagName: 'mutation',
      children: [],
      proccode,
      argumentids: JSON.stringify(argumentIds),
      warp
    }
  })
}

export const argumentReporterStringNumber = (name: string) => {
  return block('argument_reporter_string_number', {
    fields: {
      VALUE: [name, null]
    }
  })
}

export const argumentReporterBoolean = (name: string) => {
  return block('argument_reporter_boolean', {
    fields: {
      VALUE: [name, null]
    }
  })
}
