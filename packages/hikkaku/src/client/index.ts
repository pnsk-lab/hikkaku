/// <reference types="vite/client" />
// find root DOM node

import { zipSync } from 'fflate'
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

const collectAssetIds = (project: sb3.ScratchProject): string[] => {
  const assetIds = new Set<string>()
  for (const target of project.targets) {
    for (const costume of target.costumes) {
      assetIds.add(costume.md5ext ?? `${costume.assetId}.${costume.dataFormat}`)
    }
    for (const sound of target.sounds) {
      assetIds.add(sound.md5ext ?? `${sound.assetId}.${sound.dataFormat}`)
    }
  }
  return [...assetIds]
}

const loadProjectArchive = async (project: sb3.ScratchProject) => {
  const files: Record<string, Uint8Array> = {
    'project.json': new TextEncoder().encode(JSON.stringify(project)),
  }

  await Promise.all(
    collectAssetIds(project).map(async (assetId) => {
      const response = await fetch(`/hikkaku-assets/${assetId}`)
      if (!response.ok) {
        console.warn(`Failed to load Scratch asset: ${assetId}`)
        return
      }
      files[assetId] = new Uint8Array(await response.arrayBuffer())
    }),
  )

  return zipSync(files)
}

import.meta.hot?.on('hikkaku:project', async (project: sb3.ScratchProject) => {
  if (isFirstLoad) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    isFirstLoad = false
  }
  console.log('Received updated project:', project)
  const projectSB3 = await loadProjectArchive(project)
  await state.vm.loadProject(projectSB3).catch(console.error)
  console.log('Project loaded.')

  //state.scratchBlocks.getMainWorkspace().cleanUp()
})
