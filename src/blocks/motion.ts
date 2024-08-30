/**
 * Motion blocks
 * @module
 */

import type { AbstractInput } from '../ast.ts'
import { type BlockHelperInput, parseAsInput } from '../value.ts'
import { type BlockHelper, defineBlockFn } from './_shared.ts'

/**
 * gotoxy
 */
export const gotoxy: BlockHelper<
  [x: BlockHelperInput<'Number'>, y: BlockHelperInput<'Number'>],
  {
    type: 'stack'
    opcode: 'motion_gotoxy'
    inputs: {
      X: AbstractInput
      Y: AbstractInput
    }
  }
> = defineBlockFn({
  opcode: 'motion_gotoxy',
  createBlock(x, y) {
    return {
      type: 'stack',
      opcode: 'motion_gotoxy',
      inputs: {
        X: parseAsInput(x, 'Number'),
        Y: parseAsInput(y, 'Number'),
      },
    }
  },
  async run(block, c) {
    if (c.target.isStage) {
      return
    }
    const x = await c.evalInput(block.inputs.X)
    const y = await c.evalInput(block.inputs.Y)
    c.target.setXY(
      parseFloat(x),
      parseFloat(y),
    )
  },
})

/**
 * Change X By
 */
export const changeXBy: BlockHelper<[v: BlockHelperInput<'Number'>], {
  type: 'stack'
  opcode: 'motion_changexby'
  inputs: {
    DX: AbstractInput
  }
}> = defineBlockFn({
  opcode: 'motion_changexby',
  createBlock(v) {
    return {
      type: 'stack',
      opcode: 'motion_changexby',
      inputs: {
        DX: parseAsInput(v, 'Number'),
      },
    }
  },
  async run(block, c) {
    if (c.target.isStage) {
      return
    }
    const dx = await c.evalInput(block.inputs.DX)
    c.target.setXY(
      c.target.getXY()[0] + parseFloat(dx),
      null,
    )
  },
})
