import type { ScratchProject } from 'sb3-types'

type MaybePromise<T> = T | Promise<T>

export type JsonPrimitive = string | number | boolean | null
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[]
export type ProjectJson = JsonValue | ScratchProject

export interface VMOptions {
  turbo: boolean
  compatibility30tps: boolean
  maxClones: number
  deterministic: boolean
  seed: number
  penWidth: number
  penHeight: number
  stepTimeoutTicks: number
}

export interface VMOptionsInput extends Partial<VMOptions> {
  compatibility_30tps?: boolean
  max_clones?: number
  pen_width?: number
  pen_height?: number
  step_timeout_ticks?: number
  stepTimeoutTicks?: number
}

export type FrameStopReason = 'finished' | 'timeout' | 'rerender' | 'warp-exit'

export interface FrameReport {
  activeThreads: number
  ticks: number
  ops: number
  emittedEffects: number
  stopReason: FrameStopReason
  shouldRender: boolean
  isInWarp: boolean
}

export type RunEndedBy = 'idle' | 'frame_limit'

export interface RunReport {
  frames: number
  ticks: number
  ops: number
  activeThreads: number
  endedBy: RunEndedBy
}

export interface RunUntilIdleOptions {
  maxFrames?: number
}

export type VMInputEvent =
  | {
      type: 'answer'
      answer: string
    }
  | {
      type: 'mouse'
      x: number
      y: number
      isDown?: boolean
    }
  | {
      type: 'keys_down'
      keys: string[]
    }
  | {
      type: 'touching'
      touching: Record<string, string[]>
    }
  | {
      type: 'mouse_targets'
      stage?: boolean
      target?: string
      targets?: string[]
    }
  | {
      type: 'backdrop'
      backdrop: string | string[]
    }

export type {
  RenderFrame,
  RenderFrameLike,
  RenderImageData,
  RenderWithSharpOptions,
  RenderWithWebGLOptions,
  WebGLRenderResult,
} from '../render/types.ts'

export interface VMSnapshotTarget {
  id: string
  name: string
  isStage: boolean
  x: number
  y: number
  direction: number
  size: number
  volume: number
  musicInstrument: number
  textToSpeechVoice: string
  visible: boolean
  currentCostume: number
  variables: Record<string, JsonValue>
  lists: Record<string, JsonValue[]>
}

export interface VMSnapshot {
  runId: number
  nowMs: number
  running: boolean
  answer: string
  musicTempo: number
  textToSpeechLanguage: string
  activeThreads: number
  targets: VMSnapshotTarget[]
}

export interface PlaySoundEffect {
  type: 'play_sound'
  target: string
  sound: string
}

export interface MusicPlayNoteEffect {
  type: 'music_play_note'
  target: string
  note: number
  beats: number
  instrument: number
  tempo: number
}

export interface MusicPlayDrumEffect {
  type: 'music_play_drum'
  target: string
  drum: number
  beats: number
  tempo: number
}

export interface TextToSpeechEffect {
  type: 'text_to_speech'
  target: string
  words: string
  voice: string
  language: string
  waitKey: string
}

export interface TranslateRequestEffect {
  type: 'translate_request'
  words: string
  language: string
}

export interface StopAllSoundsEffect {
  type: 'stop_all_sounds'
}

export interface SayEffect {
  type: 'say'
  target: string
  message: string
}

export interface ThinkEffect {
  type: 'think'
  target: string
  message: string
}

export interface AskEffect {
  type: 'ask'
  question: string
}

export interface BroadcastEffect {
  type: 'broadcast'
  message: string
}

export interface LogEffect {
  type: 'log'
  level: string
  message: string
}

export interface UnknownEffect {
  type: string
  [key: string]: JsonValue
}

type KnownEffect =
  | PlaySoundEffect
  | MusicPlayNoteEffect
  | MusicPlayDrumEffect
  | TextToSpeechEffect
  | TranslateRequestEffect
  | StopAllSoundsEffect
  | SayEffect
  | ThinkEffect
  | AskEffect
  | BroadcastEffect
  | LogEffect

export type VMEffect = KnownEffect | UnknownEffect

export type TranslateCache = Record<string, Record<string, string>>

