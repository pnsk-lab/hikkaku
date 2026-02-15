import {
  createHeadlessVM,
  createProgramModuleFromProject,
  type VMInputEvent,
} from '../js'

const FRAME_FORCE_TIMEOUT_OUT_OF_WARP = 1000 / 30 // 30 FPS
const FRAME_FORCE_TIMEOUT_IN_WARP = 1000 / 5 // 5 FPS
const TICKS_TIMEOUT = 1
const WORKER_METRICS_WINDOW_MS = 1000

type ViewerWorkerRequest =
  | {
      type: 'load'
      projectJson: string
    }
  | {
      type: 'input'
      input: VMInputEvent
    }

let vm: ReturnType<typeof createHeadlessVM> | null = null
let runToken = 0
const pendingInputs: VMInputEvent[] = []

const flushPendingInputs = (): void => {
  if (!vm || pendingInputs.length === 0) {
    return
  }
  for (const input of pendingInputs) {
    vm.dispatchInputEvent(input)
  }
  pendingInputs.length = 0
}

const playbackLoop = async (token: number): Promise<void> => {
  let workerFpsFrames = 0
  let workerOps = 0
  let metricsStartedAt = 0
  let currentWorkerFps = 0
  let currentWorkerOpsPerSecond = 0
  while (true) {
    if (!vm || token !== runToken) {
      return
    }
    flushPendingInputs()

    const frameStart = performance.now()
    let frameOps = 0
    while (true) {
      const frameInfo = vm.stepFrame()
      frameOps += frameInfo.ops
      if (frameInfo.stopReason === 'finished') {
        break
      } else if (frameInfo.stopReason === 'rerender') {
        break
      } else if (frameInfo.stopReason === 'timeout') {
        // no-op
        //console.log('Frame timeout')
      } else if (frameInfo.stopReason === 'warp-exit') {
        //postMessage({ type: 'warp-exit', isInWarp: frameInfo.isInWarp })
        //console.log('warp-exit')
      }
      //console.log(frameInfo.isInWarp)
      if (frameInfo.isInWarp) {
        if (performance.now() - frameStart > FRAME_FORCE_TIMEOUT_IN_WARP) {
          console.log('FRAME: warp timeout')
          break
        }
      } else {
        if (performance.now() - frameStart > FRAME_FORCE_TIMEOUT_OUT_OF_WARP) {
          console.log('FRAME: normal timeout')
          break
        }
      }
    }

    workerFpsFrames += 1
    workerOps += frameOps
    const now = performance.now()
    if (metricsStartedAt === 0) {
      metricsStartedAt = now
    } else {
      const elapsedMs = now - metricsStartedAt
      if (elapsedMs >= WORKER_METRICS_WINDOW_MS) {
        currentWorkerFps = (workerFpsFrames * 1000) / elapsedMs
        currentWorkerOpsPerSecond = (workerOps * 1000) / elapsedMs
        workerFpsFrames = 0
        workerOps = 0
        metricsStartedAt = now
      }
    }

    // 描画する
    const frame = vm.renderFrame()
    postMessage({
      type: 'frame',
      frame,
      workerFps: currentWorkerFps,
      workerOpsPerSecond: currentWorkerOpsPerSecond,
    })

    await new Promise(requestAnimationFrame)
  }
}

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

globalThis.onmessage = (event) => {
  const data = event.data as ViewerWorkerRequest
  if (!data || typeof data !== 'object') {
    return
  }
  if (data.type === 'input') {
    if (!vm) {
      return
    }
    pendingInputs.push(data.input)
    return
  }
  if (data.type !== 'load') {
    return
  }

  pendingInputs.length = 0
  runToken += 1
  const token = runToken
  try {
    const program = createProgramModuleFromProject({
      projectJson: data.projectJson,
    })
    vm = createHeadlessVM({
      program,
      options: {
        stepTimeoutTicks: TICKS_TIMEOUT,
      },
    })
    vm.start()
    vm.greenFlag()
    void playbackLoop(token)
  } catch (error) {
    vm = null
    postMessage({
      type: 'error',
      message: toErrorMessage(error),
    })
  }
}
