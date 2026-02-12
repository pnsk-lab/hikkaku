import type { JsonValue } from './types.ts'

export const isObjectRecord = (value: unknown): value is Record<string, JsonValue | unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const hasStringField = (value: unknown, key: string): value is { [k: string]: string } =>
  isObjectRecord(value) && typeof value[key] === 'string'

export const hasNumberField = (value: unknown, key: string): value is { [k: string]: number } =>
  isObjectRecord(value) && typeof value[key] === 'number'
