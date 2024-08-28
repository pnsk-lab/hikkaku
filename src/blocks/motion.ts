import type { AbstractInput } from '../ast.ts'
import { BlockHelper, defineBlockFn } from './_shared.ts'

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
  opcode: 'motion_gotoxy',
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
  run(block, c) {
    if (c.target.isStage) {
      return
    }
    c.target.setXY(parseFloat(block.inputs.X.value), parseFloat(block.inputs.Y.value))
  }
})

export const changeXBy: BlockHelper<[v: number], {
  type: 'stack'
  opcode: 'motion_changexby'
  inputs: {
    DX: {
      type: 'Number'
      value: string
    }
  }
}> = defineBlockFn({
  opcode: 'motion_changexby',
  createBlock(v) {
    return {
      type: 'stack',
      opcode: 'motion_changexby',
      inputs: {
        DX: {
          type: 'Number',
          value: v.toString()
        }
      }
    }
  },
  run(block, c) {
    if (c.target.isStage) {
      return
    }
    c.target.setXY(c.target.getXY()[0] + parseFloat(block.inputs.DX.value), null)
  },
})