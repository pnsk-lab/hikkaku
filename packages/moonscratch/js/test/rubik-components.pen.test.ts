import { Project } from 'hikkaku'
import {
  clear,
  gotoXY,
  penDown,
  penUp,
  setPenColorParamTo,
  setPenColorToColor,
  setPenSizeTo,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  createVmFromProject,
  getStageVariable,
  hasApproxColor,
  runUntilFinished,
} from './helpers.ts'

describe('rubik components: pen primitives', () => {
  test('applies pen size/color/clear sequence before final draw', () => {
    const project = new Project()
    const sprite = project.createSprite('pen-sprite')
    const done = project.stage.createVariable('done', 0)

    sprite.run(() => {
      whenFlagClicked(() => {
        clear()
        setPenColorToColor('#ff0000')
        setPenSizeTo(8)
        penDown()
        gotoXY(-80, 0)
        gotoXY(80, 0)
        penUp()

        clear()
        setPenColorToColor('#0000ff')
        setPenColorParamTo('transparency', 0)
        setPenSizeTo(6)
        penDown()
        gotoXY(-40, -40)
        gotoXY(40, -40)
        penUp()

        setVariableTo(done, 1)
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, done.id)).toBeLooselyEqual(1)

    const frame = vm.renderFrame()
    expect(hasApproxColor(frame, [0, 0, 255], 36, 80)).toBe(true)
    expect(hasApproxColor(frame, [255, 0, 0], 36, 80)).toBe(false)
  })

  test('applies transparency once per stroke without over-darkening', () => {
    const project = new Project()
    const sprite = project.createSprite('pen-sprite')
    const done = project.stage.createVariable('done', 0)

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

        setVariableTo(done, 1)
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, done.id)).toBeLooselyEqual(1)

    const frame = vm.renderFrame()
    const centerX = Math.floor(frame.width / 2)
    const centerY = Math.floor(frame.height / 2)
    const base = (centerY * frame.width + centerX) * 4
    const r = frame.pixels[base] ?? 0
    const g = frame.pixels[base + 1] ?? 0
    const b = frame.pixels[base + 2] ?? 0
    const a = frame.pixels[base + 3] ?? 0

    expect(a).toBeLooselyEqual(255)
    expect(g).toBeLessThan(16)
    expect(r).toBeGreaterThan(70)
    expect(b).toBeGreaterThan(70)
    expect(r).toBeLessThan(220)
    expect(b).toBeLessThan(220)
    expect(Math.abs(r - b)).toBeLessThan(90)
  })
})
