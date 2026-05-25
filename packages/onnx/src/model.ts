import { onnx } from 'onnx-proto'

const FLOAT_DATA_TYPE = onnx.TensorProto.DataType.FLOAT
const DOUBLE_DATA_TYPE = onnx.TensorProto.DataType.DOUBLE
const ATTRIBUTE_FLOAT_TYPE = onnx.AttributeProto.AttributeType.FLOAT
const ATTRIBUTE_INT_TYPE = onnx.AttributeProto.AttributeType.INT
const ATTRIBUTE_STRING_TYPE = onnx.AttributeProto.AttributeType.STRING
const ATTRIBUTE_FLOATS_TYPE = onnx.AttributeProto.AttributeType.FLOATS
const ATTRIBUTE_INTS_TYPE = onnx.AttributeProto.AttributeType.INTS
const ATTRIBUTE_STRINGS_TYPE = onnx.AttributeProto.AttributeType.STRINGS

export type OnnxAttributeValue = number | number[] | string | string[]

export interface OnnxTensor {
  readonly name: string
  readonly dataType: number
  readonly dims: number[]
  readonly values: number[]
}

export interface OnnxValueInfo {
  readonly name: string
  readonly dims: number[]
}

export interface OnnxNode {
  readonly name: string
  readonly opType: string
  readonly inputs: string[]
  readonly outputs: string[]
  readonly attributes: Readonly<Record<string, OnnxAttributeValue>>
}

export interface OnnxModel {
  readonly inputs: OnnxValueInfo[]
  readonly outputs: OnnxValueInfo[]
  readonly initializers: Readonly<Record<string, OnnxTensor>>
  readonly nodes: OnnxNode[]
}

export type DenseActivation = 'identity' | 'relu' | 'sigmoid'

export interface DenseLayer {
  readonly name: string
  readonly inputSize: number
  readonly outputSize: number
  readonly weights: number[][]
  readonly bias: number[]
  activation: DenseActivation
}

export interface DenseNetworkModel {
  readonly inputName: string
  readonly outputName: string
  readonly inputSize: number
  readonly outputSize: number
  readonly layers: DenseLayer[]
}

export interface ConvLayer {
  readonly kind: 'conv'
  readonly name: string
  readonly inputShape: [number, number, number]
  readonly outputShape: [number, number, number]
  readonly kernelShape: [number, number]
  readonly strides: [number, number]
  readonly dilations: [number, number]
  readonly pads: [number, number, number, number]
  readonly group: number
  readonly weights: number[]
  readonly bias: number[]
}

export interface DenseOperator {
  readonly kind: 'dense'
  readonly name: string
  readonly inputSize: number
  readonly outputSize: number
  readonly weights: number[][]
  readonly bias: number[]
}

export interface FlattenOperator {
  readonly kind: 'flatten'
  readonly name: string
  readonly inputShape: number[]
  readonly outputShape: [number]
}

export interface ReluOperator {
  readonly kind: 'relu'
  readonly name: string
  readonly shape: number[]
}

export interface SigmoidOperator {
  readonly kind: 'sigmoid'
  readonly name: string
  readonly shape: number[]
}

export interface IdentityOperator {
  readonly kind: 'identity'
  readonly name: string
  readonly shape: number[]
}

export type SequentialOperator =
  | ConvLayer
  | DenseOperator
  | FlattenOperator
  | ReluOperator
  | SigmoidOperator
  | IdentityOperator

export interface SequentialNetworkModel {
  readonly inputName: string
  readonly outputName: string
  readonly inputShape: number[]
  readonly outputShape: number[]
  readonly operators: SequentialOperator[]
}

const toUint8Array = (bytes: Uint8Array | ArrayBuffer): Uint8Array => {
  if (bytes instanceof Uint8Array) {
    return bytes
  }
  return new Uint8Array(bytes)
}

const toNumber = (
  value: number | { toNumber(): number } | null | undefined,
): number => {
  if (value == null) {
    return 0
  }
  if (typeof value === 'number') {
    return value
  }
  return value.toNumber()
}

const decodeUtf8 = (value: Uint8Array | null | undefined): string => {
  if (!value) {
    return ''
  }
  return new TextDecoder().decode(value)
}

