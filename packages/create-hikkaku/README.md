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

`--ref` 未指定時は `create-hikkaku@<version>` 形式の Git タグ
（例: `create-hikkaku@0.1.9`）からテンプレートを取得します。
