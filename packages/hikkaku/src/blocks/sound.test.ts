import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { changeVolumeBy, playSound, setVolumeTo } from './sound'

describe('blocks/sound', () => {
  test('creates sound blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      playSound('meow')
      setVolumeTo(100)
      changeVolumeBy(-10)
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('sound_play')
    expect(opcodes).toContain('sound_setvolumeto')
    expect(opcodes).toContain('sound_changevolumeby')
  })
})
