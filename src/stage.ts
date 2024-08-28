import { Costume } from './ast.ts'
import { Target } from './target.ts'

export interface StageInit {
  costumes: Costume[]
}
export class Stage extends Target {
  constructor(init: StageInit) {
    super({
      name: 'stage',
      costumes: init.costumes
    })
  }
}
