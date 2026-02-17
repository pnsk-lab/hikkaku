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
import { stepMany } from '../test/test-projects.ts'
import { createHeadlessVM, createProgramModuleFromProject } from './factory.ts'

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

    const program = createProgramModuleFromProject({
      projectJson: project.toScratch(),
    })
    const vm = createHeadlessVM({
      program,
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

  test('keeps subpixel coverage on diagonal size-1 pen lines', () => {
    const project = new Project()
    const sprite = project.createSprite('pen-sprite')

    sprite.run(() => {
      whenFlagClicked(() => {
        clear()
        setPenSizeTo(1)
        setPenColorToColor('#00ff00')
        setPenColorParamTo('transparency', 0)
        penDown()
        gotoXY(-120, -80)
        gotoXY(120, 80)
        penUp()
      })
    })

    const program = createProgramModuleFromProject({
      projectJson: project.toScratch(),
    })
    const vm = createHeadlessVM({
      program,
      initialNowMs: 0,
    })
    vm.greenFlag()
    stepMany(vm, 8)

    const frame = vm.renderFrame()
    let pureGreen = 0
    let blendedGreen = 0
    for (let index = 0; index < frame.pixels.length; index += 4) {
      const r = frame.pixels[index] ?? 0
      const g = frame.pixels[index + 1] ?? 0
      const b = frame.pixels[index + 2] ?? 0
      if (r === 0 && g === 255 && b === 0) {
        pureGreen += 1
      } else if (g === 255 && r === b && r > 0 && r < 255) {
        blendedGreen += 1
      }
    }

    expect(pureGreen).toBeGreaterThan(0)
    expect(blendedGreen).toBeGreaterThan(0)
  })
})
