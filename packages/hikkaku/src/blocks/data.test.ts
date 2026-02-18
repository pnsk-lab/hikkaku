import { describe, expect, test } from 'vite-plus/test'
import { Project } from '../core/project'
import { addToList, setVariableTo } from './data'

describe('blocks/data', () => {
  test('handles variable and list operations', () => {
    const project = new Project()
    const v = project.stage.createVariable('score', 0)
    const l = project.stage.createList('items', [])

    project.stage.run(() => {
      setVariableTo(v, 10)
      addToList(l, 'a')
    })

    const blocks = project.toScratch().targets[0]?.blocks ?? {}
    const opcodes = Object.values(blocks)
      .filter(
        (b): b is { opcode: string } =>
          typeof b === 'object' && b !== null && 'opcode' in b,
      )
      .map((b) => b.opcode)

    expect(opcodes).toContain('data_setvariableto')
    expect(opcodes).toContain('data_addtolist')
  })
})
