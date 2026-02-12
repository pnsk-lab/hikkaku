Inherit repository-wide rules from the root `AGENTS.md`.

Package scope: `packages/gpts-zip/**`

- Build logic lives in `scripts/build.ts`; output artifact is `dist.zip`.
- Use `bun run build` in this package after touching zip generation flow.
- Keep temporary files under `.tmp/`; do not move them to other package paths.
- If archive structure or build inputs change, update this file and `README.md` together.
