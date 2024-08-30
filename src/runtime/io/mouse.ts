export class Mouse {
  #canvas: HTMLCanvasElement
  #canvasRect: DOMRect
  #resizeHandler: () => void

  getScratchXY(clientX: number, clientY: number) {
    const delta = this.#canvasRect.width / 480
    return [
      (clientX - this.#canvasRect.x) / delta - 240,
      (clientY - this.#canvasRect.y) / delta - 180,
    ]
  }

  #isDowned: boolean = false
  #position: {
    x: number
    y: number
  } = {
    x: 0,
    y: 0,
  }

  get data() {
    return {
      isDowned: this.#isDowned,
      x: this.#position.x,
      y: this.#position.y,
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.#canvas = canvas
    this.#canvasRect = canvas.getBoundingClientRect()

    this.#resizeHandler = () => {
      this.#canvasRect = canvas.getBoundingClientRect()
    }
    document.addEventListener('resize', this.#resizeHandler)
    document.addEventListener('scroll', this.#resizeHandler)

    const touchChanged = (evt: TouchEvent) => {
      this.#isDowned = evt.touches.length !== 0
      const touch = evt.touches.item(0)
      if (touch) {
        const [x, y] = this.getScratchXY(touch.clientX, touch.clientY)
        this.#position.x = x
        this.#position.y = y
      }
    }

    canvas.addEventListener('touchstart', touchChanged)
    canvas.addEventListener('touchmove', touchChanged)
    canvas.addEventListener('touchend', touchChanged)
  }
  destory() {
    document.removeEventListener('resize', this.#resizeHandler)
    document.removeEventListener('scroll', this.#resizeHandler)
  }
}
