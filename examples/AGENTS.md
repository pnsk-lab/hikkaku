To create a new example, copy `templates/base/` to a new folder in `examples/` and modify the files as needed.

Examples that cannot be built in CI (for example, because they depend on large gitignored model artifacts) must set `"showcase": false` in their `package.json` so the docs showcase skips them. They must also be omitted from the `hikkaku-docs#build` dependencies in `turbo.json`.
