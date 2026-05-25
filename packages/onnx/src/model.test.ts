import { onnx } from 'onnx-proto'
import { describe, expect, test } from 'vite-plus/test'
import {
  compileDenseNetwork,
  compileSequentialNetwork,
  decodeOnnxModel,
} from './model'

const encodeFloatTensor = (
  name: string,
  dims: number[],
  values: number[],
): onnx.ITensorProto => {
  const buffer = new ArrayBuffer(values.length * 4)
  const view = new DataView(buffer)
  values.forEach((value, index) => {
    view.setFloat32(index * 4, value, true)
  })
  return {
    name,
    dims,
    dataType: onnx.TensorProto.DataType.FLOAT,
    rawData: new Uint8Array(buffer),
  }
}

const makeValueInfo = (name: string, dims: number[]): onnx.IValueInfoProto => {
  return {
    name,
    type: {
      tensorType: {
        elemType: onnx.TensorProto.DataType.FLOAT,
        shape: {
          dim: dims.map((dimValue) => ({
            dimValue,
          })),
        },
      },
    },
  }
}

const buildDenseModelBytes = (): Uint8Array => {
  return onnx.ModelProto.encode({
    irVersion: onnx.Version.IR_VERSION,
    graph: {
      name: 'dense-test',
      input: [makeValueInfo('input', [1, 2])],
      output: [makeValueInfo('output', [1, 1])],
      initializer: [
        encodeFloatTensor('linear1.weight', [2, 2], [1, -1, -1, 1]),
        encodeFloatTensor('linear1.bias', [2], [0, 0]),
        encodeFloatTensor('linear2.weight', [1, 2], [1, 1]),
        encodeFloatTensor('linear2.bias', [1], [0]),
      ],
      node: [
        {
          name: 'linear1',
          opType: 'Gemm',
          input: ['input', 'linear1.weight', 'linear1.bias'],
          output: ['hidden'],
          attribute: [
            { name: 'alpha', i: 1 },
            { name: 'beta', i: 1 },
            { name: 'transB', i: 1 },
          ],
        },
        {
          name: 'relu1',
          opType: 'Relu',
          input: ['hidden'],
          output: ['hidden_relu'],
        },
        {
          name: 'linear2',
          opType: 'Gemm',
          input: ['hidden_relu', 'linear2.weight', 'linear2.bias'],
          output: ['output'],
          attribute: [
            { name: 'alpha', i: 1 },
            { name: 'beta', i: 1 },
            { name: 'transB', i: 1 },
          ],
        },
      ],
    },
  }).finish()
}

const buildConvModelBytes = (): Uint8Array => {
  return onnx.ModelProto.encode({
    irVersion: onnx.Version.IR_VERSION,
    graph: {
      name: 'conv-test',
      input: [makeValueInfo('input', [1, 1, 4, 4])],
      output: [makeValueInfo('output', [1, 1])],
      initializer: [
        encodeFloatTensor('conv.weight', [1, 1, 2, 2], [1, 0, 0, 1]),
        encodeFloatTensor('conv.bias', [1], [0]),
        encodeFloatTensor('linear.weight', [1, 9], [1, 1, 1, 1, 1, 1, 1, 1, 1]),
        encodeFloatTensor('linear.bias', [1], [0]),
      ],
      node: [
        {
          name: 'conv',
          opType: 'Conv',
          input: ['input', 'conv.weight', 'conv.bias'],
          output: ['conv_out'],
          attribute: [
            {
              name: 'strides',
              ints: [1, 1],
              type: onnx.AttributeProto.AttributeType.INTS,
            },
            {
              name: 'pads',
              ints: [0, 0, 0, 0],
              type: onnx.AttributeProto.AttributeType.INTS,
            },
          ],
        },
        {
          name: 'relu',
          opType: 'Relu',
          input: ['conv_out'],
          output: ['relu_out'],
        },
        {
          name: 'flatten',
          opType: 'Flatten',
          input: ['relu_out'],
          output: ['flat'],
          attribute: [
            { name: 'axis', i: 1, type: onnx.AttributeProto.AttributeType.INT },
          ],
        },
        {
          name: 'linear',
          opType: 'Gemm',
          input: ['flat', 'linear.weight', 'linear.bias'],
          output: ['output'],
          attribute: [
            {
              name: 'alpha',
              i: 1,
              type: onnx.AttributeProto.AttributeType.INT,
            },
            { name: 'beta', i: 1, type: onnx.AttributeProto.AttributeType.INT },
            {
              name: 'transB',
              i: 1,
              type: onnx.AttributeProto.AttributeType.INT,
            },
          ],
        },
      ],
    },
  }).finish()
}

describe('onnx/model', () => {
  test('decodes a minimal dense ONNX model', () => {
    const model = decodeOnnxModel(buildDenseModelBytes())

    expect(model.inputs).toHaveLength(1)
    expect(model.outputs).toHaveLength(1)
    expect(model.nodes.map((node) => node.opType)).toEqual([
      'Gemm',
      'Relu',
      'Gemm',
    ])
    expect(model.initializers['linear1.weight']?.values).toEqual([1, -1, -1, 1])
  })

  test('compiles Gemm and Relu nodes into dense layers', () => {
    const spec = compileDenseNetwork(decodeOnnxModel(buildDenseModelBytes()))

    expect(spec.inputSize).toBe(2)
    expect(spec.outputSize).toBe(1)
    expect(spec.layers).toHaveLength(2)
    expect(spec.layers[0]).toMatchObject({
      activation: 'relu',
      inputSize: 2,
      outputSize: 2,
      weights: [
        [1, -1],
        [-1, 1],
      ],
      bias: [0, 0],
    })
    expect(spec.layers[1]).toMatchObject({
      activation: 'identity',
      inputSize: 2,
      outputSize: 1,
      weights: [[1, 1]],
      bias: [0],
    })
  })

  test('compiles Conv, Relu, Flatten, and Gemm into sequential operators', () => {
    const spec = compileSequentialNetwork(
      decodeOnnxModel(buildConvModelBytes()),
    )

    expect(spec.inputShape).toEqual([1, 4, 4])
    expect(spec.outputShape).toEqual([1])
    expect(spec.operators.map((operator) => operator.kind)).toEqual([
      'conv',
      'relu',
      'flatten',
      'dense',
    ])
    expect(spec.operators[0]).toMatchObject({
      kind: 'conv',
      inputShape: [1, 4, 4],
      outputShape: [1, 3, 3],
      kernelShape: [2, 2],
      strides: [1, 1],
      pads: [0, 0, 0, 0],
      bias: [0],
    })
    expect(spec.operators[3]).toMatchObject({
      kind: 'dense',
      inputSize: 9,
      outputSize: 1,
      weights: [[1, 1, 1, 1, 1, 1, 1, 1, 1]],
    })
  })
})
