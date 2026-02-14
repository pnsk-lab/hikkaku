import { createHeadlessVM } from "../js";

const FRAME_FORCE_TIMEOUT_MS = 1000 / 1000;

type WorkerRequest = {
  projectJson: string;
};

globalThis.onmessage = async (event) => {
  const payload = event.data as WorkerRequest;
  const vm = createHeadlessVM({
    projectJson: payload.projectJson,
    options: {
      stepTimeoutTicks: 10,
    },
  });
  vm.start();
  vm.greenFlag();

  let running = true;
  while (true) {
    const frameStart = performance.now();
    let shouldRender = false;
    while (true) {
      const frameInfo = vm.stepFrame();
      if (frameInfo.stopReason === 'finished') {
        shouldRender = true;
        running = false;
        break;
      }
      if (
        frameInfo.stopReason === 'rerender' ||
        frameInfo.stopReason === 'warp-exit'
      ) {
        shouldRender = true;
        break;
      }
      if (performance.now() - frameStart > FRAME_FORCE_TIMEOUT_MS) {
        shouldRender = true;
        break;
      }
    }

    if (!shouldRender) {
      continue;
    }

    const frame = vm.renderFrame();
    postMessage({
      type: 'frame',
      frame,
    });

    if (!running) {
      postMessage({ type: 'finished' });
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};
