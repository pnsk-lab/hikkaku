import { Project } from 'hikkaku'
import {
  add,
  and,
  changeVariableBy,
  divide,
  equals,
  forEach,
  getVariable,
  gt,
  ifElse,
  ifThen,
  join,
  length,
  multiply,
  or,
  repeat,
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

describe('js/test variable handling', () => {
  test('executes arithmetic assignment and conditionally branches with variable values', () => {
    const project = new Project()
    const total = project.stage.createVariable('total', 0)
    const multiplier = project.stage.createVariable('multiplier', 0)
    const done = project.stage.createVariable('done', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(total, 10)
        setVariableTo(multiplier, 2)
        changeVariableBy(total, multiply(multiplier.get(), 3))
        setVariableTo(multiplier, divide(total.get(), 2))
        ifThen(gt(multiplier.get(), 2), () => {
          setVariableTo(total, add(total.get(), 10))
        })
        setVariableTo(done, 1)
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, total.id)).toBe(26)
    expect(getStageVariable(vm, multiplier.id)).toBe(8)
    expect(getStageVariable(vm, done.id)).toBe(1)
  })

  test('uses repeat and forEach to update variables deterministically', () => {
    const project = new Project()
    const running = project.stage.createVariable('running', 0)
    const index = project.stage.createVariable('index', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        repeat(2, () => {
          changeVariableBy(running, 1)
        })
        forEach(index, 4, () => {
          changeVariableBy(running, 1)
        })
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, running.id)).toBe(6)
    expect(getStageVariable(vm, index.id)).toBe(4)
  })

  test('checks branch behavior with logical and numeric/string variable states', () => {
    const project = new Project()
    const total = project.stage.createVariable('total', 0)
    const status = project.stage.createVariable('status', '')
    const statusVerified = project.stage.createVariable('statusVerified', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(total, 4)
        setVariableTo(status, 'ready')
        ifElse(
          gt(total.get(), 3),
          () => {
            setVariableTo(status, join(status.get(), '!'))
          },
          () => {
            setVariableTo(status, 'low')
          },
        )

        ifThen(and(equals(status.get(), 'ready!'), gt(total.get(), 3)), () => {
          setVariableTo(statusVerified, 1)
        })

        ifElse(
          and(gt(total.get(), 5), equals(status.get(), 'ready!')),
          () => {
            changeVariableBy(total, 4)
          },
          () => {
            changeVariableBy(total, -1)
          },
        )
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, total.id)).toBe(8)
    expect(getStageVariable(vm, status.id)).toBe('ready!')
    expect(getStageVariable(vm, statusVerified.id)).toBe(1)
  })

  test('derives a numeric summary from a string variable', () => {
    const project = new Project()
    const label = project.stage.createVariable('label', '')
    const labelLength = project.stage.createVariable('labelLength', 0)
    const isLong = project.stage.createVariable('isLong', 0)
    const status = project.stage.createVariable('status', '')

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(label, join('hello', ', world'))
        setVariableTo(labelLength, length(label.get()))
        ifElse(
          gt(labelLength.get(), 8),
          () => {
            setVariableTo(status, 'long')
          },
          () => {
            setVariableTo(status, 'short')
          },
        )
        ifThen(
          or(equals(status.get(), 'long'), equals(status.get(), 'short')),
          () => {
            setVariableTo(isLong, 1)
          },
        )
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, label.id)).toBe('hello, world')
    expect(getStageVariable(vm, labelLength.id)).toBe(12)
    expect(getStageVariable(vm, status.id)).toBe('long')
    expect(getStageVariable(vm, isLong.id)).toBe(1)
  })

  test('updates sprite variables and shares values between stage and sprite scripts', () => {
    const project = new Project()
    const stageScore = project.stage.createVariable('stageScore', 0)
    const sprite = project.createSprite('worker')
    const spriteScore = sprite.createVariable('spriteScore', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(stageScore, 2)
      })
    })

    sprite.run(() => {
      whenFlagClicked(() => {
        setVariableTo(spriteScore, getVariable(stageScore))
        repeat(2, () => {
          changeVariableBy(spriteScore, getVariable(stageScore))
        })
        ifThen(gt(spriteScore.get(), 5), () => {
          setVariableTo(
            stageScore,
            add(getVariable(stageScore), spriteScore.get()),
          )
        })
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, stageScore.id)).toBe(8)
    expect(getTargetByName(vm, 'worker').variables[spriteScore.id]).toBe(6)
  })
})
