import { describe, expect, test } from 'vite-plus/test'
import {
  cloneMonitor,
  createListMonitor,
  createVariableMonitor,
} from './monitors'

describe('core/monitors', () => {
  test('normalizes variable monitor slider bounds', () => {
    const monitor = createVariableMonitor('v1', 'score', 0, null, {
      mode: 'slider',
      sliderMin: 100,
      sliderMax: 10,
      visible: false,
    })

    expect(monitor.sliderMin).toBe(10)
    expect(monitor.sliderMax).toBe(100)
    expect(monitor.visible).toBe(false)
  })

  test('clones list monitors deeply', () => {
    const listMonitor = createListMonitor('l1', 'items', [1, 2], 'Sprite1', {
      width: 120,
      height: 80,
    })
    const cloned = cloneMonitor(listMonitor)

    expect(cloned).toEqual(listMonitor)
    if (cloned.mode === 'list') {
      cloned.value.push(3)
    }
    expect(listMonitor.value).toEqual([1, 2])
  })
})
