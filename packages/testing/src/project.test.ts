import { Project } from 'hikkaku'
import type { ScratchProject } from 'sb3-types'
import { describe, expect, test } from 'vite-plus/test'
import { toScratchProject } from './project'

const minimalScratchProject = (): ScratchProject =>
  ({
    targets: [],
    monitors: [],
    extensions: [],
    meta: {
      semver: '',
      vm: '',
      agent: '',
    },
  }) as unknown as ScratchProject

describe('toScratchProject', () => {
  test('accepts ScratchProject object', () => {
    const project = minimalScratchProject()
    const result = toScratchProject(project)
    expect(result).toBe(project)
  })

  test('accepts Scratch JSON string', () => {
    const source = minimalScratchProject()
    const json = JSON.stringify(source)
    const result = toScratchProject(json)
    expect(result).toEqual(source)
  })

  test('accepts Hikkaku project instance', () => {
    const project = new Project()
    const result = toScratchProject(project)
    expect(result).toEqual(project.toScratch())
  })

  test('accepts toScratch-like object', () => {
    const project = minimalScratchProject()
    const like = {
      toScratch: () => project,
    }
    const result = toScratchProject(like)
    expect(result).toBe(project)
  })

  test('throws when invalid input', () => {
    expect(() => toScratchProject(123 as unknown as string)).toThrow()
    expect(() => toScratchProject('{')).toThrow()
  })
})
