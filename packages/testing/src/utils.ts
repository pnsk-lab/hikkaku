import type { VariableRefLike } from './types'

/**
 * Type guard for plain object values.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Type guard for variable references (`{ id: string }`).
 */
export const isVariableRef = (value: unknown): value is VariableRefLike => {
  return (
    isRecord(value) &&
    typeof (value as unknown as VariableRefLike)?.id === 'string'
  )
}

/**
 * Type guard for Scratch variable tuples like `[name, value]`.
 */
export const isVariableTuple = (value: unknown): value is [string, unknown] => {
  return (
    Array.isArray(value) && value.length >= 2 && typeof value[0] === 'string'
  )
}
