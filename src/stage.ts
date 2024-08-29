/**
 * Defining Stage API
 * @module
 */

import type { Costume } from './ast.ts'
import { Target } from './target.ts'

/**
 * Stage init
 */
export interface StageInit {
  costumes: Costume[]
}

/**
 * Stage API
 */
export class Stage extends Target {
  constructor(init: StageInit) {
    super({
      name: 'stage',
      costumes: init.costumes,
    })
  }
}
