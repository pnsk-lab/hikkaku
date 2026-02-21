import { Project } from 'hikkaku'
import { describe, expect, test } from 'vite-plus/test'
import {
  Bool,
  defineImpl,
  defineStruct,
  isPrimitiveType,
  Num,
  Str,
  Vector,
} from './types'

describe('gobox/types', () => {
  test('builds primitive types with defaults', () => {
    expect(Num.setDefaults(3).defaults).toEqual([3])
    expect(Str.setDefaults('a').defaults).toEqual(['a'])
    expect(Bool.setDefaults(true).defaults).toEqual([1])
  })

  test('builds fixed-length vector and struct layouts', () => {
    const vec = Vector.configure(Num, 3)
    expect(vec.width).toBe(3)
    expect(vec.defaults).toEqual([0, 0, 0])

    const Pos = defineStruct({
      x: Num.setDefaults(1),
      y: Num.setDefaults(2),
      name: Str.setDefaults('cat'),
    })
    const pos = Pos.configure()

    expect(pos.width).toBe(3)
    expect(pos.fieldOffsets.x).toBe(0)
    expect(pos.fieldOffsets.y).toBe(1)
    expect(pos.fieldOffsets.name).toBe(2)
    expect(pos.defaults).toEqual([1, 2, 'cat'])
  })

  test('validates vector length', () => {
    expect(() => Vector.configure(Num, -1)).toThrow(
      /vector length must be a non-negative integer/,
    )
    expect(() => Vector.configure(Num, 1.5)).toThrow(
      /vector length must be a non-negative integer/,
    )
  })

  test('reports primitive type check correctly', () => {
    expect(isPrimitiveType(Num)).toBe(true)
    expect(isPrimitiveType(Str)).toBe(true)
    expect(isPrimitiveType(Bool)).toBe(true)
    const Counter = defineStruct({ value: Num })
    expect(isPrimitiveType(Counter.configure())).toBe(false)
  })

  test('supports defineImpl using defineStruct type', () => {
    const project = new Project()
    const Counter = defineStruct({
      count: Num,
    })
    const CounterImpl = defineImpl(Counter, {
      sync: () => undefined,
      reset: () => undefined,
    })

    expect(
      (CounterImpl.configure() as { methods?: unknown }).methods,
    ).toBeUndefined()
    project.stage.run(() => {
      const counter = CounterImpl.makeScopedValue()
      expect(counter.methods.sync).toBeTypeOf('function')
      expect(counter.methods.reset).toBeTypeOf('function')
    })
  })

  test('supports defineStruct initializer through new', () => {
    const Counter = defineStruct({
      count: Num,
      name: Str,
      ready: Bool,
    })
    const initialized = Counter.setDefaults({
      count: 10,
      name: 'cat',
      ready: true,
    })

    expect(initialized.defaults).toEqual([10, 'cat', 1])
  })

  test('skips falsy struct field definitions', () => {
    const Model = defineStruct({
      skipped: undefined as never,
      value: Num.setDefaults(42),
    } as {
      skipped: never
      value: typeof Num
    })
    const type = Model.configure()

    expect(type.fieldOffsets).toHaveProperty('value', 0)
    expect((type.fieldOffsets as { skipped?: number }).skipped).toBeUndefined()
    expect(type.width).toBe(1)
    expect(type.defaults).toEqual([42])
  })

  test('supports primitive configure reset', () => {
    expect(Num.setDefaults(9).configure().defaults).toEqual([0])
    expect(Str.setDefaults('x').configure().defaults).toEqual([''])
    expect(Bool.setDefaults(true).configure().defaults).toEqual([0])
  })

  test('resolves vector and struct defaults from initializers', () => {
    const project = new Project()
    project.stage.run(() => {
      const vec = Vector.configure(Num, 2)
      const scoped = vec.setDefaults([3, 4]).makeScopedValue()
      expect(scoped.at(0)).toBeDefined()
      expect(scoped.at(1)).toBeDefined()

      const Model = defineStruct({
        value: Num,
        label: Str,
        nested: defineStruct({
          ready: Bool,
        }),
      })
      const configured = Model.configure({
        value: 5,
        label: 'cat',
        nested: {
          ready: true,
        },
      })
      expect(configured.defaults).toEqual([5, 'cat', 1])
      const withMissingFields = Model.setDefaults({})
      expect(withMissingFields.defaults).toEqual([0, '', 0])
      const scopedStruct = configured.makeScopedValue()
      expect(scopedStruct.value).toBeDefined()
    })
  })

  test('throws on invalid initializer value types', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        defineStruct({
          value: Num,
        }).makeScopedValue({
          value: 'x' as never,
        })
      })
    }).toThrow(/number initializer must be a number/)

    expect(() => {
      project.stage.run(() => {
        defineStruct({
          value: Str,
        }).makeScopedValue({
          value: 1 as never,
        })
      })
    }).toThrow(/string initializer must be a string/)

    expect(() => {
      project.stage.run(() => {
        defineStruct({
          value: Bool,
        }).makeScopedValue({
          value: 'x' as never,
        })
      })
    }).toThrow(/boolean initializer must be a boolean/)

    expect(() => {
      project.stage.run(() => {
        Vector.configure(Num, 2).makeScopedValue([1] as never)
      })
    }).toThrow(/vector initializer length must match vector length/)

    expect(() => {
      project.stage.run(() => {
        defineStruct({
          value: Num,
        }).makeScopedValue(1 as never)
      })
    }).toThrow(/struct initializer must be an object/)
  })

  test('uses default initializers when primitive makeScopedValue has no argument', () => {
    const project = new Project()
    project.stage.run(() => {
      expect(Str.setDefaults('x').makeScopedValue()).toBeDefined()
      expect(Bool.setDefaults(true).makeScopedValue()).toBeDefined()
    })
  })

  test('supports struct factory call and handles missing field type in defaults', () => {
    const Model = defineStruct({
      skipped: undefined as never,
      value: Num,
    } as {
      skipped: never
      value: typeof Num
    })
    const viaCall = Model()
    const viaInitCall = Model({
      value: 8,
    })
    const configured = Model.configure({
      value: 9,
    })
    const reset = configured.configure()

    expect(viaCall.defaults).toEqual([0])
    expect(viaInitCall.defaults).toEqual([8])
    expect(configured.defaults).toEqual([9])
    expect(reset.defaults).toEqual([0])
    expect(Model.setDefaults({}).defaults).toEqual([0])
  })

  test('resolves explicit false boolean initializer', () => {
    const Model = defineStruct({
      ready: Bool,
    })
    expect(
      Model.setDefaults({
        ready: false,
      }).defaults,
    ).toEqual([0])
  })
})
