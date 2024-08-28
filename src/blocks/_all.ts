import * as motion from './motion.ts'
import * as event from './event.ts'
import * as controll from './controll.ts'

import type { BlockHelper } from './_shared.ts'
import type { AbstractBlock } from '../ast.ts'

const blocksArr = [
  ...Object.values(motion),
  ...Object.values(event),
  ...Object.values(controll)
] as BlockHelper<unknown[], AbstractBlock>[]

const blockHelpers: Record<string, BlockHelper<unknown[], AbstractBlock>> = {}
for (const block of blocksArr) {
  blockHelpers[block.opcode] = block
}
export { blockHelpers }
