// test/setup.ts
import { expect } from 'vite-plus/test'

expect.extend({
  toBeLooselyEqual(received: unknown, expected: unknown) {
    const pass = Number(received) === Number(expected)

    return {
      pass,
      message: () => `expected ${received} to loosely equal ${expected}`,
    }
  },
})
