import { Project } from 'hikkaku'
import {
  clear,
  gotoXY,
  penDown,
  penUp,
  setPenColorParamTo,
  setPenColorToColor,
  setPenSizeTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { createHeadlessVM } from './factory.ts'
import { stepMany } from './test-projects.ts'

describe('moonscratch/js/vm pen transparency', () => {
  test('does not overdraw alpha by repeatedly blending the same stroke area', () => {
    const project = new Project()
    const sprite = project.createSprite('pen-sprite')

    sprite.run(() => {
      whenFlagClicked(() => {
        clear()
        setPenSizeTo(6)

        setPenColorToColor('#ff0000')
        setPenColorParamTo('transparency', 0)
        penDown()
        gotoXY(-100, 0)
        gotoXY(100, 0)
        penUp()

        setPenColorToColor('#0000ff')
        setPenColorParamTo('transparency', 70)
        penDown()
        gotoXY(-100, 0)
        gotoXY(100, 0)
        penUp()
      })
    })

    const vm = createHeadlessVM({
      projectJson: project.toScratch(),
      initialNowMs: 0,
    })
    vm.greenFlag()
    stepMany(vm, 8)

    const frame = vm.renderFrame()
    const centerX = Math.floor(frame.width / 2)
    const centerY = Math.floor(frame.height / 2)
    const base = (centerY * frame.width + centerX) * 4
    const r = frame.pixels[base] ?? 0
    const g = frame.pixels[base + 1] ?? 0
    const b = frame.pixels[base + 2] ?? 0
    const a = frame.pixels[base + 3] ?? 0

    // Blue over red with transparency should stay mixed, not collapse to near-solid blue.
    expect(a).toBe(255)
    expect(g).toBeLessThan(16)
    expect(r).toBeGreaterThan(70)
    expect(b).toBeGreaterThan(70)
    expect(r).toBeLessThan(220)
    expect(b).toBeLessThan(220)
    expect(Math.abs(r - b)).toBeLessThan(90)
  })
})
