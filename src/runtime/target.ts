/**
 * Target for runtime
 * @module
 */

import { AbstractBlock, Costume } from '../ast.ts'
import { RunContext } from '../blocks/_shared.ts'
import { executeBlocks } from './execute.ts'
import type { Runtime } from './runtime.ts'

interface RuntimeTargetInit {
  blocks: AbstractBlock[][]
  costumes: Costume[]
  currentCostumeIndex: number
  name: string
  runtime: Runtime
}

export abstract class RuntimeTargetBase {
  /**
   * If target is state, it's true
   */
  abstract readonly isStage: boolean

  /**
   * Target name
   */
  readonly name: string

  /**
   * Costumes that target has
   */
  readonly costumes: Costume[]

  /**
   * Current costume index
   */
  currentCostumeIndex: number = 0

  /**
   * Target blocks tree
   */
  readonly blocks: AbstractBlock[][]

  /**
   * Runtime that target references
   */
  readonly runtime: Runtime

  /**
   * AbortController for stopping
   */
  readonly abortController: AbortController

  /**
   * @param init Options
   */
  constructor(init: RuntimeTargetInit) {
    this.costumes = init.costumes
    this.currentCostumeIndex = init.currentCostumeIndex
    this.blocks = init.blocks
    this.name = init.name
    this.runtime = init.runtime
    this.abortController = new AbortController()
  }

  /**
   * Init target
   */
  abstract init(): Promise<() => Promise<void>>

  /**
   * Stop target
   */
  stop() {
    this.abortController.abort()
  }
}

interface RuntimeSpriteInit extends RuntimeTargetInit {
  x: number
  y: number
}

/**
 * Sprite for runtime
 */
export class RuntimeSprite extends RuntimeTargetBase {
  isStage: false = false

  #x: number = 0
  #y: number = 0
  #drawableID?: number

  getXY(): [x: number, y: number] {
    return [this.#x, this.#y]
  }

  setXY(x: number | null, y: number | null) {
    if (this.#drawableID === undefined) {
      return
    }
    this.#x = x ?? this.#x
    this.#y = y ?? this.#y

    this.runtime.renderer.updateDrawablePosition(this.#drawableID, [
      this.#x,
      this.#y,
    ])
  }

  constructor(init: RuntimeSpriteInit) {
    super(init)

    this.setXY(init.x, init.y)
  }

  async init(): Promise<() => Promise<void>> {
    const runtime = this.runtime

    const skinIDs = await Promise.all(this.costumes.map(async (costume) => {
      const res = await fetch(costume.data)
      let skinID: number
      if (res.headers.get('Content-Type') === 'image/svg+xml') {
        skinID = runtime.renderer.createSVGSkin(await res.text())
      } else {
        const src = URL.createObjectURL(await res.blob())
        const image = await new Promise<HTMLImageElement>((resolve) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.src = src
        })
        skinID = runtime.renderer.createBitmapSkin(image)
      }
      return {
        id: costume.id,
        skinID,
      }
    }))
    this.#drawableID = this.runtime.renderer.createDrawable(this.name)

    runtime.renderer.updateDrawableSkinId(this.#drawableID, skinIDs[0].skinID)

    const context: RunContext = {
      target: this,
      async *execute(blocks) {
        for await (const _ of executeBlocks(blocks, context)) {
          yield _
        }
      },
    }

    return async () => {
      for (const blocks of this.blocks) {
        ;(async () => {
          for await (const _ of executeBlocks(blocks, context)) {
            // console.log(this.abortController.signal)
            if (this.abortController.signal.aborted) {
              return
            }
            await new Promise(requestAnimationFrame)
          }
        })()
      }
    }
  }
}

/**
 * Sprite for stage
 */
export class RuntimeStage extends RuntimeTargetBase {
  isStage: true = true

  async init(): Promise<() => Promise<void>> {
    return async () => {
    }
  }
}

/**
 * RuntimeSprite or RuntimeStage
 */
export type RuntimeTarget = RuntimeSprite | RuntimeStage