const readShape = (valueInfo: onnx.IValueInfoProto): number[] => {
  const dims = valueInfo.type?.tensorType?.shape?.dim ?? []
  return dims.map((dim) => {
    if (dim?.dimValue == null) {
      throw new Error(
        `Only static tensor shapes are supported for ${valueInfo.name ?? '<unnamed>'}`,
      )
    }
    return toNumber(dim.dimValue)
  })
}

const decodeRawFloatData = (
  rawData: Uint8Array,
  elementSize: 4 | 8,
): number[] => {
  if (rawData.byteLength % elementSize !== 0) {
    throw new Error('Tensor rawData length does not match element size')
  }
  const view = new DataView(
    rawData.buffer,
    rawData.byteOffset,
    rawData.byteLength,
  )
  const values: number[] = []
  const count = rawData.byteLength / elementSize
  for (let index = 0; index < count; index += 1) {
    const offset = index * elementSize
    values.push(
      elementSize === 4
        ? view.getFloat32(offset, true)
        : view.getFloat64(offset, true),
    )
  }
  return values
}

const decodeTensorValues = (tensor: onnx.ITensorProto): number[] => {
  const dataType = tensor.dataType ?? 0
  if (dataType === FLOAT_DATA_TYPE) {
    if (tensor.rawData && tensor.rawData.length > 0) {
      return decodeRawFloatData(tensor.rawData, 4)
    }
    if (tensor.floatData && tensor.floatData.length > 0) {
      return [...tensor.floatData]
    }
    return []
  }
  if (dataType === DOUBLE_DATA_TYPE) {
    if (tensor.rawData && tensor.rawData.length > 0) {
      return decodeRawFloatData(tensor.rawData, 8)
    }
    if (tensor.doubleData && tensor.doubleData.length > 0) {
      return [...tensor.doubleData]
    }
    return []
  }
  throw new Error(
    `Unsupported tensor data type ${dataType} for ${tensor.name ?? '<unnamed tensor>'}`,
  )
}

const decodeTensor = (tensor: onnx.ITensorProto): OnnxTensor => {
  if (!tensor.name) {
    throw new Error('Initializer tensor is missing a name')
  }
  return {
    name: tensor.name,
    dataType: tensor.dataType ?? 0,
    dims: (tensor.dims ?? []).map((value) => toNumber(value)),
    values: decodeTensorValues(tensor),
  }
}

const decodeAttributeValue = (
  attribute: onnx.IAttributeProto,
): OnnxAttributeValue | undefined => {
  if (attribute.type === ATTRIBUTE_FLOAT_TYPE) {
    return attribute.f ?? 0
  }
  if (attribute.type === ATTRIBUTE_INT_TYPE) {
    return toNumber(attribute.i)
  }
  if (attribute.type === ATTRIBUTE_STRING_TYPE) {
    return decodeUtf8(attribute.s)
  }
  if (attribute.type === ATTRIBUTE_FLOATS_TYPE) {
    return [...(attribute.floats ?? [])]
  }
  if (attribute.type === ATTRIBUTE_INTS_TYPE) {
    return (attribute.ints ?? []).map((value) => toNumber(value))
  }
  if (attribute.type === ATTRIBUTE_STRINGS_TYPE) {
    return (attribute.strings ?? []).map((value) => decodeUtf8(value))
  }
  if (attribute.i != null) {
    return toNumber(attribute.i)
  }
  if (attribute.f != null) {
    return attribute.f
  }
  if (attribute.ints && attribute.ints.length > 0) {
    return attribute.ints.map((value) => toNumber(value))
  }
  if (attribute.floats && attribute.floats.length > 0) {
    return [...attribute.floats]
  }
  if (attribute.s && attribute.s.length > 0) {
    return decodeUtf8(attribute.s)
  }
  return undefined
}

const decodeNode = (node: onnx.INodeProto, index: number): OnnxNode => {
  const attributes: Record<string, OnnxAttributeValue> = {}
  for (const attribute of node.attribute ?? []) {
    if (!attribute.name) {
      continue
    }
    const decoded = decodeAttributeValue(attribute)
    if (decoded !== undefined) {
      attributes[attribute.name] = decoded
    }
  }
  return {
    name: node.name || `${node.opType ?? 'node'}_${index}`,
    opType: node.opType ?? '',
    inputs: [...(node.input ?? [])],
    outputs: [...(node.output ?? [])],
    attributes: Object.freeze(attributes),
  }
}

