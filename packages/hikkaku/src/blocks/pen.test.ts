import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { penDown, setPenColorToColor, setPenSizeTo } from './pen'

describe('blocks/pen', () => {
  test('creates pen blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      penDown()
      setPenColorToColor('#ff00ff')
      setPenSizeTo(5)
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('pen_penDown')
    expect(opcodes).toContain('pen_setPenColorToColor')
    expect(opcodes).toContain('pen_setPenSizeTo')
  })
})
