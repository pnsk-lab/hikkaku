// @ts-types="@turbowarp/types"
import Render from 'scratch-render'
import { Project } from '../project.ts'
import { AbstractScratchTree } from '../ast.ts'
import { RuntimeSprite, RuntimeStage } from './target.ts'

export interface RuntimeInit {
  canvas: HTMLCanvasElement
  ast: AbstractScratchTree
}

export class Runtime {
  #canvas: HTMLCanvasElement
  #ast: AbstractScratchTree

  #stage: RuntimeStage
  #sprites: Map<string, RuntimeSprite>

  readonly renderer: Render
  constructor(init: RuntimeInit) {
    this.#canvas = init.canvas
    this.#ast = init.ast

    this.#stage = new RuntimeStage({
      blocks: this.#ast.stage.blocks,
      costumes: this.#ast.stage.costumes,
      currentCostumeIndex: 0,
      name: 'stage',
      runtime: this
    })
    this.#sprites = new Map()
    for (const sprite of this.#ast.sprites) {
      this.#sprites.set(sprite.name, new RuntimeSprite({
        blocks: sprite.blocks,
        costumes: sprite.costumes,
        currentCostumeIndex: 0,
        x: 0,
        y: 0,
        name: sprite.name,
        runtime: this
      }))
    }
    this.renderer = new Render(this.#canvas)
  }
  async start() {
    const targets = [
      ...this.#sprites.values(),
      this.#stage
    ]
    this.renderer.setLayerGroupOrdering(targets.map(target => target.name))
    const starts = await Promise.all(targets.map(target => target.init()))
    for (const start of starts) {
      start()
    }

    const update = async () => {
      this.renderer.draw()
      requestAnimationFrame(() => update())
    }
    update()
  }
}
