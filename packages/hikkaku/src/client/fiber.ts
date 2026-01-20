import type { ScratchVM } from "./types"

export const findDOMAppRoot = () => {
  const probably = [
    document.getElementById('app'), // Scratch WWW: #app is the root element
    document.querySelector('[class^=index_app]'), // Playground code of Scratch GUI
  ]
  for (const el of probably) {
    if (el && '_reactRootContainer' in el) {
      return el as ScratchRoot
    }
  }

  throw new Error(
    'Could not find root DOM node. Make sure you are running this in a Scratch environment.',
  )
}

interface FiberNode {
  child: ScratchAppFiberNode | FiberNode | null
}
interface ScratchGUIReduxStoreType {
  vm: ScratchVM
}
interface ScratchInternalReduxStoreType {
  scratchGui: ScratchGUIReduxStoreType
}
interface ScratchAppFiberNode extends FiberNode {
  memoizedProps: {
    store: {
      getState: () => ScratchInternalReduxStoreType
    }
  }
}
type ScratchRoot = {
  _reactRootContainer: {
    _internalRoot: {
      current: FiberNode
    }
  }
} & Element

const getAppFiberNode = (root: FiberNode): ScratchAppFiberNode => {
  let cur = root.child
  while (cur) {
    if ('memoizedProps' in cur && 'store' in cur.memoizedProps) {
      return cur
    }
    cur = cur.child
  }
  throw new Error('Could not find app fiber node.')
}
export const getScratchInternalStates = (
  root: ScratchRoot,
) => {
  const rootContainer = root._reactRootContainer
  const rootFiberNode = rootContainer._internalRoot.current
  const appFiberNode = getAppFiberNode(rootFiberNode)


  const reduxState = appFiberNode.memoizedProps.store.getState()
  const vm = reduxState.scratchGui.vm

  return {
    reduxState,
    vm
  }
}