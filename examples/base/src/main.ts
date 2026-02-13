import { Project } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import './index.css'
import {
  forever,
  ifOnEdgeBounce,
  moveSteps,
  whenFlagClicked,
} from 'hikkaku/blocks'
import viteImg from './assets/vite.svg?scratch'

const project = new Project()

project.stage.createVariable('description', 'Vite + TS + Hikkaku', {
  monitor: {
    mode: 'large',
    visible: true,
    x: 170,
    y: 250,
  },
})

const vite = project.createSprite('vite', {
  size: 800,
  x: -100,
  y: 50,
})
vite.addCostume({
  ...viteImg,
  name: 'cat-a',
})
vite.run(() => {
  whenFlagClicked(() => {
    forever(() => {
      moveSteps(1)
      ifOnEdgeBounce()
    })
  })
})

const cat = project.createSprite('cat', {
  x: 100,
  y: 50,
})
cat.addCostume({
  ...IMAGES.CAT_A,
  name: 'cat-1',
})
cat.run(() => {
  whenFlagClicked(() => {
    forever(() => {
      moveSteps(1)
      ifOnEdgeBounce()
    })
  })
})

export default project
