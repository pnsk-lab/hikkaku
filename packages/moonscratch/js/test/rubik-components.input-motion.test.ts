import { Project } from 'hikkaku'
import {
  getKeyPressed,
  getMouseDown,
  getMouseX,
  getMouseY,
  gotoXY,
  ifThen,
  setDragMode,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  createVmFromProject,
  getStageVariable,
  getTargetByName,
  runUntilFinished,
} from './helpers.ts'

describe('rubik components: input and motion', () => {
  test('reads key/mouse input and moves sprite with motion_gotoxy', () => {
    const project = new Project()
    const sprite = project.createSprite('pointer')
    const mouseX = project.stage.createVariable('mouseX', 0)
    const mouseY = project.stage.createVariable('mouseY', 0)
    const mouseDown = project.stage.createVariable('mouseDown', 0)
    const keyPressed = project.stage.createVariable('keyPressed', 0)

    sprite.run(() => {
      whenFlagClicked(() => {
        setDragMode('draggable')
        setVariableTo(mouseX, getMouseX())
        setVariableTo(mouseY, getMouseY())
        ifThen(getMouseDown(), () => {
          setVariableTo(mouseDown, 1)
        })
        ifThen(getKeyPressed('space'), () => {
          setVariableTo(keyPressed, 1)
        })
        gotoXY(getMouseX(), getMouseY())
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    vm.setMouseState({ x: 40, y: -30, isDown: true })
    vm.setKeysDown(['space'])
    runUntilFinished(vm)

    expect(getStageVariable(vm, mouseX.id)).toBeLooselyEqual(40)
    expect(getStageVariable(vm, mouseY.id)).toBeLooselyEqual(-30)
    expect(getStageVariable(vm, mouseDown.id)).toBeLooselyEqual(1)
    expect(getStageVariable(vm, keyPressed.id)).toBeLooselyEqual(1)

    const moved = getTargetByName(vm, 'pointer')
    expect(moved.x).toBe(40)
    expect(moved.y).toBe(-30)
  })
})
