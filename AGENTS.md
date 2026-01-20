# Repository Guidelines

## Project Structure & Module Organization
- `packages/hikkaku/` is the main library package. Source lives in `packages/hikkaku/src/` (e.g., `blocks/`, `compiler/`, `client/`, `vite/`, `utils/`).
- `packages/skill/` contains skill docs and guides (`guides/`, `practices/`).
- `examples/example1/` is the dev playground app for running the library with Vite.
- Root configs: `biome.json`, `tsconfig.json`, and workspace `package.json`.

## Build, Test, and Development Commands
- `bun install`: install workspace dependencies.
- `bun run dev`: start the example app in `examples/example1` via Vite.
- `bunx biome check .`: run lint + format checks across the repo.
- `bunx biome format .`: apply formatting (use before committing).

## Coding Style & Naming Conventions
- TypeScript/ESM (`type: module`); keep exports in `packages/hikkaku/src/index.ts` and related `src/*` entrypoints.
- Biome formatting: spaces for indentation, single quotes, and semicolons only when needed.
- Prefer descriptive, domain-based names (`blocks`, `compiler`, `client`) and keep file names lower-case.

## Testing Guidelines
- No automated test runner is configured in this repo yet.
- If you add tests, place them near the code (e.g., `packages/hikkaku/src/**/__tests__/*.test.ts`) and document the command in `package.json`.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commit-style prefixes (e.g., `feat:`, `fix:`, `rename:`, `feat(blocks):`). Keep them concise and action-oriented.
- PRs should include a clear summary, link relevant issues/PRs, and add screenshots/GIFs for visible UI changes in `examples/example1`.

## Configuration & Security Notes
- Keep dependency changes minimal and pinned to workspace scope.
- Avoid adding secrets to the repo; use local `.env` files in examples if needed.
