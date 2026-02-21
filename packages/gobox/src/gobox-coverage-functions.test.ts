import { Project } from 'hikkaku'
import { setVariableTo } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { useFunction, useImpl } from './functions'
import { boolean, type GoboxPrimitiveType, number, struct } from './types'

describe('gobox/functions edge cases', () => {
  test('throws when function argument type is unsupported in coercion', () => {
    const project = new Project()

    expect(() => {
      project.stage.run(() => {
        const unsupportedType = {
          tag: 'vector',
          element: number(0),
          length: 2,
          width: 2,
          defaults: [0, 0],
        } as unknown as GoboxPrimitiveType
        const fn = useFunction({
          name: 'unsupportedArg',
          args: {
            value: unsupportedType,
          },
          returns: number(0),
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
            value: number(0),
          },
          returns: number(0),
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
            value: number(0),
          },
          returns: number(0),
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

  test('normalizes methods through useImpl with no trait contract', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', 0)

    project.stage.run(() => {
      const counter = useImpl(struct({ value: number(0) }), {
        double: {
          args: { value: number(0) },
          returns: number(0),
          body: ({
            args,
            returning,
          }: {
            args: { value: { get(): number } }
            returning: (value: number) => { scopeId: number; value: number }
          }) => returning(args.value.get() as never),
        },
      })
      const result = counter.methods.double.call({
        value: 4,
      })
      setVariableTo(out, result.get() as never)
    })

    expect(out.id).toBeTruthy()
  })

  test('keeps primitive method values unchanged during useImpl normalization', () => {
    const project = new Project()
    project.stage.run(() => {
      const model = useImpl(struct({ value: number(0) }), {
        marker: 'ok',
      } as {
        marker: string
      })
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
          ready: boolean(false),
        },
        returns: boolean(false),
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
