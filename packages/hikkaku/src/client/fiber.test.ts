import { describe, expect, test } from 'vite-plus/test'
import { findDOMAppRoot, getSpecifiedFiber } from './fiber'

describe('client/fiber', () => {
  test('finds root element from document', () => {
    const root = { _reactRootContainer: {}, id: 'app' }
    const originalDocument = globalThis.document
    Object.assign(globalThis, {
      document: {
        getElementById: (id: string) => (id === 'app' ? root : null),
        querySelector: () => null,
      },
    })

    expect(findDOMAppRoot()).toBe(root)
    Object.assign(globalThis, { document: originalDocument })
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
