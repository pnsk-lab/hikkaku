import type { MoonResult } from './internal-types.ts'
import type { JsonValue, ProjectJson } from './types.ts'

const isRecord = (input: unknown): input is Record<string, unknown> => {
  return input !== null && typeof input === 'object' && !Array.isArray(input)
}

const hasAnyKey = (input: Record<string, unknown>): boolean => {
  for (const _key in input) {
    return true
  }
  return false
}

const compactCostumes = (input: unknown): unknown[] => {
  if (!Array.isArray(input)) {
    return []
  }
  const costumes: unknown[] = []
  for (const raw of input) {
    if (!isRecord(raw)) {
      costumes.push({})
      continue
    }

    const costume: Record<string, unknown> = {}
    if (typeof raw.name === 'string') {
      costume.name = raw.name
    }
    if (typeof raw.assetId === 'string' && raw.assetId.length > 0) {
      costume.assetId = raw.assetId
    }
    if (typeof raw.md5ext === 'string' && raw.md5ext.length > 0) {
      costume.md5ext = raw.md5ext
    }
    if (
      typeof raw.bitmapResolution === 'number' &&
      Number.isFinite(raw.bitmapResolution) &&
      raw.bitmapResolution !== 1
    ) {
      costume.bitmapResolution = raw.bitmapResolution
    }
    if (
      typeof raw.rotationCenterX === 'number' &&
      Number.isFinite(raw.rotationCenterX) &&
      raw.rotationCenterX !== 0
    ) {
      costume.rotationCenterX = raw.rotationCenterX
    }
    if (
      typeof raw.rotationCenterY === 'number' &&
      Number.isFinite(raw.rotationCenterY) &&
      raw.rotationCenterY !== 0
    ) {
      costume.rotationCenterY = raw.rotationCenterY
    }
    if (
      typeof raw.width === 'number' &&
      Number.isFinite(raw.width) &&
      raw.width > 0
    ) {
      costume.width = raw.width
    }
    if (
      typeof raw.height === 'number' &&
      Number.isFinite(raw.height) &&
      raw.height > 0
    ) {
      costume.height = raw.height
    }
    costumes.push(costume)
  }
  return costumes
}

const compactBlocks = (input: unknown): Record<string, unknown> => {
  if (!isRecord(input)) {
    return {}
  }
  const blocks: Record<string, unknown> = {}
  for (const id in input) {
    const raw = input[id]
    if (!isRecord(raw)) {
      continue
    }

    const block: Record<string, unknown> = {}
    if (typeof raw.opcode === 'string') {
      block.opcode = raw.opcode
    }
    if (typeof raw.next === 'string') {
      block.next = raw.next
    }
    if (typeof raw.parent === 'string') {
      block.parent = raw.parent
    }
    if (isRecord(raw.inputs) && hasAnyKey(raw.inputs)) {
      block.inputs = raw.inputs
    }
    if (isRecord(raw.fields) && hasAnyKey(raw.fields)) {
      block.fields = raw.fields
    }
    if (isRecord(raw.mutation) && hasAnyKey(raw.mutation)) {
      block.mutation = raw.mutation
    }
    if (raw.topLevel === true) {
      block.topLevel = true
    }
    blocks[id] = block
  }
  return blocks
}

const compactTargets = (input: unknown): unknown[] => {
  if (!Array.isArray(input)) {
    return []
  }
  const targets: unknown[] = []
  for (const raw of input) {
    if (!isRecord(raw)) {
      continue
    }

    const target: Record<string, unknown> = {}
    if (typeof raw.name === 'string') {
      target.name = raw.name
    }
    if (raw.isStage === true) {
      target.isStage = true
    }
    if (typeof raw.x === 'number' && Number.isFinite(raw.x) && raw.x !== 0) {
      target.x = raw.x
    }
    if (typeof raw.y === 'number' && Number.isFinite(raw.y) && raw.y !== 0) {
      target.y = raw.y
    }
    if (
      typeof raw.direction === 'number' &&
      Number.isFinite(raw.direction) &&
      raw.direction !== 90
    ) {
      target.direction = raw.direction
    }
    if (
      typeof raw.size === 'number' &&
      Number.isFinite(raw.size) &&
      raw.size !== 100
    ) {
      target.size = raw.size
    }
    if (
      typeof raw.volume === 'number' &&
      Number.isFinite(raw.volume) &&
      raw.volume !== 100
    ) {
      target.volume = raw.volume
    }
    if (
      typeof raw.musicInstrument === 'number' &&
      Number.isFinite(raw.musicInstrument) &&
      raw.musicInstrument !== 1
    ) {
      target.musicInstrument = raw.musicInstrument
    }
    if (
      typeof raw.textToSpeechVoice === 'string' &&
      raw.textToSpeechVoice.length > 0 &&
      raw.textToSpeechVoice !== 'ALTO'
    ) {
      target.textToSpeechVoice = raw.textToSpeechVoice
    }
    if (raw.visible === false) {
      target.visible = false
    }
    if (
      typeof raw.currentCostume === 'number' &&
      Number.isFinite(raw.currentCostume) &&
      raw.currentCostume !== 0
    ) {
      target.currentCostume = raw.currentCostume
    }
    target.variables = isRecord(raw.variables) ? raw.variables : {}
    target.lists = isRecord(raw.lists) ? raw.lists : {}
    target.blocks = compactBlocks(raw.blocks)
    target.costumes = compactCostumes(raw.costumes)
    targets.push(target)
  }
  return targets
}

export const toProjectJsonString = (input: string | ProjectJson): string => {
  if (typeof input === 'string') {
    if (input.trim().length === 0) {
      throw new Error('projectJson must be a non-empty JSON string or object')
    }
    return input
  }

  try {
    if (!isRecord(input) || !Array.isArray(input.targets)) {
      return JSON.stringify(input)
    }
    return JSON.stringify({
      targets: compactTargets(input.targets),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`projectJson could not be serialized as JSON: ${message}`)
  }
}

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

export const unwrapResult = <T>(
  result: MoonResult<T, unknown>,
  context: string,
): T => {
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
