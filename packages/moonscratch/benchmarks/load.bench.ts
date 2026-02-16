import { Project } from 'hikkaku'
import { moveSteps } from 'hikkaku/blocks'
import { bench, run } from 'mitata'
import {
  createHeadlessVM,
  createProgramModuleFromProject,
} from '../js/vm/factory.ts'

await import('scratch-storage')

const project = new Project()
project.stage.run(() => {
  for (let i = 0; i < 10000; i++) {
    moveSteps(10)
  }
})
const projectJson = project.toScratch()
const program = createProgramModuleFromProject({ projectJson })
bench('load/moonscratch', () => {
  createHeadlessVM({
    program,
    initialNowMs: 0,
  })
})

if (import.meta.main) {
  await run()
}
