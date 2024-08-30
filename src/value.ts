/**
 * Define Value
 * @module
 */

import type { AbstractInput, AbstractReporterBlock } from './ast.ts'

/**
 * Value
 */
export type Value = 'String' | 'Number'

/**
 * Block Input
 */
export type BlockHelperInput<T extends Value> =
  | ('Number' extends T ? number : string)
  | AbstractReporterBlock

/**
 * Parse Block Input
 */
export const parseAsInput = <V extends Value>(
  i: BlockHelperInput<V>,
  value: V,
): AbstractInput => {
  if (typeof i === 'string' || typeof i === 'number') {
    return {
      type: value,
      value: i.toString(),
    }
  }
  return {
    type: 'Block',
    block: i,
  }
}
