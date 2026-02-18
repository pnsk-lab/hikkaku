import { Project } from 'hikkaku'
import {
  changeVariableBy,
  getItemOfList,
  getVariable,
  lengthOfList,
  replaceItemOfList,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  createVmFromProject,
  getStageTarget,
  getStageVariable,
  runUntilFinished,
} from './helpers.ts'

describe('rubik components: lists', () => {
  test('reads, replaces and measures list values', () => {
    const project = new Project()
    const values = project.stage.createList('values', [10, 20, 30])
    const picked = project.stage.createVariable('picked', 0)
    const length = project.stage.createVariable('length', 0)
    const total = project.stage.createVariable('total', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(picked, getItemOfList(values, 2))
        replaceItemOfList(values, 2, 99)
        changeVariableBy(picked, getItemOfList(values, 2))
        setVariableTo(length, lengthOfList(values))
        setVariableTo(total, getVariable(length))
        changeVariableBy(total, getVariable(picked))
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, picked.id)).toBe(119)
    expect(getStageVariable(vm, length.id)).toBe(3)
    expect(getStageVariable(vm, total.id)).toBe(122)

    const stage = getStageTarget(vm)
    expect(stage.lists[values.id]?.map((v) => Number(v))).toEqual([10, 99, 30])
  })
})
