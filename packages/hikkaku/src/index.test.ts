import { describe, expect, test } from 'vite-plus/test'
import * as assets from './assets'
import * as blocks from './blocks'
import * as core from './index'
import hikkaku from './vite'

describe('package exports', () => {
  test('exports core project APIs', () => {
    expect(typeof core.Project).toBe('function')
    expect(typeof core.Target).toBe('function')
    expect(typeof core.block).toBe('function')
    expect(typeof core.valueBlock).toBe('function')
  })

  test('exports assets helpers', () => {
    expect(typeof assets.svg).toBe('function')
    expect(typeof assets.png).toBe('function')
    expect(typeof assets.sound).toBe('function')
    expect(typeof assets.IMAGES.BLANK_SVG).toBe('object')
  })

  test('exports representative block factories', () => {
    expect(typeof blocks.moveSteps).toBe('function')
    expect(typeof blocks.say).toBe('function')
    expect(typeof blocks.whenFlagClicked).toBe('function')
    expect(typeof blocks.setVariableTo).toBe('function')
  })

  test('exports vite plugin entrypoint', () => {
    expect(typeof hikkaku).toBe('function')
  })
})
