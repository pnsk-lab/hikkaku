Inherit repository-wide rules from the root `AGENTS.md`.

Package scope: `packages/skill/**`

- Skill entry is `hikkaku/SKILL.md`; supporting rules are in `hikkaku/rules/`.
- Use `bun run build-blocks` after changing block-related rule docs.
- Use `bun run build-blocks:check` to verify generated block references are up to date.
- When skill workflow or rule structure changes, update this file in the same change.
