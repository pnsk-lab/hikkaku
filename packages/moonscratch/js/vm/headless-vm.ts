import { moonscratch } from './bindings.ts'
import { DEFAULT_MAX_FRAMES } from './constants.ts'
import {
  isMusicPlayDrumEffect,
  isMusicPlayNoteEffect,
  isTextToSpeechEffect,
  isTranslateRequestEffect,
} from './effect-guards.ts'
import { parseJson } from './json.ts'
import {
  cloneTranslateCache,
  normalizeLanguage,
  normalizeMaxFrames,
  normalizeNowMs,
  toFrameReport,
} from './normalize.ts'
import type {
  EffectHandlers,
  FrameReport,
  JsonValue,
  RenderFrame,
  RunReport,
  RunUntilIdleOptions,
  TranslateCache,
  VMEffect,
  VMInputEvent,
  VMSnapshot,
} from './types.ts'

type BoundWasmVmHandle = unknown
type BoundMoonscratch = {
  vm_set_time?: (vmHandle: BoundWasmVmHandle, nowMs: number) => void
  vm_render_frame?: (vmHandle: BoundWasmVmHandle) => unknown
}

interface HeadlessVMHooks {
  afterGreenFlag?: () => void
  beforeStepFrame?: () => void
}

export class HeadlessVM {
  private readonly vmHandle: unknown
  private readonly hooks: HeadlessVMHooks
  private translateCache: TranslateCache = {}

  constructor(vmHandle: unknown, hooks: HeadlessVMHooks = {}) {
    this.vmHandle = vmHandle
    this.hooks = hooks
  }

  get raw(): unknown {
    return this.vmHandle
  }

  start(): void {
    moonscratch.vm_start(this.vmHandle)
  }

  greenFlag(): void {
    moonscratch.vm_green_flag(this.vmHandle)
    this.hooks.afterGreenFlag?.()
  }

  stepFrame(): FrameReport {
    this.hooks.beforeStepFrame?.()
    const raw = moonscratch.vm_step_frame(this.vmHandle)
    return toFrameReport(raw)
  }

  runFrames(frameCount: number): RunReport {
    const normalizedFrameCount = normalizeMaxFrames(frameCount)
    let frames = 0
    let ticks = 0
    let ops = 0
    let activeThreads = this.snapshot().activeThreads
    while (activeThreads > 0 && frames < normalizedFrameCount) {
      const frame = this.stepFrame()
      frames += 1
      ticks += frame.ticks
      ops += frame.ops
      activeThreads = frame.activeThreads
    }
    return {
      frames,
      ticks,
      ops,
      activeThreads,
      endedBy: 'frame_limit',
    }
  }

  runUntilIdle(options: RunUntilIdleOptions = {}): RunReport {
    const normalizedMaxFrames = normalizeMaxFrames(
      options.maxFrames ?? DEFAULT_MAX_FRAMES,
    )
    let frames = 0
    let ticks = 0
    let ops = 0
    let activeThreads = this.snapshot().activeThreads
    while (activeThreads > 0 && frames < normalizedMaxFrames) {
      const frame = this.stepFrame()
      frames += 1
      ticks += frame.ticks
      ops += frame.ops
      activeThreads = frame.activeThreads
    }
    return {
      frames,
      ticks,
      ops,
      activeThreads,
      endedBy: activeThreads === 0 ? 'idle' : 'frame_limit',
    }
  }

  postIO(device: string, payload: JsonValue): void {
    moonscratch.vm_post_io_json(this.vmHandle, device, JSON.stringify(payload))
  }

  postIORawJson(device: string, payloadJson: string): void {
    moonscratch.vm_post_io_json(this.vmHandle, device, payloadJson)
  }

  setAnswer(answer: string): void {
    this.dispatchInputEvent({
      type: 'answer',
      answer,
    })
  }

  setMouseState(input: { x: number; y: number; isDown?: boolean }): void {
    this.dispatchInputEvent({
      type: 'mouse',
      x: input.x,
      y: input.y,
      isDown: input.isDown ?? false,
    })
  }

  setKeysDown(keys: string[]): void {
    this.dispatchInputEvent({
      type: 'keys_down',
      keys,
    })
  }

  setTouching(touching: Record<string, string[]>): void {
    this.dispatchInputEvent({
      type: 'touching',
      touching,
    })
  }

  setMouseTargets(input: {
    stage?: boolean
    target?: string
    targets?: string[]
  }): void {
    this.dispatchInputEvent({
      type: 'mouse_targets',
      stage: input.stage,
      target: input.target,
      targets: input.targets,
    })
  }

  setBackdrop(backdrop: string | string[]): void {
    this.dispatchInputEvent({
      type: 'backdrop',
      backdrop,
    })
  }

