import { ASSET_CAT1, ASSET_CAT2, Project } from 'hikkaku'
import {
  forever,
  glide,
  pointInDirection,
  random,
  setRotationStyle,
  switchCostumeTo,
  whenFlagClicked,
} from 'hikkaku/blocks'

const project = new Project()

const sprite1 = project.createSprite('スプライト1')

const _cat3 = sprite1.addCostume({
  name: 'cat3',
  assetId: ASSET_CAT1,
  dataFormat: 'svg',
})

const _cat1 = sprite1.addCostume({
  name: 'cat1',
  assetId: ASSET_CAT2,
  dataFormat: 'svg',
})

sprite1.run(() => {
  whenFlagClicked(() => {
    switchCostumeTo(_cat3)
    setRotationStyle('all around')
    forever(() => {
      switchCostumeTo(_cat1)
      pointInDirection(random(-180, 180))
      glide(random(0.2, 1.2), random(-220, 220), random(-160, 160))
      switchCostumeTo(_cat3)
      pointInDirection(random(-180, 180))
      glide(random(0.2, 1.2), random(-220, 220), random(-160, 160))
    })
  })
})

export default project

import.meta.hot?.send('hikkaku:project', project.toScratch())
