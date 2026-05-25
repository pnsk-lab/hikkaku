import { Num, Vector } from '@hikkaku/gobox'
import type { ScopedNumberValue, ScopedVectorValue } from '@hikkaku/gobox/value'
import {
  __unstable_getBuildTarget,
  type HikkakuNumber,
  type ListReference,
  type PrimitiveSource,
  type Target,
  type VariableReference,
} from 'hikkaku'
import {
  add,
  and,
  callProcedure,
  changeVariableBy,
  defineProcedure,
  divide,
  forEach,
  getItemOfList,
  getVariable,
  gt,
  ifThen,
  lt,
  mathop,
  multiply,
  procedureLabel,
  replaceItemOfList,
  setVariableTo,
} from 'hikkaku/blocks'
import type {
  ConvLayer,
  DenseLayer,
  DenseNetworkModel,
  DenseOperator,
  SequentialNetworkModel,
  SequentialOperator,
} from './model'

export interface DenseNetworkSession {
  readonly input: ScopedVectorValue<typeof Num>
  readonly output: ScopedVectorValue<typeof Num>
  run(
    values: ReadonlyArray<PrimitiveSource<HikkakuNumber>>,
  ): ScopedVectorValue<typeof Num>
}

export interface SequentialNetworkSession {
  readonly input: ScopedVectorValue<typeof Num>
  readonly output: ScopedVectorValue<typeof Num>
  run(
    values: ReadonlyArray<PrimitiveSource<HikkakuNumber>>,
  ): ScopedVectorValue<typeof Num>
}

const POINTWISE_CHUNK_SIZE = 96
const DENSE_CHUNK_SIZE = 1

let denseSessionCounter = 0
let sequentialSessionCounter = 0

const sigmoidReporter = (
  value: PrimitiveSource<HikkakuNumber>,
): PrimitiveSource<HikkakuNumber> => {
  return divide(1, add(1, mathop('e ^', multiply(-1, value))))
}

const reluReporter = (
  value: PrimitiveSource<HikkakuNumber>,
): PrimitiveSource<HikkakuNumber> => {
  return divide(add(value, mathop('abs', value)), 2)
}

const shapeSize = (dims: readonly number[]): number => {
  return dims.reduce((product, dim) => product * dim, 1)
}

const _convIndex = (
  height: number,
  width: number,
  channel: number,
  y: number,
  x: number,
): number => {
  return channel * height * width + y * width + x
}

const chunkRanges = (
  length: number,
  chunkSize: number,
): Array<[number, number]> => {
  const ranges: Array<[number, number]> = []
  for (let start = 0; start < length; start += chunkSize) {
    ranges.push([start, Math.min(start + chunkSize, length)])
  }
  return ranges
}

const pointwiseReporter = (
  kind: SequentialOperator['kind'],
  source: PrimitiveSource<HikkakuNumber>,
): PrimitiveSource<HikkakuNumber> => {
  if (kind === 'relu') {
    return reluReporter(source)
  }
  if (kind === 'sigmoid') {
    return sigmoidReporter(source)
  }
  return source
}

const makeProcedureName = (
  prefix: string,
  sessionId: number,
  operatorName: string,
  chunkIndex: number,
): string => {
  const normalized = operatorName
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .slice(0, 32)
  return `${prefix} ${sessionId} ${normalized || 'op'} ${chunkIndex}`
}

const _definePointwiseProcedures = (
  prefix: string,
  sessionId: number,
  operatorName: string,
  kind: Extract<
    SequentialOperator['kind'],
    'flatten' | 'identity' | 'relu' | 'sigmoid'
  >,
  source: ScopedVectorValue<typeof Num>,
  destination: ScopedVectorValue<typeof Num>,
) => {
  return chunkRanges(source.length, POINTWISE_CHUNK_SIZE).map(
    ([start, end], chunkIndex) =>
      defineProcedure(
        [
          procedureLabel(
            makeProcedureName(prefix, sessionId, operatorName, chunkIndex),
          ),
        ],
        () => {
          for (let index = start; index < end; index += 1) {
            destination
              .at(index)
              .set(pointwiseReporter(kind, source.at(index).get()))
          }
        },
        true,
      ),
  )
}

