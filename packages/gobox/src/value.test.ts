import { Project } from 'hikkaku'
import { setVariableTo, stop, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  allocateScopedPointer,
  getCurrentScope,
  getRuntimeForCurrentTarget,
  MAX_GBOX_MEMORY_SLOTS,
  pointerToIndexSource,
  withPointerOffset,
} from './internal/runtime'
import { Bool, defineStruct, Num, Str, struct, Vector } from './types'
import {
  __unsafe_createScopedValueFromPointer,
  __unsafe_getPointerSource,
  __unsafe_getRuntimeFromScopedValue,
  isTrue,
  makeScopedValueFromType,
  useEffect,
  useSignal,
} from './value'

const findListByName = (
  project: ReturnType<Project['toScratch']>,
  targetName: string,
  listName: string,
): unknown[] | undefined => {
  const target = project.targets.find((entry) => entry.name === targetName)
  if (!target) {
    return undefined
  }
  for (const list of Object.values(target.lists)) {
    if (list[0] === listName) {
      return list[1] as unknown[]
    }
  }
  return undefined
}

describe('gobox/value', () => {
  test('allocates static scoped values in gobox list', () => {
    const project = new Project()

    project.stage.run(() => {
      const x = Num.makeScopedValue(10)
      const y = Num.makeScopedValue(20)
      x.set(11)
      y.set(21)
    })

    const scratch = project.toScratch()
    const list = findListByName(scratch, 'Stage', '__gobox_mem')
    expect(list?.length).toBe(2)
    expect(list?.[0]).toBe(10)
    expect(list?.[1]).toBe(20)
  })

  test('supports vector and struct scoped values', () => {
    const project = new Project()

    project.stage.run(() => {
      const State = defineStruct({
        position: Vector.configure(Num, 2),
        score: Num.setDefaults(1),
      })
      const state = State.makeScopedValue()
      state.position.at(0).set(10)
      state.position.at(1).set(20)
      state.score.set(5)
    })

    const scratch = project.toScratch()
    const list = findListByName(scratch, 'Stage', '__gobox_mem')
    expect(list?.length).toBe(3)
    expect(list?.[0]).toBe(0)
    expect(list?.[1]).toBe(0)
    expect(list?.[2]).toBe(1)
  })

  test('supports string and boolean scoped values', () => {
    const project = new Project()

    project.stage.run(() => {
      Str.makeScopedValue('hello')
      Bool.makeScopedValue(false)
    })

    const scratch = project.toScratch()
    const list = findListByName(scratch, 'Stage', '__gobox_mem')
    expect(list?.length).toBe(2)
    expect(list?.[0]).toBe('hello')
    expect(list?.[1]).toBe(0)
  })

  test('initializes zero-length vectors as invalid scoped values', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        Vector.configure(Num, 0).makeScopedValue()
      })
    }).toThrow(/scoped value width must be positive/)
  })

  test('throws on out-of-range vector index access', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const values = Vector.configure(Num, 2).makeScopedValue()
        values.at(2)
      })
    }).toThrow(/vector index out of range/)
  })

  test('forbids control_stop in dynamic gobox scopes', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        whenFlagClicked(() => {
          Num.makeScopedValue()
          stop('this script')
        })
      })
    }).toThrow(/control_stop is not allowed/)
  })

  test('rejects static allocation after dynamic scoped allocations', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        whenFlagClicked(() => {
          Num.makeScopedValue()
        })
        Num.makeScopedValue()
      })
    }).toThrow(
      /static allocation must happen before dynamic scoped allocations/,
    )
  })

  test('restricts useSignal to run top-level', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        whenFlagClicked(() => {
          useSignal(Num.makeScopedValue(0))
        })
      })
    }).toThrow(/run\(\) top-level/)
  })

  test('restricts useEffect to run top-level', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        whenFlagClicked(() => {
          useEffect(() => {})
        })
      })
    }).toThrow(/run\(\) top-level/)
  })

  test('restricts useSignal to primitive scoped gobox values', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const complex = struct({ x: Num }).makeScopedValue()
        useSignal(complex as unknown as import('./value').ScopedNumberValue)
      })
    }).toThrow(/only supports scoped primitive gobox values/)
  })
})

