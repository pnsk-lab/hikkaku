---
title: Blocks - Music
impact: HIGH
---

<!-- AUTO-GENERATED FILE. Do not edit manually.
Edit packages/hikkaku/src/blocks and packages/skill/scripts/build-blocks.ts instead. -->

# Music

## playDrumForBeats(drum, beats)

Plays drum for beats.

Input: `drum`, `beats`.

Output: Scratch statement block definition that is appended to the current script stack.

* `drum: See function signature for accepted input values`
* `beats: See function signature for accepted input values`

Example:
```ts
import { playDrumForBeats } from 'hikkaku/blocks'

playDrumForBeats(1, 0.25)
```

## midiPlayDrumForBeats(drum, beats)

Plays drum for beats with MIDI drum mapping.

Input: `drum`, `beats`.

Output: Scratch statement block definition that is appended to the current script stack.

* `drum: See function signature for accepted input values`
* `beats: See function signature for accepted input values`

Example:
```ts
import { midiPlayDrumForBeats } from 'hikkaku/blocks'

midiPlayDrumForBeats(36, 0.25)
```

## restForBeats(beats)

Rests for beats.

Input: `beats`.

Output: Scratch statement block definition that is appended to the current script stack.

* `beats: See function signature for accepted input values`

Example:
```ts
import { restForBeats } from 'hikkaku/blocks'

restForBeats(0.25)
```

## playNoteForBeats(note, beats)

Plays note for beats.

Input: `note`, `beats`.

Output: Scratch statement block definition that is appended to the current script stack.

* `note: See function signature for accepted input values`
* `beats: See function signature for accepted input values`

Example:
```ts
import { playNoteForBeats } from 'hikkaku/blocks'

playNoteForBeats(60, 0.25)
```

## setInstrument(instrument)

Sets instrument.

Input: `instrument`.

Output: Scratch statement block definition that is appended to the current script stack.

* `instrument: See function signature for accepted input values`

Example:
```ts
import { setInstrument } from 'hikkaku/blocks'

setInstrument(1)
```

## midiSetInstrument(instrument)

Sets instrument with MIDI instrument mapping.

Input: `instrument`.

Output: Scratch statement block definition that is appended to the current script stack.

* `instrument: See function signature for accepted input values`

Example:
```ts
import { midiSetInstrument } from 'hikkaku/blocks'

midiSetInstrument(1)
```

## setTempo(tempo)

Sets tempo.

Input: `tempo`.

Output: Scratch statement block definition that is appended to the current script stack.

* `tempo: See function signature for accepted input values`

Example:
```ts
import { setTempo } from 'hikkaku/blocks'

setTempo(60)
```

## changeTempo(tempo)

Changes tempo.

Input: `tempo`.

Output: Scratch statement block definition that is appended to the current script stack.

* `tempo: See function signature for accepted input values`

Example:
```ts
import { changeTempo } from 'hikkaku/blocks'

changeTempo(20)
```

## getTempo()

Returns tempo.

Input: none.

Output: Scratch reporter block definition that can be used as an input value in other blocks.

Example:
```ts
import { getTempo } from 'hikkaku/blocks'

getTempo()
```
