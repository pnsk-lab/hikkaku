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
  abstract readonly isStage: boolean

  readonly name: string

  readonly costumes: Costume[]
  currentCostumeIndex: number = 0
  readonly blocks: AbstractBlock[][]

  readonly runtime: Runtime

  constructor(init: RuntimeTargetInit) {
    this.costumes = init.costumes
    this.currentCostumeIndex = init.currentCostumeIndex
    this.blocks = init.blocks
    this.name = init.name
    this.runtime = init.runtime
  }

  abstract init(): Promise<() => Promise<void>>
}

interface RuntimeSpriteInit extends RuntimeTargetInit {
  x: number
  y: number
}

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

    this.runtime.renderer.updateDrawablePosition(this.#drawableID, [this.#x, this.#y])
  }

  constructor(init: RuntimeSpriteInit) {
    super(init)

    this.setXY(init.x, init.y)
  }

  async init(): Promise<() => Promise<void>> {
    const runtime = this.runtime

    const skinIDs = await Promise.all(this.costumes.map(async costume => {
      const res = await fetch(costume.data)
      let skinID: number
      if (res.headers.get('Content-Type') === 'image/svg+xml') {
        skinID = runtime.renderer.createSVGSkin(await res.text())
      } else {
        const src = URL.createObjectURL(await res.blob())
        const image = await new Promise<HTMLImageElement>(resolve => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.src = src
        })
        skinID = runtime.renderer.createBitmapSkin(image)
      }
      return {
        id: costume.id,
        skinID
      }
    }))
    this.#drawableID = this.runtime.renderer.createDrawable(this.name)

    runtime.renderer.updateDrawableSkinId(this.#drawableID, skinIDs[0].skinID)

    const context: RunContext = {
      target: this,
      async * execute(blocks) {
        for await (const _ of executeBlocks(blocks, context)) {
          yield _
        }
      },
    }

    return async () => {
      for (const blocks of this.blocks) {
        ;(async () => {
          for await (const _ of executeBlocks(blocks, context)) {
            await new Promise(requestAnimationFrame)
          }
        })()
      }
    }
  }
}

export class RuntimeStage extends RuntimeTargetBase {
  isStage: true = true

  async init(): Promise<() => Promise<void>> {
    return async () => {

    }
  }
}

export type RuntimeTarget = RuntimeSprite | RuntimeStage
