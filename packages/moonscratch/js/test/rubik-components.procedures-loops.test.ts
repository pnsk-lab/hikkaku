import { Project } from 'hikkaku'
import {
  callProcedure,
  changeVariableBy,
  defineProcedure,
  forEach,
  forever,
  procedureLabel,
  repeat,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  createVmFromProject,
  getStageTarget,
  getStageVariable,
  stepMany,
} from './helpers.ts'

describe('rubik components: procedures and loops', () => {
  test('runs repeat/forEach/procedure while forever script stays active', () => {
    const project = new Project()
    const index = project.stage.createVariable('index', 0)
    const sum = project.stage.createVariable('sum', 0)
    const done = project.stage.createVariable('done', 0)
    const foreverTicks = project.stage.createVariable('foreverTicks', 0)

    project.stage.run(() => {
      const bump = defineProcedure(
        [procedureLabel('bump')],
        () => {
          changeVariableBy(sum, 5)
          return undefined
        },
        true,
      )

      whenFlagClicked(() => {
        setVariableTo(sum, 0)
        repeat(3, () => {
          changeVariableBy(sum, 2)
        })
        forEach(index, 4, () => {
          changeVariableBy(sum, 1)
        })
        callProcedure(bump, [])
        callProcedure(bump, [])
        setVariableTo(done, 1)
      })
    })

    project.stage.run(() => {
      whenFlagClicked(() => {
        forever(() => {
          changeVariableBy(foreverTicks, 1)
        })
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    stepMany(vm, 24)

    expect(getStageVariable(vm, sum.id)).toBeLooselyEqual(20)
    expect(getStageVariable(vm, index.id)).toBeLooselyEqual(4)
    expect(getStageVariable(vm, done.id)).toBeLooselyEqual(1)
    expect(Number(getStageVariable(vm, foreverTicks.id))).toBeGreaterThan(0)
    expect(getStageTarget(vm).isStage).toBe(true)
    expect(vm.snapshot().activeThreads).toBeGreaterThan(0)
  }, 100000)
})
