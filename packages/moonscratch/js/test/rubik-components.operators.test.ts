import { Project } from 'hikkaku'
import {
  add,
  and,
  divide,
  equals,
  gt,
  ifThen,
  lt,
  mathop,
  multiply,
  not,
  or,
  setVariableTo,
  subtract,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  createVmFromProject,
  getStageVariable,
  runUntilFinished,
} from './helpers.ts'

describe('rubik components: operators', () => {
  test('evaluates arithmetic and boolean operator chains', () => {
    const project = new Project()
    const arithmetic = project.stage.createVariable('arithmetic', 0)
    const sine = project.stage.createVariable('sine', 0)
    const logic = project.stage.createVariable('logic', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(arithmetic, add(10, 5))
        setVariableTo(arithmetic, subtract(arithmetic.get(), 3))
        setVariableTo(arithmetic, multiply(arithmetic.get(), 4))
        setVariableTo(arithmetic, divide(arithmetic.get(), 6))
        setVariableTo(sine, mathop('sin', 30))
        ifThen(and(or(true, false), not(false)), () => {
          setVariableTo(logic, 1)
        })
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, arithmetic.id)).toBeLooselyEqual(8)
    expect(getStageVariable(vm, logic.id)).toBeLooselyEqual(1)
    expect(Number(getStageVariable(vm, sine.id))).toBeCloseTo(0.5, 6)
  })

  test('uses Scratch compare semantics for lt/gt/equals', () => {
    const project = new Project()
    const leftA = project.stage.createVariable('leftA', 0)
    const rightA = project.stage.createVariable('rightA', 0)
    const leftB = project.stage.createVariable('leftB', 0)
    const rightB = project.stage.createVariable('rightB', 0)
    const leftC = project.stage.createVariable('leftC', '')
    const rightC = project.stage.createVariable('rightC', '')
    const leftD = project.stage.createVariable('leftD', '')
    const rightD = project.stage.createVariable('rightD', 0)
    const numericLt = project.stage.createVariable('numericLt', 0)
    const numericGt = project.stage.createVariable('numericGt', 0)
    const stringLt = project.stage.createVariable('stringLt', 0)
    const whitespaceEq = project.stage.createVariable('whitespaceEq', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(leftA, -1)
        setVariableTo(rightA, -0.05)
        setVariableTo(leftB, 2)
        setVariableTo(rightB, 1)
        setVariableTo(leftC, 'apple')
        setVariableTo(rightC, 'Banana')
        setVariableTo(leftD, '   ')
        setVariableTo(rightD, 0)

        ifThen(lt(leftA.get(), rightA.get()), () => {
          setVariableTo(numericLt, 1)
        })
        ifThen(gt(leftB.get(), rightB.get()), () => {
          setVariableTo(numericGt, 1)
        })
        ifThen(lt(leftC.get(), rightC.get()), () => {
          setVariableTo(stringLt, 1)
        })
        ifThen(equals(leftD.get(), rightD.get()), () => {
          setVariableTo(whitespaceEq, 1)
        })
      })
    })

    const vm = createVmFromProject(project)
    vm.greenFlag()
    runUntilFinished(vm)

    expect(getStageVariable(vm, numericLt.id)).toBeLooselyEqual(1)
    expect(getStageVariable(vm, numericGt.id)).toBeLooselyEqual(1)
    expect(getStageVariable(vm, stringLt.id)).toBeLooselyEqual(1)
    expect(getStageVariable(vm, whitespaceEq.id)).toBeLooselyEqual(0)
  })
})