export const decodeOnnxModel = (bytes: Uint8Array | ArrayBuffer): OnnxModel => {
  const model = onnx.ModelProto.decode(toUint8Array(bytes))
  const graph = model.graph
  if (!graph) {
    throw new Error('ONNX model is missing a graph')
  }

  const initializers = Object.freeze(
    Object.fromEntries(
      (graph.initializer ?? []).map((tensor) => {
        const decoded = decodeTensor(tensor)
        return [decoded.name, decoded]
      }),
    ),
  )

  const inputs = (graph.input ?? [])
    .filter((valueInfo) => valueInfo.name && !(valueInfo.name in initializers))
    .map((valueInfo) => ({
      name: valueInfo.name ?? '',
      dims: readShape(valueInfo),
    }))

  const outputs = (graph.output ?? []).map((valueInfo) => ({
    name: valueInfo.name ?? '',
    dims: readShape(valueInfo),
  }))

  return {
    inputs,
    outputs,
    initializers,
    nodes: (graph.node ?? []).map((node, index) => decodeNode(node, index)),
  }
}

const requireTensor = (
  tensors: Readonly<Record<string, OnnxTensor>>,
  name: string | undefined,
  nodeName: string,
): OnnxTensor => {
  if (!name) {
    throw new Error(`${nodeName} is missing a required tensor input`)
  }
  const tensor = tensors[name]
  if (!tensor) {
    throw new Error(`${nodeName} references unknown initializer ${name}`)
  }
  return tensor
}

const getAttributeNumber = (
  attributes: Readonly<Record<string, OnnxAttributeValue>>,
  name: string,
  fallback: number,
): number => {
  const value = attributes[name]
  if (value === undefined) {
    return fallback
  }
  if (typeof value !== 'number') {
    throw new Error(`Expected numeric attribute ${name}`)
  }
  return value
}

const getAttributeNumbers = (
  attributes: Readonly<Record<string, OnnxAttributeValue>>,
  name: string,
): number[] | undefined => {
  const value = attributes[name]
  if (value === undefined) {
    return undefined
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'number')) {
    throw new Error(`Expected numeric array attribute ${name}`)
  }
  return value as number[]
}

const resolveTensorSize = (dims: readonly number[]): number => {
  return dims.reduce((product, dim) => product * dim, 1)
}

const resolveTensorShape = (
  dims: readonly number[],
  label: string,
): number[] => {
  if (dims.length === 0) {
    throw new Error(`${label} must have at least one dimension`)
  }
  if (dims.length >= 2 && dims[0] === 1) {
    return [...dims.slice(1)]
  }
  if (dims.length === 1) {
    return [dims[0] ?? 0]
  }
  throw new Error(
    `${label} must have a static batch size of 1, received [${dims.join(', ')}]`,
  )
}

const resolveVectorSize = (dims: readonly number[], label: string): number => {
  if (dims.length === 1) {
    return dims[0] ?? 0
  }
  if (dims.length >= 2 && dims[0] === 1) {
    return dims.slice(1).reduce((product, dim) => product * dim, 1)
  }
  throw new Error(
    `${label} must be a static rank-1 tensor or batch-1 tensor, received [${dims.join(', ')}]`,
  )
}

const buildWeightRows = (
  tensor: OnnxTensor,
  inputSize: number,
  outputSize: number,
  transposeB: boolean,
): number[][] => {
  const [dim0 = 0, dim1 = 0] = tensor.dims
  if (tensor.dims.length !== 2) {
    throw new Error(
      `Weight tensor ${tensor.name} must be rank-2, received [${tensor.dims.join(', ')}]`,
    )
  }

  if (transposeB) {
    if (dim0 !== outputSize || dim1 !== inputSize) {
      throw new Error(
        `Weight tensor ${tensor.name} shape mismatch, expected [${outputSize}, ${inputSize}]`,
      )
    }
    return Array.from({ length: outputSize }, (_, row) =>
      Array.from({ length: inputSize }, (_, column) => {
        return tensor.values[row * inputSize + column] ?? 0
      }),
    )
  }

  if (dim0 !== inputSize || dim1 !== outputSize) {
    throw new Error(
      `Weight tensor ${tensor.name} shape mismatch, expected [${inputSize}, ${outputSize}]`,
    )
  }

  return Array.from({ length: outputSize }, (_, row) =>
    Array.from({ length: inputSize }, (_, column) => {
      return tensor.values[column * outputSize + row] ?? 0
    }),
  )
}

