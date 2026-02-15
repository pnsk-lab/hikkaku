import { Project } from "hikkaku";
import {
  changeXBy,
  changeYBy,
  setY,
  gotoXY,
  penDown,
  penUp,
  repeat,
  whenFlagClicked,
} from "hikkaku/blocks";
import { bench, describe } from "vite-plus/test";
import {
  createHeadlessVM,
  createPrecompiledProject,
} from "../js/vm/factory.ts";

await import("scratch-storage");

const benchOptions = {
  time: 3000,
  warmupTime: 1000,
};

const runUntilFinished = (vm: {
  greenFlag(): void;
  stepFrame(): { stopReason: string };
}) => {
  vm.greenFlag();
  while (true) {
    const result = vm.stepFrame();
    if (result.stopReason === "finished") {
      break;
    }
  }
};

describe("draw", () => {
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

  const projectJson = project.toScratch();
  const vm = createHeadlessVM({
    projectJson,
    initialNowMs: 0,
    options: {
      stepTimeoutTicks: 1000000,
      turbo: true,
    },
  });
  const precompiledVm = (() => {
    const precompiled = createPrecompiledProject({ projectJson });
    return createHeadlessVM({
      precompiled,
      initialNowMs: 0,
      options: {
        stepTimeoutTicks: 1000000,
        turbo: true,
      },
    });
  })();

  bench("moonscratch run-only", () => {
    runUntilFinished(vm);
  }, benchOptions);
  bench("moonscratch precompiled run-only", () => {
    runUntilFinished(precompiledVm);
  }, benchOptions);
});
