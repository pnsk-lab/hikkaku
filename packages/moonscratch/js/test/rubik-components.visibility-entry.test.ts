import { Project } from 'hikkaku'
import { hide, setVariableTo, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  createVmFromProject,
  getStageVariable,
  getTargetByName,
  runUntilFinished,
} from './helpers.ts'

describe('rubik components: visibility and entry', () => {
  test('runs whenFlagClicked and applies looks_hide', () => {
    const project = new Project()
    const sprite = project.createSprite('hidden-sprite')
    const entered = project.stage.createVariable('entered', 0)

    sprite.run(() => {
      whenFlagClicked(() => {
        hide()
        setVariableTo(entered, 1)
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, entered.id)).toBeLooselyEqual(1)
    expect(getTargetByName(vm, 'hidden-sprite').visible).toBe(false)
  })
})
