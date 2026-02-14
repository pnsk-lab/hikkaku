import { DEFAULT_LANGUAGE } from './constants.ts'
import type { RawFrameReport } from './internal-types.ts'
import type { FrameReport, TranslateCache } from './types.ts'

export const normalizeLanguage = (language: unknown): string =>
  String(language ?? '')
    .trim()
    .toLowerCase() || DEFAULT_LANGUAGE

export const cloneTranslateCache = (
  cache: TranslateCache | undefined,
): TranslateCache => {
  const out: TranslateCache = {}
  for (const [language, bucket] of Object.entries(cache ?? {})) {
    if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) {
      continue
    }
    const normalizedLanguage = normalizeLanguage(language)
    out[normalizedLanguage] = {}
    for (const [words, translated] of Object.entries(bucket)) {
      out[normalizedLanguage][String(words)] = String(translated)
    }
  }
  return out
}

export const normalizeFrameCount = (frameCount: number): number => {
  if (!Number.isFinite(frameCount)) {
    throw new Error('frameCount must be a finite number')
  }
  const out = Math.trunc(frameCount)
  if (out <= 0) {
    throw new Error('frameCount must be greater than 0')
  }
  return out
}

export const normalizeFrameMs = (frameMs: number): number => {
  if (!Number.isFinite(frameMs)) {
    throw new Error('frameMs must be a finite number')
  }
  const out = Math.round(frameMs)
  if (out <= 0) {
    throw new Error('frameMs must be greater than 0')
  }
  return out
}

export const normalizeDurationMs = (durationMs: number): number => {
  if (!Number.isFinite(durationMs)) {
    throw new Error('durationMs must be a finite number')
  }
  return Math.max(0, durationMs)
}

export const normalizeNowMs = (nowMs: number): number => {
  if (!Number.isFinite(nowMs)) {
    throw new Error('nowMs must be a finite number')
  }
  return Math.trunc(nowMs)
}

export const normalizeMaxFrames = (maxFrames: number): number => {
  if (!Number.isFinite(maxFrames)) {
    throw new Error('maxFrames must be a finite number')
  }
  const out = Math.trunc(maxFrames)
  if (out <= 0) {
    throw new Error('maxFrames must be greater than 0')
  }
  return out
}

export const toFrameReport = (
  report: RawFrameReport,
  frameCount: number,
  frameMs: number,
): FrameReport => ({
  nowMs: report.now_ms,
  activeThreads: report.active_threads,
  ticks: report.tick_count,
  ops: report.op_count,
  emittedEffects: report.emitted_effects,
  frameCount,
  frameMs,
  elapsedMs: frameCount * frameMs,
})
