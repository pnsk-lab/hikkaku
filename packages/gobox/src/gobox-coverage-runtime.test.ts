import { Project } from 'hikkaku'
import { whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  getCurrentScope,
  getRuntimeForCurrentTarget,
  MAX_GBOX_MEMORY_SLOTS,
  pointerToIndexSource,
  withPointerOffset,
} from './internal/runtime'
import { number } from './types'
import { useScopedValue } from './value'

describe('gobox/internal/runtime edge cases', () => {
  test('throws when build APIs are used outside run()', () => {
    expect(() => {
      getCurrentScope()
    }).toThrow(/gobox APIs must be used inside target.run/)

    expect(() => {
      getRuntimeForCurrentTarget()
    }).toThrow(/gobox APIs must be used inside target.run/)
  })

  test('throws for unknown pointer kinds', () => {
    const unknownKind = {
      kind: 'mystery',
      index: 0,
    } as unknown as Parameters<typeof withPointerOffset>[0]

    expect(() => {
      withPointerOffset(unknownKind, 1)
    }).toThrow(/unknown pointer kind/)
    expect(() => {
      pointerToIndexSource(unknownKind)
    }).toThrow(/unknown pointer kind/)
  })

  test('supports dynamic scoped allocations after static allocations', () => {
    const project = new Project()
    project.stage.run(() => {
      useScopedValue(number(1))
      whenFlagClicked(() => {
        useScopedValue(number(2))
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
    expect(opcodes).toContain('control_if')
  })

  test('throws when static allocations exceed memory limit', () => {
    expect(() => {
      const project = new Project()
      project.stage.run(() => {
        const runtime = getRuntimeForCurrentTarget()
        runtime.staticCursor = MAX_GBOX_MEMORY_SLOTS
        useScopedValue(number(0))
      })
    }).toThrow(/gobox memory limit exceeded/)
  })

  test('throws when dynamic allocations exceed memory limit', () => {
    expect(() => {
      const project = new Project()
      project.stage.run(() => {
        useScopedValue(number(0))
        whenFlagClicked(() => {
          const runtime = getRuntimeForCurrentTarget()
          runtime.staticCursor = MAX_GBOX_MEMORY_SLOTS
          useScopedValue(number(0))
        })
      })
    }).toThrow(/gobox memory limit exceeded/)
  })
})
