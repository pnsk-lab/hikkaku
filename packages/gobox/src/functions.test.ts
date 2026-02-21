import { Project } from 'hikkaku'
import {
  add,
  ifThen,
  repeat,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { defineFunction, defineImpl, useImpl } from './functions'
import { IMPL_METHODS_SYMBOL } from './internal/impl'
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
      const plusOne = defineFunction({
        name: 'plusOne',
        args: {
          value: Num,
        },
        returns: Num,
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
      const isEnabled = defineFunction({
        name: 'isEnabled',
        args: {
          enabled: Bool,
        },
        returns: Bool,
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
      const prefix = defineFunction({
        name: 'prefix',
        args: {
          value: Str,
        },
        returns: Str,
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
        const plusOne = defineFunction({
          name: 'plusOne',
          args: {
            value: Num,
          },
          returns: Num,
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

  test('restricts defineFunction to run top-level', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        whenFlagClicked(() => {
          defineFunction({
            name: 'illegal',
            args: {
              value: Num,
            },
            returns: Num,
            body: ({ args, returning }) => returning(args.value.get() as never),
          })
        })
      })
    }).toThrow(/must be defined at run\(\) top-level/)
  })

  test('defineImpl accepts function options without defineFunction wrapper', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const Counter = defineStruct({
        value: Num,
      })
      const CounterImpl = defineImpl(Counter, {
        double: {
          args: {
            value: Num,
          },
          returns: Num,
          body: ({ args, returning }) => {
            const assertArgsInference = (inferredArgs: typeof args): void => {
              // @ts-expect-error args should be inferred from args spec.
              inferredArgs.missing.get()
            }
            void assertArgsInference
            return returning(
              add(
                args.value.get() as never,
                args.value.get() as never,
              ) as never,
            )
          },
        },
      })
      const counter = CounterImpl.makeScopedValue()

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

  test('defineImpl method body can read struct fields through self', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const Counter = defineStruct({
        value: Num,
      })
      const CounterImpl = defineImpl(Counter, {
        addToSelf: {
          args: {
            delta: Num,
          },
          returns: Num,
          body: ({ self, args, returning }) =>
            returning(
              add(
                self.value.get() as never,
                args.delta.get() as never,
              ) as never,
            ),
        },
      })
      const counter = CounterImpl.makeScopedValue({
        value: 10,
      })

      whenFlagClicked(() => {
        const result = counter.methods.addToSelf.call({
          delta: 7,
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

  test('defineImpl constructor initializes scoped state on makeScopedValue', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const Counter = defineStruct({
        value: Num,
      })
      const CounterImpl = defineImpl(Counter, {
        constructor: ({
          self,
        }: {
          self: { value: { set(value: number): void } }
        }) => {
          self.value.set(9)
        },
        read: {
          args: {},
          returns: Num,
          body: ({
            self,
            returning,
          }: {
            self: { value: { get(): number } }
            returning: (value: number) => { scopeId: number; value: number }
          }) => returning(self.value.get() as never),
        },
      })

      const counter = CounterImpl.makeScopedValue()
      whenFlagClicked(() => {
        const result = (
          counter.methods.read as unknown as {
            call(args: Record<string, never>): { get(): unknown }
          }
        ).call({})
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
    expect(opcodes).toContain('data_replaceitemoflist')
    expect(opcodes).toContain('procedures_definition')
    expect(opcodes).toContain('procedures_call')
    expect(out.id).toBeTruthy()
  })

  test('defineImpl accepts existing defineFunction definitions', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const Counter = defineStruct({
        value: Num,
      })

      const double = defineFunction({
        name: 'double',
        args: {
          value: Num,
        },
        returns: Num,
        body: ({ args, returning }) =>
          returning(
            add(args.value.get() as never, args.value.get() as never) as never,
          ),
      })

      const CounterImpl = defineImpl(Counter, {
        double,
      })
      const counter = CounterImpl.makeScopedValue()

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
    const project = new Project()
    const Counter = defineStruct({
      value: Num,
    })
    const CounterImpl = defineImpl(Counter, {
      marker: 'ok',
    })

    expect((CounterImpl as { methods?: unknown }).methods).toBeUndefined()
    expect((new CounterImpl() as { methods?: unknown }).methods).toBeUndefined()
    project.stage.run(() => {
      const counter = CounterImpl.makeScopedValue()
      expect(counter.methods).toHaveProperty('marker', 'ok')
    })
  })

  test('falls back to fixed primitive defaults when returning is not called', () => {
    const project = new Project()

    project.stage.run(() => {
      defineFunction({
        name: 'noNumber',
        args: {},
        returns: Num.setDefaults(123),
        body: () => {},
      })
      defineFunction({
        name: 'noString',
        args: {},
        returns: Str.setDefaults('filled'),
        body: () => {},
      })
      defineFunction({
        name: 'noBoolean',
        args: {},
        returns: Bool.setDefaults(true),
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
        defineFunction({
          name: 'badIfThen',
          args: {
            value: Num,
          },
          returns: Num,
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
        defineFunction({
          name: 'badRepeat',
          args: {
            value: Num,
          },
          returns: Num,
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
        defineFunction({
          name: 'missingReturnKeyword',
          args: {
            value: Num,
          },
          returns: Num,
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
          element: Num,
          length: 2,
          width: 2,
          defaults: [0, 0],
        } as unknown as GoboxPrimitiveType
        const fn = defineFunction({
          name: 'unsupportedArg',
          args: {
            value: unsupportedType,
          },
          returns: Num,
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
        const fn = defineFunction({
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
        const fn = defineFunction({
          name: 'missingRetPtr',
          args: {
            value: Num,
          },
          returns: Num,
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
        const fn = defineFunction({
          name: 'badReturning',
          args: {
            value: Num,
          },
          returns: Num,
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
      const Counter = defineStruct({ value: Num })
      const CounterImpl = defineImpl(Counter, {
        double: {
          args: { value: Num },
          returns: Num,
          body: ({ args, returning }) => returning(args.value.get() as never),
        },
      })
      const counter = CounterImpl.makeScopedValue()
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
      const Model = defineStruct({ value: Num })
      const ModelImpl = defineImpl(Model, {
        marker: 'ok',
      } as {
        marker: string
      })
      const model = ModelImpl.makeScopedValue()
      expect((model.methods as { marker: string }).marker).toBe('ok')
      expect(model.methods).toHaveProperty('marker', 'ok')
    })
  })

  test('supports boolean function signatures', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', false)

    project.stage.run(() => {
      const isReady = defineFunction({
        name: 'isReady',
        args: {
          ready: Bool,
        },
        returns: Bool,
        body: ({ args, returning }) => returning(args.ready.get() as never),
      })

      const result = isReady.call({
        ready: true,
      })
      setVariableTo(out, result.get() as never)
    })

    expect(out.id).toBeTruthy()
  })

  test('throws when impl struct field name is reserved', () => {
    const Counter = defineStruct({
      methods: Num,
    })
    expect(() => {
      defineImpl(Counter, {
        marker: 'x',
      })
    }).toThrow(/reserved/)
  })

  test('throws when impl constructor is not a function', () => {
    const Counter = defineStruct({
      value: Num,
    })
    expect(() => {
      defineImpl(Counter, {
        constructor: 1 as unknown as () => void,
      })
    }).toThrow(/constructor must be a function/)
  })

  test('supports impl setDefaults and useImpl helper', () => {
    const project = new Project()
    project.stage.run(() => {
      const Counter = defineStruct({
        value: Num,
      })
      const CounterImpl = defineImpl(Counter, {
        read: {
          args: {},
          returns: Num,
          body: ({ self, returning }) => returning(self.value.get() as never),
        },
      })
      const configured = CounterImpl.setDefaults({
        value: 7,
      })
      const scoped = configured.makeScopedValue()
      const viaUseImpl = useImpl(configured, {
        marker: 'ok',
      })
      expect(scoped.methods.read.call({})).toBeDefined()
      expect(viaUseImpl.methods).toHaveProperty('marker', 'ok')
    })
  })

  test('throws when raw impl function call is unbound', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const Counter = defineStruct({
          value: Num,
        })
        const CounterImpl = defineImpl(Counter, {
          pass: {
            args: {
              value: Num,
            },
            returns: Num,
            body: ({ args, returning }) => returning(args.value.get() as never),
          },
        })
        const rawMethods = (
          CounterImpl as {
            [IMPL_METHODS_SYMBOL]: Record<string, unknown>
          }
        )[IMPL_METHODS_SYMBOL]
        const method = rawMethods.pass as {
          call(args: { value: number }, self?: unknown): unknown
        }
        method.call({
          value: 1,
        })
      })
    }).toThrow(/requires bound self/)
  })

  test('throws when impl function call has unknown arguments', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const Counter = defineStruct({
          value: Num,
        })
        const CounterImpl = defineImpl(Counter, {
          pass: {
            args: {
              value: Num,
            },
            returns: Num,
            body: ({ args, returning }) => returning(args.value.get() as never),
          },
        })
        const counter = CounterImpl.makeScopedValue()
        counter.methods.pass.call({
          value: 1,
          extra: 2,
        } as {
          value: number
          extra: number
        })
      })
    }).toThrow(/Unknown function argument: extra/)
  })

  test('throws when impl function call is missing internal pointers', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const Counter = defineStruct({
          value: Num,
        })
        const CounterImpl = defineImpl(Counter, {
          pass: {
            args: {
              value: Bool,
            },
            returns: Num,
            body: ({ self, returning }) => returning(self.value.get() as never),
          },
        })
        const counter = CounterImpl.makeScopedValue()
        const bound = counter.methods.pass as {
          procedure: {
            reference: { arguments: Record<string, { id: string }> }
          }
          call(args: { value: boolean }): unknown
        }
        bound.procedure.reference.arguments.__ret_ptr = undefined as never
        bound.call({
          value: true,
        })
      })
    }).toThrow(/return pointer argument is missing/)

    expect(() => {
      project.stage.run(() => {
        const Counter = defineStruct({
          value: Num,
        })
        const CounterImpl = defineImpl(Counter, {
          pass: {
            args: {
              value: Bool,
            },
            returns: Num,
            body: ({ self, returning }) => returning(self.value.get() as never),
          },
        })
        const counter = CounterImpl.makeScopedValue()
        const bound = counter.methods.pass as {
          procedure: {
            reference: { arguments: Record<string, { id: string }> }
          }
          call(args: { value: boolean }): unknown
        }
        bound.procedure.reference.arguments.__self_ptr = undefined as never
        bound.call({
          value: true,
        })
      })
    }).toThrow(/self pointer argument is missing/)
  })

  test('supports impl method fallback when returning is not called', () => {
    const project = new Project()
    project.stage.run(() => {
      const Counter = defineStruct({
        value: Num,
      })
      const CounterImpl = defineImpl(Counter, {
        noop: {
          args: {},
          returns: Num,
          body: () => undefined,
        },
      })
      const counter = CounterImpl.makeScopedValue()
      expect(counter.methods.noop.call({})).toBeDefined()
    })
  })

  test('throws when impl method uses returning without returning token', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const Counter = defineStruct({
          value: Num,
        })
        const CounterImpl = defineImpl(Counter, {
          bad: {
            args: {
              value: Num,
            },
            returns: Num,
            body: ({ args, returning }) => {
              returning(args.value.get() as never)
            },
          },
        })
        const counter = CounterImpl.makeScopedValue()
        counter.methods.bad.call({
          value: 1,
        })
      })
    }).toThrow(/returning\(\) must/)
  })

  test('throws when impl method calls returning multiple times', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const Counter = defineStruct({
          value: Num,
        })
        const CounterImpl = defineImpl(Counter, {
          bad: {
            args: {
              value: Num,
            },
            returns: Num,
            body: ({ args, returning }) => {
              const first = returning(args.value.get() as never)
              returning(args.value.get() as never)
              return first
            },
          },
        })
        const counter = CounterImpl.makeScopedValue()
        counter.methods.bad.call({
          value: 1,
        })
      })
    }).toThrow(/returning\(\) must/)
  })

  test('throws when impl method returns forged token instance', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const Counter = defineStruct({
          value: Num,
        })
        const CounterImpl = defineImpl(Counter, {
          bad: {
            args: {
              value: Num,
            },
            returns: Num,
            body: ({ args, returning }) => {
              const token = returning(args.value.get() as never)
              const forged = Object.assign(
                Object.create(Object.getPrototypeOf(token)),
                token,
              ) as typeof token
              return forged
            },
          },
        })
        const counter = CounterImpl.makeScopedValue()
        counter.methods.bad.call({
          value: 1,
        })
      })
    }).toThrow(/returning\(\) must/)
  })

  test('reuses cached normalized impl methods metadata', () => {
    const Counter = defineStruct({
      value: Num,
    })
    const CounterImpl = defineImpl(Counter, {
      marker: 'ok',
    })

    const first = (
      CounterImpl as {
        [IMPL_METHODS_SYMBOL]: Record<string, unknown>
      }
    )[IMPL_METHODS_SYMBOL]
    const second = (
      CounterImpl as {
        [IMPL_METHODS_SYMBOL]: Record<string, unknown>
      }
    )[IMPL_METHODS_SYMBOL]
    expect(first).toBe(second)
  })
})
