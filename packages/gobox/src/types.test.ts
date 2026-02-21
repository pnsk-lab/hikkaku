import { describe, expect, test } from 'vite-plus/test'
import {
  Bool,
  defineImpl,
  defineStruct,
  isPrimitiveType,
  Num,
  Str,
  vector,
} from './types'

describe('gobox/types', () => {
  test('builds primitive types with defaults', () => {
    expect(new Num(3).defaults).toEqual([3])
    expect(new Str('a').defaults).toEqual(['a'])
    expect(new Bool(true).defaults).toEqual([1])
  })

  test('builds fixed-length vector and struct layouts', () => {
    const vec = vector(new Num(0), 3)
    expect(vec.width).toBe(3)
    expect(vec.defaults).toEqual([0, 0, 0])

    const Pos = defineStruct({
      x: new Num(1),
      y: new Num(2),
      name: new Str('cat'),
    })
    const pos = new Pos()

    expect(pos.width).toBe(3)
    expect(pos.fieldOffsets.x).toBe(0)
    expect(pos.fieldOffsets.y).toBe(1)
    expect(pos.fieldOffsets.name).toBe(2)
    expect(pos.defaults).toEqual([1, 2, 'cat'])
  })

  test('validates vector length', () => {
    expect(() => vector(new Num(0), -1)).toThrow(
      /vector length must be a non-negative integer/,
    )
    expect(() => vector(new Num(0), 1.5)).toThrow(
      /vector length must be a non-negative integer/,
    )
  })

  test('reports primitive type check correctly', () => {
    expect(isPrimitiveType(new Num(0))).toBe(true)
    expect(isPrimitiveType(new Str(''))).toBe(true)
    expect(isPrimitiveType(new Bool(false))).toBe(true)
    const Counter = defineStruct({ value: new Num(0) })
    expect(isPrimitiveType(new Counter())).toBe(false)
  })

  test('supports defineImpl using defineStruct type', () => {
    const Counter = defineStruct({
      count: new Num(0),
    })
    const CounterImpl = defineImpl(Counter, {
      sync: () => undefined,
      reset: () => undefined,
    })
    const counter = new CounterImpl()

    expect(counter.methods.sync).toBeTypeOf('function')
    expect(counter.methods.reset).toBeTypeOf('function')
  })

  test('supports defineStruct initializer through new', () => {
    const Counter = defineStruct({
      count: new Num(0),
      name: new Str(''),
      ready: new Bool(false),
    })
    const initialized = new Counter({
      count: 10,
      name: 'cat',
      ready: true,
    })

    expect(initialized.defaults).toEqual([10, 'cat', 1])
  })

  test('skips falsy struct field definitions', () => {
    const Model = defineStruct({
      skipped: undefined as never,
      value: new Num(42),
    } as {
      skipped: never
      value: ReturnType<typeof Num>
    })
    const type = new Model()

    expect(type.fieldOffsets).toHaveProperty('value', 0)
    expect((type.fieldOffsets as { skipped?: number }).skipped).toBeUndefined()
    expect(type.width).toBe(1)
    expect(type.defaults).toEqual([42])
  })
})
