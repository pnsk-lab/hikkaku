import { Project } from '../project.ts'

export interface Config {
  project: Project
  assetsDir: string
}

export const defineConfig = (config: Config): Config => config
