import type { RawVMOptions } from './internal-types.ts'
import type { VMOptionsInput } from './types.ts'

export const toOptionsJson = (options: string | VMOptionsInput | undefined): string | undefined => {
  if (options === undefined) {
    return undefined
  }
  if (typeof options === 'string') {
    return options
  }

  const raw: RawVMOptions = {}
  if (options.turbo !== undefined) {
    raw.turbo = options.turbo
  }

  const compatibility30tps = options.compatibility30tps ?? options.compatibility_30tps
  if (compatibility30tps !== undefined) {
    raw.compatibility_30tps = compatibility30tps
  }

  const maxClones = options.maxClones ?? options.max_clones
  if (maxClones !== undefined) {
    raw.max_clones = maxClones
  }

  if (options.deterministic !== undefined) {
    raw.deterministic = options.deterministic
  }

  if (options.seed !== undefined) {
    raw.seed = options.seed
  }

  const penWidth = options.penWidth ?? options.pen_width
  if (penWidth !== undefined) {
    raw.pen_width = penWidth
  }

  const penHeight = options.penHeight ?? options.pen_height
  if (penHeight !== undefined) {
    raw.pen_height = penHeight
  }

  return JSON.stringify(raw)
}
