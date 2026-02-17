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

const waitForNextFrame = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
      return
    }
    setTimeout(() => resolve(), FRAME_FORCE_TIMEOUT_OUT_OF_WARP)
  })
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
    vm.setTime(frameStart)
    let frameOps = 0
    let shouldRender = false
    let isFinished = false
    while (true) {
      const frameInfo = vm.stepFrame()
      frameOps += frameInfo.ops
      if (frameInfo.stopReason === 'finished') {
        shouldRender = frameInfo.shouldRender
        isFinished = true
        break
      }
      if (frameInfo.shouldRender) {
        shouldRender = true
        break
      }

      const frameBudget = frameInfo.isInWarp
        ? FRAME_FORCE_TIMEOUT_IN_WARP
        : FRAME_FORCE_TIMEOUT_OUT_OF_WARP
      if (performance.now() - frameStart > frameBudget) {
        break
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

    if (shouldRender) {
      const frame = vm.renderFrame()
      postMessage({
        type: 'frame',
        frame,
        workerFps: currentWorkerFps,
        workerOpsPerSecond: currentWorkerOpsPerSecond,
      })
    }

    if (isFinished) {
      postMessage({ type: 'finished' })
      return
    }

    await waitForNextFrame()
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
