Inherit repository-wide rules from the root `AGENTS.md`.

Package scope: `packages/minifier/**`

- Keep the core JSON minifier in `src/minify.ts` and Vite integration in `src/vite.ts`.
- Preserve runtime semantics over byte savings when the two conflict. Document every best-effort optimization that can miss dynamic string references.
- Run `bun run typecheck` after changing exported APIs or block-rewrite logic.
- Run `bun run test` after changing rename or pruning behavior.
- When exports, package boundaries, or release workflow integration change, update this file and `README.md` in the same change.
