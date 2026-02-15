import { Project } from "hikkaku";
import {
  changeXBy,
  changeYBy,
  clear,
  gotoXY,
  moveSteps,
  penDown,
  penUp,
  repeat,
  setY,
  whenFlagClicked,
} from "hikkaku/blocks";
import { beforeEach, bench, describe } from "vite-plus/test";
import { createHeadlessVM } from "../js/vm/factory.ts";
import type { HeadlessVM } from "../js/index.ts";

const _ScratchStorage = (await import("scratch-storage").then(
  (mod) => mod.default,
)) as {
  ScratchStorage: typeof import("scratch-storage");
} & typeof import("scratch-storage");

describe("load 10000 blocks", () => {
  const project = new Project();
  project.stage.run(() => {
    for (let i = 0; i < 10000; i++) {
      moveSteps(10);
    }
  });
  bench("moonscratch", () => {
    createHeadlessVM({
      projectJson: project.toScratch(),
      initialNowMs: 0,
    });
  });
});

describe("fill stage with pen", () => {
  const project = new Project();
  const sprite = project.createSprite("Sprite1");

  sprite.run(() => {
    whenFlagClicked(() => {
      gotoXY(-240, -180);
      repeat(420, () => {
        changeXBy(1);
        setY(-180);

        penDown();
        repeat(360, () => {
          changeYBy(1);
        });
        penUp();
      });
    });
  });

  const vm = createHeadlessVM({
    projectJson: project.toScratch(),
    initialNowMs: 0,
    options: {
      stepTimeoutTicks: 1000000,
      turbo: true,
    },
  });
  bench("moonscratch", () => {
    vm.greenFlag();
    while (true) {
      const r = vm.stepFrame();
      if (r.stopReason === "finished") {
        break;
      }
    }
  });
});
