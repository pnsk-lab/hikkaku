import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { askAndWait, resetTimer, setDragMode } from './sensing'

describe('blocks/sensing', () => {
  test('creates sensing blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      askAndWait('ready?')
      setDragMode('draggable')
      resetTimer()
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('sensing_askandwait')
    expect(opcodes).toContain('sensing_setdragmode')
    expect(opcodes).toContain('sensing_resettimer')
  })
})
