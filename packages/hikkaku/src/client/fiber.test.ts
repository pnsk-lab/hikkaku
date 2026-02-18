import { describe, expect, test } from 'vite-plus/test'
import {
  findDOMAppRoot,
  getScratchInternalStates,
  getSpecifiedFiber,
} from './fiber'

describe('client/fiber', () => {
  test('finds root element from document', () => {
    type TestElement = Element & {
      _reactRootContainer: {
        _internalRoot: {
          current: {
            child: null
            sibling: null
            type: null
          }
        }
      }
    }

    const root = {
      _reactRootContainer: {
        _internalRoot: {
          current: {
            child: null,
            sibling: null,
            type: null,
          },
        },
      },
      id: 'app',
    } as unknown as TestElement
    const originalDocument = globalThis.document
    try {
      Object.assign(globalThis, {
        document: {
          getElementById: (id: string) => (id === 'app' ? root : null),
          querySelector: () => null,
        },
      })

      expect(findDOMAppRoot()).toBe(root)
    } finally {
      Object.assign(globalThis, { document: originalDocument })
    }
  })

  test('finds root element from fallback selector', () => {
    const root = {
      _reactRootContainer: {
        _internalRoot: {
          current: { child: null, sibling: null, type: null },
        },
      },
    } as unknown as {
      _reactRootContainer: {
        _internalRoot: {
          current: {
            child: null
            sibling: null
            type: null
          }
        }
      }
    } & Element
    const originalDocument = globalThis.document
    try {
      Object.assign(globalThis, {
        document: {
          getElementById: () => null,
          querySelector: () => root,
        },
      })

      expect(findDOMAppRoot()).toBe(root)
    } finally {
      Object.assign(globalThis, { document: originalDocument })
    }
  })

  test('throws when root element is not found', () => {
    const originalDocument = globalThis.document
    try {
      Object.assign(globalThis, {
        document: {
          getElementById: () => null,
          querySelector: () => null,
        },
      })
      expect(() => findDOMAppRoot()).toThrowError(
        'Could not find root DOM node. Make sure you are running this in a Scratch environment.',
      )
    } finally {
      Object.assign(globalThis, { document: originalDocument })
    }
  })

  test('finds matching fiber node', () => {
    const tree = {
      type: null,
      child: {
        type: 'a',
        child: null,
        sibling: { type: 'target', child: null, sibling: null },
      },
      sibling: null,
    }

    const found = getSpecifiedFiber(tree, (fiber) => fiber.type === 'target')
    expect(found?.type).toBe('target')
  })

  test('returns null when matching fiber node does not exist', () => {
    const tree = {
      type: 'root',
      child: { type: 'a', child: null, sibling: null },
      sibling: null,
    }

    const found = getSpecifiedFiber(tree, (fiber) => fiber.type === 'target')
    expect(found).toBeNull()
  })

  test('extracts scratch internal states and patches storage', () => {
    type TestFiber = {
      child: TestFiber | null
      sibling: TestFiber | null
      type: unknown
      elementType?: {
        propTypes?: Record<string, unknown>
      }
      stateNode?: {
        ScratchBlocks?: unknown
      }
      memoizedProps?: {
        store: {
          getState: () => unknown
        }
      }
    }

    let addWebStoreArgs: unknown[] | null = null
    const storage = {
      webHelper: {
        assetTool: {
          tools: ['default-tool'],
        },
        stores: ['store-a', 'store-b'],
      },
      AssetType: {
        ImageVector: 'ImageVector',
        ImageBitmap: 'ImageBitmap',
        Sound: 'Sound',
      },
      addWebStore: (...args: unknown[]) => {
        addWebStoreArgs = args
      },
    }
    const vm = {
      runtime: {
        storage,
      },
    }
    const reduxState = { scratchGui: { vm } } as unknown
    const scratchBlocks = {
      getMainWorkspace: () => ({
        cleanUp: () => undefined,
      }),
    }

    const appFiberNode: TestFiber = {
      child: null,
      sibling: null,
      type: null,
      memoizedProps: {
        store: {
          getState: () => reduxState,
        },
      },
    }
    const scratchBlocksFiberNode: TestFiber = {
      child: null,
      sibling: null,
      type: () => null,
      elementType: {
        propTypes: {
          toolboxXML: true,
        },
      },
      stateNode: {
        ScratchBlocks: scratchBlocks,
      },
    }

    appFiberNode.sibling = scratchBlocksFiberNode

    const root = {
      _reactRootContainer: {
        _internalRoot: {
          current: {
            child: appFiberNode,
            sibling: null,
            type: null,
          },
        },
      },
    } as Parameters<typeof getScratchInternalStates>[0]

    const state = getScratchInternalStates(root)

    expect(state.reduxState).toBe(reduxState as typeof state.reduxState)
    expect(state.vm).toBe(vm as unknown as typeof state.vm)
    expect(state.scratchBlocks).toBe(scratchBlocks)
    expect(storage.webHelper.assetTool.tools).toEqual([])
    expect(storage.webHelper.stores).toEqual([])
    if (!addWebStoreArgs) {
      throw new Error('addWebStore was not called')
    }
    const callArgs = addWebStoreArgs as unknown[]
    const [assetTypes, resolver, option1, option2] = callArgs
    if (!Array.isArray(assetTypes)) {
      throw new Error('asset types should be an array')
    }
    expect(assetTypes).toEqual(['ImageVector', 'ImageBitmap', 'Sound'])
    expect(typeof resolver).toBe('function')
    expect(option1).toBeNull()
    expect(option2).toBeNull()
  })
})
