import { AbstractInput } from '../ast.ts'
import { BlockHelper, defineBlockFn } from './mod.ts'

/**
 * gotoxy
 */
export const gotoxy: BlockHelper<[x: number, y: number], {
  type: 'stack',
  opcode: 'motion_gotoxy',
  inputs: {
    X: AbstractInput<'Number'>
    Y: AbstractInput<'Number'>
  }
}> = defineBlockFn({
  id: 'motion.gotoxy',
  createBlock(x, y) {
    return {
      type: 'stack',
      opcode: 'motion_gotoxy',
      inputs: {
        X: {
          type: 'Number',
          value: x.toString()
        },
        Y: {
          type: 'Number',
          value: y.toString()
        }
      }
    }
  },
  run(block) {
    
  }
})
