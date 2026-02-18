// vitest.d.ts
import 'vite-plus/test'

declare module 'vite-plus/test' {
  interface Assertion<T = any> {
    toBeLooselyEqual(expected: unknown): T
  }
}
