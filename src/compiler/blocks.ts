/**
 * Defining block compiler
 * @modle
 */

import { AbstractBlock } from '../ast.ts'
import type {
  Block as ScratchBlock,
  Input as ScratchInput,
} from '@pnsk-lab/sb3-types'
import { NotImplmentedError } from '../utils/error.ts'

interface ScratchBlocks {
  [id: string]: ScratchBlock
}
interface ScratchInputs {
  [id: string]: ScratchInput
}

const compileBlockList = (
  blockList: AbstractBlock[],
  c: CompileBlocksContext,
  parentID: string | null = null,
): string[] => {
  let lastBlockID: string | null = parentID
  const ids: string[] = []
  for (const block of blockList) {
    const blockID = crypto.randomUUID()
    const isToplevel = block.type === 'hat'

    // One block before: `next`
    const oneBlockBeforeID = ids.at(-1)
    if (oneBlockBeforeID) {
      c.scratchBlocks[oneBlockBeforeID].next = blockID
    }

    // Create Input
    const blockInputs: ScratchInputs = {}
    if (block.type === 'c') {
      for (const [branchName, branchBlocks] of Object.entries(block.branches)) {
        const [branchID] = compileBlockList(branchBlocks, c, blockID)
        blockInputs[branchName] = [
          3,
          branchID,
          //@ts-expect-error @pnsk-lab/sb3-types's problem
          null,
        ]
      }
    }
    for (const [inputName, inputSource] of Object.entries(block.inputs ?? {})) {
      let input: ScratchInput
      switch (inputSource.type) {
        case 'Number':
          input = [2, [4, inputSource.value]]
          break
        case 'String':
          input = [2, [10, inputSource.value]]
          break
        case 'Color':
          input = [2, [9, inputSource.value]]
          break
        case 'Broadcast':
        case 'Variable':
        case 'List':
        case 'Block':
        default:
          throw new NotImplmentedError(
            `Input type ${inputSource.type} is not implmented.`,
          )
      }
      blockInputs[inputName] = input
    }

    // Create Block
    const scratchBlock: ScratchBlock = {
      opcode: block.opcode,
      topLevel: isToplevel,
      parent: lastBlockID,
      inputs: blockInputs,
    }

    lastBlockID = blockID

    c.scratchBlocks[blockID] = scratchBlock
    ids.push(blockID)
  }
  return ids
}
interface CompileBlocksContext {
  readonly scratchBlocks: ScratchBlocks
}

/**
 * Compile AST to `block` of project.json
 * @param blocks Block list
 * @returns Compiled blocks for project.json
 */
export const compileBlocks = (blocks: AbstractBlock[][]): ScratchBlocks => {
  const ctx: CompileBlocksContext = {
    scratchBlocks: {},
  }

  for (const blockList of blocks) {
    compileBlockList(blockList, ctx)
  }

  return ctx.scratchBlocks
}