  dispatchInputEvents(events: VMInputEvent[]): void {
    for (const event of events) {
      this.dispatchInputEvent(event)
    }
  }

  dispatchInputEvent(event: VMInputEvent): void {
    switch (event.type) {
      case 'answer':
        this.postIO('answer', event.answer)
        return
      case 'mouse':
        this.postIO('mouse', {
          x: event.x,
          y: event.y,
          isDown: event.isDown ?? false,
        })
        return
      case 'keys_down':
        this.postIO('keys_down', event.keys)
        return
      case 'touching':
        this.postIO('touching', event.touching)
        return
      case 'mouse_targets':
        this.postIO('mouse_targets', {
          stage: event.stage ?? false,
          target: event.target ?? '',
          targets: event.targets ?? [],
        })
        return
      case 'backdrop':
        if (Array.isArray(event.backdrop)) {
          this.postIO('backdrop', {
            backdrops: event.backdrop,
          })
          return
        }
        this.postIO('backdrop', {
          backdrop: event.backdrop,
        })
        return
      default: {
        const unreachable: never = event
        throw new Error(`Unknown input event: ${String(unreachable)}`)
      }
    }
  }

  broadcast(message: string): void {
    moonscratch.vm_broadcast(this.vmHandle, message)
  }

  stopAll(): void {
    moonscratch.vm_stop_all(this.vmHandle)
  }

  setTime(nowMs: number): void {
    const binding = moonscratch as unknown as BoundMoonscratch
    if (typeof binding.vm_set_time === 'function') {
      binding.vm_set_time(this.vmHandle, normalizeNowMs(nowMs))
      return
    }
    throw new Error(
      'vm_set_time is unavailable in this build. Please rebuild moonscratch JS bindings.',
    )
  }

  takeEffects(): VMEffect[] {
    const effects = parseJson<unknown>(
      moonscratch.vm_take_effects_json(this.vmHandle),
      'vm_take_effects_json',
    )
    if (!Array.isArray(effects)) {
      throw new Error('vm_take_effects_json: expected JSON array')
    }
    return effects as VMEffect[]
  }

  snapshot(): VMSnapshot {
    const snapshot = parseJson<unknown>(
      moonscratch.vm_snapshot_json(this.vmHandle),
      'vm_snapshot_json',
    )
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      throw new Error('vm_snapshot_json: expected JSON object')
    }
    return snapshot as VMSnapshot
  }

  snapshotJson(): string {
    return moonscratch.vm_snapshot_json(this.vmHandle)
  }

  renderFrame(): RenderFrame {
    const binding = moonscratch as unknown as BoundMoonscratch
    if (typeof binding.vm_render_frame !== 'function') {
      throw new Error(
        'vm_render_frame is unavailable in this build. Please rebuild moonscratch JS bindings.',
      )
    }
    return binding.vm_render_frame(this.vmHandle) as RenderFrame
  }

  setViewerLanguage(language: string): void {
    this.postIO('viewer_language', normalizeLanguage(language))
  }

  setTranslateResult(
    words: string,
    language: string,
    translated: string,
  ): string {
    const normalizedLanguage = normalizeLanguage(language)
    if (!this.translateCache[normalizedLanguage]) {
      this.translateCache[normalizedLanguage] = {}
    }
    this.translateCache[normalizedLanguage][String(words)] = String(translated)
    this.syncTranslateCache()
    return translated
  }

  setTranslateCache(cache: TranslateCache): void {
    this.translateCache = cloneTranslateCache(cache)
    this.syncTranslateCache()
  }

  clearTranslateCache(): void {
    this.translateCache = {}
    this.syncTranslateCache()
  }

  ackTextToSpeech(waitKey: string | null | undefined): void {
    if (typeof waitKey !== 'string' || waitKey.length === 0) {
      return
    }
    this.postIO(waitKey, true)
  }

  async handleEffects(handlers: EffectHandlers = {}): Promise<VMEffect[]> {
    const effects = this.takeEffects()
    for (const effect of effects) {
      if (isTranslateRequestEffect(effect) && handlers.translate) {
        const translated = await handlers.translate(effect)
        if (typeof translated === 'string') {
          this.setTranslateResult(effect.words, effect.language, translated)
        }
      } else if (isTextToSpeechEffect(effect)) {
        if (handlers.textToSpeech) {
          await handlers.textToSpeech(effect)
        }
        this.ackTextToSpeech(effect.waitKey)
      } else if (isMusicPlayNoteEffect(effect) && handlers.musicNote) {
        await handlers.musicNote(effect)
      } else if (isMusicPlayDrumEffect(effect) && handlers.musicDrum) {
        await handlers.musicDrum(effect)
      }

      if (handlers.effect) {
        await handlers.effect(effect)
      }
    }
    return effects
  }

  private syncTranslateCache(): void {
    this.postIO('translate_cache', this.translateCache)
  }
}
