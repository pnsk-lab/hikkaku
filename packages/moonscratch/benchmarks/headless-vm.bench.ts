import { Project } from 'hikkaku'
import { changeVariableBy, forever, moveSteps, setVariableTo, whenFlagClicked } from 'hikkaku/blocks'
import { bench, describe } from 'vite-plus/test'
import { createHeadlessVM } from '../js/vm/factory.ts'
import { createVmFromProject, stepMany } from '../js/test/helpers.ts'
import VirtualMacine from '@scratch/scratch-vm'

const ScratchStorage = await import('scratch-storage').then(mod => mod.default) as {
  ScratchStorage: typeof import('scratch-storage')
} & typeof import('scratch-storage')

describe('load 10000 blocks', () => {
  const project = new Project()
  project.stage.run(() => {
    for (let i = 0; i < 10000; i++) {
      moveSteps(10)
    }
  })
  bench('moonscratch', () => {
    createHeadlessVM({
      projectJson: project.toScratch(),
      initialNowMs: 0,
    })
  })
})


