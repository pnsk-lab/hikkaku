/**
 * Merge all block helpers
 * @module
 */

import * as motion from './motion.ts'
import * as event from './event.ts'
import * as control from './control.ts'
import * as sensing from './sensing.ts'

import type { BlockHelper } from './_shared.ts'
import type { AbstractBlock } from '../ast.ts'

const blocksArr = [
  ...Object.values(motion),
  ...Object.values(event),
  ...Object.values(control),
  ...Object.values(sensing),
] as BlockHelper<unknown[], AbstractBlock>[]

/**
 * All block helpers record
 */
export const blockHelpers: Record<
  string,
  BlockHelper<unknown[], AbstractBlock>
> = {}

for (const block of blocksArr) {
  blockHelpers[block.opcode] = block
}
