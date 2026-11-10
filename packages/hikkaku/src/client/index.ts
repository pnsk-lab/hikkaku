/// <reference types="vite/client" />
// find root DOM node

import type * as sb3 from 'sb3-types'
import { findDOMAppRoot, getScratchInternalStates } from './fiber'

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

let isFirstLoad = true

import.meta.hot?.on('hikkaku:project', async (project: sb3.ScratchProject) => {
  if (isFirstLoad) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    isFirstLoad = false
  }
  console.log('Received updated project:', project)
  await state.vm.loadProject(project).catch(console.error)
  console.log('Project loaded.')

  //state.scratchBlocks.getMainWorkspace().cleanUp()
})
