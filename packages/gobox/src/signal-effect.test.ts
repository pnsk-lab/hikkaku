import { Project } from 'hikkaku'
import { setVariableTo, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { Bool, Num, Str } from './types'
import { useEffect, useSignal } from './value'

describe('gobox signal/effect', () => {
  test('emits procedure-based initial and reactive effect scripts', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', -1)

    project.stage.run(() => {
      const count = useSignal(Num.makeScopedValue(0))

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

  test('creates only initial procedure call when effect has no signal dependencies', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', -1)

    project.stage.run(() => {
      useEffect(() => {
        setVariableTo(out, 1)
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

    expect(opcodes).toContain('procedures_definition')
    expect(
      opcodes.filter((opcode) => opcode === 'procedures_call').length,
    ).toBe(1)
    expect(opcodes).not.toContain('event_whenbroadcastreceived')
    expect(opcodes).not.toContain('event_broadcast')
    expect(out.id).toBeTruthy()
  })

  test('supports string and boolean signal values', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', -1)

    project.stage.run(() => {
      const name = useSignal(Str.makeScopedValue('ready'))
      const running = useSignal(Bool.makeScopedValue(false))

      useEffect(() => {
        setVariableTo(out, name.get() as never)
        setVariableTo(out, running.get() as never)
      })

      whenFlagClicked(() => {
        name.set('go')
        running.set(true)
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

    expect(opcodes).toContain('procedures_definition')
    expect(
      opcodes.filter((opcode) => opcode === 'procedures_call').length,
    ).toBeGreaterThan(1)
    expect(opcodes).not.toContain('event_broadcastreceived')
    expect(opcodes).not.toContain('event_broadcast')
    expect(out.id).toBeTruthy()
  })

  test('does not re-run effect when scoped value is set directly', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', -1)

    project.stage.run(() => {
      const raw = Num.makeScopedValue(0)
      const count = useSignal(raw)

      useEffect(() => {
        setVariableTo(out, count.get() as never)
      })

      whenFlagClicked(() => {
        raw.set(7)
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
      opcodes.filter((opcode) => opcode === 'procedures_call').length,
    ).toBe(1)
    expect(out.id).toBeTruthy()
  })

  test('supports signal get outside dependency collection', () => {
    const project = new Project()
    const out = project.stage.createVariable('out', -1)

    project.stage.run(() => {
      const count = useSignal(Num.makeScopedValue(3))
      setVariableTo(out, count.get() as never)
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
    expect(opcodes).toContain('data_setvariableto')
    expect(out.id).toBeTruthy()
  })
})
