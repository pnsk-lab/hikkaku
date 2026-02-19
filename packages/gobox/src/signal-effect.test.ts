import { Project } from 'hikkaku'
import { setVariableTo, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { number } from './types'
import { useEffect, useSignal } from './value'

describe('gobox signal/effect', () => {
  test('emits procedure-based initial and reactive effect scripts', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', -1)

    project.stage.run(() => {
      const count = useSignal(number(0))

      useEffect(() => {
        setVariableTo(out, count.get() as never)
      })

      whenFlagClicked(() => {
        count.set(7)
      })
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

    expect(
      opcodes.filter((opcode) => opcode === 'event_whenflagclicked').length,
    ).toBe(2)
    expect(opcodes).toContain('procedures_definition')
    expect(opcodes).toContain('procedures_call')
    expect(opcodes).not.toContain('event_whenbroadcastreceived')
    expect(opcodes).not.toContain('event_broadcast')
    expect(out.id).toBeTruthy()
  })
})
