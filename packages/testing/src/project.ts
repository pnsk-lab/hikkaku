import type { ScratchProject, Sprite, Stage } from 'sb3-types'
import type { HikkakuProjectInput } from './types'
import { isRecord } from './utils'

type HikkakuProjectLike = {
  toScratch(): ScratchProject
}

const isScratchProject = (value: unknown): value is ScratchProject => {
  return isRecord(value) && Array.isArray(value.targets)
}

const isHikkakuProject = (value: unknown): value is HikkakuProjectLike => {
  return (
    isRecord(value) &&
    typeof (value as HikkakuProjectLike).toScratch === 'function'
  )
}

/**
 * Convert supported project inputs to a Scratch project object.
 *
 * @param project
 * A Scratch JSON string, ScratchProject object, Hikkaku project, or object with
 * a `toScratch` method.
 * @returns
 * Normalized Scratch project object.
 */
export const toScratchProject = (
  project: HikkakuProjectInput,
): ScratchProject => {
  if (typeof project === 'string') {
    const parsed = JSON.parse(project)
    if (!isScratchProject(parsed)) {
      throw new Error('project must be valid Scratch JSON string')
    }
    return parsed
  }
  if (isScratchProject(project) || isHikkakuProject(project)) {
    return isScratchProject(project) ? project : project.toScratch()
  }
  throw new Error('project must be a Scratch project object or Hikkaku Project')
}

/**
 * Find a project target by name or index.
 *
 * @param project Source Scratch project.
 * @param target Target name or index.
 * @returns Target and index pair, or `undefined` when not found.
 */
export const findProjectTarget = (
  project: ScratchProject,
  target: string | number,
): { target: Stage | Sprite; index: number } | undefined => {
  if (typeof target === 'number') {
    const value = project.targets[target]
    if (!value) {
      return undefined
    }
    return { target: value as Stage | Sprite, index: target }
  }

  const index = project.targets.findIndex((entry) => entry.name === target)
  if (index === -1) {
    return undefined
  }
  return { target: project.targets[index] as Stage | Sprite, index }
}
