import { Project } from 'hikkaku'
import { forever, say, wait, whenFlagClicked } from 'hikkaku/blocks'

const project = new Project()

project.stage.run(() => {
  whenFlagClicked(() => {
    forever(() => {
      say('Hello, Hikkaku!!aaa')
      wait(1)
      say('')
      wait(1)
    })
  })
})

export default project
