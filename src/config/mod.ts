/**
 * Type definition and utils for project config
 */

import { Project } from '../project.ts'

/**
 * Type definition for project config
 */
export interface Config {
  project: Project
  assetsDir: string
}

/**
 * Helper for defining config
 * @param config Config
 * @returns Config
 */
export const defineConfig = (config: Config): Config => config
