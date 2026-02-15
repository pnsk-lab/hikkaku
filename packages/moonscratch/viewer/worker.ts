import {
  createHeadlessVM,
  createPrecompiledProject,
  type VMInputEvent,
} from '../js'

const FRAME_FORCE_TIMEOUT_OUT_OF_WARP = 1000 / 30 // 30 FPS
const FRAME_FORCE_TIMEOUT_IN_WARP = 1000 / 5 // 5 FPS
const TICKS_TIMEOUT = 1

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
  while (true) {
    if (!vm || token !== runToken) {
      return
    }
    flushPendingInputs()

    const frameStart = performance.now()
    while (true) {
      const frameInfo = vm.stepFrame()
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
          //console.log('Forcing frame end due to warp timeout')
          break
        }
      } else {
        if (performance.now() - frameStart > FRAME_FORCE_TIMEOUT_OUT_OF_WARP) {
          //console.log('Forcing frame end due to timeout')
          break
        }
      }
    }

    // 描画する
    const frame = vm.renderFrame()
    postMessage({
      type: 'frame',
      frame,
    })

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
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
    const precompiled = createPrecompiledProject({
      projectJson: data.projectJson,
    })
    vm = createHeadlessVM({
      precompiled,
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
