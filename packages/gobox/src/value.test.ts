import { Project } from 'hikkaku'
import { stop, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { number } from './types'
import { useScopedValue, useSignal } from './value'

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
})
