import {
  callProcedure,
  defineProcedure,
  procedureLabel,
  repeat,
  say,
  whenFlagClicked,
} from '../../hikkaku/src/blocks'
import { Project } from '../../hikkaku/src/index'
import { createHeadlessVM } from '.'

const project = new Project()
project.stage.run(() => {
  const a = defineProcedure(
    [procedureLabel('a')],
    () => {
      repeat(100000, () => {
        say('Hello, World!')
      })
    },
    true,
  )
  whenFlagClicked(() => {
    repeat(10, () => {
      callProcedure(a, [])
    })
  })
})

const vm = createHeadlessVM({
  projectJson: /*await Bun.file(
    new URL("../../../examples/tesseract/dist/project.json", import.meta.url),
  ).json(),*/ project.toScratch(),
  options: {
    stepTimeoutTicks: 10,
  },
})

vm.greenFlag()

while (true) {
  const report = vm.stepFrame()
  console.log('Stopped:', report.stopReason)
  if (report.stopReason === 'finished') {
    break
  }
}
