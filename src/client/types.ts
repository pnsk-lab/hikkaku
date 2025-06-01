import * as sb3 from '@pnsk-lab/sb3-types'

export interface ScratchVM {
  blockListener: () => void
  loadProject: (project: sb3.ScratchProject | string) => Promise<void>
}