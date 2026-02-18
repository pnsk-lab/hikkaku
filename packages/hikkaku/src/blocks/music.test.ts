import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { playDrumForBeats, setTempo } from './music'

describe('blocks/music', () => {
  test('creates music extension blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      playDrumForBeats(1, 0.5)
      setTempo(120)
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('music_playDrumForBeats')
    expect(opcodes).toContain('music_setTempo')
  })
})
