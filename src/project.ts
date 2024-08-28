import { AbstractScratchTree } from './ast.ts'
import { Stage, StageInit } from './stage.ts'
import { Sprite, SpriteInit } from './sprite.ts'

export interface ProjectInit {
  stage: StageInit
}

export class Project {
  #stage: Stage
  #sprites: Sprite[]

  constructor(init: ProjectInit) {
    this.#stage = new Stage(init.stage)
    this.#sprites = []
  }
  get stage(): Stage {
    return this.#stage
  }
  addSprite(init: SpriteInit): Sprite {
    const sprite = new Sprite(init)
    this.#sprites.push(sprite)
    return sprite
  }

  exportAsAST(): AbstractScratchTree {
    return {
      stage: this.stage.exportAsTree(),
      sprites: this.#sprites
    }
  }
}