const denseReporterForLayer = (
  layer: DenseLayer | DenseOperator,
  source: ScopedVectorValue<typeof Num>,
  outputIndex: number,
): PrimitiveSource<HikkakuNumber> => {
  let sum: PrimitiveSource<HikkakuNumber> = layer.bias[outputIndex] ?? 0
  for (let inputIndex = 0; inputIndex < layer.inputSize; inputIndex += 1) {
    sum = add(
      sum,
      multiply(
        source.at(inputIndex).get(),
        layer.weights[outputIndex]?.[inputIndex] ?? 0,
      ),
    )
  }
  if ('activation' in layer) {
    if (layer.activation === 'relu') {
      return reluReporter(sum)
    }
    if (layer.activation === 'sigmoid') {
      return sigmoidReporter(sum)
    }
  }
  return sum
}

const defineDenseProcedures = (
  prefix: string,
  sessionId: number,
  layer: DenseLayer | DenseOperator,
  source: ScopedVectorValue<typeof Num>,
  destination: ScopedVectorValue<typeof Num>,
) => {
  return chunkRanges(layer.outputSize, DENSE_CHUNK_SIZE).map(
    ([start, end], chunkIndex) =>
      defineProcedure(
        [
          procedureLabel(
            makeProcedureName(prefix, sessionId, layer.name, chunkIndex),
          ),
        ],
        () => {
          for (let outputIndex = start; outputIndex < end; outputIndex += 1) {
            destination
              .at(outputIndex)
              .set(denseReporterForLayer(layer, source, outputIndex))
          }
        },
        true,
      ),
  )
}

const assertBuildTarget = (): Target => {
  const target = __unstable_getBuildTarget()
  if (!target) {
    throw new Error('onnx runtime must be created inside target.run()')
  }
  return target
}

const createHiddenList = (
  target: Target,
  name: string,
  values: readonly number[],
): ListReference => {
  return target.createList(name, [...values])
}

const createZeroList = (
  target: Target,
  name: string,
  length: number,
): ListReference => {
  return createHiddenList(target, name, Array(length).fill(0))
}

const readNumberListItem = (
  list: ListReference,
  index: PrimitiveSource<HikkakuNumber>,
): PrimitiveSource<HikkakuNumber> => {
  return add(getItemOfList(list, index) as PrimitiveSource<HikkakuNumber>, 0)
}

const createListBackedVector = (
  list: ListReference,
  length: number,
): ScopedVectorValue<typeof Num> => {
  return {
    length,
    at: (index: number) => {
      if (!Number.isInteger(index) || index < 0 || index >= length) {
        throw new Error(
          `vector index out of range: ${index} (length: ${length})`,
        )
      }
      const oneBasedIndex = index + 1
      const value: ScopedNumberValue = {
        get: () =>
          readNumberListItem(list, oneBasedIndex) as ReturnType<
            ScopedNumberValue['get']
          >,
        set: (next) => {
          replaceItemOfList(list, oneBasedIndex, next)
        },
        borrow: () => ({
          get: () =>
            readNumberListItem(list, oneBasedIndex) as ReturnType<
              ScopedNumberValue['get']
            >,
        }),
        borrowMut: () => ({
          get: () =>
            readNumberListItem(list, oneBasedIndex) as ReturnType<
              ScopedNumberValue['get']
            >,
          set: (next) => {
            replaceItemOfList(list, oneBasedIndex, next)
          },
        }),
      }
      return value
    },
  }
}

type SequentialLoopState = {
  readonly pointIndex: VariableReference
  readonly outputIndex: VariableReference
  readonly inputIndex: VariableReference
  readonly outputChannel: VariableReference
  readonly outputY: VariableReference
  readonly outputX: VariableReference
  readonly inputChannel: VariableReference
  readonly kernelY: VariableReference
  readonly kernelX: VariableReference
  readonly inputY: VariableReference
  readonly inputX: VariableReference
  readonly accumulator: VariableReference
  readonly weightIndex: VariableReference
  readonly scratch: VariableReference
}

