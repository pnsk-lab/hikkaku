import type { DenseNetworkModel } from '@hikkaku/onnx'

export const xorDenseNetworkModel = {
  inputName: 'input',
  outputName: 'output',
  inputSize: 2,
  outputSize: 1,
  layers: [
    {
      name: '/network/network.0/Gemm',
      inputSize: 2,
      outputSize: 4,
      weights: [
        [0.04938792809844017, -0.4259566068649292],
        [3.162459373474121, 3.1594858169555664],
        [-2.5304019451141357, -2.5277671813964844],
        [-0.4142428934574127, -0.42963460087776184],
      ],
      bias: [
        -0.19047172367572784, -3.164069652557373, 2.5201950073242188,
        -0.4585201144218445,
      ],
      activation: 'relu',
    },
    {
      name: '/network/network.2/Gemm',
      inputSize: 4,
      outputSize: 1,
      weights: [
        [
          -0.21316099166870117, -4.195398807525635, -5.033853530883789,
          0.4892413914203644,
        ],
      ],
      bias: [5.746037483215332],
      activation: 'sigmoid',
    },
  ],
} satisfies DenseNetworkModel