const normalizePair = (
  values: number[] | undefined,
  fallback: number,
  name: string,
): [number, number] => {
  if (!values || values.length === 0) {
    return [fallback, fallback]
  }
  if (values.length === 1) {
    return [values[0] ?? fallback, values[0] ?? fallback]
  }
  if (values.length === 2) {
    return [values[0] ?? fallback, values[1] ?? fallback]
  }
  throw new Error(`${name} must have length 1 or 2`)
}

const normalizePads = (
  values: number[] | undefined,
): [number, number, number, number] => {
  if (!values || values.length === 0) {
    return [0, 0, 0, 0]
  }
  if (values.length === 2) {
    return [values[0] ?? 0, values[1] ?? 0, values[0] ?? 0, values[1] ?? 0]
  }
  if (values.length === 4) {
    return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? 0]
  }
  throw new Error('pads must have length 2 or 4')
}

const assertImageShape = (
  shape: readonly number[],
  label: string,
): [number, number, number] => {
  if (shape.length !== 3) {
    throw new Error(`${label} must have shape [channels, height, width]`)
  }
  return [shape[0] ?? 0, shape[1] ?? 0, shape[2] ?? 0]
}

const buildConvLayer = (
  node: OnnxNode,
  inputShape: readonly number[],
  initializers: Readonly<Record<string, OnnxTensor>>,
): ConvLayer => {
  if (node.inputs.length < 2) {
    throw new Error(`${node.name} must have at least two inputs`)
  }

  const [inputChannels, inputHeight, inputWidth] = assertImageShape(
    inputShape,
    `${node.name} input`,
  )
  const weightTensor = requireTensor(initializers, node.inputs[1], node.name)
  const biasTensor = node.inputs[2]
    ? requireTensor(initializers, node.inputs[2], node.name)
    : undefined

  if (weightTensor.dims.length !== 4) {
    throw new Error(`${node.name} weights must be rank-4`)
  }

  const outChannels = weightTensor.dims[0] ?? 0
  const kernelInputChannels = weightTensor.dims[1] ?? 0
  const kernelHeight = weightTensor.dims[2] ?? 0
  const kernelWidth = weightTensor.dims[3] ?? 0
  const group = getAttributeNumber(node.attributes, 'group', 1)
  const strides = normalizePair(
    getAttributeNumbers(node.attributes, 'strides'),
    1,
    'strides',
  )
  const dilations = normalizePair(
    getAttributeNumbers(node.attributes, 'dilations'),
    1,
    'dilations',
  )
  const pads = normalizePads(getAttributeNumbers(node.attributes, 'pads'))

  if (group !== 1) {
    throw new Error(`${node.name} only supports group=1`)
  }
  if (kernelInputChannels !== inputChannels) {
    throw new Error(
      `${node.name} expected ${inputChannels} input channels, received ${kernelInputChannels}`,
    )
  }
  if (
    biasTensor &&
    (biasTensor.dims.length !== 1 || biasTensor.dims[0] !== outChannels)
  ) {
    throw new Error(`${node.name} bias must have shape [${outChannels}]`)
  }

  const dilatedKernelHeight = dilations[0] * (kernelHeight - 1) + 1
  const dilatedKernelWidth = dilations[1] * (kernelWidth - 1) + 1
  const outputHeight = Math.floor(
    (inputHeight + pads[0] + pads[2] - dilatedKernelHeight) / strides[0] + 1,
  )
  const outputWidth = Math.floor(
    (inputWidth + pads[1] + pads[3] - dilatedKernelWidth) / strides[1] + 1,
  )

  if (outputHeight <= 0 || outputWidth <= 0) {
    throw new Error(`${node.name} produced a non-positive spatial output shape`)
  }

  return {
    kind: 'conv',
    name: node.name,
    inputShape: [inputChannels, inputHeight, inputWidth],
    outputShape: [outChannels, outputHeight, outputWidth],
    kernelShape: [kernelHeight, kernelWidth],
    strides,
    dilations,
    pads,
    group,
    weights: [...weightTensor.values],
    bias: biasTensor ? [...biasTensor.values] : Array(outChannels).fill(0),
  }
}

