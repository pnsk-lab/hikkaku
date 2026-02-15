import { Project } from "hikkaku";
import {
  add,
  changeVariableBy,
  changeXBy,
  changeYBy,
  clear,
  divide,
  gotoXY,
  mathop,
  moveSteps,
  multiply,
  penDown,
  penUp,
  repeat,
  setVariableTo,
  setY,
  subtract,
  whenFlagClicked,
} from "hikkaku/blocks";
import { bench, describe } from "vite-plus/test";
import {
  createHeadlessVM,
  createPrecompiledProject,
} from "../js/vm/factory.ts";

const _ScratchStorage = (await import("scratch-storage").then(
  (mod) => mod.default,
)) as {
  ScratchStorage: typeof import("scratch-storage");
} & typeof import("scratch-storage");

const runUntilFinished = (vm: {
  greenFlag(): void;
  stepFrame(): { stopReason: string };
}) => {
  vm.greenFlag();
  while (true) {
    const r = vm.stepFrame();
    if (r.stopReason === "finished") {
      break;
    }
  }
};

const benchOptions = {
  time: 3000,
  warmupTime: 1000,
};

describe("load 10000 blocks", () => {
  const project = new Project();
  project.stage.run(() => {
    for (let i = 0; i < 10000; i++) {
      moveSteps(10);
    }
  });
  const projectJson = project.toScratch();
  bench("moonscratch", () => {
    createHeadlessVM({
      projectJson,
      initialNowMs: 0,
    });
  }, benchOptions);
  bench("moonscratch precompiled", () => {
    const precompiled = createPrecompiledProject({ projectJson });
    createHeadlessVM({
      precompiled,
      initialNowMs: 0,
    });
  }, benchOptions);
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

  const projectJson = project.toScratch();
  const precompiled = createPrecompiledProject({ projectJson });
  const vm = createHeadlessVM({
    projectJson,
    initialNowMs: 0,
    options: {
      stepTimeoutTicks: 1000000,
      turbo: true,
    },
  });
  const precompiledVm = createHeadlessVM({
    precompiled,
    initialNowMs: 0,
    options: {
      stepTimeoutTicks: 1000000,
      turbo: true,
    },
  });
  bench("moonscratch run-only", () => {
    runUntilFinished(vm);
  }, benchOptions);
  bench("moonscratch precompiled run-only", () => {
    runUntilFinished(precompiledVm);
  }, benchOptions);
});

describe("heavy arithmetic without pen", () => {
  const project = new Project();
  const acc = project.stage.createVariable("acc", 0);
  const angle = project.stage.createVariable("angle", 0);

  project.stage.run(() => {
    whenFlagClicked(() => {
      setVariableTo(acc, 0);
      setVariableTo(angle, 0);
      repeat(50000, () => {
        setVariableTo(
          acc,
          add(
            acc.get(),
            multiply(
              mathop("sin", angle.get()),
              mathop("cos", angle.get()),
            ),
          ),
        );
        changeVariableBy(angle, subtract(divide(angle.get(), 2), -1));
      });
    });
  });

  const projectJson = project.toScratch();
  const precompiled = createPrecompiledProject({ projectJson });
  const vm = createHeadlessVM({
    projectJson,
    initialNowMs: 0,
    options: {
      stepTimeoutTicks: 1000000,
      turbo: true,
    },
  });
  const precompiledVm = createHeadlessVM({
    precompiled,
    initialNowMs: 0,
    options: {
      stepTimeoutTicks: 1000000,
      turbo: true,
    },
  });
  bench("moonscratch run-only", () => {
    runUntilFinished(vm);
  }, benchOptions);
  bench("moonscratch precompiled run-only", () => {
    runUntilFinished(precompiledVm);
  }, benchOptions);
});
