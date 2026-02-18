import { Shadow } from 'sb3-types/enum'
import { describe, expect, test } from 'vite-plus/test'
import {
  attachStack,
  block,
  createBlocks,
  substack,
  valueBlock,
} from './composer'

describe('core/composer', () => {
  test('links statement blocks and layouts top-level blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      block('looks_say', {})
      block('motion_movesteps', {})
    })

    const all = Object.values(blocks)
    const top = all.find((b) => b.opcode === 'event_whenflagclicked')
    const say = all.find((b) => b.opcode === 'looks_say')
    const move = all.find((b) => b.opcode === 'motion_movesteps')

    expect(top?.next).toBeTruthy()
    expect(say?.next).toBeTruthy()
    expect(move?.next).toBeNull()
    expect(top?.x).toBe(64)
    expect(top?.y).toBe(72)
  })

  test('attaches value blocks via input references', () => {
    const blocks = createBlocks(() => {
      const value = valueBlock('operator_random', { fields: {} })
      block('motion_movesteps', {
        inputs: {
          STEPS: [Shadow.SameBlockShadow, value.id],
        },
      })
    })

    const random = Object.values(blocks).find(
      (b) => b.opcode === 'operator_random',
    )
    expect(random?.parent).toBeTruthy()
  })

  test('supports substack and attachStack helpers', () => {
    const blocks = createBlocks(() => {
      const parent = block('control_repeat', { topLevel: true })
      const id = substack(() => {
        block('looks_show', {})
      })
      expect(id).toBeTruthy()
      const attached = attachStack(parent.id, () => {
        block('looks_hide', {})
      })
      expect(attached).toBeTruthy()
    })
    expect(Object.keys(blocks).length).toBeGreaterThanOrEqual(3)
  })

  test('throws on unconnected value blocks', () => {
    expect(() =>
      createBlocks(() => {
        valueBlock('operator_add', { fields: {} })
      }),
    ).toThrow(/Unconnected value block/)
  })
})
