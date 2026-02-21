import { Project } from 'hikkaku'
import { setVariableTo } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { boolean, number, string } from './types'
import { __unsafe_getPointerSource, isTrue, useScopedValue } from './value'

describe('gobox/value internals', () => {
  test('invokes borrow helpers for scoped primitives', () => {
    const project = new Project()
    const outNumber = project.stage.createVariable('outNumber', 0)
    const outString = project.stage.createVariable('outString', '')
    const outBoolean = project.stage.createVariable('outBoolean', 0)

    project.stage.run(() => {
      const valueNumber = useScopedValue(number(1))
      const valueString = useScopedValue(string('a'))
      const valueBoolean = useScopedValue(boolean(false))

      const borrowNumber = valueNumber.borrow()
      const borrowMutNumber = valueNumber.borrowMut()
      const borrowString = valueString.borrow()
      const borrowMutString = valueString.borrowMut()
      const borrowBoolean = valueBoolean.borrow()
      const borrowMutBoolean = valueBoolean.borrowMut()

      setVariableTo(outNumber, borrowMutNumber.get() as never)
      borrowMutNumber.set(3 as never)
      setVariableTo(outString, borrowMutString.get() as never)
      borrowMutString.set('updated')
      setVariableTo(outBoolean, borrowMutBoolean.get() as never)
      borrowMutBoolean.set(true)
      setVariableTo(outNumber, borrowNumber.get() as never)
      setVariableTo(outString, borrowString.get() as never)
      setVariableTo(outBoolean, borrowBoolean.get() as never)
    })
  })

  test('throws when getting pointer source from non-scoped values', () => {
    expect(() => {
      __unsafe_getPointerSource({} as never)
    }).toThrow(/value is not a scoped gobox value/)
  })

  test('builds isTrue boolean projection block', () => {
    const project = new Project()
    project.stage.run(() => {
      const signal = useScopedValue(boolean(true))
      setVariableTo(
        project.stage.createVariable('flag', 0),
        isTrue(signal.get()) as never,
      )
    })

    const stage = project
      .toScratch()
      .targets.find((entry) => entry.name === 'Stage')
    const opcodes = Object.values(stage?.blocks ?? {})
      .filter(
        (block): block is { opcode: string } =>
          typeof block === 'object' && block !== null && 'opcode' in block,
      )
      .map((block) => block.opcode)
    expect(opcodes).toContain('operator_equals')
  })
})
