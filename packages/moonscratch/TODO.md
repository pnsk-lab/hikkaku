# TODO

Scratch VM (`scratch-editor/packages/scratch-vm`) と比較した未実装 opcode 管理。

## Done in this pass (`control_*`)

- [x] `control_all_at_once`
- [x] `control_clear_counter`
- [x] `control_create_clone_of`
- [x] `control_for_each`
- [x] `control_get_counter`
- [x] `control_incr_counter`
- [x] `control_repeat_until`
- [x] `control_start_as_clone`
- [x] `control_wait_until`
- [x] `control_while`

## Remaining core opcodes

### `data_*`

- [x] `data_hidelist` (headless no-op)
- [x] `data_hidevariable` (headless no-op)
- [x] `data_itemnumoflist`
- [x] `data_showlist` (headless no-op)
- [x] `data_showvariable` (headless no-op)

### `event_*`

- [x] `event_whenbackdropswitchesto`
- [x] `event_whengreaterthan`
- [x] `event_whenkeypressed`
- [x] `event_whenstageclicked`
- [x] `event_whenthisspriteclicked`
- [x] `event_whentouchingobject`

### `looks_*`

- [x] `looks_backdropnumbername`
- [x] `looks_changeeffectby`
- [x] `looks_changestretchby` (headless no-op)
- [x] `looks_cleargraphiceffects`
- [x] `looks_costumenumbername`
- [x] `looks_goforwardbackwardlayers` (headless no-op)
- [x] `looks_gotofrontback` (headless no-op)
- [x] `looks_hideallsprites`
- [x] `looks_nextbackdrop`
- [x] `looks_seteffectto`
- [x] `looks_setstretchto` (headless no-op)
- [x] `looks_size`
- [x] `looks_switchbackdropto`
- [x] `looks_switchbackdroptoandwait`

### `motion_*`

- [x] `motion_align_scene` (headless no-op)
- [x] `motion_direction`
- [x] `motion_glidesecstoxy`
- [x] `motion_glideto`
- [x] `motion_goto`
- [x] `motion_ifonedgebounce`
- [x] `motion_pointindirection`
- [x] `motion_pointtowards`
- [x] `motion_scroll_right` (headless no-op)
- [x] `motion_scroll_up` (headless no-op)
- [x] `motion_setrotationstyle` (headless no-op)
- [x] `motion_xposition`
- [x] `motion_xscroll` (returns `0`)
- [x] `motion_yposition`
- [x] `motion_yscroll` (returns `0`)

### `procedures_*`

- [x] `procedures_call`
- [x] `procedures_definition`

### `sensing_*`

- [x] `sensing_coloristouchingcolor`
- [x] `sensing_current`
- [x] `sensing_dayssince2000`
- [x] `sensing_distanceto`
- [x] `sensing_keypressed`
- [x] `sensing_loud`
- [x] `sensing_loudness`
- [x] `sensing_mousedown`
- [x] `sensing_mousex`
- [x] `sensing_mousey`
- [x] `sensing_of`
- [x] `sensing_online`
- [x] `sensing_resettimer`
- [x] `sensing_touchingcolor`
- [x] `sensing_touchingobject`
- [x] `sensing_userid`
- [x] `sensing_username`

### `sound_*`

- [x] `sound_beats_menu`
- [x] `sound_changeeffectby`
- [x] `sound_changevolumeby`
- [x] `sound_cleareffects`
- [x] `sound_effects_menu`
- [x] `sound_seteffectto`
- [x] `sound_setvolumeto`
- [x] `sound_sounds_menu`
- [x] `sound_volume`

## Extensions

### Implemented

- `music_*` (`playDrumForBeats`, `midiPlayDrumForBeats`, `restForBeats`, `playNoteForBeats`, `setInstrument`, `midiSetInstrument`, `setTempo`, `changeTempo`, `getTempo`)
- `pen_*` (`clear`, `stamp`, `penDown`, `penUp`, `setPenColorToColor`, `changePenColorParamBy`, `setPenColorParamTo`, `changePenSizeBy`, `setPenSizeTo`, `setPenHueToNumber`, `changePenHueBy`, `setPenShadeToNumber`, `changePenShadeBy`)
- `text2speech_*` (`speakAndWait`, `setVoice`, `setLanguage`)
- `translate_*` (`getTranslate`, `getViewerLanguage`)

### Not started

`videoSensing_*`, `wedo2_*`, `ev3_*`, `boost_*`, `gdxfor_*`, `makeymakey_*`, `microbit_*`, `faceSensing_*`
