import { describe, expect, test } from 'vite-plus/test'
import { findDOMAppRoot, getSpecifiedFiber } from './fiber'

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
})
