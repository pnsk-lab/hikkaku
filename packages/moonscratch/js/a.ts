import type { ScratchProject } from "sb3-types";
import { createHeadlessVM } from ".";
import { Project } from "../../hikkaku/src/index";
import {
  add,
  callProcedure,
  clear,
  defineProcedure,
  forever,
  procedureLabel,
  repeat,
  say,
  stamp,
  wait,
  whenFlagClicked,
} from "../../hikkaku/src/blocks";

const project = new Project();
project.stage.run(() => {
  whenFlagClicked(() => {
    repeat(100, () => {
      say("Hello, world!");
    });
  });
});


const vm = createHeadlessVM({
  projectJson: await Bun.file(
    new URL("../../../examples/rectangle/dist/project.json", import.meta.url),
  ).json(),//*/project.toScratch(),
  options: {
    stepTimeoutTicks: 100,
  },
});

vm.greenFlag();

while (true) {
  const report = vm.stepFrame();
  console.log(report)
}

