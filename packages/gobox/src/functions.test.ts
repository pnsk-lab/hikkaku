import { Project } from 'hikkaku'
import {
  add,
  ifThen,
  repeat,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { defineImpl, useFunction } from './functions'
import { Bool, defineStruct, type GoboxPrimitiveType, Num, Str } from './types'

type ProcedureBlock = {
  opcode: string
  next?: string | null
  mutation?: {
    proccode?: string
  }
  inputs?: Record<string, unknown>
}

const findProcedureProccode = (
  blocks: Record<string, ProcedureBlock> | undefined,
  procedureName: string,
): string | undefined => {
  if (!blocks) {
    return undefined
  }

  const definition = Object.values(blocks).find((block) => {
    const customBlockInput = block.inputs?.custom_block
    if (
      !Array.isArray(customBlockInput) ||
      customBlockInput.length < 2 ||
      typeof customBlockInput[1] !== 'string'
    ) {
      return false
    }
    const prototype = blocks[customBlockInput[1]]
    return (
      block.opcode === 'procedures_definition' &&
      prototype?.opcode === 'procedures_prototype' &&
      typeof prototype.mutation?.proccode === 'string' &&
      prototype.mutation.proccode.startsWith(procedureName)
    )
  })
  if (!definition) {
    return undefined
  }

  const customBlockInput = definition.inputs?.custom_block
  if (
    !Array.isArray(customBlockInput) ||
    customBlockInput.length < 2 ||
    typeof customBlockInput[1] !== 'string'
  ) {
    return undefined
  }

  const prototype = blocks[customBlockInput[1]]
  return prototype?.mutation?.proccode
}

describe('gobox/functions', () => {
  test('supports statement-return custom functions', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const plusOne = useFunction({
        name: 'plusOne',
        args: {
          value: new Num(0),
        },
        returns: new Num(0),
        body: ({ args, returning }) =>
          returning(add(args.value.get() as never, 1) as never),
      })

      whenFlagClicked(() => {
        const result = plusOne.call({
          value: 3,
        })
        setVariableTo(out, result.get() as never)
      })
    })

    const stage = project
      .toScratch()
      .targets.find((entry) => entry.name === 'Stage')
    const opcodes = Object.values(stage?.blocks ?? {})
      .filter(
        (block): block is { opcode: string } =>
          typeof block === 'object' && block !== null && 'opcode' in block,
      )
      .map((block) => block.opcode)
    expect(opcodes).toContain('procedures_definition')
    expect(opcodes).toContain('procedures_call')
    expect(opcodes).toContain('data_replaceitemoflist')
    expect(out.id).toBeTruthy()
  })

  test('supports boolean function arguments', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const isEnabled = useFunction({
        name: 'isEnabled',
        args: {
          enabled: new Bool(false),
        },
        returns: new Bool(false),
        body: ({ args, returning }) => returning(args.enabled.get() as never),
      })

      whenFlagClicked(() => {
        const result = isEnabled.call({
          enabled: true,
        })
        setVariableTo(out, result.get() as never)
      })
    })

    const stage = project
      .toScratch()
      .targets.find((entry) => entry.name === 'Stage')
    const blocks = stage?.blocks as Record<string, ProcedureBlock> | undefined
    const opcodes = Object.values(blocks ?? {})
      .filter(
        (block): block is { opcode: string } =>
          typeof block === 'object' && block !== null && 'opcode' in block,
      )
      .map((block) => block.opcode)
    expect(opcodes).toContain('procedures_definition')
    expect(opcodes).toContain('procedures_call')
    expect(opcodes).toContain('data_replaceitemoflist')
    expect(findProcedureProccode(blocks, 'isEnabled')).toContain('%b')
    expect(out.id).toBeTruthy()
  })

  test('supports string function arguments', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', '')

    project.stage.run(() => {
      const prefix = useFunction({
        name: 'prefix',
        args: {
          value: new Str(''),
        },
        returns: new Str(''),
        body: ({ args, returning }) => returning(args.value.get() as never),
      })

      whenFlagClicked(() => {
        const result = prefix.call({
          value: 'hello',
        })
        setVariableTo(out, result.get() as never)
      })
    })

    const stage = project
      .toScratch()
      .targets.find((entry) => entry.name === 'Stage')
    const blocks = stage?.blocks as Record<string, ProcedureBlock> | undefined
    const opcodes = Object.values(blocks ?? {})
      .filter(
        (block): block is { opcode: string } =>
          typeof block === 'object' && block !== null && 'opcode' in block,
      )
      .map((block) => block.opcode)
    expect(opcodes).toContain('procedures_definition')
    expect(opcodes).toContain('procedures_call')
    expect(opcodes).toContain('data_replaceitemoflist')
    expect(findProcedureProccode(blocks, 'prefix')).toContain('%s')
    expect(out.id).toBeTruthy()
  })

  test('throws when calling with unknown function arguments', () => {
    const project = new Project()

    expect(() => {
      project.stage.run(() => {
        const plusOne = useFunction({
          name: 'plusOne',
          args: {
            value: new Num(0),
          },
          returns: new Num(0),
          body: ({ args, returning }) =>
            returning(add(args.value.get() as never, 1) as never),
        })

        plusOne.call({
          value: 1,
          unknown: 2,
        } as { value: number; unknown: number })
      })
    }).toThrow(/Unknown function argument: unknown/)
  })

  test('restricts useFunction to run top-level', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        whenFlagClicked(() => {
          useFunction({
            name: 'illegal',
            args: {
              value: new Num(0),
            },
            returns: new Num(0),
            body: ({ args, returning }) => returning(args.value.get() as never),
          })
        })
      })
    }).toThrow(/must be defined at run\(\) top-level/)
  })

  test('defineImpl accepts function options without useFunction wrapper', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const Counter = defineStruct({
        value: new Num(0),
      })
      const CounterImpl = defineImpl(Counter, {
        double: {
          args: {
            value: new Num(0),
          },
          returns: new Num(0),
          body: ({
            args,
            returning,
          }: {
            args: { value: { get(): number } }
            returning: (value: number) => { scopeId: number; value: number }
          }) =>
            returning(
              add(
                args.value.get() as never,
                args.value.get() as never,
              ) as never,
            ),
        },
      })
      const counter = new CounterImpl()

      whenFlagClicked(() => {
        const result = counter.methods.double.call({
          value: 3,
        })
        setVariableTo(out, result.get() as never)
      })
    })

    const stage = project
      .toScratch()
      .targets.find((entry) => entry.name === 'Stage')
    const opcodes = Object.values(stage?.blocks ?? {})
      .filter(
        (block): block is { opcode: string } =>
          typeof block === 'object' && block !== null && 'opcode' in block,
      )
      .map((block) => block.opcode)
    expect(opcodes).toContain('procedures_definition')
    expect(opcodes).toContain('procedures_call')
    expect(opcodes).toContain('data_replaceitemoflist')
    expect(out.id).toBeTruthy()
  })

  test('defineImpl accepts existing useFunction definitions', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const Counter = defineStruct({
        value: new Num(0),
      })

      const double = useFunction({
        name: 'double',
        args: {
          value: new Num(0),
        },
        returns: new Num(0),
        body: ({ args, returning }) =>
          returning(
            add(args.value.get() as never, args.value.get() as never) as never,
          ),
      })

      const CounterImpl = defineImpl(Counter, {
        double,
      })
      const counter = new CounterImpl()

      whenFlagClicked(() => {
        const result = counter.methods.double.call({
          value: 4,
        })
        setVariableTo(out, result.get() as never)
      })
    })

    const stage = project
      .toScratch()
      .targets.find((entry) => entry.name === 'Stage')
    const opcodes = Object.values(stage?.blocks ?? {})
      .filter(
        (block): block is { opcode: string } =>
          typeof block === 'object' && block !== null && 'opcode' in block,
      )
      .map((block) => block.opcode)
    expect(opcodes).toContain('procedures_definition')
    expect(opcodes).toContain('procedures_call')
    expect(opcodes).toContain('data_replaceitemoflist')
    expect(out.id).toBeTruthy()
  })

  test('defineImpl keeps method normalization result on factory and instances', () => {
    const Counter = defineStruct({
      value: new Num(0),
    })
    const CounterImpl = defineImpl(Counter, {
      marker: 'ok',
    })

    expect(CounterImpl.methods).toHaveProperty('marker', 'ok')
    expect(new CounterImpl().methods).toHaveProperty('marker', 'ok')
  })

  test('falls back to fixed primitive defaults when returning is not called', () => {
    const project = new Project()

    project.stage.run(() => {
      useFunction({
        name: 'noNumber',
        args: {},
        returns: new Num(123),
        body: () => {},
      })
      useFunction({
        name: 'noString',
        args: {},
        returns: new Str('filled'),
        body: () => {},
      })
      useFunction({
        name: 'noBoolean',
        args: {},
        returns: new Bool(true),
        body: () => {},
      })
    })

    const stage = project
      .toScratch()
      .targets.find((target) => target.name === 'Stage')
    const blocks = stage?.blocks as
      | Record<
          string,
          {
            opcode: string
            next: string | null
            mutation?: { proccode?: string }
            inputs?: Record<string, unknown>
          }
        >
      | undefined

    const fallbackLiteralFor = (procedureName: string): string | undefined => {
      if (!blocks) {
        return undefined
      }
      const definition = Object.values(blocks).find((block) => {
        const customBlockInput = block.inputs?.custom_block
        if (
          !Array.isArray(customBlockInput) ||
          customBlockInput.length < 2 ||
          typeof customBlockInput[1] !== 'string'
        ) {
          return false
        }
        const prototype = blocks[customBlockInput[1]]
        return (
          block.opcode === 'procedures_definition' &&
          prototype?.opcode === 'procedures_prototype' &&
          typeof prototype.mutation?.proccode === 'string' &&
          prototype.mutation.proccode.startsWith(procedureName)
        )
      })
      if (!definition || !definition.next) {
        return undefined
      }
      const writeBlock = blocks[definition.next]
      if (!writeBlock || writeBlock.opcode !== 'data_replaceitemoflist') {
        return undefined
      }
      const itemInput = writeBlock.inputs?.ITEM
      if (!Array.isArray(itemInput) || itemInput.length < 2) {
        return undefined
      }
      const shadowInput = itemInput[1]
      if (!Array.isArray(shadowInput) || shadowInput.length < 2) {
        return undefined
      }
      const literal = shadowInput[1]
      return typeof literal === 'string' ? literal : undefined
    }

    expect(fallbackLiteralFor('noNumber')).toBe('0')
    expect(fallbackLiteralFor('noString')).toBe('')
    expect(fallbackLiteralFor('noBoolean')).toBe('0')
  })

  test('throws when returning is used inside ifThen substack', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        useFunction({
          name: 'badIfThen',
          args: {
            value: new Num(0),
          },
          returns: new Num(0),
          body: ({ args, returning }) => {
            ifThen(true, () => {
              returning(args.value.get() as never)
            })
          },
        })
      })
    }).toThrow(/returning\(\) must/)
  })

  test('throws when returning is used inside repeat substack', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        useFunction({
          name: 'badRepeat',
          args: {
            value: new Num(0),
          },
          returns: new Num(0),
          body: ({ args, returning }) => {
            repeat(1, () => {
              returning(args.value.get() as never)
            })
          },
        })
      })
    }).toThrow(/returning\(\) must/)
  })

  test('throws when returning is called without returning from body', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        useFunction({
          name: 'missingReturnKeyword',
          args: {
            value: new Num(0),
          },
          returns: new Num(0),
          body: ({ args, returning }) => {
            returning(args.value.get() as never)
          },
        })
      })
    }).toThrow(/returning\(\) must/)
  })

  test('throws when function argument type is unsupported in coercion', () => {
    const project = new Project()

    expect(() => {
      project.stage.run(() => {
        const unsupportedType = {
          tag: 'vector',
          element: new Num(0),
          length: 2,
          width: 2,
          defaults: [0, 0],
        } as unknown as GoboxPrimitiveType
        const fn = useFunction({
          name: 'unsupportedArg',
          args: {
            value: unsupportedType,
          },
          returns: new Num(0),
          body: ({ args, returning }) => returning(args.value.get() as never),
        })
        fn.call({} as { value: number })
      })
    }).toThrow(/unsupported primitive type/)
  })

  test('throws when return type is unsupported in fallback conversion', () => {
    const project = new Project()

    expect(() => {
      project.stage.run(() => {
        const fn = useFunction({
          name: 'unsupportedReturn',
          args: {},
          returns: {
            tag: 'struct',
            fields: {},
            fieldOrder: [],
            fieldOffsets: {},
            width: 0,
            defaults: [],
          } as unknown as GoboxPrimitiveType,
          body: () => undefined,
        })
        fn.call({})
      })
    }).toThrow(/unsupported primitive type/)
  })

  test('throws when internal return pointer argument is missing', () => {
    const project = new Project()

    expect(() => {
      project.stage.run(() => {
        const fn = useFunction({
          name: 'missingRetPtr',
          args: {
            value: new Num(0),
          },
          returns: new Num(0),
          body: ({ args, returning }) => returning(args.value.get() as never),
        })

        const definition = fn as {
          procedure: {
            reference: { arguments: Record<string, { id: string }> }
          }
        }
        definition.procedure.reference.arguments.__ret_ptr = undefined as never
        fn.call({
          value: 10,
        } as { value: number })
      })
    }).toThrow(/internal return pointer argument is missing/)
  })

  test('throws when body returns non-token value', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    expect(() => {
      project.stage.run(() => {
        const fn = useFunction({
          name: 'badReturning',
          args: {
            value: new Num(0),
          },
          returns: new Num(0),
          body: ({ args, returning }) => {
            const next = returning(args.value.get() as never)
            setVariableTo(out, next.value as never)
            return returning(args.value.get() as never)
          },
        })
        fn.call({
          value: 3,
        } as { value: number })
      })
    }).toThrow(/returning\(\) must/)
  })

  test('normalizes methods through defineImpl', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const Counter = defineStruct({ value: new Num(0) })
      const CounterImpl = defineImpl(Counter, {
        double: {
          args: { value: new Num(0) },
          returns: new Num(0),
          body: ({
            args,
            returning,
          }: {
            args: { value: { get(): number } }
            returning: (value: number) => { scopeId: number; value: number }
          }) => returning(args.value.get() as never),
        },
      })
      const counter = new CounterImpl()
      const result = counter.methods.double.call({
        value: 4,
      })
      setVariableTo(out, result.get() as never)
    })

    expect(out.id).toBeTruthy()
  })

  test('keeps primitive method values unchanged during defineImpl normalization', () => {
    const project = new Project()
    project.stage.run(() => {
      const Model = defineStruct({ value: new Num(0) })
      const ModelImpl = defineImpl(Model, {
        marker: 'ok',
      } as {
        marker: string
      })
      const model = new ModelImpl()
      expect((model.methods as { marker: string }).marker).toBe('ok')
      expect(model.methods).toHaveProperty('marker', 'ok')
    })
  })

  test('supports boolean function signatures', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', false)

    project.stage.run(() => {
      const isReady = useFunction({
        name: 'isReady',
        args: {
          ready: new Bool(false),
        },
        returns: new Bool(false),
        body: ({ args, returning }) => returning(args.ready.get() as never),
      })

      const result = isReady.call({
        ready: true,
      })
      setVariableTo(out, result.get() as never)
    })

    expect(out.id).toBeTruthy()
  })
})
