import { createHeadlessVM, renderWithWebGL } from "../js";

const FRAME_FORCE_TIMEOUT = 1000 / 30; // 30 FPS

globalThis.onmessage = async (event) => {
  const vm = createHeadlessVM({
    projectJson: event.data.projectJson,
    options: {
      stepTimeoutTicks: 100,
    },
  });
  vm.start();
  vm.greenFlag();

  while (true) {
    const frameStart = performance.now();
    while (true) {
      const frameInfo = vm.stepFrame()
      if (frameInfo.stopReason === 'finished') {
        break;
      } else if (frameInfo.stopReason === 'rerender') {
        break;
      } else if (frameInfo.stopReason === 'timeout') {
        // no-op
      } else if (frameInfo.stopReason === 'warp-exit') {
        // no-op
        break
      }
      if (performance.now() - frameStart > FRAME_FORCE_TIMEOUT) {
        break
      }
    }

    // 描画する
    const frame = vm.renderFrame()
    postMessage({
      type: 'frame',
      frame,
    })

    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};
