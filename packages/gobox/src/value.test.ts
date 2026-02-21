import { Project } from 'hikkaku'
import { setVariableTo, stop, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  getCurrentScope,
  getRuntimeForCurrentTarget,
  MAX_GBOX_MEMORY_SLOTS,
  pointerToIndexSource,
  withPointerOffset,
} from './internal/runtime'
import { Bool, Num, Str, struct, vector } from './types'
import {
  __unsafe_getPointerSource,
  isTrue,
  useEffect,
  useScopedValue,
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
      const x = useScopedValue(new Num(10))
      const y = useScopedValue(new Num(20))
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
      const state = useScopedValue(
        struct({
          position: vector(new Num(0), 2),
          score: new Num(1),
        }),
      )
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
      useScopedValue(new Str('hello'))
      useScopedValue(new Bool(false))
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
        useScopedValue(vector(new Num(0), 0))
      })
    }).toThrow(/scoped value width must be positive/)
  })

  test('throws on out-of-range vector index access', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const values = useScopedValue(vector(new Num(0), 2))
        values.at(2)
      })
    }).toThrow(/vector index out of range/)
  })

  test('forbids control_stop in dynamic gobox scopes', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        whenFlagClicked(() => {
          useScopedValue(new Num(0))
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
          useScopedValue(new Num(0))
        })
        useScopedValue(new Num(0))
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
          useSignal(0)
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

  test('restricts useSignal to primitive gobox types', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        useSignal(struct({ x: new Num(0) }) as unknown as number)
      })
    }).toThrow(/only supports primitive gobox types/)
  })
})

describe('gobox/value internals', () => {
  test('invokes borrow helpers for scoped primitives', () => {
    const project = new Project()
    const outNumber = project.stage.createVariable('outNumber', 0)
    const outString = project.stage.createVariable('outString', '')
    const outBoolean = project.stage.createVariable('outBoolean', 0)

    project.stage.run(() => {
      const valueNumber = useScopedValue(new Num(1))
      const valueString = useScopedValue(new Str('a'))
      const valueBoolean = useScopedValue(new Bool(false))

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
      const signal = useScopedValue(new Bool(true))
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
      useScopedValue(new Num(1))
      whenFlagClicked(() => {
        useScopedValue(new Num(2))
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
        useScopedValue(new Num(0))
      })
    }).toThrow(/gobox memory limit exceeded/)
  })

  test('throws when dynamic allocations exceed memory limit', () => {
    expect(() => {
      const project = new Project()
      project.stage.run(() => {
        useScopedValue(new Num(0))
        whenFlagClicked(() => {
          const runtime = getRuntimeForCurrentTarget()
          runtime.staticCursor = MAX_GBOX_MEMORY_SLOTS
          useScopedValue(new Num(0))
        })
      })
    }).toThrow(/gobox memory limit exceeded/)
  })
})
