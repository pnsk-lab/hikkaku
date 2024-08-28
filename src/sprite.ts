import { Target, TargetInit } from './target.ts'

export interface SpriteInit extends TargetInit {

}
export class Sprite extends Target {
  constructor(init: SpriteInit) {
    super(init)
  }
}