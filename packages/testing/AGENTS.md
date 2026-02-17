# Package Scope: `packages/testing/**`

This package provides Vitest-oriented utilities for unit testing Hikkaku projects with MoonScratch.

## Rules

- Keep public APIs minimal and discovery-friendly for test authoring.
- Keep helper behavior deterministic and side-effect free outside VM execution context.
- Run `bun run typecheck` after type-level API changes.

## Testing

- Use this package's helpers with Vitest (`vitest` or `vite-plus/test`) assertions.
- Add focused tests under `src/` for helper behavior changes when possible.
