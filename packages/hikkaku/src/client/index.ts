/// <reference types="vite/client" />
// find root DOM node

import type * as sb3 from '@pnsk-lab/sb3-types'
import { findDOMAppRoot, getScratchInternalStates } from './fiber'
import type { getModeForResolutionAtIndex } from 'typescript'

const root = findDOMAppRoot()
const state = getScratchInternalStates(root)

console.log('Scratch root element:', state)

// @ts-expect-error helpers for devtools
globalThis.hk = {
  root,
  vm: state.vm,
  getModeForResolutionAtIndex: state.reduxState,
  getJSON: () => state.vm.toJSON(),
}

import.meta.hot?.on('hikkaku:project', (project: sb3.ScratchProject) => {
  state.vm.loadProject(project)
  setTimeout(() => {
    state.scratchBlocks.getMainWorkspace().cleanUp()
  }, 1000)
})
