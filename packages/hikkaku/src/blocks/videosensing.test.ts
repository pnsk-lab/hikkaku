import { describe, expect, test } from 'vite-plus/test'
import { block, createBlocks } from '../core/composer'
import { say } from './looks'
import {
  setVideoTransparency,
  videoOn,
  videoToggle,
  whenMotionGreaterThan,
} from './videosensing'

describe('blocks/videosensing', () => {
  test('creates video sensing extension blocks', () => {
    const blocks = createBlocks(() => {
      block('event_whenflagclicked', { topLevel: true })
      whenMotionGreaterThan(10)
      say(videoOn('motion', 'this sprite'))
      videoToggle('on')
      setVideoTransparency(50)
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('videoSensing_whenMotionGreaterThan')
    expect(opcodes).toContain('videoSensing_videoOn')
    expect(opcodes).toContain('videoSensing_videoToggle')
    expect(opcodes).toContain('videoSensing_setVideoTransparency')
  })
})
