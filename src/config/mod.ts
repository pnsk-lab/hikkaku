/**
 * Type definition and utils for project config
 * @module
 */

/**
 * Type definition for project config
 */
export interface Config {
  project: URL | string
  assetsDir: string
}

/**
 * Helper for defining config
 * @param config Config
 * @returns Config
 */
export const defineConfig = (config: Config): Config => config
