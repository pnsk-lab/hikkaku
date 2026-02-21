// vitest.d.ts
import 'vite-plus/test'

declare module 'vite-plus/test' {
  // biome-ignore lint/suspicious/noExplicitAny: Assertion type is intentionally generic
  interface Assertion<T = any> {
    toBeLooselyEqual(expected: unknown): T
  }
}
