import { Project } from 'hikkaku'
import { say, whenFlagClicked } from 'hikkaku/blocks'

const project = new Project()

project.stage.run(() => {
  whenFlagClicked(() => {
    say('Hello, Turbowarp Packager!')
  })
})

export default project
