# @hikkaku/gobox

Higher-level typed value and function helpers for `hikkaku`.

## Modules

- `@hikkaku/gobox/value`
- `@hikkaku/gobox/types`
- `@hikkaku/gobox/functions`

## Notes

- Uses Scratch lists as memory backing.
- Dynamic scoped values are released on scope exit via stack-pointer rollback.
- `control_stop` is forbidden inside gobox-managed dynamic scopes.
- `trait()` + `useImpl()` can enforce required method names for struct extensions.
- `useImpl()` accepts either `useFunction(...)` results or function option objects.
