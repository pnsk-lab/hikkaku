import { Sprite } from './sprite.ts'
import { Stage } from './stage.ts'

export class Project {
  #stage: Stage
  #sprites: Map<string, Sprite>

  constructor() {
    this.#stage = new Stage()
    this.#sprites = new Map()
  }
  get stage(): Stage {
    return this.#stage
  }
  addSprite(name: string): Sprite {
    const sprite = new Sprite()

    this.#sprites.set(name, sprite)

    return sprite
  }
}
