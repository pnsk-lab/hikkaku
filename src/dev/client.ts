import { Runtime } from '../runtime/runtime.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const flagButton = document.getElementById('flag') as HTMLButtonElement
const stopButton = document.getElementById('stop') as HTMLButtonElement

let runtime: Runtime
const start = async () => {
  if (runtime?.isStarted) {
    runtime.stop()
  }
  runtime = new Runtime({
    canvas,
    ast: await fetch('/ast.json').then(res => res.json())
  })
  await runtime.start()
}

flagButton.onclick = () => {
  start()
}
stopButton.onclick = () => {
  runtime.stop()
}
