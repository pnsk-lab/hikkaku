import { describe, expect, test } from 'vite-plus/test'
import { createBlocks } from '../core/composer'
import { whenFlagClicked, whenKeyPressed } from './events'
import { moveSteps } from './motion'

describe('blocks/events', () => {
  test('creates event hat blocks', () => {
    const blocks = createBlocks(() => {
      whenFlagClicked(() => moveSteps(10))
      whenKeyPressed('space', () => moveSteps(20))
    })

    const opcodes = Object.values(blocks).map((b) => b.opcode)
    expect(opcodes).toContain('event_whenflagclicked')
    expect(opcodes).toContain('event_whenkeypressed')
  })
})
