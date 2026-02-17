# js/vm

- Manages VM bindings and execution support logic.
- Maintains runtime/program WASM ABI bridging (`factory.ts`, `program-wasm.ts`); keep ABI checks and payload decoding explicit.
- Since type guards, normalization, and JSON conversion are prone to spec drift, tests are required.
- Use shared test data in `../test/test-projects.ts` to reduce duplication.
