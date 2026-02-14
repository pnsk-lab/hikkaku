import { moonscratch } from './bindings.ts'
import { DEFAULT_FRAME_MS, DEFAULT_MAX_FRAMES } from './constants.ts'
import {
  isMusicPlayDrumEffect,
  isMusicPlayNoteEffect,
  isTextToSpeechEffect,
  isTranslateRequestEffect,
} from './effect-guards.ts'
import { parseJson } from './json.ts'
import {
  cloneTranslateCache,
  normalizeDurationMs,
  normalizeFrameCount,
  normalizeFrameMs,
  normalizeLanguage,
  normalizeMaxFrames,
  normalizeNowMs,
  toFrameReport,
} from './normalize.ts'
import type {
  EffectHandlers,
  FrameReport,
  JsonValue,
  RunReport,
  RunUntilIdleOptions,
  TranslateCache,
  VMEffect,
  VMSnapshot,
} from './types.ts'

export class HeadlessVM {
  private readonly vmHandle: unknown
  private translateCache: TranslateCache = {}

  constructor(vmHandle: unknown) {
    this.vmHandle = vmHandle
  }

  get raw(): unknown {
    return this.vmHandle
  }

  start(): void {
    moonscratch.vm_start(this.vmHandle)
  }

  greenFlag(): void {
    moonscratch.vm_green_flag(this.vmHandle)
  }

  stepFrame(frameCount = 1, frameMs = DEFAULT_FRAME_MS): FrameReport {
    const normalizedFrameCount = normalizeFrameCount(frameCount)
    const normalizedFrameMs = normalizeFrameMs(frameMs)
    const raw = moonscratch.vm_step_frame(
      this.vmHandle,
      normalizedFrameCount,
      normalizedFrameMs,
    )
    return toFrameReport(raw, normalizedFrameCount, normalizedFrameMs)
  }

  runFrames(frameCount: number, frameMs = DEFAULT_FRAME_MS): RunReport {
    const frame = this.stepFrame(frameCount, frameMs)
    return {
      frames: frame.frameCount,
      ticks: frame.ticks,
      ops: frame.ops,
      elapsedMs: frame.elapsedMs,
      activeThreads: frame.activeThreads,
      endedBy: 'frame_limit',
    }
  }

  runForTime(durationMs: number, frameMs = DEFAULT_FRAME_MS): RunReport {
    const normalizedDurationMs = normalizeDurationMs(durationMs)
    const normalizedFrameMs = normalizeFrameMs(frameMs)
    if (normalizedDurationMs <= 0) {
      return {
        frames: 0,
        ticks: 0,
        ops: 0,
        elapsedMs: 0,
        activeThreads: this.snapshot().activeThreads,
        endedBy: 'time_limit',
      }
    }
    const frameCount = Math.ceil(normalizedDurationMs / normalizedFrameMs)
    const frame = this.stepFrame(frameCount, normalizedFrameMs)
    return {
      frames: frame.frameCount,
      ticks: frame.ticks,
      ops: frame.ops,
      elapsedMs: frame.elapsedMs,
      activeThreads: frame.activeThreads,
      endedBy: 'time_limit',
    }
  }

  runUntilIdle(options: RunUntilIdleOptions = {}): RunReport {
    const normalizedFrameMs = normalizeFrameMs(
      options.frameMs ?? DEFAULT_FRAME_MS,
    )
    const normalizedMaxFrames = normalizeMaxFrames(
      options.maxFrames ?? DEFAULT_MAX_FRAMES,
    )
    let frames = 0
    let ticks = 0
    let ops = 0
    let activeThreads = this.snapshot().activeThreads
    while (activeThreads > 0 && frames < normalizedMaxFrames) {
      const frame = this.stepFrame(1, normalizedFrameMs)
      frames += frame.frameCount
      ticks += frame.ticks
      ops += frame.ops
      activeThreads = frame.activeThreads
    }
    return {
      frames,
      ticks,
      ops,
      elapsedMs: frames * normalizedFrameMs,
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
    this.postIO('answer', answer)
  }

  setMouseState(input: { x: number; y: number; isDown?: boolean }): void {
    this.postIO('mouse', {
      x: input.x,
      y: input.y,
      isDown: input.isDown ?? false,
    })
  }

  setKeysDown(keys: string[]): void {
    this.postIO('keys_down', keys)
  }

  setTouching(touching: Record<string, string[]>): void {
    this.postIO('touching', touching)
  }

  broadcast(message: string): void {
    moonscratch.vm_broadcast(this.vmHandle, message)
  }

  stopAll(): void {
    moonscratch.vm_stop_all(this.vmHandle)
  }

  setNowMs(nowMs: number): void {
    moonscratch.vm_set_now_ms(this.vmHandle, normalizeNowMs(nowMs))
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

  renderSvg(): string {
    return moonscratch.vm_render_svg(this.vmHandle)
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
