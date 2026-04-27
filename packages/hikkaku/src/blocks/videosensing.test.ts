import { describe, expect, test } from 'vite-plus/test'
import { createBlocks } from '../core/composer'
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
      whenMotionGreaterThan(10, () => {
        setVideoTransparency(50)
      })
      say(videoOn('motion', 'this sprite'))
      videoToggle('on')
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('videoSensing_whenMotionGreaterThan')
    expect(opcodes).toContain('videoSensing_videoOn')
    expect(opcodes).toContain('videoSensing_menu_ATTRIBUTE')
    expect(opcodes).toContain('videoSensing_menu_SUBJECT')
    expect(opcodes).toContain('videoSensing_videoToggle')
    expect(opcodes).toContain('videoSensing_menu_VIDEO_STATE')
    expect(opcodes).toContain('videoSensing_setVideoTransparency')

    const hat = Object.values(blocks).find(
      (b) => b.opcode === 'videoSensing_whenMotionGreaterThan',
    )
    expect(hat?.topLevel).toBe(true)
  })
})
