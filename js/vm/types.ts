import type { ScratchProject } from 'sb3-types'

type MaybePromise<T> = T | Promise<T>

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[]
export type ProjectJson = JsonValue | ScratchProject

export interface VMOptions {
  turbo: boolean
  compatibility30tps: boolean
  maxClones: number
  deterministic: boolean
  seed: number
  penWidth: number
  penHeight: number
}

export interface VMOptionsInput extends Partial<VMOptions> {
  compatibility_30tps?: boolean
  max_clones?: number
  pen_width?: number
  pen_height?: number
}

export interface StepReport {
  nowMs: number
  activeThreads: number
  steppedThreads: number
  emittedEffects: number
}

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
  translate?: (effect: TranslateRequestEffect) => MaybePromise<string | null | undefined>
  textToSpeech?: (effect: TextToSpeechEffect) => MaybePromise<void>
  musicNote?: (effect: MusicPlayNoteEffect) => MaybePromise<void>
  musicDrum?: (effect: MusicPlayDrumEffect) => MaybePromise<void>
  effect?: (effect: VMEffect) => MaybePromise<void>
}

export interface CreateHeadlessVMOptions {
  projectJson: string | ProjectJson
  assets?: string | Record<string, JsonValue>
  options?: string | VMOptionsInput
  viewerLanguage?: string
  translateCache?: TranslateCache
}
