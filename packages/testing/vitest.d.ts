// vitest.d.ts
import 'vite-plus/test'

declare module 'vite-plus/test' {
  // biome-ignore lint: any
  interface Assertion<T = any> {
    toBeLooselyEqual(expected: unknown): T
  }
}
