Inherit repository-wide rules from the root `AGENTS.md`.

Package scope: `packages/create-hikkaku/**`

- CLI source is `src/main.ts`; distributable output is `dist/main.js`.
- Use `bun run build` in this package after changing CLI behavior.
- Keep scaffold behavior aligned with `examples/base` and documented flags in `README.md`.
- When options or generated files change, update this file and `README.md` in the same change.
