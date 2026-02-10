import { Project, type VariableReference } from 'hikkaku'
import {
  add,
  callProcedure,
  changeVariableBy,
  defineProcedure,
  divide,
  equals,
  eraseAll,
  forEach,
  forever,
  getItemOfList,
  getMouseDown,
  getMouseX,
  getMouseY,
  getVariable,
  gotoXY,
  gt,
  hide,
  ifElse,
  ifThen,
  lengthOfList,
  lt,
  mathop,
  multiply,
  penDown,
  penUp,
  procedureLabel,
  replaceItemOfList,
  setDragMode,
  setPenColorTo,
  setPenSizeTo,
  setVariableTo,
  subtract,
  whenFlagClicked,
} from 'hikkaku/blocks'
import { TEAPOT_EDGES, TEAPOT_VERTICES } from './teapot-model'

const project = new Project()
const renderer = project.createSprite('renderer')

const modelScale = renderer.createVariable('modelScale', 1.1)
const cameraDistance = renderer.createVariable('cameraDistance', 340)
const focalLength = renderer.createVariable('focalLength', 250)

const angleX = renderer.createVariable('angleX', -18)
const angleY = renderer.createVariable('angleY', 24)

const dragging = renderer.createVariable('dragging', 0)
const lastMouseX = renderer.createVariable('lastMouseX', 0)
const lastMouseY = renderer.createVariable('lastMouseY', 0)

const vertexIndex = renderer.createVariable('vertexIndex', 1)
const edgeIndex = renderer.createVariable('edgeIndex', 1)
const edgeFrom = renderer.createVariable('edgeFrom', 1)
const edgeTo = renderer.createVariable('edgeTo', 1)

const workX = renderer.createVariable('workX', 0)
const workY = renderer.createVariable('workY', 0)
const workZ = renderer.createVariable('workZ', 0)
const rotatedX = renderer.createVariable('rotatedX', 0)
const rotatedY = renderer.createVariable('rotatedY', 0)
const rotatedZ = renderer.createVariable('rotatedZ', 0)
const perspective = renderer.createVariable('perspective', 1)

const vertexXList = renderer.createList(
  'vertexX',
  TEAPOT_VERTICES.map(([x]) => x),
)
const vertexYList = renderer.createList(
  'vertexY',
  TEAPOT_VERTICES.map(([, y]) => y),
)
const vertexZList = renderer.createList(
  'vertexZ',
  TEAPOT_VERTICES.map(([, , z]) => z),
)

const projectedXList = renderer.createList(
  'projectedX',
  TEAPOT_VERTICES.map(() => 0),
)
const projectedYList = renderer.createList(
  'projectedY',
  TEAPOT_VERTICES.map(() => 0),
)

const edgeFromList = renderer.createList(
  'edgeFrom',
  TEAPOT_EDGES.map(([from]) => from + 1),
)
const edgeToList = renderer.createList(
  'edgeTo',
  TEAPOT_EDGES.map(([, to]) => to + 1),
)

const readVar = (variable: VariableReference) => getVariable(variable)
const stepProcCode = '1step'
const stepArgumentIds: string[] = []

renderer.run(() => {
  defineProcedure(
    [procedureLabel(stepProcCode)],
    () => {
      ifElse(
        getMouseDown(),
        () => {
          ifElse(
            equals(readVar(dragging), 0),
            () => {
              setVariableTo(dragging, 1)
              setVariableTo(lastMouseX, getMouseX())
              setVariableTo(lastMouseY, getMouseY())
            },
            () => {
              changeVariableBy(
                angleY,
                multiply(subtract(getMouseX(), readVar(lastMouseX)), 0.8),
              )
              changeVariableBy(
                angleX,
                multiply(subtract(readVar(lastMouseY), getMouseY()), 0.8),
              )
              setVariableTo(lastMouseX, getMouseX())
              setVariableTo(lastMouseY, getMouseY())
            },
          )
        },
        () => {
          setVariableTo(dragging, 0)
          changeVariableBy(angleY, 0.2)
        },
      )

      ifThen(gt(readVar(angleX), 89), () => {
        setVariableTo(angleX, 89)
      })
      ifThen(lt(readVar(angleX), -89), () => {
        setVariableTo(angleX, -89)
      })

      eraseAll()

      forEach(vertexIndex, lengthOfList(vertexXList), () => {
        setVariableTo(
          workX,
          multiply(
            getItemOfList(vertexXList, readVar(vertexIndex)),
            readVar(modelScale),
          ),
        )
        setVariableTo(
          workY,
          multiply(
            getItemOfList(vertexYList, readVar(vertexIndex)),
            readVar(modelScale),
          ),
        )
        setVariableTo(
          workZ,
          multiply(
            getItemOfList(vertexZList, readVar(vertexIndex)),
            readVar(modelScale),
          ),
        )

        setVariableTo(
          rotatedX,
          add(
            multiply(readVar(workX), mathop('cos', readVar(angleY))),
            multiply(readVar(workZ), mathop('sin', readVar(angleY))),
          ),
        )
        setVariableTo(
          rotatedZ,
          subtract(
            multiply(readVar(workZ), mathop('cos', readVar(angleY))),
            multiply(readVar(workX), mathop('sin', readVar(angleY))),
          ),
        )

        setVariableTo(
          rotatedY,
          subtract(
            multiply(readVar(workY), mathop('cos', readVar(angleX))),
            multiply(readVar(rotatedZ), mathop('sin', readVar(angleX))),
          ),
        )
        setVariableTo(
          rotatedZ,
          add(
            multiply(readVar(workY), mathop('sin', readVar(angleX))),
            multiply(readVar(rotatedZ), mathop('cos', readVar(angleX))),
          ),
        )

        setVariableTo(
          perspective,
          divide(
            readVar(focalLength),
            add(readVar(cameraDistance), readVar(rotatedZ)),
          ),
        )

        replaceItemOfList(
          projectedXList,
          readVar(vertexIndex),
          multiply(readVar(rotatedX), readVar(perspective)),
        )
        replaceItemOfList(
          projectedYList,
          readVar(vertexIndex),
          multiply(readVar(rotatedY), readVar(perspective)),
        )
      })

      forEach(edgeIndex, lengthOfList(edgeFromList), () => {
        setVariableTo(edgeFrom, getItemOfList(edgeFromList, readVar(edgeIndex)))
        setVariableTo(edgeTo, getItemOfList(edgeToList, readVar(edgeIndex)))

        penUp()
        gotoXY(
          getItemOfList(projectedXList, readVar(edgeFrom)),
          getItemOfList(projectedYList, readVar(edgeFrom)),
        )
        penDown()
        gotoXY(
          getItemOfList(projectedXList, readVar(edgeTo)),
          getItemOfList(projectedYList, readVar(edgeTo)),
        )
        penUp()
      })
    },
    true,
  )

  whenFlagClicked(() => {
    hide()
    setDragMode('not draggable')

    penUp()
    setPenSizeTo(1)
    setPenColorTo('#f97316')

    setVariableTo(lastMouseX, getMouseX())
    setVariableTo(lastMouseY, getMouseY())
    setVariableTo(dragging, 0)

    forever(() => {
      callProcedure(stepProcCode, stepArgumentIds, {}, true)
    })
  })
})

export default project
