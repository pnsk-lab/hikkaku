import { Project } from 'hikkaku'
import { setVariableTo, whenFlagClicked } from 'hikkaku/blocks'
import { describe, expect, test } from 'vite-plus/test'
import {
  createHeadlessVMFromProject,
  getSnapshotVariable,
} from '../../testing/src'
import type { DenseNetworkModel, SequentialNetworkModel } from './model'
import {
  createDenseNetworkSession,
  createSequentialNetworkSession,
} from './runtime'

const distanceModel: DenseNetworkModel = {
  inputName: 'input',
  outputName: 'output',
  inputSize: 2,
  outputSize: 1,
  layers: [
    {
      name: 'hidden',
      inputSize: 2,
      outputSize: 2,
      weights: [
        [1, -1],
        [-1, 1],
      ],
      bias: [0, 0],
      activation: 'relu',
    },
    {
      name: 'output',
      inputSize: 2,
      outputSize: 1,
      weights: [[1, 1]],
      bias: [0],
      activation: 'identity',
    },
  ],
}

const convAccumulatorModel: SequentialNetworkModel = {
  inputName: 'input',
  outputName: 'output',
  inputShape: [1, 4, 4],
  outputShape: [1],
  operators: [
    {
      kind: 'conv',
      name: 'conv',
      inputShape: [1, 4, 4],
      outputShape: [1, 3, 3],
      kernelShape: [2, 2],
      strides: [1, 1],
      dilations: [1, 1],
      pads: [0, 0, 0, 0],
      group: 1,
      weights: [1, 0, 0, 1],
      bias: [0],
    },
    {
      kind: 'relu',
      name: 'relu',
      shape: [1, 3, 3],
    },
    {
      kind: 'flatten',
      name: 'flatten',
      inputShape: [1, 3, 3],
      outputShape: [9],
    },
    {
      kind: 'dense',
      name: 'dense',
      inputSize: 9,
      outputSize: 1,
      weights: [[1, 1, 1, 1, 1, 1, 1, 1, 1]],
      bias: [0],
    },
  ],
}

describe('onnx/runtime', () => {
  const runProject = (project: Project, maxFrames = 16) => {
    const vm = createHeadlessVMFromProject({
      projectJson: project.toScratch(),
    })
    vm.greenFlag()
    for (let frame = 0; frame < maxFrames; frame += 1) {
      const report = vm.stepFrame()
      if (report.stopReason === 'finished') {
        break
      }
    }
    return vm.snapshot()
  }

  test('runs dense inference through gobox buffers', async () => {
    const project = new Project()
    const output = project.stage.createVariable('output', 0)

    project.stage.run(() => {
      const session = createDenseNetworkSession(distanceModel)

      whenFlagClicked(() => {
        const result = session.run([1, 0])
        setVariableTo(output, result.at(0).get())
      })
    })

    const snapshot = runProject(project)
    expect(getSnapshotVariable(snapshot, output)).toBe(1)
  })

  test('rejects mismatched input lengths', () => {
    const project = new Project()
    expect(() => {
      project.stage.run(() => {
        const session = createDenseNetworkSession(distanceModel)
        session.run([1])
      })
    }).toThrow(/expected 2 inputs, received 1/)
  })

  test('runs sequential convolution inference through gobox buffers', async () => {
    const project = new Project()
    const output = project.stage.createVariable('output', 0)

    project.stage.run(() => {
      const session = createSequentialNetworkSession(convAccumulatorModel)

      whenFlagClicked(() => {
        const result = session.run([
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
        ])
        setVariableTo(output, result.at(0).get())
      })
    })

    const snapshot = runProject(project, 32)
    expect(getSnapshotVariable(snapshot, output)).toBe(153)
  })
})
