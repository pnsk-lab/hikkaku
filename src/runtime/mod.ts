/**
 * Runtime
 * @module
 */

import { RuntimeTarget } from './target.ts'

/**
 * Runtime context definition
 */
export interface RuntimeContext {
  /**
   * Current Target
   */
  target: RuntimeTarget
}
