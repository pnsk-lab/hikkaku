import { createSequentialNetworkSession } from '@hikkaku/onnx'
import { Project, type VariableReference } from 'hikkaku'
import {
  add,
  and,
  callProcedure,
  defineProcedure,
  divide,
  equals,
  eraseAll,
  forEach,
  forever,
  getItemOfList,
  getKeyPressed,
  getMouseDown,
  getMouseX,
  getMouseY,
  getVariable,
  gotoXY,
  gt,
  hide,
  ifThen,
  lt,
  mathop,
  multiply,
  not,
  penDown,
  penUp,
  procedureLabel,
  replaceItemOfList,
  setPenColorTo,
  setPenSizeTo,
  setVariableTo,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { mnistConvModel } from './model.generated'
import { mnistSamples } from './samples.generated'

const GRID = mnistConvModel.inputShape[2] ?? 28
const PIXEL_COUNT = GRID * GRID
const CELL_SIZE = GRID <= 14 ? 13 : 7
const CANVAS_LEFT = -230
const CANVAS_TOP = 160
const CANVAS_RIGHT = CANVAS_LEFT + GRID * CELL_SIZE
const CANVAS_BOTTOM = CANVAS_TOP - GRID * CELL_SIZE
const SAMPLE_COUNT = mnistSamples.length

const project = new Project()

const predictionMonitor = project.stage.createVariable('prediction', 0, {
  monitor: { mode: 'large', visible: true, x: 300, y: 20 },
})
const sourceMonitor = project.stage.createVariable('source', 'sample', {
  monitor: { mode: 'default', visible: true, x: 300, y: 70 },
})
const sampleLabelMonitor = project.stage.createVariable('sampleLabel', '-', {
  monitor: { mode: 'default', visible: true, x: 300, y: 110 },
})

const renderer = project.createSprite('mnist-conv')
const canvasPixels = renderer.createList(
  'canvasPixels',
  Array(PIXEL_COUNT).fill(0),
)
const logits = renderer.createList('logits', Array(10).fill(0))
const samplePixels = renderer.createList(
  'samplePixels',
  mnistSamples.flatMap((sample) => sample.pixels),
)
const sampleLabels = renderer.createList(
  'sampleLabels',
  mnistSamples.map((sample) => sample.label),
)

const read = (variable: VariableReference) => getVariable(variable)
const pixelIndex = (
  col: number | ReturnType<typeof read>,
  row: number | ReturnType<typeof read>,
) => add(multiply(add(row, -1), GRID), col)
const cellCenterX = (col: number | ReturnType<typeof read>) =>
  add(CANVAS_LEFT + CELL_SIZE / 2, multiply(add(col, -1), CELL_SIZE))
const cellCenterY = (row: number | ReturnType<typeof read>) =>
  add(CANVAS_TOP - CELL_SIZE / 2, multiply(add(row, -1), -CELL_SIZE))

renderer.run(() => {
  const cursorOnCanvas = renderer.createVariable('cursorOnCanvas', 0)
  const cursorCol = renderer.createVariable('cursorCol', 1)
  const cursorRow = renderer.createVariable('cursorRow', 1)
  const clickLatch = renderer.createVariable('clickLatch', 0)
  const clearLatch = renderer.createVariable('clearLatch', 0)
  const sampleLatch = renderer.createVariable('sampleLatch', 0)
  const dirty = renderer.createVariable('dirty', 1)
  const sampleIndex = renderer.createVariable('sampleIndex', 1)
  const bestLogit = renderer.createVariable('bestLogit', -999999)
  const loopIndex = renderer.createVariable('loopIndex', 1)
  const loopDigit = renderer.createVariable('loopDigit', 1)
  const sampleBase = renderer.createVariable('sampleBase', 0)
  const workX = renderer.createVariable('workX', 0)
  const workY = renderer.createVariable('workY', 0)

  const session = createSequentialNetworkSession(mnistConvModel)

  const setPixelIfInside = (
    col: number | ReturnType<typeof read>,
    row: number | ReturnType<typeof read>,
    value: number,
  ) => {
    ifThen(
      and(
        and(gt(col, 0), lt(col, GRID + 1)),
        and(gt(row, 0), lt(row, GRID + 1)),
      ),
      () => {
        replaceItemOfList(canvasPixels, pixelIndex(col, row), value)
      },
    )
  }

  const clearCanvas = defineProcedure(
    [procedureLabel('clear canvas')],
    () => {
      forEach(loopIndex, PIXEL_COUNT, () => {
        replaceItemOfList(canvasPixels, read(loopIndex), 0)
      })
      forEach(loopDigit, 10, () => {
        replaceItemOfList(logits, read(loopDigit), 0)
      })
      setVariableTo(sampleLabelMonitor, '-')
      setVariableTo(sourceMonitor, 'draw')
      setVariableTo(dirty, 1)
    },
    true,
  )

  const loadCurrentSample = defineProcedure(
    [procedureLabel('load sample')],
    () => {
      setVariableTo(
        sampleBase,
        multiply(add(read(sampleIndex), -1), PIXEL_COUNT),
      )
      forEach(loopIndex, PIXEL_COUNT, () => {
        replaceItemOfList(
          canvasPixels,
          read(loopIndex),
          getItemOfList(samplePixels, add(read(sampleBase), read(loopIndex))),
        )
      })
      setVariableTo(sourceMonitor, 'sample')
      setVariableTo(
        sampleLabelMonitor,
        getItemOfList(sampleLabels, read(sampleIndex)),
      )
      setVariableTo(dirty, 1)
    },
    true,
  )

  const updateCursor = defineProcedure(
    [procedureLabel('update cursor')],
    () => {
      setVariableTo(cursorOnCanvas, 0)
      ifThen(
        and(
          and(gt(getMouseX(), CANVAS_LEFT), lt(getMouseX(), CANVAS_RIGHT)),
          and(gt(getMouseY(), CANVAS_BOTTOM), lt(getMouseY(), CANVAS_TOP)),
        ),
        () => {
          setVariableTo(cursorOnCanvas, 1)
          setVariableTo(
            cursorCol,
            add(
              mathop(
                'floor',
                divide(add(getMouseX(), -CANVAS_LEFT), CELL_SIZE),
              ),
              1,
            ),
          )
          setVariableTo(
            cursorRow,
            add(
              mathop(
                'floor',
                divide(add(CANVAS_TOP, multiply(-1, getMouseY())), CELL_SIZE),
              ),
              1,
            ),
          )
        },
      )
    },
    true,
  )

  const runInference = defineProcedure(
    [procedureLabel('run inference')],
    () => {
      const inputReporters = Array.from({ length: PIXEL_COUNT }, (_, index) =>
        add(getItemOfList(canvasPixels, index + 1), 0),
      )
      const output = session.run(inputReporters)

      setVariableTo(bestLogit, -999999)
      setVariableTo(predictionMonitor, 0)

      for (let digit = 0; digit < 10; digit += 1) {
        const logit = output.at(digit).get()
        replaceItemOfList(logits, digit + 1, logit)
        ifThen(gt(logit, read(bestLogit)), () => {
          setVariableTo(bestLogit, logit)
          setVariableTo(predictionMonitor, digit)
        })
      }
    },
    true,
  )

  const drawScene = defineProcedure(
    [procedureLabel('draw scene')],
    () => {
      eraseAll()

      setPenColorTo('#101418')
      setPenSizeTo(GRID * CELL_SIZE + 10)
      gotoXY(
        divide(add(CANVAS_LEFT, CANVAS_RIGHT), 2),
        divide(add(CANVAS_TOP, CANVAS_BOTTOM), 2),
      )
      penDown()
      penUp()

      setPenColorTo('#25313f')
      setPenSizeTo(2)
      gotoXY(CANVAS_LEFT - 3, CANVAS_TOP + 3)
      penDown()
      gotoXY(CANVAS_RIGHT + 3, CANVAS_TOP + 3)
      gotoXY(CANVAS_RIGHT + 3, CANVAS_BOTTOM - 3)
      gotoXY(CANVAS_LEFT - 3, CANVAS_BOTTOM - 3)
      gotoXY(CANVAS_LEFT - 3, CANVAS_TOP + 3)
      penUp()

      setPenColorTo('#f5f7fb')
      setPenSizeTo(CELL_SIZE - 1)
      forEach(loopIndex, PIXEL_COUNT, () => {
        ifThen(gt(getItemOfList(canvasPixels, read(loopIndex)), 0.05), () => {
          setVariableTo(
            workX,
            add(mathop('floor', divide(add(read(loopIndex), -1), GRID)), 1),
          )
          setVariableTo(
            workY,
            add(read(loopIndex), multiply(add(read(workX), -1), -GRID)),
          )
          gotoXY(cellCenterX(read(workY)), cellCenterY(read(workX)))
          penDown()
          penUp()
        })
      })

      setPenColorTo('#5b7089')
      setPenSizeTo(1)
      gotoXY(40, 150)
      penDown()
      gotoXY(200, 150)
      penUp()
      gotoXY(40, 100)
      penDown()
      gotoXY(200, 100)
      penUp()
    },
    true,
  )

  const oneStep = defineProcedure(
    [procedureLabel('1step')],
    () => {
      ifThen(and(getKeyPressed('c'), equals(read(clearLatch), 0)), () => {
        setVariableTo(clearLatch, 1)
        callProcedure(clearCanvas, {})
      })
      ifThen(not(getKeyPressed('c')), () => {
        setVariableTo(clearLatch, 0)
      })

      ifThen(and(getKeyPressed('s'), equals(read(sampleLatch), 0)), () => {
        setVariableTo(sampleLatch, 1)
        setVariableTo(sampleIndex, add(read(sampleIndex), 1))
        ifThen(gt(read(sampleIndex), SAMPLE_COUNT), () => {
          setVariableTo(sampleIndex, 1)
        })
        callProcedure(loadCurrentSample, {})
      })
      ifThen(not(getKeyPressed('s')), () => {
        setVariableTo(sampleLatch, 0)
      })

      callProcedure(updateCursor, {})

      ifThen(and(getMouseDown(), equals(read(cursorOnCanvas), 1)), () => {
        setVariableTo(sourceMonitor, 'draw')
        setVariableTo(sampleLabelMonitor, '-')
        setPixelIfInside(read(cursorCol), read(cursorRow), 1)
        setPixelIfInside(add(read(cursorCol), -1), read(cursorRow), 0.6)
        setPixelIfInside(add(read(cursorCol), 1), read(cursorRow), 0.6)
        setPixelIfInside(read(cursorCol), add(read(cursorRow), -1), 0.6)
        setPixelIfInside(read(cursorCol), add(read(cursorRow), 1), 0.6)
        setPixelIfInside(
          add(read(cursorCol), -1),
          add(read(cursorRow), -1),
          0.3,
        )
        setPixelIfInside(add(read(cursorCol), 1), add(read(cursorRow), -1), 0.3)
        setPixelIfInside(add(read(cursorCol), -1), add(read(cursorRow), 1), 0.3)
        setPixelIfInside(add(read(cursorCol), 1), add(read(cursorRow), 1), 0.3)
        setVariableTo(dirty, 1)
      })

      ifThen(equals(read(dirty), 1), () => {
        callProcedure(runInference, {})
        callProcedure(drawScene, {})
        setVariableTo(dirty, 0)
      })

      ifThen(and(not(getMouseDown()), equals(read(clickLatch), 1)), () => {
        setVariableTo(clickLatch, 0)
      })
      ifThen(getMouseDown(), () => {
        setVariableTo(clickLatch, 1)
      })
    },
    true,
  )

  whenFlagClicked(() => {
    hide()
    penUp()
    setPenSizeTo(1)
    setVariableTo(sampleIndex, 1)
    callProcedure(loadCurrentSample, {})
    callProcedure(runInference, {})
    callProcedure(drawScene, {})

    forever(() => {
      callProcedure(oneStep, {}, true)
    })
  })
})

export default project
