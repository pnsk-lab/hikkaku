/** Convert input project to ScratchProject format. */

/** Create and run a project harness, with common execution helpers. */
export {
  createHeadlessVMFromProject,
  createHeadlessVMWithScratchAssets,
  createProjectHarness,
  runProjectFrames,
  runProjectUntilIdle,
} from './harness'
export { toScratchProject } from './project'
/** Snapshot helper to resolve targets and variables from a VM snapshot. */
export { getSnapshotTarget, getSnapshotVariable } from './snapshot'
/** Public test helper types and runtime options. */
/** Variable identifier reference used by snapshot helpers and harness APIs. */
export type {
  HikkakuProjectInput,
  ProjectHarnessOptions,
  ProjectRunResult,
  TestHarness,
  VariableRefLike,
} from './types'
