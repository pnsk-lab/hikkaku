import type { JsonValue, VMSnapshot, VMSnapshotTarget } from 'moonscratch'
import type { ScratchProject, Sprite, Stage } from 'sb3-types'
import { findProjectTarget } from './project'
import type { VariableRefLike } from './types'
import { isRecord, isVariableRef, isVariableTuple } from './utils'

const findSnapshotTarget = (
  snapshot: VMSnapshot,
  target: string | number,
): { target: VMSnapshotTarget; index: number } | undefined => {
  if (typeof target === 'number') {
    const value = snapshot.targets[target]
    if (!value) {
      return undefined
    }
    return { target: value, index: target }
  }

  const index = snapshot.targets.findIndex((entry) => entry.name === target)
  if (index === -1) {
    return undefined
  }
  const resolved = snapshot.targets[index]
  if (!resolved) {
    return undefined
  }
  return { target: resolved, index }
}

const resolveVariableId = (
  target: Stage | Sprite,
  nameOrId: string,
): string | undefined => {
  if (!target.variables || typeof target.variables !== 'object') {
    return undefined
  }

  if (Object.hasOwn(target.variables, nameOrId)) {
    return nameOrId
  }

  for (const [id, value] of Object.entries(target.variables)) {
    if (isVariableTuple(value) && value[0] === nameOrId) {
      return id
    }
  }
  return undefined
}

const resolveVariableRef = (
  variable: string | VariableRefLike,
): string | undefined => {
  return typeof variable === 'string' ? variable : variable.id
}

const readVariableFromSnapshot = (
  snapshot: VMSnapshot,
  target: string | number,
  variableId: string,
): JsonValue | undefined => {
  const liveTarget = findSnapshotTarget(snapshot, target)
  if (!liveTarget || !isRecord(liveTarget.target.variables)) {
    return undefined
  }
  return Object.hasOwn(liveTarget.target.variables, variableId)
    ? (liveTarget.target.variables[variableId] as JsonValue)
    : undefined
}

const readVariableFromAnyTarget = (
  snapshot: VMSnapshot,
  variableId: string,
): JsonValue | undefined => {
  for (const liveTarget of snapshot.targets) {
    if (!isRecord(liveTarget.variables)) {
      continue
    }
    if (Object.hasOwn(liveTarget.variables, variableId)) {
      return liveTarget.variables[variableId] as JsonValue
    }
  }
  return undefined
}

/**
 * Find a snapshot target by name or index.
 *
 * @param snapshot VM snapshot to search.
 * @param target Target name or index.
 * @returns Matched snapshot target or `undefined`.
 */
export const getSnapshotTarget = (
  snapshot: VMSnapshot,
  target: string | number,
): VMSnapshotTarget | undefined => {
  return findSnapshotTarget(snapshot, target)?.target
}

/**
 * Resolve a variable value from a snapshot.
 *
 * @param snapshot VM snapshot.
 * @param variable Variable ID or `{ id }` reference.
 * @returns Variable value when the id/reference matches, otherwise `undefined`.
 */
export function getSnapshotVariable(
  snapshot: VMSnapshot,
  variable: string | VariableRefLike,
): JsonValue | undefined
/**
 * Resolve a variable value from a snapshot by project/target context.
 *
 * @param snapshot VM snapshot.
 * @param project Scratch project used for variable name-to-id resolution.
 * @param target Target name or index.
 * @param variableNameOrId Variable name or id.
 * @returns Variable value when found, otherwise `undefined`.
 */
export function getSnapshotVariable(
  snapshot: VMSnapshot,
  project: ScratchProject,
  target: string | number,
  variableNameOrId: string,
): JsonValue | undefined
export function getSnapshotVariable(
  snapshot: VMSnapshot,
  projectOrVariable: ScratchProject | string | VariableRefLike,
  targetOrVariable?: string | number,
  variableNameOrId?: string,
): JsonValue | undefined {
  if (
    typeof projectOrVariable !== 'string' &&
    !isVariableRef(projectOrVariable) &&
    targetOrVariable !== undefined &&
    typeof variableNameOrId === 'string'
  ) {
    const projectTarget = findProjectTarget(projectOrVariable, targetOrVariable)
    if (!projectTarget) {
      return undefined
    }
    const variableId = resolveVariableId(projectTarget.target, variableNameOrId)
    if (!variableId) {
      return undefined
    }
    return readVariableFromSnapshot(snapshot, targetOrVariable, variableId)
  }

  if (
    !isVariableRef(projectOrVariable) &&
    typeof projectOrVariable !== 'string'
  ) {
    return undefined
  }

  const variableId = resolveVariableRef(projectOrVariable)
  if (!variableId) {
    return undefined
  }

  if (targetOrVariable === undefined) {
    return readVariableFromAnyTarget(snapshot, variableId)
  }

  if (
    typeof targetOrVariable === 'string' ||
    typeof targetOrVariable === 'number'
  ) {
    return readVariableFromSnapshot(snapshot, targetOrVariable, variableId)
  }

  return undefined
}
