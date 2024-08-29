/**
 * Target API
 * @module
 */

import type { AbstractBlock, AbstractTarget, Costume } from './ast.ts'
import { whenFlagClicked } from './blocks/event.ts'
import { into, outof } from './stacking/mod.ts'

type Handler = () => void

/**
 * Target Init
 */
export interface TargetInit {
  name: string
  costumes: Costume[]
}

/**
 * Target API
 */
export abstract class Target {
  readonly name: string
  readonly costumes: Costume[]
  constructor (init: TargetInit) {
    this.name = init.name
    this.costumes = init.costumes
  }

  blocks: AbstractBlock[][] = []
  addOnFlag(h: Handler) {
    const blocks: AbstractBlock[] = []
    into((block) => {
      blocks.push(block)
    })
    whenFlagClicked()
    h()
    outof()
    this.blocks.push(blocks)
  }

  exportAsTree (): AbstractTarget {
    return {
      name: this.name,
      blocks: this.blocks,
      costumes: this.costumes
    }
  }
}
