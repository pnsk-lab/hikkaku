// DO NOT USE ASYNC API

/**
 * Internal API, for stacking blocks
 * @module
 */

import type { AbstractBlock } from '../ast.ts'
import type { Target } from '../target.ts'

type BlockListener = (block: AbstractBlock) => void

type Stack = {
  listener: BlockListener
  target: Target
}

const stacks: Stack[] = []

/**
 * Listen children blocks
 * @param listener new listener
 */
export const into = (
  listener: BlockListener,
  target: Target = stacks.at(-1)?.target!,
): void => {
  stacks.push({
    listener,
    target,
  })
}

/**
 * Out this block
 */
export const outof = (): void => {
  stacks.pop()
}

/**
 * Add new block
 * @param block New Block
 */
export const add = (block: AbstractBlock): void => {
  const stack = stacks.at(-1)
  stack?.listener(block)
}

/**
 * Get Target
 */
export const getTarget = (): Target => {
  return stacks.at(-1)?.target!
}
