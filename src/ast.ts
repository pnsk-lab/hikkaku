// Abstract **Scratch** Tree

export type AbstractInput<T extends string = string> = ({
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
}) & {
  type: T
}

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

export interface AbstractCBlock extends AbstractBlockBase {
  type: 'c'
  children: AbstractBlock[]
}
export interface AbstractStackBlock extends AbstractBlockBase{
  type: 'stack'
}
export interface AbstractReporterBlock extends AbstractBlockBase {
  type: 'reporter'
}
export interface AbstractHatBlock extends AbstractBlockBase {
  type: 'hat'
}

export type AbstractBlock = AbstractCBlock | AbstractStackBlock | AbstractReporterBlock | AbstractHatBlock

export interface Costume {
  data: string
  id: string
}

export interface AbstractTarget {
  name: string
  blocks: AbstractBlock[][]
  costumes: Costume[]
}

export interface AbstractScratchTree {
  stage: AbstractTarget
  sprites: AbstractTarget[]
}
