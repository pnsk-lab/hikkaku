declare module '*.svg?scratch' {
  import * as sb3 from 'sb3-types'

  const content: sb3.Costume
  export default content
}
declare module '*.png?scratch' {
  import * as sb3 from 'sb3-types'

  const content: sb3.Costume
  export default content
}
declare module '*.wav?scratch' {
  import * as sb3 from 'sb3-types'

  const content: sb3.Sound
  export default content
}
declare module '*.mp3?scratch' {
  import * as sb3 from 'sb3-types'

  const content: sb3.Sound
  export default content
}

declare module 'vite-plus' {
  export function defineConfig<T>(config: T): T
}

declare module 'vite-plus/test' {
  export { describe, expect, it, test } from 'bun:test'
  export type { TestInterface } from 'bun:test'
}
