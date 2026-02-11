import type * as sb3 from 'sb3-types'

export interface ScratchVM {
  blockListener: () => void
  loadProject: (
    project: sb3.ScratchProject | string | Uint8Array,
  ) => Promise<void>
  toJSON: () => sb3.ScratchProject
  runtime: {
    storage: ScratchStorage
  }
}
export interface ScratchStorage {
  webHelper: {
    assetTool: {
      tools: {
        get: (...args: unknown[]) => Promise<unknown>
      }[]
    }
  }
}
