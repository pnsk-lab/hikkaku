import 'vite-plus/test'

declare module 'vite-plus/test' {
  interface Assertion<T = unknown> {
    toBeApproximately(expected: number, precision?: number): T
  }
}
