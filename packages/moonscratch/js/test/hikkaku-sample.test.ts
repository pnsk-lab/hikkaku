import { Project } from 'hikkaku'
import { setVariableTo, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import { createHeadlessVM, createProgramModuleFromProject } from '../index.ts'

describe('moonscratch/js/test/hikkaku-sample.test.ts', () => {
  test('runs a project generated with hikkaku', () => {
    const project = new Project()
    const score = project.stage.createVariable('score', 0)

    project.stage.run(() => {
      whenFlagClicked(() => {
        setVariableTo(score, 42)
      })
    })

    const program = createProgramModuleFromProject({
      projectJson: project.toScratch(),
    })
    const vm = createHeadlessVM({
      program,
      initialNowMs: 0,
    })

    vm.greenFlag()
    const report = vm.stepFrame()

    expect(report.stopReason).toBe('finished')

    const stage = vm.snapshot().targets.find((target) => target.isStage)
    if (!stage) {
      throw new Error('stage target was not found in snapshot')
    }

    expect(stage.variables[score.id]).toBe(42)
  })
})
