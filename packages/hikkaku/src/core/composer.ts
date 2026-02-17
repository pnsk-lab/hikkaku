import type * as sb3 from 'sb3-types'
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
      // [shadow,blockId] or [shadow,blockId,blockId]
      value.slice(1).forEach((input) => {
        if (typeof input === 'string') {
          attachValueBlock(ctx, id, input)
        }
      })
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

function attachValueBlock(ctx: RootContext, parentId: string, blockId: string) {
  const block = ctx.blocks[blockId]
  if (!block) {
    console.warn(
      `Block with ID ${blockId} not found (referenced from block ${parentId})`,
    )
    return
  }

  block.parent = parentId
  ctx.usedAsValueSet.add(block)
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
  try {
    handler()
  } finally {
    ctx.adder = oldAdder
  }
}

const firstExecutableBlockId = (blocks: sb3.Block[]) => {
  const ctx = getRootContext()
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

const layoutTopLevelBlocks = (blocks: sb3.Block[]) => {
  const ctx = getRootContext()
  const seen = new Set<string>()
  let index = 0

  for (const block of blocks) {
    if (!block || !block.topLevel) {
      continue
    }

    const blockId = ctx.blockToId.get(block)
    if (!blockId || seen.has(blockId)) {
      continue
    }
    seen.add(blockId)

    // Keep explicit coordinates if a caller sets them in the future.
    if (block.x !== 0 || block.y !== 0) {
      continue
    }

    block.x = 64
    block.y = 72 + index * 260
    index++
  }
}

export const substack = (handler: Handler) => {
  const ctx = getRootContext()
  const blocks: sb3.Block[] = []

  catchNewBlocks(handler, (id, block) => {
    ctx.blocks[id] = block
    blocks.push(block)
  })
  applyNextAndParent(blocks)

  return firstExecutableBlockId(blocks)
}

export const attachStack = (parentId: string, handler?: Handler) => {
  if (!handler) {
    return null
  }

  const ctx = getRootContext()
  const blocks: sb3.Block[] = []
  catchNewBlocks(handler, (id, block) => {
    ctx.blocks[id] = block
    blocks.push(block)
  })

  const stackBlocks = blocks.filter((block) => !block.topLevel)
  applyNextAndParent(stackBlocks)

  const firstBlockId = firstExecutableBlockId(stackBlocks)
  if (!firstBlockId) {
    return null
  }

  const parentBlock = ctx.blocks[parentId]
  const firstBlock = ctx.blocks[firstBlockId]
  if (parentBlock && firstBlock) {
    parentBlock.next = firstBlockId
    firstBlock.parent = parentId
  }

  return firstBlockId
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
  layoutTopLevelBlocks(blocksForAddingNext)

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
