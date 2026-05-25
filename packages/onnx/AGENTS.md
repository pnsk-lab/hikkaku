Inherit repository-wide rules from the root `AGENTS.md`.

Package scope: `packages/onnx/**`

- Keep `@hikkaku/onnx` focused on ONNX decoding and Gobox-based inference helpers.
- Support only the smallest ONNX subset needed for the checked-in examples unless the API clearly advertises otherwise.
- Run `bun run typecheck` and `bun run test` in this package after API changes.
