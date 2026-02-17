# Project Agents.md Guide

This is a [MoonBit](https://docs.moonbitlang.com) project.

You can browse and install extra skills here:
<https://github.com/moonbitlang/skills>

## Project Structure

- MoonBit packages are organized per directory; each directory contains a
  `moon.pkg` file listing its dependencies. Each package has its files and
  blackbox test files (ending in `_test.mbt`) and whitebox test files (ending in
  `_wbtest.mbt`).

- In the toplevel directory, there is a `moon.mod.json` file listing module
  metadata.

* Tests under `src/` are unit tests only; macro-style tests should be written in `test/`.

## AGENTS.md Maintenance

- Place `AGENTS.md` files not only at the root but also in major directories where responsibilities diverge.
- Agents should autonomously update related `AGENTS.md` files when project structure or operating rules change, keeping instructions synchronized with the current state.

## Coding convention

- MoonBit code is organized in block style, each block is separated by `///|`,
  the order of each block is irrelevant. In some refactorings, you can process
  block by block independently.

- Try to keep deprecated blocks in file called `deprecated.mbt` in each
  directory.

## Tooling

- `moon fmt` is used to format your code properly.

- `moon ide` provides project navigation helpers like `peek-def`, `outline`, and
  `find-references`. See $moonbit-agent-guide for details.

- `moon info` is used to update the generated interface of the package, each
  package has a generated interface file `.mbti`, it is a brief formal
  description of the package. If nothing in `.mbti` changes, this means your
  change does not bring the visible changes to the external package users, it is
  typically a safe refactoring.

- In the last step, run `moon info && moon fmt` to update the interface and
  format the code. Check the diffs of `.mbti` file to see if the changes are
  expected.

- Run `moon test` to check tests pass. MoonBit supports snapshot testing; when
  changes affect outputs, run `moon test --update` to refresh snapshots.

- Prefer `assert_eq` or `assert_true(pattern is Pattern(...))` for results that
  are stable or very unlikely to change. Use snapshot tests to record current
  behavior. For solid, well-defined results (e.g. scientific computations),
  prefer assertion tests. You can use `moon coverage analyze > uncovered.log` to
  see which parts of your code are not covered by tests.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commit-style prefixes (e.g., `feat:`, `fix:`, `rename:`, `feat(blocks):`). Keep them concise and action-oriented.
- PRs should include a clear summary, link relevant issues/PRs, and add screenshots/GIFs for visible UI changes in `examples/example1`.

* If you are Codex, use `Co-authored-by: chatgpt-codex-connector[bot] <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>` in the commit message to credit the human collaborator.
  - You have to add `--author="chatgpt-codex-connector[bot] <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>" --no-gpg-sign` option to git commit command.
    Example:
  ```sh
    git commit -m "fix: correct minor typos in code\n\nCo-authored-by: chatgpt-codex-connector[bot] <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>" --author="chatgpt-codex-connector[bot] <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>" --no-gpg-sign
  ```
* You can use git command and gh command to commit, push and create PR.
* Use "Squash and merge" to merge the PR on GitHub.

## JS

- Uses Bun as runtime environment.
- `bun run test` to run tests. `vite-plus/test` API is same as `vitest`.
- `bun run build` to build the project.
- `bun typecheck` to typecheck the code using `tsgo`.
- If you add or modify tests, run `bun run test` before reporting completion.
- Required before finishing any change in `packages/moonscratch`:
  - `bun typecheck`
  - `moon check`
  - `bun run test`
- For project-level tests, generate `project.json` using `hikkaku`.

## Precompiled Cache Safety

- Caches stored in `PrecompiledProject` must be limited to immutable data derived from the initial compiled project state.
- Never store or feed back mutable VM execution state (runtime threads, pen/render buffers, variable/list mutations, etc.) into `PrecompiledProject`.
- Creating a new VM from the same compiled program must always produce the same initial state as a fresh compile, and must not be affected by prior VM execution (including `emptyCompiled`-style reuse).
