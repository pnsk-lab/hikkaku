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
  test.each([
    'stage',
    'Stage',
  ] as const)('serializes %s as the Scratch stage menu value', (subject) => {
    const blocks = createBlocks(() => {
      say(videoOn('motion', subject))
    })
    const menu = Object.values(blocks).find(
      (block) => block.opcode === 'videoSensing_menu_SUBJECT',
    )
    expect(menu?.fields?.SUBJECT).toEqual(['Stage', null])
  })

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
    const transparency = Object.entries(blocks).find(
      ([, block]) => block.opcode === 'videoSensing_setVideoTransparency',
    )
    const following = Object.entries(blocks).find(
      ([, block]) => block.opcode === 'looks_say',
    )
    expect(hat?.next).toBe(transparency?.[0])
    expect(transparency?.[1].next).toBe(following?.[0])
    expect(following?.[1].parent).toBe(transparency?.[0])
  })
})