const createSequentialLoopState = (
  target: Target,
  sessionId: number,
): SequentialLoopState => {
  const prefix = `__onnx_seq_${sessionId}`
  return {
    pointIndex: target.createVariable(`${prefix}_point_i`, 0),
    outputIndex: target.createVariable(`${prefix}_out_i`, 0),
    inputIndex: target.createVariable(`${prefix}_in_i`, 0),
    outputChannel: target.createVariable(`${prefix}_oc`, 0),
    outputY: target.createVariable(`${prefix}_oy`, 0),
    outputX: target.createVariable(`${prefix}_ox`, 0),
    inputChannel: target.createVariable(`${prefix}_ic`, 0),
    kernelY: target.createVariable(`${prefix}_ky`, 0),
    kernelX: target.createVariable(`${prefix}_kx`, 0),
    inputY: target.createVariable(`${prefix}_iy`, 0),
    inputX: target.createVariable(`${prefix}_ix`, 0),
    accumulator: target.createVariable(`${prefix}_acc`, 0),
    weightIndex: target.createVariable(`${prefix}_weight_i`, 0),
    scratch: target.createVariable(`${prefix}_scratch`, 0),
  }
}

const flattenDenseWeights = (weights: readonly number[][]): number[] => {
  const flat: number[] = []
  for (const row of weights) {
    flat.push(...row)
  }
  return flat
}

const defineSequentialPointwiseProcedure = (
  sessionId: number,
  operatorName: string,
  kind: Extract<
    SequentialOperator['kind'],
    'flatten' | 'identity' | 'relu' | 'sigmoid'
  >,
  source: ListReference,
  destination: ListReference,
  length: number,
  loopState: SequentialLoopState,
) => {
  return defineProcedure(
    [
      procedureLabel(
        makeProcedureName('onnx seq pointwise', sessionId, operatorName, 0),
      ),
    ],
    () => {
      forEach(loopState.pointIndex, length, () => {
        const index = getVariable(
          loopState.pointIndex,
        ) as PrimitiveSource<HikkakuNumber>
        replaceItemOfList(
          destination,
          index,
          pointwiseReporter(kind, readNumberListItem(source, index)),
        )
      })
    },
    true,
  )
}

const defineSequentialDenseProcedure = (
  sessionId: number,
  operator: DenseOperator,
  source: ListReference,
  destination: ListReference,
  target: Target,
  loopState: SequentialLoopState,
  operatorIndex: number,
) => {
  const weightList = createHiddenList(
    target,
    `__onnx_seq_${sessionId}_dense_${operatorIndex}_weights`,
    flattenDenseWeights(operator.weights),
  )
  const biasList = createHiddenList(
    target,
    `__onnx_seq_${sessionId}_dense_${operatorIndex}_bias`,
    operator.bias,
  )

  return defineProcedure(
    [
      procedureLabel(
        makeProcedureName('onnx seq dense', sessionId, operator.name, 0),
      ),
    ],
    () => {
      forEach(loopState.outputIndex, operator.outputSize, () => {
        setVariableTo(
          loopState.accumulator,
          readNumberListItem(
            biasList,
            getVariable(
              loopState.outputIndex,
            ) as PrimitiveSource<HikkakuNumber>,
          ),
        )

        forEach(loopState.inputIndex, operator.inputSize, () => {
          setVariableTo(
            loopState.weightIndex,
            multiply(
              add(
                getVariable(
                  loopState.outputIndex,
                ) as PrimitiveSource<HikkakuNumber>,
                -1,
              ),
              operator.inputSize,
            ),
          )
          changeVariableBy(
            loopState.weightIndex,
            getVariable(loopState.inputIndex) as PrimitiveSource<HikkakuNumber>,
          )
          changeVariableBy(
            loopState.accumulator,
            multiply(
              readNumberListItem(
                source,
                getVariable(
                  loopState.inputIndex,
                ) as PrimitiveSource<HikkakuNumber>,
              ),
              readNumberListItem(
                weightList,
                getVariable(
                  loopState.weightIndex,
                ) as PrimitiveSource<HikkakuNumber>,
              ),
            ),
          )
        })

        replaceItemOfList(
          destination,
          getVariable(loopState.outputIndex) as PrimitiveSource<HikkakuNumber>,
          getVariable(loopState.accumulator) as PrimitiveSource<HikkakuNumber>,
        )
      })
    },
    true,
  )
}

