import { changeXBy, gotoXY, moveSteps, setX } from "../src/blocks/motion";
import { add } from "../src/blocks/operator";
import type * as sb3 from "@pnsk-lab/sb3-types";
import { Project } from "../src/compiler/project";
import { whenFlagClicked } from "../src/blocks/events";
import { ASSET_CAT1, ASSET_CAT2 } from "../src/utils/assets";
import { forever } from "../src/blocks/control";

const project = new Project()

const sprite1 = project.createSprite('スプライト1')

sprite1.costumes = [
  {
    name: 'cat3',
    assetId: ASSET_CAT1,
    dataFormat: 'svg'
  },
  {
    name: 'cat1',
    assetId: ASSET_CAT2,
    dataFormat: 'svg'
  }
]

sprite1.run(() => {
  whenFlagClicked(() => {
    forever(() => {
      moveSteps(add(10, 30))
    })
  })
})

export default project

console.log(JSON.stringify(project.toScratch(), null, 2))
import.meta.hot?.send('hikkaku:project', project.toScratch())
