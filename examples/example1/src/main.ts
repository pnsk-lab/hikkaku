import { ASSET_CAT1, ASSET_CAT2, Project } from 'hikkaku'
import {
  argumentReporterBoolean,
  defineProcedure,
  getMouseX,
  gotoXY,
  procedureBoolean,
  procedureLabel,
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
  defineProcedure(
    [procedureLabel('Move to mouse pointer'), procedureBoolean('isFast')],
    ({ isFast }) => {
      argumentReporterBoolean(isFast)

      gotoXY(getMouseX(), 10)
    },
  )
})

export default project

console.log(JSON.stringify(project.toScratch(), null, 2))
import.meta.hot?.send('hikkaku:project', project.toScratch())
