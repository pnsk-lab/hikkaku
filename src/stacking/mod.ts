// DO NOT USE ASYNC API

/**
 * Internal API, for stacking blocks
 * @module
 */

import type { AbstractBlock } from '../ast.ts'

type BlockListener = (block: AbstractBlock) => void

const listeners: BlockListener[] = []

/**
 * Listen children blocks
 * @param listener new listener
 */
export const into = (listener: BlockListener): void => {
  listeners.push(listener)
}

/**
 * Out this block
 */
export const outof = (): void => {
  listeners.pop()
}

/**
 * Add new block
 * @param block New Block
 */
export const add = (block: AbstractBlock): void => {
  const listener = listeners.at(-1)
  listener?.(block)
}
