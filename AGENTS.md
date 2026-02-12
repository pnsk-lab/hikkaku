# Repository Guidelines

## Project Structure & Module Organization
- `packages/hikkaku/` is the main library package. Source lives in `packages/hikkaku/src/` (e.g., `blocks/`, `core/`, `client/`, `vite/`, `utils/`).
- `packages/skill/` contains skill docs and guides (`guides/`, `practices/`).
- `examples/example1/` is the dev playground app for running the library with Vite.
- Root configs: `biome.json`, `tsconfig.json`, and workspace `package.json`.

## AGENTS.md Maintenance Policy
- Treat every `AGENTS.md` as a living contract for agents.
- When project structure, scripts, conventions, or package responsibilities change, update the affected `AGENTS.md` files in the same PR/commit.
- Keep this root `AGENTS.md` for cross-repo rules and keep `packages/*/AGENTS.md` for package-local rules.
- Prefer the closest `AGENTS.md` to the file being edited when instructions differ.

## Build, Test, and Development Commands
- `bun install`: install workspace dependencies.
- `bun run dev`: start the example app in `examples/example1` via Vite.
- `bun lint`: run lint + format checks across the repo.
- `bun fmt`: apply formatting (use before committing).

## Coding Style & Naming Conventions
- TypeScript/ESM (`type: module`); keep exports in `packages/hikkaku/src/index.ts` and related `src/*` entrypoints.
- Biome formatting: spaces for indentation, single quotes, and semicolons only when needed.
- Prefer descriptive, domain-based names (`blocks`, `compiler`, `client`) and keep file names lower-case.

## Testing Guidelines
- No automated test runner is configured in this repo yet.
- If you add tests, place them near the code (e.g., `packages/hikkaku/src/**/__tests__/*.test.ts`) and document the command in `package.json`.

## Configuration & Security Notes
- Keep dependency changes minimal and pinned to workspace scope.
- Avoid adding secrets to the repo; use local `.env` files in examples if needed.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commit-style prefixes (e.g., `feat:`, `fix:`, `rename:`, `feat(blocks):`). Keep them concise and action-oriented.
- PRs should include a clear summary, link relevant issues/PRs, and add screenshots/GIFs for visible UI changes in `examples/example1`.
* If you are Codex, use `Co-authored-by: chatgpt-codex-connector[bot] <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>` in the commit message to credit the human collaborator.
  * You have to add `--author="chatgpt-codex-connector[bot] <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>" --no-gpg-sign` option to git commit command.
  Example:
  ```sh
    git commit -m "fix: correct minor typos in code\n\nCo-authored-by: chatgpt-codex-connector[bot] <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>" --author="chatgpt-codex-connector[bot] <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>" --no-gpg-sign
    ```
* You can use git command and gh command to commit, push and create PR.
* Use "Squash and merge" to merge the PR on GitHub.

* commands you have to use before commiting:
  * `bun fmt`: apply formatting
  * `bun typecheck`: run type checking
  * `bun ref:build`: update the docs
