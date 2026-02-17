import type {
  CreateHeadlessVMFromProjectOptions,
  CreateHeadlessVMWithScratchAssetsOptions,
} from 'moonscratch'
import {
  createHeadlessVMFromProject,
  createHeadlessVMWithScratchAssets,
} from 'moonscratch'
import { toScratchProject } from './project'
import { getSnapshotTarget, getSnapshotVariable } from './snapshot'
import type {
  HikkakuProjectInput,
  ProjectHarnessOptions,
  ProjectRunResult,
  TestHarness,
} from './types'
import { isVariableRef } from './utils'

/**
 * Create a VM test harness for a Hikkaku/Scratch project.
 *
 * @param input Project input accepted by `toScratchProject`.
 * @param options Runtime and harness options.
 * @returns A configured test harness.
 */
export const createProjectHarness = async (
  input: HikkakuProjectInput,
  options: ProjectHarnessOptions = {},
): Promise<TestHarness> => {
  const {
    withScratchAssets = false,
    autoStart = true,
    setup,
    maxFrames: _maxFrames,
    ...rest
  } = options

  const project = toScratchProject(input)
  const runtimeOptions = {
    ...rest,
    projectJson: project,
  }

  const vm = withScratchAssets
    ? await createHeadlessVMWithScratchAssets(
        runtimeOptions as CreateHeadlessVMWithScratchAssetsOptions,
      )
    : createHeadlessVMFromProject(
        runtimeOptions as CreateHeadlessVMFromProjectOptions,
      )

  const ctx: TestHarness = {
    project,
    vm,
    snapshotTarget: (target) => {
      return getSnapshotTarget(vm.snapshot(), target)
    },
    snapshotVariable: (targetOrVariable, variableNameOrId) => {
      if (
        (typeof targetOrVariable === 'string' ||
          typeof targetOrVariable === 'number') &&
        typeof variableNameOrId === 'string'
      ) {
        return getSnapshotVariable(
          vm.snapshot(),
          project,
          targetOrVariable,
          variableNameOrId,
        )
      }
      if (
        isVariableRef(targetOrVariable) ||
        typeof targetOrVariable === 'string'
      ) {
        return getSnapshotVariable(vm.snapshot(), targetOrVariable)
      }
      return undefined
    },
    start: () => {
      vm.greenFlag()
    },
    stepFrame: () => {
      return vm.stepFrame()
    },
    runUntilIdle: (runOptions) => {
      return vm.runUntilIdle(runOptions)
    },
    runFrames: (frameCount) => {
      return vm.runFrames(frameCount)
    },
    dispatchInputEvents: (events) => {
      vm.dispatchInputEvents(events)
    },
    snapshot: () => {
      return vm.snapshot()
    },
  }

  if (setup) {
    await setup(ctx)
  }

  if (autoStart) {
    ctx.start()
  }

  return ctx
}

/**
 * Create a harness and run `runUntilIdle`.
 *
 * @param input Project input accepted by `toScratchProject`.
 * @param options Execution options, including `maxFrames`.
 * @returns Execution summary and final snapshot.
 */
export const runProjectUntilIdle = async (
  input: HikkakuProjectInput,
  options: ProjectHarnessOptions = {},
): Promise<ProjectRunResult> => {
  const { maxFrames, ...harnessOptions } = options
  const ctx = await createProjectHarness(input, harnessOptions)
  const report = ctx.runUntilIdle(
    maxFrames === undefined ? undefined : { maxFrames },
  )
  return {
    project: ctx.project,
    vm: ctx.vm,
    report,
    snapshot: ctx.snapshot(),
  }
}

/**
 * Create a harness and run a fixed number of frames.
 *
 * @param input Project input accepted by `toScratchProject`.
 * @param frameCount Number of frames to execute.
 * @param options Execution options.
 * @returns Execution summary and final snapshot.
 */
export const runProjectFrames = async (
  input: HikkakuProjectInput,
  frameCount: number,
  options: ProjectHarnessOptions = {},
): Promise<ProjectRunResult> => {
  const ctx = await createProjectHarness(input, options)
  const report = ctx.runFrames(frameCount)
  return {
    project: ctx.project,
    vm: ctx.vm,
    report,
    snapshot: ctx.snapshot(),
  }
}

/**
 * Re-export MoonScratch creator from scratch project JSON.
 */
export { createHeadlessVMFromProject }

/**
 * Re-export MoonScratch creator that resolves scratch assets.
 */
export { createHeadlessVMWithScratchAssets }
