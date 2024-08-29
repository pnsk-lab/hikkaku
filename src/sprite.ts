/**
 * Defining Sprite API
 */

import { Target, type TargetInit } from './target.ts'

/**
 * Sprite init
 */
export interface SpriteInit extends TargetInit {

}

/**
 * Sprite API
 */
export class Sprite extends Target {
  constructor(init: SpriteInit) {
    super(init)
  }
}