const defineSequentialConvProcedure = (
  sessionId: number,
  operator: ConvLayer,
  source: ListReference,
  destination: ListReference,
  target: Target,
  loopState: SequentialLoopState,
  operatorIndex: number,
) => {
  const [inputChannels, inputHeight, inputWidth] = operator.inputShape
  const [outputChannels, outputHeight, outputWidth] = operator.outputShape
  const [kernelHeight, kernelWidth] = operator.kernelShape
  const [strideY, strideX] = operator.strides
  const [dilationY, dilationX] = operator.dilations
  const [padTop, padLeft] = operator.pads
  const inputPlaneSize = inputHeight * inputWidth
  const outputPlaneSize = outputHeight * outputWidth

  const weightList = createHiddenList(
    target,
    `__onnx_seq_${sessionId}_conv_${operatorIndex}_weights`,
    operator.weights,
  )
  const biasList = createHiddenList(
    target,
    `__onnx_seq_${sessionId}_conv_${operatorIndex}_bias`,
    operator.bias,
  )

  return defineProcedure(
    [
      procedureLabel(
        makeProcedureName('onnx seq conv', sessionId, operator.name, 0),
      ),
    ],
    () => {
      forEach(loopState.outputChannel, outputChannels, () => {
        forEach(loopState.outputY, outputHeight, () => {
          forEach(loopState.outputX, outputWidth, () => {
            setVariableTo(
              loopState.accumulator,
              readNumberListItem(
                biasList,
                getVariable(
                  loopState.outputChannel,
                ) as PrimitiveSource<HikkakuNumber>,
              ),
            )

            forEach(loopState.inputChannel, inputChannels, () => {
              forEach(loopState.kernelY, kernelHeight, () => {
                setVariableTo(
                  loopState.inputY,
                  add(
                    add(
                      multiply(
                        add(
                          getVariable(
                            loopState.outputY,
                          ) as PrimitiveSource<HikkakuNumber>,
                          -1,
                        ),
                        strideY,
                      ),
                      multiply(
                        add(
                          getVariable(
                            loopState.kernelY,
                          ) as PrimitiveSource<HikkakuNumber>,
                          -1,
                        ),
                        dilationY,
                      ),
                    ),
                    1 - padTop,
                  ),
                )

                ifThen(
                  and(
                    gt(
                      getVariable(
                        loopState.inputY,
                      ) as PrimitiveSource<HikkakuNumber>,
                      0,
                    ),
                    lt(
                      getVariable(
                        loopState.inputY,
                      ) as PrimitiveSource<HikkakuNumber>,
                      inputHeight + 1,
                    ),
                  ),
                  () => {
                    forEach(loopState.kernelX, kernelWidth, () => {
                      setVariableTo(
                        loopState.inputX,
                        add(
                          add(
                            multiply(
                              add(
                                getVariable(
                                  loopState.outputX,
                                ) as PrimitiveSource<HikkakuNumber>,
                                -1,
                              ),
                              strideX,
                            ),
                            multiply(
                              add(
                                getVariable(
                                  loopState.kernelX,
                                ) as PrimitiveSource<HikkakuNumber>,
                                -1,
                              ),
                              dilationX,
                            ),
                          ),
                          1 - padLeft,
                        ),
                      )

                      ifThen(
                        and(
                          gt(
                            getVariable(
                              loopState.inputX,
                            ) as PrimitiveSource<HikkakuNumber>,
                            0,
                          ),
                          lt(
                            getVariable(
                              loopState.inputX,
                            ) as PrimitiveSource<HikkakuNumber>,
                            inputWidth + 1,
                          ),
                        ),
                        () => {
                          setVariableTo(
                            loopState.inputIndex,
                            multiply(
                              add(
                                getVariable(
                                  loopState.inputChannel,
                                ) as PrimitiveSource<HikkakuNumber>,
                                -1,
                              ),
                              inputPlaneSize,
                            ),
                          )
                          changeVariableBy(
                            loopState.inputIndex,
                            multiply(
                              add(
                                getVariable(
                                  loopState.inputY,
                                ) as PrimitiveSource<HikkakuNumber>,
                                -1,
                              ),
                              inputWidth,
                            ),
                          )
                          changeVariableBy(
                            loopState.inputIndex,
                            getVariable(
                              loopState.inputX,
                            ) as PrimitiveSource<HikkakuNumber>,
                          )

                          setVariableTo(
                            loopState.weightIndex,
                            multiply(
                              add(
                                getVariable(
                                  loopState.outputChannel,
                                ) as PrimitiveSource<HikkakuNumber>,
                                -1,
                              ),
                              inputChannels,
                            ),
                          )
                          changeVariableBy(
                            loopState.weightIndex,
                            add(
                              getVariable(
                                loopState.inputChannel,
                              ) as PrimitiveSource<HikkakuNumber>,
                              -1,
                            ),
                          )
                          setVariableTo(
                            loopState.weightIndex,
                            multiply(
                              getVariable(
                                loopState.weightIndex,
                              ) as PrimitiveSource<HikkakuNumber>,
                              kernelHeight,
                            ),
                          )
                          changeVariableBy(
                            loopState.weightIndex,
                            add(
                              getVariable(
                                loopState.kernelY,
                              ) as PrimitiveSource<HikkakuNumber>,
                              -1,
                            ),
                          )
                          setVariableTo(
                            loopState.weightIndex,
                            multiply(
                              getVariable(
                                loopState.weightIndex,
                              ) as PrimitiveSource<HikkakuNumber>,
                              kernelWidth,
                            ),
                          )
                          changeVariableBy(
                            loopState.weightIndex,
                            getVariable(
                              loopState.kernelX,
                            ) as PrimitiveSource<HikkakuNumber>,
                          )

                          changeVariableBy(
                            loopState.accumulator,
                            multiply(
                              readNumberListItem(
                                source,
                                getVariable(
                                  loopState.inputIndex,
                                ) as PrimitiveSource<HikkakuNumber>,
                              ),
                              readNumberListItem(
                                weightList,
                                getVariable(
                                  loopState.weightIndex,
                                ) as PrimitiveSource<HikkakuNumber>,
                              ),
                            ),
                          )
                        },
                      )
                    })
                  },
                )
              })
            })

            setVariableTo(
              loopState.outputIndex,
              multiply(
                add(
                  getVariable(
                    loopState.outputChannel,
                  ) as PrimitiveSource<HikkakuNumber>,
                  -1,
                ),
                outputPlaneSize,
              ),
            )
            changeVariableBy(
              loopState.outputIndex,
              multiply(
                add(
                  getVariable(
                    loopState.outputY,
                  ) as PrimitiveSource<HikkakuNumber>,
                  -1,
                ),
                outputWidth,
              ),
            )
            changeVariableBy(
              loopState.outputIndex,
              getVariable(loopState.outputX) as PrimitiveSource<HikkakuNumber>,
            )
            replaceItemOfList(
              destination,
              getVariable(
                loopState.outputIndex,
              ) as PrimitiveSource<HikkakuNumber>,
              getVariable(
                loopState.accumulator,
              ) as PrimitiveSource<HikkakuNumber>,
            )
          })
        })
      })
    },
    true,
  )
}

