import { forever } from '../src/blocks/controll.ts'
import { changeXBy } from '../src/blocks/motion.ts'
import { Project } from '../src/project.ts'

const project = new Project({
  stage: {
    costumes: []
  }
})

const cat = project.addSprite({
  name: 'cat',
  costumes: [
    {
      id: 'cat',
      data: 'https://cdn.assets.scratch.mit.edu/internalapi/asset/b7853f557e4426412e64bb3da6531a99.svg/get/'
    }
  ]
})

cat.addOnFlag(() => {
  forever(() => {
    changeXBy(1)
  })
})

export default project
