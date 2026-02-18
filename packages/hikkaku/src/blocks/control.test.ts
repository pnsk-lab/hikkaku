import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { ifElse, repeat, wait } from './control'

describe('blocks/control', () => {
  test('builds control blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      wait(1)
      repeat(2, () => wait(0.1))
      ifElse(
        true,
        () => wait(1),
        () => wait(2),
      )
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('control_repeat')
    expect(opcodes).toContain('control_if_else')
    expect(opcodes).toContain('control_wait')
  })
})
