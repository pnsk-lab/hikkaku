import { describe, expect, test } from 'vite-plus/test'
import {
  fromPrimitiveSource,
  fromPrimitiveSourceColor,
  isCostumeReference,
  isHikkakuBlock,
  isSoundReference,
  menuInput,
  unwrapCostumeSource,
  unwrapSoundSource,
} from './block-helper'
import { InputType, Shadow } from './sb3-enum'

describe('core/block-helper', () => {
  test('converts primitives into Scratch inputs', () => {
    expect(fromPrimitiveSource(10)).toEqual([
      Shadow.SameBlockShadow,
      [InputType.Number, 10],
    ])
    expect(fromPrimitiveSource(true)).toEqual([
      Shadow.SameBlockShadow,
      [InputType.PositiveInteger, 1],
    ])
    expect(fromPrimitiveSource('hello')).toEqual([
      Shadow.SameBlockShadow,
      [InputType.String, 'hello'],
    ])
  })

  test('supports block and color inputs', () => {
    const block = { isBlock: true, id: 'abc' } as const
    expect(fromPrimitiveSource(block)).toEqual([Shadow.SameBlockShadow, 'abc'])
    expect(fromPrimitiveSourceColor('#ff00ff')).toEqual([
      Shadow.SameBlockShadow,
      [InputType.Color, '#ff00ff'],
    ])
  })

  test('unwraps references and builds menu input', () => {
    const costumeRef = { type: 'costume', name: 'cat' } as const
    const soundRef = { type: 'sound', name: 'meow' } as const
    expect(unwrapCostumeSource(costumeRef)).toBe('cat')
    expect(unwrapSoundSource(soundRef)).toBe('meow')
    expect(isCostumeReference(costumeRef)).toBe(true)
    expect(isSoundReference(soundRef)).toBe(true)
    expect(isHikkakuBlock({ isBlock: true, id: 'x' })).toBe(true)

    const created: string[] = []
    const sourceBlock = { isBlock: true, id: 'source' } as const
    const input = menuInput(sourceBlock, () => {
      created.push('called')
      return { isBlock: true, id: 'shadow' }
    })

    expect(created).toEqual(['called'])
    expect(input).toEqual([Shadow.DiffBlockShadow, 'source', 'shadow'])
  })
})
