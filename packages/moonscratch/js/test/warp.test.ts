import { Project } from 'hikkaku'
import {
  callProcedure,
  defineProcedure,
  procedureLabel,
  repeat,
  say,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { describe, expect, it } from 'vite-plus/test'
import { createHeadlessVM, createProgramModuleFromProject } from '../vm'

describe('warp-exit', () => {
  it('should emit warp-exit before finished', () => {
    const project = new Project()
    project.stage.run(() => {
      const fn = defineProcedure(
        [procedureLabel('myfn')],
        () => {
          // produce more blocks
          for (let i = 0; i < 1000; i++) {
            repeat(100, () => {
              say('Hello')
            })
          }
        },
        true,
      )
      whenFlagClicked(() => {
        repeat(3, () => {
          callProcedure(fn, [])
        })
      })
    })
    const program = createProgramModuleFromProject({
      projectJson: project.toScratch(),
      assets: {},
    })
    const vm = createHeadlessVM({
      program,
      options: {
        stepTimeoutTicks: 10000,
        turbo: true,
      },
    })
    vm.greenFlag()

    const reasons: string[] = []
    for (let i = 0; i < 16; i++) {
      const frame = vm.stepFrame()
      reasons.push(frame.stopReason)
      if (frame.stopReason === 'finished') {
        break
      }
    }
    expect(reasons).toContain('warp-exit')
    expect(reasons[reasons.length - 1]).toBe('finished')
  })
})
