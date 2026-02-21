import { Project } from 'hikkaku'
import {
  add,
  ifThen,
  repeat,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { type GoboxFunctionDefinition, useFunction, useImpl } from './functions'
import {
  boolean,
  type GoboxNumberType,
  number,
  string,
  struct,
  trait,
} from './types'

describe('gobox/functions', () => {
  test('supports statement-return custom functions', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const plusOne = useFunction({
        name: 'plusOne',
        args: {
          value: number(0),
        },
        returns: number(0),
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

  test('restricts useFunction to run top-level', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        whenFlagClicked(() => {
          useFunction({
            name: 'illegal',
            args: {
              value: number(0),
            },
            returns: number(0),
            body: ({ args, returning }) => returning(args.value.get() as never),
          })
        })
      })
    }).toThrow(/must be defined at run\(\) top-level/)
  })

  test('useImpl accepts function options without useFunction wrapper', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const counterTrait = trait<{
        double: GoboxFunctionDefinition<
          { value: GoboxNumberType },
          GoboxNumberType
        >
      }>(['double'])

      const counter = useImpl(
        struct({
          value: number(0),
        }),
        counterTrait,
        {
          double: {
            args: {
              value: number(0),
            },
            returns: number(0),
            body: ({ args, returning }) =>
              returning(
                add(
                  args.value.get() as never,
                  args.value.get() as never,
                ) as never,
              ),
          },
        },
      )

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

  test('useImpl accepts existing useFunction definitions', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const counterTrait = trait<{
        double: GoboxFunctionDefinition<
          { value: GoboxNumberType },
          GoboxNumberType
        >
      }>(['double'])

      const double = useFunction({
        name: 'double',
        args: {
          value: number(0),
        },
        returns: number(0),
        body: ({ args, returning }) =>
          returning(
            add(args.value.get() as never, args.value.get() as never) as never,
          ),
      })

      const counter = useImpl(
        struct({
          value: number(0),
        }),
        counterTrait,
        {
          double,
        },
      )

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

  test('useImpl throws when required trait methods are missing', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const counterTrait = trait<{
          double: GoboxFunctionDefinition<
            { value: GoboxNumberType },
            GoboxNumberType
          >
        }>(['double'])

        useImpl(
          struct({
            value: number(0),
          }),
          counterTrait,
          {} as unknown as {
            double: GoboxFunctionDefinition<
              { value: GoboxNumberType },
              GoboxNumberType
            >
          },
        )
      })
    }).toThrow(/Missing trait method: double/)
  })

  test('falls back to fixed primitive defaults when returning is not called', () => {
    const project = new Project()

    project.stage.run(() => {
      useFunction({
        name: 'noNumber',
        args: {},
        returns: number(123),
        body: () => {},
      })
      useFunction({
        name: 'noString',
        args: {},
        returns: string('filled'),
        body: () => {},
      })
      useFunction({
        name: 'noBoolean',
        args: {},
        returns: boolean(true),
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
            value: number(0),
          },
          returns: number(0),
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
            value: number(0),
          },
          returns: number(0),
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
            value: number(0),
          },
          returns: number(0),
          body: ({ args, returning }) => {
            returning(args.value.get() as never)
          },
        })
      })
    }).toThrow(/returning\(\) must/)
  })
})
