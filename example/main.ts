import { moveSteps } from "../src/blocks/motion";
import { add } from "../src/blocks/operator";
import type * as sb3 from "@pnsk-lab/sb3-types";
import { Project } from "../src/compiler/project";
import { whenFlagClicked } from "../src/blocks/events";

const project = new Project()

const sprite1 = project.createSprite('スプライト1')

sprite1.run(() => {
  whenFlagClicked(() => {
    moveSteps(add(10, 20))
  })
})

export default project

import.meta.hot?.send('hikkaku:project', project.toScratch())
