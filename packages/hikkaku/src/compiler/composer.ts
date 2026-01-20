import type * as sb3 from '@pnsk-lab/sb3-types'
import type { HikkakuBlock } from './types'

export type Handler = () => void

let id = 0
const nextId = () => (++id).toString(16)

interface RootContext {
  blocks: Record<string, sb3.Block>
  adder?: (id: string, block: sb3.Block) => void
  usedAsValueSet: WeakSet<sb3.Block>
  valueBlockSet: WeakSet<sb3.Block>
  blockToId: WeakMap<sb3.Block, string>
}
let rootContext: RootContext | null = null
const getRootContext = () => {
  if (!rootContext) {
    throw new Error('Root context is not initialized. Call createBlocks first.')
  }
  return rootContext
}

export interface BlockInit {
  inputs?: Record<string, sb3.Input>
  fields?: Record<string, sb3.Fields>
  topLevel?: boolean
  mutation?: sb3.Mutation
  isShadow?: boolean
  isValue?: boolean
}
export const block = (opcode: string, init: BlockInit): HikkakuBlock => {
  const ctx = getRootContext()
  const id = nextId()
  const block = {
    opcode,
    inputs: init.inputs ?? {},
    fields: init.fields ?? {},
    mutation: init.mutation,
    shadow: init.isShadow ?? false,
    topLevel: init.topLevel ?? false,
    x: 0,
    y: 0,
    next: null,
    parent: null,
  }
  ctx.blocks[id] = block
  ctx.blockToId.set(block, id)
  if (init.isValue) {
    ctx.valueBlockSet.add(block)
  }

  if (init.inputs) {
    for (const [_key, value] of Object.entries(init.inputs)) {
      if (typeof value[1] === 'string') {
        const valueBlockId = value[1]
        const valueBlock = ctx.blocks[valueBlockId]
        if (valueBlock) {
          valueBlock.parent = id
          ctx.usedAsValueSet.add(valueBlock)
        }
      }
    }
  }

  if (ctx.adder) {
    ctx.adder(id, block)
  }

  return {
    isBlock: true,
    id,
  }
}

export const valueBlock = (opcode: string, init: BlockInit): HikkakuBlock => {
  return block(opcode, { ...init, isValue: true })
}

const applyNextAndParent = (blocks: sb3.Block[]) => {
  const ctx = getRootContext()
  let lastBlock: [string, sb3.Block] | null = null
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (!block || ctx.usedAsValueSet.has(block)) {
      continue
    }
    const blockId = ctx.blockToId.get(block)
    if (!blockId) {
      throw new Error(`Block ${JSON.stringify(block)} does not have an ID`)
    }
    if (block.topLevel) {
      lastBlock = null
      block.parent = null
    }

    if (lastBlock) {
      lastBlock[1].next = blockId
      block.parent ??= lastBlock[0]
    }

    lastBlock = [blockId, block]
  }
}
const catchNewBlocks = (
  handler: Handler,
  catched: (id: string, block: sb3.Block) => void,
) => {
  const ctx = getRootContext()
  const oldAdder = ctx.adder
  ctx.adder = (id: string, block: sb3.Block) => {
    catched(id, block)
  }
  handler()
  ctx.adder = oldAdder
}

export const substack = (handler: Handler) => {
  const ctx = getRootContext()
  const blocks: sb3.Block[] = []

  catchNewBlocks(handler, (id, block) => {
    ctx.blocks[id] = block
    blocks.push(block)
  })
  applyNextAndParent(blocks)

  // Pick the first executable block (skip value blocks used as inputs).
  for (const block of blocks) {
    if (!block || ctx.usedAsValueSet.has(block)) {
      continue
    }
    const blockId = ctx.blockToId.get(block)
    if (blockId) {
      return blockId
    }
  }

  return null
}

export const createBlocks = (handler: Handler) => {
  const blocks: Record<string, sb3.Block> = {}
  rootContext = {
    blocks: blocks,
    usedAsValueSet: new WeakSet(),
    valueBlockSet: new WeakSet(),
    blockToId: new WeakMap(),
  }

  const blocksForAddingNext: sb3.Block[] = []
  catchNewBlocks(handler, (id, block) => {
    blocks[id] = block
    blocksForAddingNext.push(block)
  })
  applyNextAndParent(blocksForAddingNext)

  const unconnectedValueBlocks: Array<{ id: string; opcode: string }> = []
  for (const [blockId, block] of Object.entries(blocks)) {
    if (
      rootContext.valueBlockSet.has(block) &&
      !rootContext.usedAsValueSet.has(block)
    ) {
      unconnectedValueBlocks.push({ id: blockId, opcode: block.opcode })
    }
  }
  if (unconnectedValueBlocks.length > 0) {
    const formatted = unconnectedValueBlocks
      .map(({ id, opcode }) => `${opcode} (${id})`)
      .join(', ')
    rootContext = null
    throw new Error(`Unconnected value block(s): ${formatted}`)
  }

  rootContext = null
  return blocks
}
