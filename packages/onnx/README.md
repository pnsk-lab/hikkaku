# @hikkaku/onnx

Minimal ONNX utilities for hikkaku. The package can compile small dense and sequential convolution-style networks exported from PyTorch and run inference through Gobox-backed buffers.

## Installation

```bash
bun add @hikkaku/onnx
```

## Usage

```ts
import {
  compileSequentialNetwork,
  createSequentialNetworkSession,
  decodeOnnxModel,
} from '@hikkaku/onnx'

const onnxModel = decodeOnnxModel(bytes)
const network = compileSequentialNetwork(onnxModel)

sprite.run(() => {
  const session = createSequentialNetworkSession(network)
  const output = session.run(Array(28 * 28).fill(0))
  output.at(0).get()
})
```

Currently supported operator subset:

- `Conv`
- `Gemm`
- `Relu`
- `Sigmoid`
- `Flatten`
- `Identity`
