import type { ScratchVM } from './types'

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
  sibling: ScratchAppFiberNode | FiberNode | null
  type: string | null
  elementType?: {
    propTypes?: Record<string, unknown>
  }
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

export function getSpecifiedFiber(
  root: FiberNode,
  cond: (fiber: FiberNode) => boolean,
) {
  const stack = [root]
  while (true) {
    const fiber = stack.pop()
    if (!fiber) {
      return null
    }

    if (cond(fiber)) {
      return fiber
    }
    if (fiber.child) {
      stack.push(fiber.child)
    }
    if (fiber.sibling) {
      stack.push(fiber.sibling)
    }
  }
}

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
export const getScratchInternalStates = (root: ScratchRoot) => {
  const rootContainer = root._reactRootContainer
  const rootFiberNode = rootContainer._internalRoot.current
  const appFiberNode = getAppFiberNode(rootFiberNode)

  const reduxState = appFiberNode.memoizedProps.store.getState()
  const vm = reduxState.scratchGui.vm

  const scratchBlocksFiber = getSpecifiedFiber(rootFiberNode, (fiber) => {
    if (typeof fiber.type === 'function') {
      const propTypes = fiber.elementType?.propTypes
      if (propTypes && 'toolboxXML' in propTypes) {
        return true
      }
    }
    return false
  })
  // @ts-expect-error scratchBlocksFiber existence checked
  const scratchBlocks = scratchBlocksFiber.stateNode.ScratchBlocks as {
    getMainWorkspace: () => {
      cleanUp: () => void
    }
  }

  return {
    reduxState,
    vm,
    scratchBlocks,
  }
}
