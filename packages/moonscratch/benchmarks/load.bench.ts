import { Project } from 'hikkaku'
import { moveSteps } from 'hikkaku/blocks'
import { bench, describe } from 'vite-plus/test'
import {
  createHeadlessVM,
  createProgramModuleFromProject,
} from '../js/vm/factory.ts'

await import('scratch-storage')

const benchOptions = {
  time: 3000,
  warmupTime: 1000,
}

describe('load', () => {
  const project = new Project()
  project.stage.run(() => {
    for (let i = 0; i < 10000; i++) {
      moveSteps(10)
    }
  })
  const projectJson = project.toScratch()
  const program = createProgramModuleFromProject({ projectJson })
  bench(
    'moonscratch',
    () => {
      createHeadlessVM({
        program,
        initialNowMs: 0,
      })
    },
    benchOptions,
  )
})
