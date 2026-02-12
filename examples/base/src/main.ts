import { Project } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import { forever, moveSteps, whenFlagClicked } from 'hikkaku/blocks'

const project = new Project()

const cat = project.createSprite('cat')

cat.addCostume({
  ...IMAGES.CAT_A,
  name: 'cat-a',
})
cat.run(() => {
  whenFlagClicked(() => {
    forever(() => {
      moveSteps(1)
    })
  })
})

export default project
