## MoonScratch Headless Interpreter Plan (Skill適用版)

### Summary

scratch-editor/packages/scratch-vm を参照して、project.json + assets(Map) 入力のヘッドレス
コアは MoonBit、音声/時刻/入力/乱数/ログは Host 抽象経由で差し替え可能にする（JS固定実装に
しない）。
JS からは Wasm ラッパ API で利用可能にする。

### Skill Usage（追加反映）

この計画では moonscratch/.agents/skills の以下を使う。

1. moonbit-agent-guide（最初）

- パッケージ境界確認、moon ツール運用、検証手順の標準化に使う。

2. moonbit-practice（実装中ずっと）

- MoonBit 構文/テスト/moon ide 優先の実装規約に従うために使う。

3. moonbit-refactoring（中盤以降）

- API縮小・責務分割・互換を崩さない整理を行う際に使う。

### Public APIs / Interfaces

- trait HostAdapter
- HostEffect（PlaySound, StopAllSounds, MonitorUpdate, CloudUpdate など）
- Vm API
  - new/start/green_flag/step/post_io/broadcast/stop_all/snapshot/dispose
- JS API
  - createHeadlessVM({projectJson, assets, options, host})
  - start(), greenFlag(), step(dtMs), postIO(), onEffect(), getSnapshot()

### Implementation

1. moonscratch を分割

- sb3（project.json デシリアライズと block graph）
- host（HostAdapter + default no-op）

- Scratch3 主要カテゴリを scratch-vm 挙動に合わせる。
- 副作用は全て HostEffect 化し、ランタイム本体はヘッドレスを維持。

3. 拡張互換

- extension registry を用意し、ペン/音楽/ビデオ/TTS を段階的に対応。

### Tests / Scenarios

- 統合: 主要サンプル project.json + assets 実行で状態遷移検証。

### Acceptance Criteria

- project.json + assets Map だけで実行可能。
- 主要サンプルでクラッシュせず想定状態へ到達。
- JS API が start/step/postIO/stop/snapshot で運用可能。

### Assumptions

- 入力は Scratch3 (project.json) を標準対象とする。
- Host 実装は利用側差し替え前提（JS直書き固定ではない）。
- 完全互換志向だが、実装は段階的に進める。
