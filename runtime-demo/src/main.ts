import { gotoxy } from '../../src/blocks/motion.ts'
import { Project } from '../../src/project.ts'
import { Runtime } from '../../src/runtime/runtime.ts'

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
  gotoxy(0, 100)
})

const canvas = document.createElement('canvas')
document.body.append(canvas)
const runtime = new Runtime({
  canvas,
  ast: project.exportAsAST()
})
await runtime.start()

console.log(runtime)
