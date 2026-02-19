import type {
  ListReference,
  PrimitiveSource,
  Target,
  VariableReference,
} from 'hikkaku'
import {
  __unstable_forbidStopInCurrentScope,
  __unstable_getBuildScopeFrame,
  __unstable_getBuildTarget,
  __unstable_onBuildScopeExit,
} from 'hikkaku'
import {
  add,
  addToList,
  getVariable,
  gt,
  ifThen,
  lengthOfList,
  lt,
  repeat,
  setVariableTo,
  subtract,
} from 'hikkaku/blocks'
import type { GoboxMemoryAtom } from '../types'

export const MAX_GBOX_MEMORY_SLOTS = 200000

export type BuildScopeKind = 'run' | 'stack'

export interface BuildScopeSnapshot {
  id: number
  kind: BuildScopeKind
  depth: number
  forbidStop: boolean
}

export type SlotPointer =
  | {
      kind: 'static'
      index: number
    }
  | {
      kind: 'variable'
      variable: VariableReference
      offset: number
    }
  | {
      kind: 'expr'
      source: PrimitiveSource<number>
      offset: number
    }

interface ScopeRuntimeState {
  startVar: VariableReference
  allocationCount: number
}

export interface GoboxTargetRuntime {
  target: Target
  memoryList: ListReference
  memoryBacking: GoboxMemoryAtom[]
  stackPointer: VariableReference
  staticCursor: number
  hasDynamicAllocation: boolean
  dynamicScopes: Map<number, ScopeRuntimeState>
  signalCounter: number
}

const runtimeByTarget = new WeakMap<object, GoboxTargetRuntime>()

export const getCurrentScope = (): BuildScopeSnapshot => {
  const scope = __unstable_getBuildScopeFrame()
  if (!scope) {
    throw new Error('gobox APIs must be used inside target.run()')
  }
  return scope
}

export const getRuntimeForCurrentTarget = (): GoboxTargetRuntime => {
  const target = __unstable_getBuildTarget()
  if (!target) {
    throw new Error('gobox APIs must be used inside target.run()')
  }

  const cached = runtimeByTarget.get(target)
  if (cached) {
    return cached
  }

  const memoryBacking: GoboxMemoryAtom[] = []
  const runtime: GoboxTargetRuntime = {
    target,
    memoryList: target.createList('__gobox_mem', memoryBacking),
    memoryBacking,
    stackPointer: target.createVariable('__gobox_sp', 0),
    staticCursor: 0,
    hasDynamicAllocation: false,
    dynamicScopes: new Map(),
    signalCounter: 0,
  }
  runtimeByTarget.set(target, runtime)
  return runtime
}

export const withPointerOffset = (
  pointer: SlotPointer,
  offset: number,
): SlotPointer => {
  if (offset === 0) {
    return pointer
  }

  switch (pointer.kind) {
    case 'static':
      return {
        kind: 'static',
        index: pointer.index + offset,
      }
    case 'variable':
      return {
        kind: 'variable',
        variable: pointer.variable,
        offset: pointer.offset + offset,
      }
    case 'expr':
      return {
        kind: 'expr',
        source: pointer.source,
        offset: pointer.offset + offset,
      }
    default: {
      const exhaustivePointer: never = pointer
      void exhaustivePointer
      throw new Error('unknown pointer kind')
    }
  }
}

export const pointerToIndexSource = (
  pointer: SlotPointer,
  extraOffset = 0,
): PrimitiveSource<number> => {
  switch (pointer.kind) {
    case 'static':
      return pointer.index + extraOffset
    case 'variable': {
      const totalOffset = pointer.offset + extraOffset
      const base = getVariable(pointer.variable) as PrimitiveSource<number>
      return totalOffset === 0 ? base : add(base, totalOffset)
    }
    case 'expr': {
      const totalOffset = pointer.offset + extraOffset
      return totalOffset === 0
        ? pointer.source
        : add(pointer.source, totalOffset)
    }
    default: {
      const exhaustivePointer: never = pointer
      void exhaustivePointer
      throw new Error('unknown pointer kind')
    }
  }
}

