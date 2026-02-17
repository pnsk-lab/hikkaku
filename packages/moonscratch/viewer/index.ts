/// <reference types="vite-plus/client" />

import type { RenderFrame, VMInputEvent } from '../js/index.ts'
import VMWorker from './worker.ts?worker'

type ExampleProject = {
  id: string
  label: string
  projectJson: string
}

type ProjectModule = {
  default?: unknown
}

type ViewerWorkerRequest =
  | {
      type: 'load'
      projectJson: string
    }
  | {
      type: 'input'
      input: VMInputEvent
    }

type ViewerWorkerResponse =
  | {
      type: 'frame'
      frame: RenderFrame
      workerFps: number
      workerOpsPerSecond: number
    }
  | {
      type: 'finished'
    }
  | {
      type: 'warp-exit'
      isInWarp: boolean
    }
  | {
      type: 'error'
      message: string
    }

const formatProjectId = (path: string): string => {
  const match = path.match(/([^/]+)\/dist\/project\.json$/)
  return match?.[1] ?? path
}

const toProjectJson = (_path: string, raw: unknown): string | null => {
  const rawModule = raw as ProjectModule | string
  const extracted =
    typeof rawModule === 'object' &&
    rawModule !== null &&
    'default' in rawModule
      ? rawModule.default
      : rawModule
  if (typeof extracted === 'string') {
    return extracted
  }
  if (extracted === undefined || extracted === null) {
    return null
  }
  try {
    return JSON.stringify(extracted)
  } catch {
    return null
  }
}

const loadedModules = import.meta.glob(
  '../../../examples/*/dist/project.json',
  {
    eager: true,
    import: 'default',
  },
)

const projects = Object.entries(loadedModules)
  .map(([path, raw]) => {
    const projectJson = toProjectJson(path, raw)
    if (!projectJson) {
      return null
    }

    const id = formatProjectId(path)
    return {
      id,
      label: id,
      projectJson,
    }
  })
  .filter(
    (entry): entry is ExampleProject =>
      entry !== null && entry.id.trim().length > 0,
  )
  .sort((left, right) => left.label.localeCompare(right.label))

const appElement = document.querySelector<HTMLElement>('#app') ?? document.body

const controlPanel = document.createElement('div')
controlPanel.className = 'controls'

const selectLabel = document.createElement('label')
selectLabel.textContent = 'Project'
selectLabel.htmlFor = 'example-project-select'

const projectSelect = document.createElement('select')
projectSelect.id = 'example-project-select'
projectSelect.setAttribute('aria-label', 'Select a project')

const status = document.createElement('p')
status.className = 'status'

const fpsLabel = document.createElement('small')
fpsLabel.style.color = '#facc15'

const canvas = document.createElement('canvas')
canvas.width = 480
canvas.height = 360
canvas.tabIndex = 0

const statusContainer = document.createElement('div')
statusContainer.append(status, fpsLabel)

if (projects.length === 0) {
  const heading = document.createElement('h1')
  heading.textContent = 'MoonScratch Viewer'
  const errorMessage = document.createElement('p')
  errorMessage.textContent =
    'examples/*/dist/project.json を検出できませんでした。'
  appElement.append(heading, errorMessage)
} else {
  projects.forEach((project) => {
    const option = document.createElement('option')
    option.value = project.id
    option.textContent = project.label
    projectSelect.append(option)
  })

  const heading = document.createElement('h1')
  heading.textContent = 'MoonScratch Viewer'
  controlPanel.append(selectLabel, projectSelect)
  appElement.append(heading, controlPanel, statusContainer, canvas)
}

document.body.append(appElement)

const context = canvas.getContext('2d')
if (!context) {
  throw new Error('canvas 2D context is unavailable')
}

let worker: Worker | null = null
let fpsFrames = 0
let fpsStartedAt = 0
let playbackToken = 0
let isPointerDown = false
const keysDown = new Set<string>()
let workerFps = 0
let workerOpsPerSecond = 0

const postInput = (input: VMInputEvent): void => {
  if (!worker) {
    return
  }
  const message: ViewerWorkerRequest = {
    type: 'input',
    input,
  }
  worker.postMessage(message)
}

const normalizeDomKey = (key: string): string => {
  if (key === ' ') {
    return 'space'
  }
  return key.toLowerCase()
}

const syncKeysDown = (): void => {
  postInput({
    type: 'keys_down',
    keys: Array.from(keysDown),
  })
}

const toStageMousePoint = (
  event: Pick<MouseEvent, 'clientX' | 'clientY'>,
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 }
  }
  const offsetX = (event.clientX - rect.left) / rect.width
  const offsetY = (event.clientY - rect.top) / rect.height
  const rawX = offsetX * canvas.width - canvas.width / 2
  const rawY = canvas.height / 2 - offsetY * canvas.height
  const x = Math.max(-canvas.width / 2, Math.min(canvas.width / 2, rawX))
  const y = Math.max(-canvas.height / 2, Math.min(canvas.height / 2, rawY))
  return {
    x,
    y,
  }
}

