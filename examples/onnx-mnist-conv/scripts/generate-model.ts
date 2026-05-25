import {
  compileSequentialNetwork,
  decodeOnnxModel,
  type SequentialNetworkModel,
} from '@hikkaku/onnx'

type MnistSample = {
  label: number
  pixels: number[]
}

const onnxPath = new URL('../artifacts/mnist-conv.onnx', import.meta.url)
const samplesPath = new URL('../artifacts/mnist-samples.json', import.meta.url)
const modelOutputPath = new URL('../src/model.generated.ts', import.meta.url)
const samplesOutputPath = new URL(
  '../src/samples.generated.ts',
  import.meta.url,
)

const modelBytes = await Bun.file(onnxPath).bytes()
const model = compileSequentialNetwork(decodeOnnxModel(modelBytes))
const samples = (await Bun.file(samplesPath).json()) as MnistSample[]

const writeModule = async (
  path: URL,
  exportName: string,
  value: unknown,
  typeName?: string,
) => {
  const suffix = typeName ? ` satisfies ${typeName}` : ''
  await Bun.write(
    path,
    `export const ${exportName} = ${JSON.stringify(value, null, 2)}${suffix}\n`,
  )
}

await writeModule(
  modelOutputPath,
  'mnistConvModel',
  model,
  'import("@hikkaku/onnx").SequentialNetworkModel',
)
await writeModule(samplesOutputPath, 'mnistSamples', samples)

const summarizeModel = (value: SequentialNetworkModel): string => {
  return `${value.operators.length} operators, input=${value.inputShape.join('x')}, output=${value.outputShape.join('x')}`
}

console.log(`generated ${modelOutputPath.pathname} (${summarizeModel(model)})`)
console.log(
  `generated ${samplesOutputPath.pathname} (${samples.length} samples)`,
)
