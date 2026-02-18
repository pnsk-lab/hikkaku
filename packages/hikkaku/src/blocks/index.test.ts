import { describe, expect, test } from 'vite-plus/test'
import * as blocks from './index'

describe('blocks/index', () => {
  test('re-exports block factories', () => {
    expect(typeof blocks.moveSteps).toBe('function')
    expect(typeof blocks.say).toBe('function')
    expect(typeof blocks.whenFlagClicked).toBe('function')
    expect(typeof blocks.defineProcedure).toBe('function')
  })
})