export interface EffectHandlers {
  translate?: (
    effect: TranslateRequestEffect,
  ) => MaybePromise<string | null | undefined>
  textToSpeech?: (effect: TextToSpeechEffect) => MaybePromise<void>
  musicNote?: (effect: MusicPlayNoteEffect) => MaybePromise<void>
  musicDrum?: (effect: MusicPlayDrumEffect) => MaybePromise<void>
  effect?: (effect: VMEffect) => MaybePromise<void>
}

export interface CompileProjectToWatOptions {
  projectJson: string | ProjectJson
  assets?: string | Record<string, JsonValue>
}

export interface ProgramManifest {
  abiVersion: number
  opcodeSetVersion: number
  projectByteLength: number
  assetsByteLength: number
  buildFingerprint: string
}

export interface CompileProjectToWatResult {
  wat: string
  abiVersion: number
  manifest: ProgramManifest
}

export type ProgramWasmBytes = Uint8Array | ArrayBuffer

export type WatToWasm = (wat: string) => ProgramWasmBytes

export interface CompileProjectToWasmOptions
  extends CompileProjectToWatOptions {
  watToWasm?: WatToWasm
}

export interface CompileProjectToWasmResult extends CompileProjectToWatResult {
  wasmBytes: Uint8Array
}

export interface RuntimeHandle {
  raw: unknown
  abiVersion: number
}

export interface ProgramPayload {
  projectJson: string
  assetsJson: string
  commandsJson?: string
}

export interface ProgramWasmExecHost {
  getVarNumber: (targetIndex: number, variableId: string) => number
  setVarNumber: (targetIndex: number, variableId: string, value: number) => void
  setVarJson: (
    targetIndex: number,
    variableId: string,
    valueJson: string,
  ) => void
  execHostOpcode: (targetIndex: number, pc: number) => number
  execHostTail: (targetIndex: number, startPc: number) => number
  execDrawOpcode: (
    targetIndex: number,
    opcode: string,
    arg0: number,
    arg1: number,
    extra: number,
  ) => number
}

export type ProgramWasmExecRunner = () => number

export interface ProgramModule {
  raw: WebAssembly.Instance
  abiVersion: number
  manifest: ProgramManifest
  readPayload: () => ProgramPayload
  hasWasmExec: () => boolean
  createWasmExecRunner: (
    host: ProgramWasmExecHost,
  ) => ProgramWasmExecRunner | null
}

export interface CreateProgramModuleOptions {
  wasmBytes: ProgramWasmBytes
  manifest?: ProgramManifest
}

export interface CreateProgramModuleFromProjectOptions
  extends CompileProjectToWasmOptions {}

export interface PrecompileProgramForRuntimeOptions {
  program: ProgramModule
  runtime?: RuntimeHandle
}

export interface CreateHeadlessVMOptions {
  program: ProgramModule
  runtime?: RuntimeHandle
  options?: string | VMOptionsInput
  initialNowMs?: number
  viewerLanguage?: string
  translateCache?: TranslateCache
}

export interface CreateHeadlessVMFromProjectOptions
  extends Omit<CreateHeadlessVMOptions, 'program'>,
    CreateProgramModuleFromProjectOptions {}

export interface ScratchAssetResponse {
  ok: boolean
  status: number
  statusText: string
  arrayBuffer(): Promise<ArrayBuffer>
}

export type FetchAsset = (url: string) => Promise<ScratchAssetResponse>

export type DecodeImageBytes = (bytes: ArrayBuffer | Uint8Array) => Promise<{
  width: number
  height: number
  rgbaBase64: string
}>

export interface ResolveMissingScratchAssetsOptions {
  projectJson: string | ProjectJson
  assets?: string | Record<string, JsonValue>
  scratchCdnBaseUrl?: string
  fetchAsset?: FetchAsset
  decodeImageBytes?: DecodeImageBytes
}

export interface CreateHeadlessVMWithScratchAssetsOptions
  extends Omit<CreateHeadlessVMFromProjectOptions, 'assets'> {
  projectJson: string | ProjectJson
  assets?: string | Record<string, JsonValue>
  scratchCdnBaseUrl?: string
  fetchAsset?: FetchAsset
  decodeImageBytes?: DecodeImageBytes
}
