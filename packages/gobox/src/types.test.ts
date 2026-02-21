import { describe, expect, test } from 'vite-plus/test'
import {
  boolean,
  isPrimitiveType,
  number,
  string,
  struct,
  trait,
  useImpl,
  vector,
} from './types'

describe('gobox/types', () => {
  test('builds primitive types with defaults', () => {
    expect(number(3).defaults).toEqual([3])
    expect(string('a').defaults).toEqual(['a'])
    expect(boolean(true).defaults).toEqual([1])
  })

  test('builds fixed-length vector and struct layouts', () => {
    const vec = vector(number(0), 3)
    expect(vec.width).toBe(3)
    expect(vec.defaults).toEqual([0, 0, 0])

    const pos = struct({
      x: number(1),
      y: number(2),
      name: string('cat'),
    })

    expect(pos.width).toBe(3)
    expect(pos.fieldOffsets.x).toBe(0)
    expect(pos.fieldOffsets.y).toBe(1)
    expect(pos.fieldOffsets.name).toBe(2)
    expect(pos.defaults).toEqual([1, 2, 'cat'])
  })

  test('validates vector length', () => {
    expect(() => vector(number(0), -1)).toThrow(
      /vector length must be a non-negative integer/,
    )
    expect(() => vector(number(0), 1.5)).toThrow(
      /vector length must be a non-negative integer/,
    )
  })

  test('reports primitive type check correctly', () => {
    expect(isPrimitiveType(number(0))).toBe(true)
    expect(isPrimitiveType(string(''))).toBe(true)
    expect(isPrimitiveType(boolean(false))).toBe(true)
    expect(isPrimitiveType(struct({ value: number(0) }))).toBe(false)
  })

  test('supports trait contracts on useImpl', () => {
    const counter = struct({
      count: number(0),
    })

    const counterTrait = trait<{
      sync(): void
    }>(['sync'])

    const withTrait = useImpl(counter, counterTrait, {
      sync: () => undefined,
      reset: () => undefined,
    })

    expect(withTrait.methods.sync).toBeTypeOf('function')
    expect(withTrait.methods.reset).toBeTypeOf('function')
  })

  test('supports useImpl without a trait', () => {
    const pos = struct({
      x: number(0),
    })
    const withMethods = useImpl(pos, {
      reset: () => undefined,
      scale: 2,
    })

    expect(withMethods.methods.reset).toBeTypeOf('function')
    expect(withMethods.methods.scale).toBe(2)
  })

  test('throws when required trait methods are missing', () => {
    const counter = struct({
      count: number(0),
    })

    const counterTrait = trait<{
      sync(): void
    }>(['sync'])

    expect(() =>
      useImpl(counter, counterTrait, {} as unknown as { sync(): void }),
    ).toThrow(/Missing trait method: sync/)
  })
})