export const createDenseNetworkSession = (
  model: DenseNetworkModel,
): DenseNetworkSession => {
  if (model.layers.length === 0) {
    throw new Error('Dense network session requires at least one layer')
  }

  const sessionId = denseSessionCounter
  denseSessionCounter += 1

  const input = Vector.configure(Num, model.inputSize).makeScopedValue()
  const buffers = model.layers.map((layer) =>
    Vector.configure(Num, layer.outputSize).makeScopedValue(),
  )
  const output = buffers[buffers.length - 1]
  if (!output) {
    throw new Error('Dense network session did not allocate an output buffer')
  }

  const procedures = model.layers.map((layer, layerIndex) => {
    const source = layerIndex === 0 ? input : buffers[layerIndex - 1]
    const destination = buffers[layerIndex]
    if (!source || !destination) {
      throw new Error(`Missing dense buffer for layer ${layerIndex}`)
    }
    return defineDenseProcedures(
      'onnx dense',
      sessionId,
      layer,
      source,
      destination,
    )
  })

  const run = (
    values: ReadonlyArray<PrimitiveSource<HikkakuNumber>>,
  ): ScopedVectorValue<typeof Num> => {
    if (values.length !== model.inputSize) {
      throw new Error(
        `Dense network expected ${model.inputSize} inputs, received ${values.length}`,
      )
    }

    values.forEach((value, index) => {
      input.at(index).set(value)
    })

    procedures.forEach((chunks) => {
      chunks.forEach((procedure) => {
        callProcedure(procedure, [])
      })
    })

    return output
  }

  return {
    input,
    output,
    run,
  }
}