const postMouseState = (
  event: Pick<MouseEvent, 'clientX' | 'clientY'>,
  isDown: boolean,
): void => {
  const point = toStageMousePoint(event)
  postInput({
    type: 'mouse',
    x: point.x,
    y: point.y,
    isDown,
  })
}

const postMouseTargets = (): void => {
  postInput({
    type: 'mouse_targets',
    stage: true,
    targets: [],
  })
}

const updateFps = (now = performance.now()): void => {
  if (fpsStartedAt === 0) {
    fpsStartedAt = now
  }
  fpsFrames += 1
  const elapsedMs = now - fpsStartedAt
  if (elapsedMs >= 500) {
    const renderFps = (fpsFrames * 1000) / elapsedMs
    fpsLabel.textContent = `${renderFps.toFixed(1)} FPS, worker ${workerFps.toFixed(1)} FPS, ${workerOpsPerSecond.toFixed(0)} ops/s`
    fpsFrames = 0
    fpsStartedAt = now
  }
}

const renderFrameToCanvas = (frame: RenderFrame): void => {
  const { width, height, pixels } = frame
  if (width <= 0 || height <= 0) {
    status.textContent = '空のフレームです'
    return
  }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  const clamped = Uint8ClampedArray.from(pixels)
  const imageData = new ImageData(clamped, width, height)
  context.putImageData(imageData, 0, 0)
  updateFps()
}

const stopPlayback = (): void => {
  if (worker) {
    worker.terminate()
    worker = null
  }
  keysDown.clear()
  isPointerDown = false
  fpsFrames = 0
  fpsStartedAt = 0
  workerFps = 0
  workerOpsPerSecond = 0
}

const startPlayback = async (projectId: string) => {
  const selected = projects.find((project) => project.id === projectId)
  if (!selected) {
    return
  }

  stopPlayback()

  status.textContent = `${selected.label} を起動中...`
  fpsLabel.textContent = ''
  try {
    const token = playbackToken + 1
    playbackToken = token
    status.textContent = `${selected.label} を再生中`
    worker = new VMWorker()
    const startMessage: ViewerWorkerRequest = {
      type: 'load',
      projectJson: selected.projectJson,
    }
    worker.postMessage(startMessage)
    worker.onmessage = (event) => {
      if (token !== playbackToken) {
        return
      }
      const payload = event.data as ViewerWorkerResponse
      if (payload.type === 'frame') {
        workerFps = payload.workerFps
        workerOpsPerSecond = payload.workerOpsPerSecond
        renderFrameToCanvas(payload.frame)
        return
      }
      if (payload.type === 'finished') {
        status.textContent = `${selected.label} の再生が完了`
        return
      }
      if (payload.type === 'warp-exit') {
        status.textContent = `${selected.label}: warp-exit (isInWarp=${payload.isInWarp})`
        return
      }
      if (payload.type === 'error') {
        status.textContent = `読み込みに失敗しました: ${payload.message}`
        stopPlayback()
      }
    }
    worker.onerror = (event) => {
      if (token !== playbackToken) {
        return
      }
      status.textContent = `読み込みに失敗しました: ${event.message}`
      stopPlayback()
    }
  } catch (error) {
    status.textContent = `読み込みに失敗しました: ${
      error instanceof Error ? error.message : String(error)
    }`
    stopPlayback()
  }
}

projectSelect.addEventListener('change', () => {
  startPlayback(projectSelect.value)
})

canvas.addEventListener('pointerdown', (event) => {
  if (!worker) {
    return
  }
  isPointerDown = true
  postMouseState(event, true)
  postMouseTargets()
  canvas.focus()
})

canvas.addEventListener('pointermove', (event) => {
  if (!worker) {
    return
  }
  postMouseState(event, isPointerDown || event.buttons > 0)
  postMouseTargets()
})

canvas.addEventListener('pointerup', (event) => {
  if (!worker) {
    return
  }
  isPointerDown = false
  postMouseState(event, false)
  postMouseTargets()
})

canvas.addEventListener('pointercancel', () => {
  isPointerDown = false
})

canvas.addEventListener('keydown', (event) => {
  if (!worker) {
    return
  }
  const key = normalizeDomKey(event.key)
  if (event.repeat || keysDown.has(key)) {
    return
  }
  keysDown.add(key)
  syncKeysDown()
})

canvas.addEventListener('keyup', (event) => {
  if (!worker) {
    return
  }
  const key = normalizeDomKey(event.key)
  if (!keysDown.delete(key)) {
    return
  }
  syncKeysDown()
})

canvas.addEventListener('blur', () => {
  if (!worker || keysDown.size === 0) {
    return
  }
  keysDown.clear()
  syncKeysDown()
})

if (projects.length > 0) {
  startPlayback('rubiks-cube')
}
