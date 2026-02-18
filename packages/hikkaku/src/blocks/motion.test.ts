import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { goTo, gotoXY, moveSteps } from './motion'

describe('blocks/motion', () => {
  test('creates motion blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      moveSteps(10)
      gotoXY(1, 2)
      goTo('_mouse_')
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('motion_movesteps')
    expect(opcodes).toContain('motion_gotoxy')
    expect(opcodes).toContain('motion_goto')
  })
})
