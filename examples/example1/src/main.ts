import { changeXBy, gotoXY, moveSteps, setX } from "hikkaku/blocks/motion";
import { add } from "hikkaku/blocks/operator";
import { Project } from "hikkaku/compiler/project";
import { whenFlagClicked } from "hikkaku/blocks/events";
import { ASSET_CAT1, ASSET_CAT2 } from "hikkaku/utils/assets";
import { forever } from "hikkaku/blocks/control";
import { getMouseX } from "hikkaku/blocks/sensing";
import { switchCostumeTo } from "hikkaku/blocks/looks";

const project = new Project()

const sprite1 = project.createSprite('スプライト1')

const cat3 = sprite1.addCostume({
  name: 'cat3',
  assetId: ASSET_CAT1,
  dataFormat: 'svg'
})

const cat1 = sprite1.addCostume({
  name: 'cat1',
  assetId: ASSET_CAT2,
  dataFormat: 'svg'
})

sprite1.run(() => {
  whenFlagClicked(() => {
    switchCostumeTo(cat3)
    forever(() => {
      switchCostumeTo(cat1)
      moveSteps(getMouseX())
    })
  })
})

export default project

console.log(JSON.stringify(project.toScratch(), null, 2))
import.meta.hot?.send('hikkaku:project', project.toScratch())
