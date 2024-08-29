/**
 * Utils and types for defining blocks
 * @module
 */

import type { AbstractBlock } from '../ast.ts'
import type { RuntimeTarget } from '../runtime/target.ts'
import { add } from '../stacking/mod.ts'

/**
 * Context for runtime
 */
export interface RunContext {
  target: RuntimeTarget
  execute(blocks: AbstractBlock[]): AsyncGenerator
}

type Run<B extends AbstractBlock = AbstractBlock> = (
  block: B,
  c: RunContext,
) => Promise<void> | void | AsyncGenerator

/**
 * For defining blocks
 */
export interface BlockDefinetion<
  Args extends unknown[],
  Block extends AbstractBlock,
> {
  readonly opcode: string

  readonly createBlock: (...args: Args) => Block

  readonly run: Run<Block>
}

/**
 * A block helper.
 * You can execute them in events.
 */
export interface BlockHelper<
  Args extends unknown[],
  Block extends AbstractBlock,
> {
  (...args: Args): Block
  opcode: string
  run: Run<Block>
}

/**
 * Create block helper
 * @param block Block definetion
 * @returns Block helper
 */
export const defineBlockFn = <
  Args extends unknown[],
  Block extends AbstractBlock,
>(block: BlockDefinetion<Args, Block>): BlockHelper<Args, Block> => {
  const fn = (...args: Args) => {
    const abstractBlock = block.createBlock(...args)
    if (abstractBlock.type !== 'reporter') {
      add(abstractBlock)
    }
    return abstractBlock
  }
  fn.opcode = block.opcode
  fn.run = block.run
  return fn
}
