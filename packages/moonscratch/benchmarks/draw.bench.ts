import { Project } from 'hikkaku'
import {
  callProcedure,
  changeXBy,
  changeYBy,
  defineProcedure,
  eraseAll,
  forEach,
  getItemOfList,
  gotoXY,
  hide,
  lengthOfList,
  penDown,
  penUp,
  procedureLabel,
  repeat,
  setPenColorTo,
  setPenSizeTo,
  setVariableTo,
  setY,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { bench, run } from 'mitata'
import {
  createHeadlessVM,
  createProgramModuleFromProject,
} from '../js/vm/factory.ts'

await import('scratch-storage')

const runUntilFinished = (vm: {
  greenFlag(): void
  stepFrame(): { stopReason: string }
}) => {
  vm.greenFlag()
  while (true) {
    const result = vm.stepFrame()
    if (result.stopReason === 'finished') {
      break
    }
  }
}

const project = new Project()
const sprite = project.createSprite('Sprite1')

sprite.run(() => {
  whenFlagClicked(() => {
    gotoXY(-240, -180)
    repeat(420, () => {
      changeXBy(1)
      setY(-180)

      penDown()
      repeat(360, () => {
        changeYBy(1)
      })
      penUp()
    })
  })
})

const projectJson = project.toScratch()
const program = createProgramModuleFromProject({ projectJson })
const vm = createHeadlessVM({
  program,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1000000,
    turbo: true,
  },
})

bench('draw/moonscratch', () => {
  runUntilFinished(vm)
})

const FRAME_FORCE_TIMEOUT_OUT_OF_WARP_MS = 1000 / 30
const FRAME_FORCE_TIMEOUT_IN_WARP_MS = 1000 / 5

const stepLikeViewerFrame = (vm: {
  stepFrame(): { stopReason: string; isInWarp: boolean }
  renderFrame(): unknown
}) => {
  const frameStart = performance.now()
  while (true) {
    const frameInfo = vm.stepFrame()
    if (
      frameInfo.stopReason === 'finished' ||
      frameInfo.stopReason === 'rerender'
    ) {
      break
    }
    const elapsed = performance.now() - frameStart
    if (frameInfo.isInWarp) {
      if (elapsed > FRAME_FORCE_TIMEOUT_IN_WARP_MS) {
        break
      }
    } else {
      if (elapsed > FRAME_FORCE_TIMEOUT_OUT_OF_WARP_MS) {
        break
      }
    }
  }
  vm.renderFrame()
}

const TESSERACT_VERTICES_2D = Array.from({ length: 16 }, (_, vertex) => {
  const sign = (bit: number) => {
    return vertex & (1 << bit) ? 1 : -1
  }
  const x = sign(0)
  const y = sign(1)
  const z = sign(2)
  const w = sign(3)
  const perspective4 = 1 / (2.6 - w * 0.8)
  const x3 = x * perspective4
  const y3 = y * perspective4
  const z3 = z * perspective4
  const perspective3 = 1 / (3.2 - z3)
  return [x3 * perspective3 * 110, y3 * perspective3 * 110] as const
})

const TESSERACT_EDGES: Array<[number, number]> = []
for (let vertex = 0; vertex < 16; vertex += 1) {
  for (let bit = 0; bit < 4; bit += 1) {
    const neighbor = vertex ^ (1 << bit)
    if (vertex < neighbor) {
      TESSERACT_EDGES.push([vertex + 1, neighbor + 1])
    }
  }
}

const tesseractProject = new Project()
const tesseractSprite = tesseractProject.createSprite('Tesseract')
const edgeIndex = tesseractSprite.createVariable('edgeIndex', 1)
const edgeFrom = tesseractSprite.createVariable('edgeFrom', 1)
const edgeTo = tesseractSprite.createVariable('edgeTo', 1)
const vertexXList = tesseractSprite.createList(
  'vertexX',
  TESSERACT_VERTICES_2D.map(([x]) => x),
)
const vertexYList = tesseractSprite.createList(
  'vertexY',
  TESSERACT_VERTICES_2D.map(([, y]) => y),
)
const edgeFromList = tesseractSprite.createList(
  'edgeFrom',
  TESSERACT_EDGES.map(([from]) => from),
)
const edgeToList = tesseractSprite.createList(
  'edgeTo',
  TESSERACT_EDGES.map(([, to]) => to),
)

tesseractSprite.run(() => {
  const drawStep = defineProcedure(
    [procedureLabel('draw step')],
    () => {
      eraseAll()
      forEach(edgeIndex, lengthOfList(edgeFromList), () => {
        setVariableTo(edgeFrom, getItemOfList(edgeFromList, edgeIndex.get()))
        setVariableTo(edgeTo, getItemOfList(edgeToList, edgeIndex.get()))
        penUp()
        gotoXY(
          getItemOfList(vertexXList, edgeFrom.get()),
          getItemOfList(vertexYList, edgeFrom.get()),
        )
        penDown()
        gotoXY(
          getItemOfList(vertexXList, edgeTo.get()),
          getItemOfList(vertexYList, edgeTo.get()),
        )
        penUp()
      })
    },
    true,
  )

  whenFlagClicked(() => {
    hide()
    penUp()
    setPenSizeTo(1.2)
    setPenColorTo('#38bdf8')
    repeat(30, () => {
      callProcedure(drawStep, {}, true)
    })
  })
})

const tesseractProjectJson = tesseractProject.toScratch()
const tesseractProgram = createProgramModuleFromProject({
  projectJson: tesseractProjectJson,
})
const tesseractVM = createHeadlessVM({
  program: tesseractProgram,
  initialNowMs: 0,
  options: {
    stepTimeoutTicks: 1,
  },
})
tesseractVM.start()

bench('draw/tesseract-30/moonscratch', () => {
  tesseractVM.stopAll()
  tesseractVM.greenFlag()
  for (let frame = 0; frame < 30; frame += 1) {
    stepLikeViewerFrame(tesseractVM)
  }
  tesseractVM.stopAll()
})

if (import.meta.main) {
  await run()
}
