/**
 * Defining project
 * @module
 */

import { AbstractScratchTree } from './ast.ts'
import { Stage, StageInit } from './stage.ts'
import { Sprite, SpriteInit } from './sprite.ts'

/**
 * Options for initing Project
 */
export interface ProjectInit {
  stage: StageInit
}

/**
 * Project
 */
export class Project {
  #stage: Stage
  #sprites: Sprite[]

  constructor(init: ProjectInit) {
    this.#stage = new Stage(init.stage)
    this.#sprites = []
  }

  /**
   * Get stage
   */
  get stage(): Stage {
    return this.#stage
  }

  /**
   * Create a new sprite
   * @param init Options
   * @returns Sprite
   */
  addSprite(init: SpriteInit): Sprite {
    const sprite = new Sprite(init)
    this.#sprites.push(sprite)
    return sprite
  }

  /**
   * export project to AST
   * @returns AST
   */
  exportAsAST(): AbstractScratchTree {
    return {
      stage: this.stage.exportAsTree(),
      sprites: this.#sprites
    }
  }
}
