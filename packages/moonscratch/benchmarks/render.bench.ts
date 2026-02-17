import { Project } from 'hikkaku'
import {
  changeXBy,
  changeYBy,
  clear,
  gotoXY,
  penDown,
  penUp,
  repeat,
  setY,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { bench, run } from 'mitata'
import { createHeadlessVM, createProgramModuleFromProject } from '../js'

const emptyProject = new Project()
const emptyCompiled = createProgramModuleFromProject({
  projectJson: emptyProject.toScratch(),
})
bench('render empty/moonscratch', () => {
  const emptyVM = createHeadlessVM({ program: emptyCompiled })
  emptyVM.renderFrame()
})

const filledProject = new Project()
filledProject.createSprite('mysprite').run(() => {
  whenFlagClicked(() => {
    clear()
    gotoXY(-240, -180)
    repeat(420, () => {
      changeXBy(1)
      setY(-180)

      penDown()
      repeat(360, () => {
        changeYBy(1)
      })
      penUp()
    })
  })
})

const filledCompiled = createProgramModuleFromProject({
  projectJson: filledProject.toScratch(),
})
bench('render filled/moonscratch', () => {
  const filledVM = createHeadlessVM({ program: filledCompiled })
  filledVM.renderFrame()
})

if (import.meta.main) {
  await run()
}
