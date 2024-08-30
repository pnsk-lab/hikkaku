import { forever } from '../src/blocks/control.ts'
import { changeXBy } from '../src/blocks/motion.ts'
import { Project } from '../src/project.ts'

const project = new Project({
  stage: {
    costumes: [
      {
        id: 'blank',
        data:
          'https://cdn.assets.scratch.mit.edu/internalapi/asset/cd21514d0531fdffb22204e0ec5ed84a.svg/get/',
      },
    ],
  },
})

const cat = project.addSprite({
  name: 'cat',
  costumes: [
    {
      id: 'cat',
      data:
        'https://cdn.assets.scratch.mit.edu/internalapi/asset/b7853f557e4426412e64bb3da6531a99.svg/get/',
    },
  ],
})

cat.addOnFlag(() => {
  forever(() => {
    changeXBy(1)
  })
})

export default project
