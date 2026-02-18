import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { say, switchCostumeTo, thinkForSecs } from './looks'

describe('blocks/looks', () => {
  test('creates looks blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      say('hi')
      thinkForSecs('hmm', 1)
      switchCostumeTo('costume1')
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('looks_say')
    expect(opcodes).toContain('looks_thinkforsecs')
    expect(opcodes).toContain('looks_switchcostumeto')
  })
})
