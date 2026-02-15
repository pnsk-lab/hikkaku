import { Project } from 'hikkaku'
import {
  changeVariableBy,
  equals,
  gt,
  ifElse,
  ifThen,
  lt,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  createVmFromProject,
  getStageVariable,
  runUntilFinished,
} from './helpers.ts'

describe('rubik components: variables and branches', () => {
  test('executes control_if/control_if_else with variable writes', () => {
    const project = new Project()
    const score = project.stage.createVariable('score', 0)
    const branch = project.stage.createVariable('branch', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(score, 1)
        changeVariableBy(score, 2)

        ifElse(
          lt(1, 2),
          () => {
            changeVariableBy(branch, 1)
          },
          () => {
            changeVariableBy(branch, 100)
          },
        )

        ifThen(equals(score.get(), '3'), () => {
          changeVariableBy(branch, 2)
        })

        ifThen(gt(score.get(), 2), () => {
          changeVariableBy(branch, 4)
        })
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, score.id)).toBe(3)
    expect(getStageVariable(vm, branch.id)).toBe(7)
  })
})