const buildDenseLayer = (
  node: OnnxNode,
  inputSize: number,
  initializers: Readonly<Record<string, OnnxTensor>>,
): DenseLayer => {
  if (node.inputs.length < 3) {
    throw new Error(`${node.name} must have three inputs`)
  }

  const weightTensor = requireTensor(initializers, node.inputs[1], node.name)
  const biasTensor = requireTensor(initializers, node.inputs[2], node.name)
  const alpha = getAttributeNumber(node.attributes, 'alpha', 1)
  const beta = getAttributeNumber(node.attributes, 'beta', 1)
  const transA = getAttributeNumber(node.attributes, 'transA', 0)
  const transB = getAttributeNumber(node.attributes, 'transB', 0)

  if (alpha !== 1 || beta !== 1 || transA !== 0) {
    throw new Error(
      `${node.name} uses unsupported Gemm attributes (alpha=${alpha}, beta=${beta}, transA=${transA})`,
    )
  }

  const outputSize =
    transB === 1 ? (weightTensor.dims[0] ?? 0) : (weightTensor.dims[1] ?? 0)
  if (biasTensor.dims.length !== 1 || biasTensor.dims[0] !== outputSize) {
    throw new Error(
      `Bias tensor ${biasTensor.name} must have shape [${outputSize}]`,
    )
  }

  return {
    name: node.name,
    inputSize,
    outputSize,
    weights: buildWeightRows(weightTensor, inputSize, outputSize, transB === 1),
    bias: [...biasTensor.values],
    activation: 'identity',
  }
}

const buildFlattenOperator = (
  node: OnnxNode,
  inputShape: readonly number[],
): FlattenOperator => {
  const axis = getAttributeNumber(node.attributes, 'axis', 1)
  if (axis !== 1) {
    throw new Error(`${node.name} only supports Flatten(axis=1)`)
  }
  return {
    kind: 'flatten',
    name: node.name,
    inputShape: [...inputShape],
    outputShape: [resolveTensorSize(inputShape)],
  }
}

export const compileDenseNetwork = (model: OnnxModel): DenseNetworkModel => {
  if (model.inputs.length !== 1) {
    throw new Error(
      `Dense network compiler expects exactly one graph input, received ${model.inputs.length}`,
    )
  }
  if (model.outputs.length !== 1) {
    throw new Error(
      `Dense network compiler expects exactly one graph output, received ${model.outputs.length}`,
    )
  }
  if (model.nodes.length === 0) {
    throw new Error('Dense network compiler received an empty graph')
  }

  const inputInfo = model.inputs[0]
  const outputInfo = model.outputs[0]
  if (!inputInfo || !outputInfo) {
    throw new Error('Dense network compiler could not resolve graph IO')
  }

  let currentValueName = inputInfo.name
  let currentSize = resolveVectorSize(inputInfo.dims, `Input ${inputInfo.name}`)
  const layers: DenseLayer[] = []

  for (let index = 0; index < model.nodes.length; index += 1) {
    const node = model.nodes[index]
    if (!node) {
      continue
    }

    if (node.opType === 'Flatten') {
      const axis = getAttributeNumber(node.attributes, 'axis', 1)
      if (axis !== 1) {
        throw new Error(`${node.name} only supports Flatten(axis=1)`)
      }
      if (node.inputs[0] !== currentValueName) {
        throw new Error(`${node.name} does not consume the current value`)
      }
      currentValueName = node.outputs[0] ?? currentValueName
      continue
    }

    if (node.opType === 'Identity') {
      if (node.inputs[0] !== currentValueName) {
        throw new Error(`${node.name} does not consume the current value`)
      }
      currentValueName = node.outputs[0] ?? currentValueName
      continue
    }

    if (node.opType !== 'Gemm') {
      throw new Error(`Unsupported operator ${node.opType} in dense compiler`)
    }
    if (node.inputs[0] !== currentValueName) {
      throw new Error(`${node.name} does not consume the current value`)
    }

    const layer = buildDenseLayer(node, currentSize, model.initializers)
    currentValueName = node.outputs[0] ?? currentValueName
    currentSize = layer.outputSize

    const nextNode = model.nodes[index + 1]
    if (
      nextNode &&
      nextNode.inputs[0] === currentValueName &&
      (nextNode.opType === 'Relu' || nextNode.opType === 'Sigmoid')
    ) {
      layer.activation = nextNode.opType === 'Relu' ? 'relu' : 'sigmoid'
      currentValueName = nextNode.outputs[0] ?? currentValueName
      index += 1
    }

    layers.push(layer)
  }

  if (layers.length === 0) {
    throw new Error('Dense network compiler did not find any Gemm layers')
  }
  if (currentValueName !== outputInfo.name) {
    throw new Error(
      `Dense network compiler ended at ${currentValueName} instead of ${outputInfo.name}`,
    )
  }

  return {
    inputName: inputInfo.name,
    outputName: outputInfo.name,
    inputSize: resolveVectorSize(inputInfo.dims, `Input ${inputInfo.name}`),
    outputSize: resolveVectorSize(outputInfo.dims, `Output ${outputInfo.name}`),
    layers,
  }
}

