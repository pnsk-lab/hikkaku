Inherit repository-wide rules from the root `AGENTS.md`.

Package scope: `packages/hikkaku/**`

- Public entrypoints are managed by `package.json` exports and `src/index.ts` plus `src/{assets,blocks,client,vite}/index.ts`.
- Keep block APIs grouped by domain files under `src/blocks/` and keep core compiler logic under `src/core/`.
- Run `bun run typecheck` after TypeScript API changes; run `bun run build` when build output behavior changes.
- When exports, entrypoints, or package boundaries change, update this file and `README.md` in the same change.
