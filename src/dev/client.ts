/**
 * Client-side script for dev-server
 */

import { Runtime } from '../runtime/runtime.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const flagButton = document.getElementById('flag') as HTMLButtonElement
const stopButton = document.getElementById('stop') as HTMLButtonElement

let runtime: Runtime
const start = async () => {
  if (runtime?.isRunning) {
    runtime.stop()
  }
  runtime = new Runtime({
    canvas,
    ast: await fetch('/ast.json').then((res) => res.json()),
  })
  await runtime.start()
}

flagButton.onclick = () => {
  start()
}
stopButton.onclick = () => {
  runtime.stop()
}

// Hot Reload Handle
const ws = new WebSocket('/listen')
ws.onmessage = () => {
  location.reload()
}
