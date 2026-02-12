import type { MoonResult } from './internal-types.ts'
import type { JsonValue, ProjectJson } from './types.ts'

export const toJsonString = (
  input: string | ProjectJson,
  inputName: string,
  requireNonEmpty: boolean,
): string => {
  if (typeof input === 'string') {
    if (requireNonEmpty && input.trim().length === 0) {
      throw new Error(`${inputName} must be a non-empty JSON string or object`)
    }
    return input
  }

  try {
    return JSON.stringify(input)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${inputName} could not be serialized as JSON: ${message}`)
  }
}

export const toOptionalJsonString = (
  input: string | JsonValue | undefined,
  inputName: string,
): string | undefined => {
  if (input === undefined) {
    return undefined
  }
  return toJsonString(input, inputName, false)
}

const formatVmError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const candidate = (error as { _0?: unknown })._0
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate
    }
  }
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export const unwrapResult = <T>(result: MoonResult<T, unknown>, context: string): T => {
  if (result.$tag === 1) {
    return result._0
  }
  throw new Error(`${context}: ${formatVmError(result._0)}`)
}

export const parseJson = <T>(text: string, context: string): T => {
  try {
    return JSON.parse(text) as T
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${context}: failed to parse JSON (${message})`)
  }
}
