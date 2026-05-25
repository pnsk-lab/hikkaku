# ONNX Neural Network Example

This example trains a small XOR classifier in PyTorch, exports it to ONNX, converts the ONNX graph into a typed dense-network spec, and runs inference in hikkaku through `@hikkaku/onnx`.

## Commands

```bash
bun run model:refresh
bun run dev
```

`model:refresh` runs:

1. `uv` + PyTorch training in [train.py](/home/nakasyou/hikkaku/hikkaku1/examples/onnx-neural-network/train.py)
2. ONNX export to `artifacts/xor-mlp.onnx`
3. TS spec generation into [model.generated.ts](/home/nakasyou/hikkaku/hikkaku1/examples/onnx-neural-network/src/model.generated.ts)
