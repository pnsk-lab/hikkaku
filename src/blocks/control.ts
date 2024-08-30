/**
 * Control blocks
 * @module
 */

import type { AbstractBlock } from '../ast.ts'
import { into, outof } from '../stacking/mod.ts'
import { defineBlockFn } from './_shared.ts'
import type { BlockHelper } from './_shared.ts'

/**
 * Forever function
 */
export const forever: BlockHelper<[fn: () => void], {
  type: 'c'
  opcode: 'control_forever'
  branches: {
    SUBSTACK: AbstractBlock[]
  }
}> = defineBlockFn({
  opcode: 'control_forever',
  createBlock(fn) {
    const children: AbstractBlock[] = []
    into((block) => {
      children.push(block)
    })
    fn()
    outof()
    return {
      type: 'c',
      opcode: 'control_forever',
      branches: {
        SUBSTACK: children,
      },
    }
  },
  async *run(block, c) {
    while (true) {
      for await (const _ of c.execute(block.branches.SUBSTACK)) {
        yield _
      }
      yield null
    }
  },
})
