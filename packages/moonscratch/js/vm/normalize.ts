import { DEFAULT_LANGUAGE } from './constants.ts'
import type { RawFrameReport } from './internal-types.ts'
import type { FrameReport, FrameStopReason, TranslateCache } from './types.ts'

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

const toFrameStopReason = (reason: string): FrameStopReason => {
  if (
    reason === 'finished' ||
    reason === 'timeout' ||
    reason === 'rerender' ||
    reason === 'warp-exit'
  ) {
    return reason
  }
  return 'timeout'
}

export const toFrameReport = (report: RawFrameReport): FrameReport => ({
  activeThreads: report.active_threads,
  ticks: report.tick_count,
  ops: report.op_count,
  emittedEffects: report.emitted_effects,
  stopReason: toFrameStopReason(report.stop_reason),
  shouldRender: report.should_render,
  isInWarp: report.is_in_warp,
})