export const compileSequentialNetwork = (
  model: OnnxModel,
): SequentialNetworkModel => {
  if (model.inputs.length !== 1) {
    throw new Error(
      `Sequential compiler expects exactly one graph input, received ${model.inputs.length}`,
    )
  }
  if (model.outputs.length !== 1) {
    throw new Error(
      `Sequential compiler expects exactly one graph output, received ${model.outputs.length}`,
    )
  }

  const inputInfo = model.inputs[0]
  const outputInfo = model.outputs[0]
  if (!inputInfo || !outputInfo) {
    throw new Error('Sequential compiler could not resolve graph IO')
  }

  let currentValueName = inputInfo.name
  let currentShape = resolveTensorShape(
    inputInfo.dims,
    `Input ${inputInfo.name}`,
  )
  const operators: SequentialOperator[] = []

  for (const node of model.nodes) {
    if (!node) {
      continue
    }
    if (node.inputs[0] !== currentValueName) {
      throw new Error(`${node.name} does not consume the current value`)
    }

    switch (node.opType) {
      case 'Conv': {
        const operator = buildConvLayer(node, currentShape, model.initializers)
        operators.push(operator)
        currentShape = [...operator.outputShape]
        break
      }
      case 'Relu': {
        operators.push({
          kind: 'relu',
          name: node.name,
          shape: [...currentShape],
        })
        break
      }
      case 'Sigmoid': {
        operators.push({
          kind: 'sigmoid',
          name: node.name,
          shape: [...currentShape],
        })
        break
      }
      case 'Identity': {
        operators.push({
          kind: 'identity',
          name: node.name,
          shape: [...currentShape],
        })
        break
      }
      case 'Flatten': {
        const operator = buildFlattenOperator(node, currentShape)
        operators.push(operator)
        currentShape = [...operator.outputShape]
        break
      }
      case 'Gemm': {
        if (currentShape.length !== 1) {
          throw new Error(`${node.name} expects a flattened rank-1 input`)
        }
        const dense = buildDenseLayer(
          node,
          currentShape[0] ?? 0,
          model.initializers,
        )
        operators.push({
          kind: 'dense',
          name: dense.name,
          inputSize: dense.inputSize,
          outputSize: dense.outputSize,
          weights: dense.weights,
          bias: dense.bias,
        })
        currentShape = [dense.outputSize]
        break
      }
      default:
        throw new Error(
          `Unsupported operator ${node.opType} in sequential compiler`,
        )
    }

    currentValueName = node.outputs[0] ?? currentValueName
  }

  if (currentValueName !== outputInfo.name) {
    throw new Error(
      `Sequential compiler ended at ${currentValueName} instead of ${outputInfo.name}`,
    )
  }

  return {
    inputName: inputInfo.name,
    outputName: outputInfo.name,
    inputShape: resolveTensorShape(inputInfo.dims, `Input ${inputInfo.name}`),
    outputShape: resolveTensorShape(
      outputInfo.dims,
      `Output ${outputInfo.name}`,
    ),
    operators,
  }
}
