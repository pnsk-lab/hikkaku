import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { waitUntil } from './control'
import { say } from './looks'
import { moveSteps } from './motion'
import { add, and, join } from './operator'

describe('blocks/operator', () => {
  test('creates operator reporter blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      moveSteps(add(1, 2))
      waitUntil(and(true, false))
      say(join('a', 'b'))
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('operator_add')
    expect(opcodes).toContain('operator_and')
    expect(opcodes).toContain('operator_join')
  })
})