export const createSequentialNetworkSession = (
  model: SequentialNetworkModel,
): SequentialNetworkSession => {
  if (model.operators.length === 0) {
    throw new Error('Sequential network session requires at least one operator')
  }

  const target = assertBuildTarget()
  const sessionId = sequentialSessionCounter
  sequentialSessionCounter += 1

  const inputSize = shapeSize(model.inputShape)
  const outputSize = shapeSize(model.outputShape)
  const inputList = createZeroList(
    target,
    `__onnx_seq_${sessionId}_input`,
    inputSize,
  )
  const bufferLists = model.operators.map((operator, operatorIndex) => {
    const size =
      operator.kind === 'conv'
        ? shapeSize(operator.outputShape)
        : operator.kind === 'dense'
          ? operator.outputSize
          : operator.kind === 'flatten'
            ? shapeSize(operator.outputShape)
            : shapeSize(operator.shape)
    return createZeroList(
      target,
      `__onnx_seq_${sessionId}_buffer_${operatorIndex}`,
      size,
    )
  })
  const outputList = bufferLists[bufferLists.length - 1]
  if (!outputList) {
    throw new Error(
      'Sequential network session did not allocate an output buffer',
    )
  }

  const loopState = createSequentialLoopState(target, sessionId)
  const procedures = model.operators.map((operator, operatorIndex) => {
    const source =
      operatorIndex === 0 ? inputList : bufferLists[operatorIndex - 1]
    const destination = bufferLists[operatorIndex]
    if (!source || !destination) {
      throw new Error(`Missing sequential buffer for operator ${operatorIndex}`)
    }

    switch (operator.kind) {
      case 'conv':
        return defineSequentialConvProcedure(
          sessionId,
          operator,
          source,
          destination,
          target,
          loopState,
          operatorIndex,
        )
      case 'dense':
        return defineSequentialDenseProcedure(
          sessionId,
          operator,
          source,
          destination,
          target,
          loopState,
          operatorIndex,
        )
      case 'flatten':
      case 'identity':
      case 'relu':
      case 'sigmoid':
        return defineSequentialPointwiseProcedure(
          sessionId,
          operator.name,
          operator.kind,
          source,
          destination,
          shapeSize(
            operator.kind === 'flatten' ? operator.outputShape : operator.shape,
          ),
          loopState,
        )
      default: {
        const exhaustiveOperator: never = operator
        void exhaustiveOperator
        throw new Error('Unsupported sequential operator')
      }
    }
  })

  const input = createListBackedVector(inputList, inputSize)
  const output = createListBackedVector(outputList, outputSize)

  const run = (
    values: ReadonlyArray<PrimitiveSource<HikkakuNumber>>,
  ): ScopedVectorValue<typeof Num> => {
    if (values.length !== inputSize) {
      throw new Error(
        `Sequential network expected ${inputSize} inputs, received ${values.length}`,
      )
    }

    values.forEach((value, index) => {
      replaceItemOfList(inputList, index + 1, value)
    })

    procedures.forEach((procedure) => {
      callProcedure(procedure, [])
    })

    return output
  }

  return {
    input,
    output,
    run,
  }
}
