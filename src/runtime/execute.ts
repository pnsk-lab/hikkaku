/**
 * Block executer
 * @module
 */

import { AbstractBlock } from '../ast.ts'
import { blockHelpers } from '../blocks/_all.ts'
import type { RunContext } from '../blocks/_shared.ts'

async function* executeBlock(block: AbstractBlock, ctx: RunContext) {
  const { run } = blockHelpers[block.opcode]
  const returned = run(block, ctx)
  if (!returned) {
    return
  }
  if ('next' in returned) {
    for await (const _ of returned) {
      yield _
    }
  } else {
    await returned
  }
}

/**
 * Execute block list
 * @param blocks Blocks
 * @param ctx Context
 */
export async function* executeBlocks(blocks: AbstractBlock[], ctx: RunContext) {
  for (const block of blocks) {
    for await (const _ of executeBlock(block, ctx)) {
      yield
    }
    yield
  }
}
