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
import { block, createBlocks, valueBlock } from './composer'
import type {
  HikkakuBlock,
  HikkakuNumber,
  HikkakuReporterBlock,
  HikkakuString,
  PrimitiveSource,
} from './types'

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
    const block = {
      isBlock: true,
      id: 'abc',
    } as unknown as HikkakuReporterBlock
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
    const sourceBlock = {
      isBlock: true,
      id: 'source',
    } as unknown as HikkakuReporterBlock
    const input = menuInput(sourceBlock, () => {
      created.push('called')
      return {
        isBlock: true,
        id: 'shadow',
      } as unknown as HikkakuReporterBlock<HikkakuString>
    })

    expect(created).toEqual(['called'])
    expect(input).toEqual([Shadow.DiffBlockShadow, 'source', 'shadow'])
  })

  test('supports broadcast primitive and default fallback values', () => {
    expect(fromPrimitiveSource(InputType.Broadcast, 'start')).toEqual([
      Shadow.SameBlockShadow,
      [InputType.Broadcast, 'start', 'start'],
    ])

    const valueBlockSource = {
      isBlock: true,
      id: 'value-id',
    } as unknown as HikkakuReporterBlock
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
      const shadowBlock = valueBlock('motion_xposition', { isShadow: true })
      block('looks_say', {
        inputs: {
          MESSAGE: [Shadow.SameBlockShadow, shadowBlock.id],
        },
      })
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

  test('rejects statement blocks as primitive sources at type level', () => {
    const statement = { isBlock: true, id: 'statement-id' } as HikkakuBlock
    // @ts-expect-error statement blocks are not reporter blocks
    const _invalid: PrimitiveSource<HikkakuNumber> = statement
    expect(statement.id).toBe('statement-id')
  })
})
