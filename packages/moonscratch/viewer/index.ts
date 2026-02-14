/// <reference types="vite-plus/client" />

import { type RenderFrame } from "../js/index.ts";
import VMWorker from "./worker.ts?worker";

type ExampleProject = {
  id: string;
  label: string;
  projectJson: string;
};

type ProjectModule = {
  default?: unknown;
};

const formatProjectId = (path: string): string => {
  const match = path.match(/([^/]+)\/dist\/project\.json$/);
  return match?.[1] ?? path;
};

const toProjectJson = (path: string, raw: unknown): string | null => {
  const rawModule = raw as ProjectModule | string;
  const extracted = typeof rawModule === "object" && rawModule !== null &&
      "default" in rawModule
    ? rawModule.default
    : rawModule;
  if (typeof extracted === "string") {
    return extracted;
  }
  if (extracted === undefined || extracted === null) {
    return null;
  }
  try {
    return JSON.stringify(extracted);
  } catch {
    return null;
  }
};

const loadedModules = import.meta.glob(
  "../../../examples/*/dist/project.json",
  {
    eager: true,
    import: "default",
  },
);

const projects = Object.entries(loadedModules)
  .map(([path, raw]) => {
    const projectJson = toProjectJson(path, raw);
    if (!projectJson) {
      return null;
    }

    const id = formatProjectId(path);
    return {
      id,
      label: id,
      projectJson,
    };
  })
  .filter(
    (entry): entry is ExampleProject =>
      entry !== null && entry.id.trim().length > 0,
  )
  .sort((left, right) => left.label.localeCompare(right.label));

const appElement = document.querySelector<HTMLElement>("#app") ?? document.body;

const controlPanel = document.createElement("div");
controlPanel.className = "controls";

const selectLabel = document.createElement("label");
selectLabel.textContent = "Project";
selectLabel.htmlFor = "example-project-select";

const projectSelect = document.createElement("select");
projectSelect.id = "example-project-select";
projectSelect.setAttribute("aria-label", "Select a project");

const status = document.createElement("p");
status.className = "status";

const fpsLabel = document.createElement("small");
fpsLabel.style.color = "#facc15";

const canvas = document.createElement("canvas");
canvas.width = 480;
canvas.height = 360;

const statusContainer = document.createElement("div");
statusContainer.append(status, fpsLabel);

if (projects.length === 0) {
  const heading = document.createElement("h1");
  heading.textContent = "MoonScratch Viewer";
  const errorMessage = document.createElement("p");
  errorMessage.textContent =
    "examples/*/dist/project.json を検出できませんでした。";
  appElement.append(heading, errorMessage);
} else {
  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.label;
    projectSelect.append(option);
  });

  const heading = document.createElement("h1");
  heading.textContent = "MoonScratch Viewer";
  controlPanel.append(selectLabel, projectSelect);
  appElement.append(heading, controlPanel, statusContainer, canvas);
}

document.body.append(appElement);

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("canvas 2D context is unavailable");
}

let worker: Worker | null = null;
let fpsFrames = 0;
let fpsStartedAt = 0;
let playbackToken = 0;

const updateFps = (now = performance.now()): void => {
  if (fpsStartedAt === 0) {
    fpsStartedAt = now;
  }
  fpsFrames += 1;
  const elapsedMs = now - fpsStartedAt;
  if (elapsedMs >= 500) {
    const fps = (fpsFrames * 1000) / elapsedMs;
    fpsLabel.textContent = `${fps.toFixed(1)} FPS`;
    fpsFrames = 0;
    fpsStartedAt = now;
  }
};

const renderFrameToCanvas = (frame: RenderFrame): void => {
  const { width, height, pixels } = frame;
  if (width <= 0 || height <= 0) {
    status.textContent = "空のフレームです";
    return;
  }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const clamped = Uint8ClampedArray.from(pixels);
  const imageData = new ImageData(clamped, width, height);
  context.putImageData(imageData, 0, 0);
  updateFps();
};

const stopPlayback = (): void => {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  fpsFrames = 0;
  fpsStartedAt = 0;
};

const startPlayback = async (projectId: string) => {
  const selected = projects.find((project) => project.id === projectId);
  if (!selected) {
    return;
  }

  stopPlayback();

  status.textContent = `${selected.label} を起動中...`;
  fpsLabel.textContent = "";
  try {
    const token = playbackToken + 1;
    playbackToken = token;
    status.textContent = `${selected.label} を再生中`;
    worker = new VMWorker();
    worker.postMessage({
      projectJson: selected.projectJson,
    });
    worker.onmessage = (event) => {
      if (token !== playbackToken) {
        return;
      }
      if (event.data.type === "frame") {
        renderFrameToCanvas(event.data.frame);
        return;
      }
      if (event.data.type === "finished") {
        status.textContent = `${selected.label} の再生が完了`;
      }
    };
    worker.onerror = (event) => {
      if (token !== playbackToken) {
        return;
      }
      status.textContent = `読み込みに失敗しました: ${event.message}`;
      stopPlayback();
    };
  } catch (error) {
    status.textContent = `読み込みに失敗しました: ${
      error instanceof Error ? error.message : String(error)
    }`;
    stopPlayback();
  }
};

projectSelect.addEventListener("change", () => {
  startPlayback(projectSelect.value);
});

if (projects.length > 0) {
  //startPlayback('rectangle')
}
