// find root DOM node

import { findDOMAppRoot, getScratchInternalStates } from "./fiber";
import * as sb3 from "@pnsk-lab/sb3-types";

const root = findDOMAppRoot()
const state = getScratchInternalStates(root)

console.log('Scratch root element:', state)

import.meta.hot?.on('hikkaku:project', (project: sb3.ScratchProject) => {
  state.vm.loadProject(project)
})
