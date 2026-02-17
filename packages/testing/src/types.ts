import type { Project as HikkakuProject } from 'hikkaku'
import type {
  CreateHeadlessVMFromProjectOptions,
  CreateHeadlessVMWithScratchAssetsOptions,
  HeadlessVM,
  JsonValue,
  RunReport,
  RunUntilIdleOptions,
  VMInputEvent,
  VMSnapshot,
} from 'moonscratch'
import type { ScratchProject } from 'sb3-types'

/**
 * Utility alias for values that may already be plain values or Promises.
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Object that can be converted to a Scratch project JSON.
 */
type HikkakuProjectLike = {
  toScratch(): ScratchProject
}

/**
 * Acceptable project inputs for test helpers.
 */
export type HikkakuProjectInput =
  | string
  | ScratchProject
  | HikkakuProject
  | HikkakuProjectLike

/**
 * Reference object for identifying a Scratch variable by id.
 */
export interface VariableRefLike {
  /**
   * Variable ID in the Scratch target variables map.
   */
  id: string
}

type RuntimeCreateOptions = Omit<
  CreateHeadlessVMFromProjectOptions,
  'projectJson'
>

type ScratchAssetCreateOptions = Omit<
  CreateHeadlessVMWithScratchAssetsOptions,
  'projectJson' | 'assets'
>

export interface ProjectHarnessOptions
  extends RuntimeCreateOptions,
    ScratchAssetCreateOptions {
  /**
   * Whether to call `greenFlag` after harness creation.
   * @default true
   */
  autoStart?: boolean
  /**
   * Maximum frame count for `runProjectUntilIdle`.
   */
  maxFrames?: number
  /**
   * Use `createHeadlessVMWithScratchAssets` instead of `createHeadlessVMFromProject`.
   * @default false
   */
  withScratchAssets?: boolean
  /**
   * Hook that runs during harness creation.
   */
  setup?: (ctx: TestHarness) => MaybePromise<void>
}

/**
 * Runtime test helper bound to a created Headless VM.
 */
export interface TestHarness {
  /**
   * Scratch project used by this harness.
   */
  readonly project: ScratchProject
  /**
   * Active Headless VM instance.
   */
  readonly vm: HeadlessVM

  /**
   * Resolve a snapshot target by name or index.
   */
  snapshotTarget(
    target: string | number,
  ): VMSnapshot['targets'][number] | undefined
  /**
   * Read a variable from the current snapshot.
   */
  snapshotVariable(
    targetOrVariable: string | number | VariableRefLike,
    variableNameOrId?: string,
  ): JsonValue | undefined
  /**
   * Trigger green flag.
   */
  start(): void
  /**
   * Step one frame.
   */
  stepFrame(): ReturnType<HeadlessVM['stepFrame']>
  /**
   * Step the VM until idle.
   */
  runUntilIdle(options?: RunUntilIdleOptions): RunReport
  /**
   * Step the VM a fixed number of frames.
   */
  runFrames(frameCount: number): RunReport
  /**
   * Forward input events to VM.
   */
  dispatchInputEvents(events: VMInputEvent[]): void
  /**
   * Take a VM snapshot.
   */
  snapshot(): VMSnapshot
}

/**
 * Result object returned from run helpers.
 */
export interface ProjectRunResult {
  /** Scratch project used to create the VM. */
  readonly project: ScratchProject
  /** VM instance used in the run. */
  readonly vm: HeadlessVM
  /** Report from `runUntilIdle` / `runFrames`. */
  readonly report: RunReport
  /** Snapshot captured after execution. */
  readonly snapshot: VMSnapshot
}
