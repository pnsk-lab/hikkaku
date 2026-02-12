import { DEFAULT_LANGUAGE } from './constants.ts'
import type { RawStepReport } from './internal-types.ts'
import type { StepReport, TranslateCache } from './types.ts'

export const normalizeLanguage = (language: unknown): string =>
  String(language ?? '')
    .trim()
    .toLowerCase() || DEFAULT_LANGUAGE

export const cloneTranslateCache = (cache: TranslateCache | undefined): TranslateCache => {
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

export const normalizeStepMs = (dtMs: number): number => {
  if (!Number.isFinite(dtMs)) {
    throw new Error('dtMs must be a finite number')
  }
  return Math.max(0, Math.trunc(dtMs))
}

export const toStepReport = (report: RawStepReport): StepReport => ({
  nowMs: report.now_ms,
  activeThreads: report.active_threads,
  steppedThreads: report.stepped_threads,
  emittedEffects: report.emitted_effects,
})
