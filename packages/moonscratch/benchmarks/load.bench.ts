import { Project } from "hikkaku";
import { moveSteps } from "hikkaku/blocks";
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

describe("load", () => {
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
