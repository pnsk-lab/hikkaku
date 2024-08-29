/**
 * Runtime core
 * @module
 */

// @ts-types="@turbowarp/types"
import Render from 'scratch-render'
import type { AbstractScratchTree } from '../ast.ts'
import { RuntimeSprite, RuntimeStage } from './target.ts'

/**
 * Options for initing Runtime
 */
export interface RuntimeInit {
  /**
   * Target Canvas
   */
  canvas: HTMLCanvasElement
  /**
   * AST
   */
  ast: AbstractScratchTree
}

/**
 * Runtime Core Class
 */
export class Runtime {
  #canvas: HTMLCanvasElement
  #ast: AbstractScratchTree

  #stage: RuntimeStage
  #sprites: Map<string, RuntimeSprite>

  #abortController = new AbortController()

  /**
   * If runtime running, it is true
   */
  isRunning: boolean

  /**
   * scratch-render instance
   */
  readonly renderer: Render

  constructor(init: RuntimeInit) {
    this.#canvas = init.canvas
    this.#ast = init.ast

    this.#stage = new RuntimeStage({
      blocks: this.#ast.stage.blocks,
      costumes: this.#ast.stage.costumes,
      currentCostumeIndex: 0,
      name: 'stage',
      runtime: this,
    })
    this.#sprites = new Map()
    for (const sprite of this.#ast.sprites) {
      this.#sprites.set(
        sprite.name,
        new RuntimeSprite({
          blocks: sprite.blocks,
          costumes: sprite.costumes,
          currentCostumeIndex: 0,
          x: 0,
          y: 0,
          name: sprite.name,
          runtime: this,
        }),
      )
    }
    this.renderer = new Render(this.#canvas)
    this.renderer.resize(480, 360)

    this.isRunning = false
  }

  #startedMeta?: {
    targets: (RuntimeStage | RuntimeSprite)[]
  }

  /**
   * Start runtime
   */
  async start() {
    this.#abortController = new AbortController()

    const targets = [
      ...this.#sprites.values(),
      this.#stage,
    ]
    this.renderer.setLayerGroupOrdering(targets.map((target) => target.name))
    const starts = await Promise.all(targets.map((target) => target.init()))

    for (const start of starts) {
      start()
    }

    const update = () => {
      if (this.#abortController.signal.aborted) {
        return
      }
      this.renderer.draw()
      requestAnimationFrame(() => update())
    }
    update()

    this.#startedMeta = {
      targets,
    }

    this.isRunning = true
  }

  /**
   * Stop Runtime
   */
  stop() {
    this.#abortController.abort()
    for (const target of this.#startedMeta?.targets ?? []) {
      target.stop()
    }

    this.isRunning = false
  }
}
