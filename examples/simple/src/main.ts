import { Project } from 'hikkaku'
import {
  forever,
  ifElse,
  ifThen,
  say,
  wait,
  whenFlagClicked,
} from 'hikkaku/blocks'

const project = new Project()

project.stage.run(() => {
  whenFlagClicked(() => {
    forever(() => {
      say('Hello, Hikkaku!!aaa')
      wait(1)
      say('')
      wait(1)
      ifThen(true, () => {
        say('This is an if block')
      })
      ifElse(
        false,
        () => {},
        () => {
          say('This is an else block')
        },
      )
    })
  })
})

export default project
