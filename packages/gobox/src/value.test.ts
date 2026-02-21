import { Project } from 'hikkaku'
import { stop, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { boolean, number, string, struct, vector } from './types'
import { useEffect, useScopedValue, useSignal } from './value'

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
      const x = useScopedValue(number(10))
      const y = useScopedValue(number(20))
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
          position: vector(number(0), 2),
          score: number(1),
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
      useScopedValue(string('hello'))
      useScopedValue(boolean(false))
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
        useScopedValue(vector(number(0), 0))
      })
    }).toThrow(/scoped value width must be positive/)
  })

  test('throws on out-of-range vector index access', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const values = useScopedValue(vector(number(0), 2))
        values.at(2)
      })
    }).toThrow(/vector index out of range/)
  })

  test('forbids control_stop in dynamic gobox scopes', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        whenFlagClicked(() => {
          useScopedValue(number(0))
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
          useScopedValue(number(0))
        })
        useScopedValue(number(0))
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
        useSignal(struct({ x: number(0) }) as unknown as number)
      })
    }).toThrow(/only supports primitive gobox types/)
  })
})
