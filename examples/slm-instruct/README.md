# SLM Instruct Example

Pure Scratch block/list runtime example for a small instruct-tuned causal language model.

## Commands

```bash
bun run model:refresh
bun run build
bun run dev
```

`bun run build` now also emits `dist/model-parameters.txt`.
At startup only the `modelParameters` list monitor is shown.
Load that text file into `modelParameters`, then press the space key to parse and expand those values into the runtime tensor lists and reveal the conversation list.
The file is emitted as at most 50 newline-delimited items, with each item containing many slash-separated values.
During chat, entering `/new` resets the conversation context without reloading the model parameters.

Build-time model selection is controlled by environment variables. For example:

```bash
SLM_MODEL_REPO=SmallDoge/Doge-60M-Instruct \
SLM_MODEL_REVISION=main \
bun run model:refresh
```

The default model source is `SmallDoge/Doge-60M-Instruct`, but you can point the pipeline at any compatible Hugging Face repo that provides the same artifact set (`config.json`, tokenizer files, and `model.safetensors`).

Optional build-time token limits:

```bash
SLM_MAX_PROMPT_TOKENS=128 \
SLM_MAX_NEW_TOKENS=8 \
SLM_MAX_TOTAL_TOKENS=144 \
bun run model:generate
```

Optional build-time float precision for static list serialization:

```bash
SLM_STATIC_FLOAT_PRECISION=6 \
bun run build
```

Tensor parameters are emitted without q8 quantization. Only
`SLM_STATIC_FLOAT_PRECISION` affects how float values are serialized into
`model-parameters.txt`.

- `Green flag`: ask for a prompt, tokenize it, run a short greedy decode, and display the result.
- `Green flag`: shows only `modelParameters` first and waits for you to import `model-parameters.txt` and press space.
- `model:refresh`: fetch the selected Hugging Face revision, generate runtime metadata, and build reference fixtures.
