import { AbstractBlock } from '../ast.ts'
import { add } from '../stacking/mod.ts'

export interface BlockDefinetion<Args extends unknown[], Block extends AbstractBlock> {
  /**
   * Block id (it is not opcode)
   */
  readonly id: string

  readonly createBlock: (...args: Args) => Block

  readonly run: (block: Block) => Promise<void> | void
}

export type BlockHelper<Args extends unknown[], Block extends AbstractBlock> = (...args: Args) => Block

export const defineBlockFn = <Args extends unknown[], Block extends AbstractBlock>(block: BlockDefinetion<Args, Block>): BlockHelper<Args, Block> => {
  return (...args) => {
    const abstractBlock = block.createBlock(...args)
    if (abstractBlock.type !== 'reporter') {
      add(abstractBlock)
    }
    return abstractBlock
  }
}
