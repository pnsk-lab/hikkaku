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

type AssetType = unknown
type Asset = {
  assetId: string
  dataFormat: string
  md5ext: string
}
export interface ScratchStorage {
  webHelper: {
    assetTool: {
      tools: {
        get: (...args: unknown[]) => Promise<unknown>
      }[]
    }
  }
  AssetType: {
    ImageVector: AssetType
    ImageBitmap: AssetType
    Sound: AssetType
  }
  addWebStore: (
    assetTypes: AssetType[],
    f: (asset: Asset) => string,
    u1: null,
    u2: null,
  ) => void
}
