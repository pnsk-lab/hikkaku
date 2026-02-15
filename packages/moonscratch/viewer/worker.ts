import { createHeadlessVM, type VMInputEvent } from '../js'

const FRAME_FORCE_TIMEOUT = 1000 / 30 // 30 FPS

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
      } else if (frameInfo.stopReason === 'warp-exit') {
        // no-op
        console.log('Warp exit')
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
    vm = createHeadlessVM({
      projectJson: data.projectJson,
      options: {
        stepTimeoutTicks: 100,
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
