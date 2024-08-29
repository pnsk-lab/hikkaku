/**
 * Event blocks
 * @module
 */

import { type BlockHelper, defineBlockFn } from './_shared.ts'

/**
 * When :greenflag: clicked
 */
export const whenFlagClicked: BlockHelper<[], {
  type: 'hat'
  opcode: 'event_whenflagclicked'
}> = defineBlockFn({
  opcode: 'event_whenflagclicked',
  createBlock() {
    return {
      type: 'hat',
      opcode: 'event_whenflagclicked',
    }
  },
  run() {
  },
})
