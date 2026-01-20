import type * as sb3 from "@pnsk-lab/sb3-types"
import { createBlocks } from "./composer"
import type { CostumeReference, ListReference, SoundReference, VariableReference } from "./types"

let nextAssetId = 0
const createAssetId = () => `asset-${(++nextAssetId).toString(16)}`

export class Target<IsStage extends boolean = boolean> {
  readonly isStage: IsStage
  readonly name: IsStage extends true ? 'Stage' : string
  currentCostume = 0

  #blocks: Record<string, sb3.Block> = {}
  #variables: Record<string, sb3.ScalarVariable> = {}
  #lists: Record<string, sb3.List> = {}
  #costumes: sb3.Costume[] = []
  #sounds: sb3.Sound[] = []
  constructor(
    isStage: IsStage,
    name: IsStage extends true ? 'Stage' : string
  ) {
    this.isStage = isStage
    this.name = name
  }

  run (handler: (target: Target<IsStage>) => void): void {
    const blocks = createBlocks(() => {
      handler(this)
    })
    this.#blocks = {
      ...this.#blocks,
      ...blocks
    }
  }

  createVariable (
    name: string,
    defaultValue: sb3.ScalarVal = 0,
    isCloudVariable = false
  ): VariableReference {
    const id = createAssetId()
    this.#variables[id] = [name, defaultValue, isCloudVariable]
    return {
      id,
      name,
      type: 'variable'
    }
  }

  createList (
    name: string,
    defaultValue: sb3.ScalarVal[] = []
  ): ListReference {
    const id = createAssetId()
    this.#lists[id] = [name, defaultValue]
    return {
      id,
      name,
      type: 'list'
    }
  }

  addCostume (costume: sb3.Costume): CostumeReference {
    this.#costumes.push(costume)
    return {
      name: costume.name,
      type: 'costume' as const
    }
  }

  addSound (sound: sb3.Sound): SoundReference {
    this.#sounds.push(sound)
    return {
      name: sound.name,
      type: 'sound' as const
    }
  }

  toScratch(): IsStage extends true ? sb3.Stage : sb3.Sprite {
    const costumes = (this.#costumes.length > 0)
      ? this.#costumes
      : [{
        name: this.name,
        assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
        dataFormat: 'svg' as const
      }]
    const target: sb3.Target = {
      blocks: this.#blocks,
      broadcasts: {},
      variables: this.#variables,
      lists: this.#lists,
      sounds: this.#sounds,
      currentCostume: this.currentCostume,
      costumes
    }
    if (this.isStage) {
      return {
        ...target,
        isStage: true,
        name: 'Stage',
      } satisfies sb3.Stage as IsStage extends true ? sb3.Stage : sb3.Sprite
    }
    return {
      ...target,
      isStage: false,
      name: this.name,
      visible: true
    } satisfies sb3.Sprite as IsStage extends true ? sb3.Stage : sb3.Sprite
  }
}

export class Project {
  readonly stage: Target<true>
  #targets: Target[] = []
  constructor () {
    this.#targets.push(this.stage = new Target(true, 'Stage'))
  }
  createSprite (name: string): Target<false> {
    const sprite = new Target(false, name)
    this.#targets.push(sprite)
    return sprite
  }
  toScratch(): sb3.ScratchProject {
    return {
      targets: this.#targets.map(target => target.toScratch()),
      meta: {
        semver: '3.0.0',
        agent: `Hikkaku | ${globalThis.navigator ? navigator.userAgent : 'unknown'}`,
      }
    }
  }
}
