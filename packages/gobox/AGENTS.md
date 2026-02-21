Inherit repository-wide rules from the root `AGENTS.md`.

Package scope: `packages/gobox/**`

- Keep `@hikkaku/gobox` focused on higher-level value/function abstractions over `hikkaku`.
- Do not expose raw pointer internals as public stable API.
- Keep `hikkaku` core changes minimal and `__unstable_*`-scoped when required.
- Run `bun run typecheck` and `bun run test` in this package after API changes.
