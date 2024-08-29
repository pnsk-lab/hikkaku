/**
 * Runtime
 * @module
 */

import type { RuntimeTarget } from './target.ts'

/**
 * Runtime context definition
 */
export interface RuntimeContext {
  /**
   * Current Target
   */
  target: RuntimeTarget
}
