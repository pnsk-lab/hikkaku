import { createDenseNetworkSession } from '@hikkaku/onnx'
import { Project } from 'hikkaku'
import { IMAGES } from 'hikkaku/assets'
import {
  add,
  getItemOfList,
  getVariable,
  gt,
  ifElse,
  setVariableTo,
  show,
  whenFlagClicked,
  whenThisSpriteClicked,
} from 'hikkaku/blocks'
import { xorDenseNetworkModel } from './model.generated'

const project = new Project()

const sampleIndex = project.stage.createVariable('sample', 1, {
  monitor: {
    mode: 'large',
    visible: true,
    x: 20,
    y: 20,
  },
})

const inputA = project.stage.createVariable('inputA', 0, {
  monitor: {
    mode: 'large',
    visible: true,
    x: 20,
    y: 70,
  },
})

const inputB = project.stage.createVariable('inputB', 0, {
  monitor: {
    mode: 'large',
    visible: true,
    x: 20,
    y: 120,
  },
})

const expected = project.stage.createVariable('expected', 0, {
  monitor: {
    mode: 'large',
    visible: true,
    x: 20,
    y: 170,
  },
})

const prediction = project.stage.createVariable('prediction', 0, {
  monitor: {
    mode: 'large',
    visible: true,
    x: 20,
    y: 220,
  },
})

const predictedLabel = project.stage.createVariable('predicted', 0, {
  monitor: {
    mode: 'large',
    visible: true,
    x: 20,
    y: 270,
  },
})

const sampleAList = project.stage.createList('sampleA', [0, 0, 1, 1])
const sampleBList = project.stage.createList('sampleB', [0, 1, 0, 1])
const sampleLabelList = project.stage.createList('sampleLabel', [0, 1, 1, 0])

const cat = project.createSprite('onnx-cat', {
  x: 80,
  y: 10,
  size: 160,
})
cat.addCostume({
  ...IMAGES.CAT_A,
  name: 'cat-a',
})

cat.run(() => {
  const session = createDenseNetworkSession(xorDenseNetworkModel)

  const applyCurrentSample = () => {
    const currentIndex = getVariable(sampleIndex)
    const a = add(getItemOfList(sampleAList, currentIndex), 0)
    const b = add(getItemOfList(sampleBList, currentIndex), 0)
    const label = add(getItemOfList(sampleLabelList, currentIndex), 0)

    setVariableTo(inputA, a)
    setVariableTo(inputB, b)
    setVariableTo(expected, label)

    const output = session.run([a, b])
    setVariableTo(prediction, output.at(0).get())

    ifElse(
      gt(output.at(0).get(), 0.5),
      () => {
        setVariableTo(predictedLabel, 1)
      },
      () => {
        setVariableTo(predictedLabel, 0)
      },
    )
  }

  whenFlagClicked(() => {
    show()
    setVariableTo(sampleIndex, 1)
    applyCurrentSample()
  })

  whenThisSpriteClicked(() => {
    setVariableTo(sampleIndex, add(getVariable(sampleIndex), 1))
    ifElse(
      gt(getVariable(sampleIndex), 4),
      () => {
        setVariableTo(sampleIndex, 1)
      },
      () => {},
    )
    applyCurrentSample()
  })
})

export default project
