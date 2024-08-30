/**
 * Sensing Blocks
 * @module
 */

import { type BlockHelper, defineBlockFn } from './_shared.ts'

/**
 * Get Mouse X
 */
export const getMouseX: BlockHelper<[], {
  type: 'reporter'
  opcode: 'sensing_mousex'
}> = defineBlockFn({
  opcode: 'sensing_mousex',
  createBlock() {
    return {
      type: 'reporter',
      opcode: 'sensing_mousex',
    }
  },
  run(_block, c) {
    return {
      type: 'Number',
      data: c.runtime.mouse.data.x,
    }
  },
})
