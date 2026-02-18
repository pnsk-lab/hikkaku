import { InputType, Shadow } from 'sb3-types/enum'
import { describe, expect, test } from 'vite-plus/test'
import {
  fromPrimitiveSource,
  isCostumeReference,
  isHikkakuBlock,
  isSoundReference,
  menuInput,
  unwrapCostumeSource,
  unwrapSoundSource,
} from './block-helper'
import { block, createBlocks } from './composer'

describe('core/block-helper', () => {
  test('converts primitives into Scratch inputs', () => {
    expect(fromPrimitiveSource(InputType.Number, 10)).toEqual([
      Shadow.SameBlockShadow,
      [InputType.Number, 10],
    ])
    expect(fromPrimitiveSource(InputType.String, 'hello')).toEqual([
      Shadow.SameBlockShadow,
      [InputType.String, 'hello'],
    ])
  })

  test('supports block and color inputs', () => {
    const block = { isBlock: true, id: 'abc' } as const
    expect(fromPrimitiveSource(InputType.String, block, 'fallback')).toEqual([
      Shadow.DiffBlockShadow,
      'abc',
      [InputType.String, 'fallback'],
    ])
    expect(fromPrimitiveSource(InputType.Color, '#ff00ff')).toEqual([
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

  test('supports broadcast primitive and default fallback values', () => {
    expect(fromPrimitiveSource(InputType.Broadcast, 'start')).toEqual([
      Shadow.SameBlockShadow,
      [InputType.Broadcast, 'start', 'start'],
    ])

    const valueBlockSource = { isBlock: true, id: 'value-id' } as const
    expect(fromPrimitiveSource(InputType.Angle, valueBlockSource)).toEqual([
      Shadow.DiffBlockShadow,
      'value-id',
      [InputType.Angle, 90],
    ])
    expect(
      fromPrimitiveSource(InputType.PositiveInteger, valueBlockSource),
    ).toEqual([
      Shadow.DiffBlockShadow,
      'value-id',
      [InputType.PositiveInteger, 1],
    ])
  })

  test('uses same-block shadow when source block is a shadow block in context', () => {
    let input: ReturnType<typeof fromPrimitiveSource> | null = null

    createBlocks(() => {
      const shadowBlock = block('motion_xposition', { isShadow: true })
      input = fromPrimitiveSource(InputType.String, shadowBlock, 'fallback')
    })

    if (!input) {
      throw new Error('expected input to be initialized')
    }

    const shadowId = input[1] as string
    if (input[0] !== Shadow.SameBlockShadow) {
      throw new Error('expected input to be same block shadow')
    }
    if (input[1] !== shadowId) {
      throw new Error('expected input id to match')
    }
  })
})
