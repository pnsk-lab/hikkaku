/**
 * Utils and types for defining blocks
 * @module
 */

import type { AbstractBlock, AbstractInput } from '../ast.ts'
import type { Runtime } from '../runtime/runtime.ts'
import type { RuntimeTarget } from '../runtime/target.ts'
import { add } from '../stacking/mod.ts'

/**
 * Context for runtime
 */
export interface RunContext {
  target: RuntimeTarget
  execute(blocks: AbstractBlock[]): AsyncGenerator
  runtime: Runtime
  evalInput(input: AbstractInput): Promise<string>
}

interface ReporterReturn {
  type: 'String' | 'Number'
  data: string | number
}

type RunReturn<T> = Promise<T> | T | AsyncGenerator<unknown, T>

type Run<B extends AbstractBlock = AbstractBlock> = (
  block: B,
  c: RunContext,
) => RunReturn<'reporter' extends B['type'] ? ReporterReturn : void>

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
