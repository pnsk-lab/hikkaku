# create-hikkaku

Scaffold a new Hikkaku project from `examples/base`.

## Usage

```bash
npx create-hikkaku
# or
bunx create-hikkaku
```

## Options

```bash
create-hikkaku [project-name] [options]

-y, --yes
--pm, --package-manager <pm>
--agents / --no-agents
--link-claude / --no-link-claude
--skills / --no-skills
--ref <git-tag>
```

`--ref` 未指定時は `create-hikkaku` の `version` と同じ Git タグからテンプレートを取得します。