const ensureDynamicScope = (
  runtime: GoboxTargetRuntime,
  scope: BuildScopeSnapshot,
): ScopeRuntimeState => {
  const existing = runtime.dynamicScopes.get(scope.id)
  if (existing) {
    return existing
  }

  runtime.hasDynamicAllocation = true
  __unstable_forbidStopInCurrentScope()

  if (runtime.staticCursor > 0) {
    ifThen(lt(getVariable(runtime.stackPointer), runtime.staticCursor), () => {
      setVariableTo(runtime.stackPointer, runtime.staticCursor)
    })
  }

  const startVar = runtime.target.createVariable(
    `__gobox_scope_${scope.id}_start`,
    0,
  )
  setVariableTo(startVar, getVariable(runtime.stackPointer))

  __unstable_onBuildScopeExit(() => {
    setVariableTo(runtime.stackPointer, getVariable(startVar))
  })

  const state: ScopeRuntimeState = {
    startVar,
    allocationCount: 0,
  }
  runtime.dynamicScopes.set(scope.id, state)
  return state
}

const ensureCapacityByStackPointer = (runtime: GoboxTargetRuntime): void => {
  ifThen(
    gt(getVariable(runtime.stackPointer), lengthOfList(runtime.memoryList)),
    () => {
      repeat(
        subtract(
          getVariable(runtime.stackPointer),
          lengthOfList(runtime.memoryList),
        ),
        () => {
          addToList(runtime.memoryList, '')
        },
      )
    },
  )
}

const allocateStaticPointer = (
  runtime: GoboxTargetRuntime,
  width: number,
  defaults: GoboxMemoryAtom[],
): SlotPointer => {
  if (runtime.hasDynamicAllocation) {
    throw new Error(
      'useScopedValue() static allocation must happen before dynamic scoped allocations in the same target',
    )
  }

  if (runtime.staticCursor + width > MAX_GBOX_MEMORY_SLOTS) {
    throw new Error(
      `gobox memory limit exceeded (${MAX_GBOX_MEMORY_SLOTS} slots max)`,
    )
  }

  const startIndex = runtime.staticCursor + 1
  runtime.staticCursor += width
  runtime.memoryBacking.push(...defaults)

  return {
    kind: 'static',
    index: startIndex,
  }
}

const allocateDynamicPointer = (
  runtime: GoboxTargetRuntime,
  width: number,
  scope: BuildScopeSnapshot,
): SlotPointer => {
  if (runtime.staticCursor + width > MAX_GBOX_MEMORY_SLOTS) {
    throw new Error(
      `gobox memory limit exceeded (${MAX_GBOX_MEMORY_SLOTS} slots max)`,
    )
  }

  const scopeState = ensureDynamicScope(runtime, scope)
  const pointerVar = runtime.target.createVariable(
    `__gobox_ptr_${scope.id}_${scopeState.allocationCount}`,
    0,
  )
  scopeState.allocationCount += 1

  setVariableTo(pointerVar, add(getVariable(runtime.stackPointer), 1))
  setVariableTo(
    runtime.stackPointer,
    add(getVariable(runtime.stackPointer), width),
  )
  ensureCapacityByStackPointer(runtime)

  return {
    kind: 'variable',
    variable: pointerVar,
    offset: 0,
  }
}

export const allocateScopedPointer = (
  runtime: GoboxTargetRuntime,
  width: number,
  defaults: GoboxMemoryAtom[],
): SlotPointer => {
  if (width <= 0) {
    throw new Error('scoped value width must be positive')
  }

  const scope = getCurrentScope()
  if (scope.kind === 'run') {
    return allocateStaticPointer(runtime, width, defaults)
  }

  if (scope.kind === 'stack') {
    void defaults
    return allocateDynamicPointer(runtime, width, scope)
  }

  throw new Error('unknown build scope kind')
}
