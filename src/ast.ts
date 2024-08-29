// Abstract **Scratch** Tree

/**
 * Defining AST
 * @module
 */

/**
 * AbstractInput
 */
export type AbstractInput<T extends string = string> =
  & ({
    type: 'Number' | 'String'
    value: string
  } | {
    type: 'Color'
    value: `#${string}`
  } | {
    type: 'Broadcast'
    name: string
  } | {
    type: 'Variable' | 'List'
    id: string
  } | {
    type: 'Block'
    block: AbstractBlock
  })
  & {
    type: T
  }

/**
 * AbstractBlockBase, it's extended by blocks
 */
export interface AbstractBlockBase {
  fields?: {
    [K in string]: {
      data: string
      varId?: string
    }
  }
  inputs?: {
    [K in string]: AbstractInput
  }
  opcode: string
}

/**
 * C Blocks
 * It has branch.
 */
export interface AbstractCBlock extends AbstractBlockBase {
  type: 'c'
  branches: {
    [k: `SUBSTACK${string}`]: AbstractBlock[]
  }
}

/**
 * Stack Block.
 */
export interface AbstractStackBlock extends AbstractBlockBase {
  type: 'stack'
}

/**
 * Reporter block.
 * It can return values.
 */
export interface AbstractReporterBlock extends AbstractBlockBase {
  type: 'reporter'
}

/**
 * Hat Blocks.
 * The Program starts with it.
 */
export interface AbstractHatBlock extends AbstractBlockBase {
  type: 'hat'
}

/**
 * Union of Blocks
 */
export type AbstractBlock =
  | AbstractCBlock
  | AbstractStackBlock
  | AbstractReporterBlock
  | AbstractHatBlock

/**
 * Abstract Costume
 */
export interface Costume {
  data: string
  id: string
}

/**
 * Target Tree
 */
export interface AbstractTarget {
  name: string
  blocks: AbstractBlock[][]
  costumes: Costume[]
}

/**
 * Project root AST
 */
export interface AbstractScratchTree {
  stage: AbstractTarget
  sprites: AbstractTarget[]
}
