import { Project } from 'hikkaku'
import { add, setVariableTo, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { type GoboxFunctionDefinition, useFunction, useImpl } from './functions'
import { type GoboxNumberType, number, struct, trait } from './types'

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
        body: ({ args, returnValue }) => {
          returnValue.set(add(args.value.get() as never, 1) as never)
        },
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
            body: ({ args, returnValue }) => {
              returnValue.set(args.value.get() as never)
            },
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
            body: ({ args, returnValue }) => {
              returnValue.set(
                add(
                  args.value.get() as never,
                  args.value.get() as never,
                ) as never,
              )
            },
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
        body: ({ args, returnValue }) => {
          returnValue.set(
            add(args.value.get() as never, args.value.get() as never) as never,
          )
        },
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
})