describe('gobox/value internals', () => {
  test('invokes borrow helpers for scoped primitives', () => {
    const project = new Project()
    const outNumber = project.stage.createVariable('outNumber', 0)
    const outString = project.stage.createVariable('outString', '')
    const outBoolean = project.stage.createVariable('outBoolean', 0)

    project.stage.run(() => {
      const valueNumber = Num.makeScopedValue(1)
      const valueString = Str.makeScopedValue('a')
      const valueBoolean = Bool.makeScopedValue(false)

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

  test('gets runtime from scoped values and rejects non-scoped inputs', () => {
    const project = new Project()
    project.stage.run(() => {
      const value = Num.makeScopedValue(1)
      const runtime = __unsafe_getRuntimeFromScopedValue(value)
      expect(runtime).toBe(getRuntimeForCurrentTarget())
    })

    expect(() => {
      __unsafe_getRuntimeFromScopedValue({} as never)
    }).toThrow(/value is not a scoped gobox value/)
  })

  test('throws for unknown gobox type tags in scoped creation', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        makeScopedValueFromType({
          tag: 'unknown',
          width: 1,
          defaults: [0],
        } as unknown as import('./types').GoboxTypeAny)
      })
    }).toThrow(/unknown gobox type/)
  })

  test('skips malformed struct fields in unsafe scoped creation', () => {
    const project = new Project()
    project.stage.run(() => {
      const runtime = getRuntimeForCurrentTarget()
      const pointer = allocateScopedPointer(runtime, 1, [0])
      const malformed = {
        tag: 'struct',
        fields: {},
        fieldOrder: ['ghost'],
        fieldOffsets: { ghost: 0 },
        width: 1,
        defaults: [0],
      } as unknown as import('./types').GoboxStructType<Record<string, never>>
      const scoped = __unsafe_createScopedValueFromPointer(
        runtime,
        malformed,
        pointer,
      ) as { ghost?: unknown }
      expect(scoped.ghost).toBeUndefined()
    })
  })

  test('builds isTrue boolean projection block', () => {
    const project = new Project()
    project.stage.run(() => {
      const signal = Bool.makeScopedValue(true)
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
      Num.makeScopedValue(1)
      whenFlagClicked(() => {
        Num.makeScopedValue(2)
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

  test('reuses dynamic scope state for repeated allocations in same stack scope', () => {
    const project = new Project()
    project.stage.run(() => {
      whenFlagClicked(() => {
        Num.makeScopedValue(1)
        Num.makeScopedValue(2)
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
    expect(opcodes).toContain('data_setvariableto')
  })

  test('supports pointer offsets for variable and expr pointers', () => {
    const project = new Project()
    const pointerVar = project.stage.createVariable('ptr', 1)
    const out = project.stage.createVariable('out', 0)

    const variablePointer = withPointerOffset(
      {
        kind: 'variable',
        variable: pointerVar,
        offset: 2,
      },
      3,
    )
    const exprPointer = withPointerOffset(
      {
        kind: 'expr',
        source: 5,
        offset: 4,
      },
      6,
    )

    expect(variablePointer).toEqual({
      kind: 'variable',
      variable: pointerVar,
      offset: 5,
    })
    expect(exprPointer).toEqual({
      kind: 'expr',
      source: 5,
      offset: 10,
    })
    project.stage.run(() => {
      setVariableTo(out, pointerToIndexSource(variablePointer) as never)
      setVariableTo(out, pointerToIndexSource(exprPointer) as never)
    })
  })

  test('throws when static allocations exceed memory limit', () => {
    expect(() => {
      const project = new Project()
      project.stage.run(() => {
        const runtime = getRuntimeForCurrentTarget()
        runtime.staticCursor = MAX_GBOX_MEMORY_SLOTS
        Num.makeScopedValue()
      })
    }).toThrow(/gobox memory limit exceeded/)
  })

  test('throws when dynamic allocations exceed memory limit', () => {
    expect(() => {
      const project = new Project()
      project.stage.run(() => {
        Num.makeScopedValue()
        whenFlagClicked(() => {
          const runtime = getRuntimeForCurrentTarget()
          runtime.staticCursor = MAX_GBOX_MEMORY_SLOTS
          Num.makeScopedValue()
        })
      })
    }).toThrow(/gobox memory limit exceeded/)
  })
})
