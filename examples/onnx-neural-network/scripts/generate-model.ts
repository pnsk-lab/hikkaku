import {
  compileDenseNetwork,
  type DenseNetworkModel,
  decodeOnnxModel,
} from '@hikkaku/onnx'

const artifactPath = new URL('../artifacts/xor-mlp.onnx', import.meta.url)
const outputPath = new URL('../src/model.generated.ts', import.meta.url)

const onnxBytes = await Bun.file(artifactPath).bytes()
const denseModel = compileDenseNetwork(decodeOnnxModel(onnxBytes))

const moduleSource = `import type { DenseNetworkModel } from '@hikkaku/onnx'

export const xorDenseNetworkModel = ${JSON.stringify(
  denseModel,
  null,
  2,
)} satisfies DenseNetworkModel
`

await Bun.write(outputPath, moduleSource)

const summary = (model: DenseNetworkModel): string => {
  return `${model.layers.length} layers, input=${model.inputSize}, output=${model.outputSize}`
}

console.log(`generated ${outputPath.pathname} (${summary(denseModel)})`)
