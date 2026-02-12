///|
let music_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_tempo": ["tempo_var", 0]
  #|      },
  #|      "lists": {},
  #|      "blocks": {}
  #|    },
  #|    {
  #|      "isStage": false,
  #|      "name": "Sprite1",
  #|      "variables": {},
  #|      "lists": {},
  #|      "blocks": {
  #|        "hat_flag": {
  #|          "opcode": "event_whenflagclicked",
  #|          "next": "set_tempo",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "set_tempo": {
  #|          "opcode": "music_setTempo",
  #|          "next": "change_tempo",
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "TEMPO": [1, [4, 100]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "change_tempo": {
  #|          "opcode": "music_changeTempo",
  #|          "next": "set_tempo_var",
  #|          "parent": "set_tempo",
  #|          "inputs": {
  #|            "TEMPO": [1, [4, -10]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_tempo_var": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_instrument",
  #|          "parent": "change_tempo",
  #|          "inputs": {
  #|            "VALUE": [2, "tempo_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["tempo_var", "var_tempo"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "tempo_reporter": {
  #|          "opcode": "music_getTempo",
  #|          "next": null,
  #|          "parent": "set_tempo_var",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_instrument": {
  #|          "opcode": "music_setInstrument",
  #|          "next": "play_note",
  #|          "parent": "set_tempo_var",
  #|          "inputs": {
  #|            "INSTRUMENT": [1, [4, 2]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "play_note": {
  #|          "opcode": "music_playNoteForBeats",
  #|          "next": "play_drum",
  #|          "parent": "set_instrument",
  #|          "inputs": {
  #|            "NOTE": [1, [4, 60]],
  #|            "BEATS": [1, [4, 0.1]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "play_drum": {
  #|          "opcode": "music_playDrumForBeats",
  #|          "next": "rest",
  #|          "parent": "play_note",
  #|          "inputs": {
  #|            "DRUM": [1, [4, 1]],
  #|            "BEATS": [1, [4, 0.1]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rest": {
  #|          "opcode": "music_restForBeats",
  #|          "next": null,
  #|          "parent": "play_drum",
  #|          "inputs": {
  #|            "BEATS": [1, [4, 0.1]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
test "music extension opcodes update tempo and emit note/drum effects" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(music_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)
  for _ in 0..<40 {
    ignore(@moonscratch.vm_step(vm, 16))
  }

  let snapshot = unwrap_result(
    try? @json.parse(@moonscratch.vm_snapshot_json(vm)),
    "snapshot parse failed",
  )
  let root_obj = match snapshot {
    Object(obj) => obj
    _ => fail("snapshot must be object")
  }
  let targets = match root_obj["targets"] {
    Array(items) => items
    _ => fail("targets must be array")
  }
  let stage = match targets[0] {
    Object(obj) => obj
    _ => fail("stage must be object")
  }
  let vars = match stage["variables"] {
    Object(obj) => obj
    _ => fail("variables must be object")
  }
  assert_eq(vars["var_tempo"], Json::number(90.0))

  let effects = unwrap_result(
    try? @json.parse(@moonscratch.vm_take_effects_json(vm)),
    "effects parse failed",
  )
  let effect_items = match effects {
    Array(items) => items
    _ => fail("effects must be array")
  }
  let mut has_note = false
  let mut has_drum = false
  for effect in effect_items {
    match effect {
      Object(obj) =>
        if obj["type"] == Json::string("music_play_note") {
          has_note = true
          assert_eq(obj["note"], Json::number(60.0))
          assert_eq(obj["instrument"], Json::number(2.0))
          assert_eq(obj["tempo"], Json::number(90.0))
        } else if obj["type"] == Json::string("music_play_drum") {
          has_drum = true
          assert_eq(obj["drum"], Json::number(1.0))
          assert_eq(obj["tempo"], Json::number(90.0))
        }
      _ => ()
    }
  }
  assert_true(has_note)
  assert_true(has_drum)
}

///|
let text2speech_translate_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_viewer": ["viewer", ""],
  #|        "var_trans": ["translated", ""],
  #|        "var_done": ["done", 0]
  #|      },
  #|      "lists": {},
  #|      "blocks": {}
  #|    },
  #|    {
  #|      "isStage": false,
  #|      "name": "Sprite1",
  #|      "variables": {},
  #|      "lists": {},
  #|      "blocks": {
  #|        "hat_flag": {
  #|          "opcode": "event_whenflagclicked",
  #|          "next": "set_viewer",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "set_viewer": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_translate",
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "VALUE": [2, "viewer_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["viewer", "var_viewer"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "viewer_reporter": {
  #|          "opcode": "translate_getViewerLanguage",
  #|          "next": null,
  #|          "parent": "set_viewer",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_translate": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_voice",
  #|          "parent": "set_viewer",
  #|          "inputs": {
  #|            "VALUE": [2, "translate_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["translated", "var_trans"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "translate_reporter": {
  #|          "opcode": "translate_getTranslate",
  #|          "next": null,
  #|          "parent": "set_translate",
  #|          "inputs": {
  #|            "WORDS": [1, [10, "hello"]],
  #|            "LANGUAGE": [1, [10, "ja"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_voice": {
  #|          "opcode": "text2speech_setVoice",
  #|          "next": "set_language",
  #|          "parent": "set_translate",
  #|          "inputs": {
  #|            "VOICE": [1, [10, "TENOR"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_language": {
  #|          "opcode": "text2speech_setLanguage",
  #|          "next": "speak",
  #|          "parent": "set_voice",
  #|          "inputs": {
  #|            "LANGUAGE": [1, [10, "ja"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "speak": {
  #|          "opcode": "text2speech_speakAndWait",
  #|          "next": "set_done",
  #|          "parent": "set_language",
  #|          "inputs": {
  #|            "WORDS": [1, [10, "hello"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_done": {
  #|          "opcode": "data_setvariableto",
  #|          "next": null,
  #|          "parent": "speak",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 1]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["done", "var_done"]
  #|          },
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
test "text2speech and translate extension opcodes use JS-provided API data" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(text2speech_translate_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)
  @moonscratch.vm_post_io_json(vm, "viewer_language", "\"ja\"")
  @moonscratch.vm_post_io_json(
    vm, "translate_cache", "{\"ja\":{\"hello\":\"こんにちは\"}}",
  )

  for _ in 0..<6 {
    ignore(@moonscratch.vm_step(vm, 16))
  }
  @moonscratch.vm_post_io_json(vm, "text2speech_done_1", "true")
  for _ in 0..<10 {
    ignore(@moonscratch.vm_step(vm, 16))
  }

  let snapshot = unwrap_result(
    try? @json.parse(@moonscratch.vm_snapshot_json(vm)),
    "snapshot parse failed",
  )
  let root_obj = match snapshot {
    Object(obj) => obj
    _ => fail("snapshot must be object")
  }
  let targets = match root_obj["targets"] {
    Array(items) => items
    _ => fail("targets must be array")
  }
  let stage = match targets[0] {
    Object(obj) => obj
    _ => fail("stage must be object")
  }
  let vars = match stage["variables"] {
    Object(obj) => obj
    _ => fail("variables must be object")
  }
  assert_eq(vars["var_viewer"], Json::string("ja"))
  assert_eq(vars["var_trans"], Json::string("こんにちは"))
  assert_eq(vars["var_done"], Json::number(1.0))

  let effects = unwrap_result(
    try? @json.parse(@moonscratch.vm_take_effects_json(vm)),
    "effects parse failed",
  )
  let effect_items = match effects {
    Array(items) => items
    _ => fail("effects must be array")
  }
  let mut has_tts = false
  let mut has_translate_request = false
  for effect in effect_items {
    match effect {
      Object(obj) =>
        if obj["type"] == Json::string("text_to_speech") {
          has_tts = true
          assert_eq(obj["voice"], Json::string("TENOR"))
          assert_eq(obj["language"], Json::string("ja"))
          assert_eq(obj["waitKey"], Json::string("text2speech_done_1"))
        } else if obj["type"] == Json::string("translate_request") {
          has_translate_request = true
        }
      _ => ()
    }
  }
  assert_true(has_tts)
  assert_true(!has_translate_request)
}

///|
let pen_touching_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_touch_bg": ["touch_bg", false],
  #|        "var_touch_mask": ["touch_mask", false],
  #|        "var_touch_pen": ["touch_pen", false]
  #|      },
  #|      "lists": {},
  #|      "costumes": [
  #|        {
  #|          "name": "backdrop1",
  #|          "assetId": "bg_green",
  #|          "bitmapResolution": 1,
  #|          "rotationCenterX": 0,
  #|          "rotationCenterY": 0
  #|        }
  #|      ],
  #|      "blocks": {}
  #|    },
  #|    {
  #|      "isStage": false,
  #|      "name": "Sprite1",
  #|      "x": 0,
  #|      "y": 0,
  #|      "direction": 90,
  #|      "size": 100,
  #|      "visible": true,
  #|      "variables": {},
  #|      "lists": {},
  #|      "costumes": [
  #|        {
  #|          "name": "costume1",
  #|          "assetId": "sprite_red",
  #|          "bitmapResolution": 1,
  #|          "rotationCenterX": 0,
  #|          "rotationCenterY": 0
  #|        }
  #|      ],
  #|      "blocks": {
  #|        "hat_flag": {
  #|          "opcode": "event_whenflagclicked",
  #|          "next": "set_touch_bg",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "set_touch_bg": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_touch_mask",
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_touch_bg"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["touch_bg", "var_touch_bg"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_touch_bg": {
  #|          "opcode": "sensing_touchingcolor",
  #|          "next": null,
  #|          "parent": "set_touch_bg",
  #|          "inputs": {
  #|            "COLOR": [1, [10, "#00ff00"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_touch_mask": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "pen_color",
  #|          "parent": "set_touch_bg",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_touch_mask"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["touch_mask", "var_touch_mask"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_touch_mask": {
  #|          "opcode": "sensing_coloristouchingcolor",
  #|          "next": null,
  #|          "parent": "set_touch_mask",
  #|          "inputs": {
  #|            "COLOR": [1, [10, "#ff0000"]],
  #|            "COLOR2": [1, [10, "#00ff00"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "pen_color": {
  #|          "opcode": "pen_setPenColorToColor",
  #|          "next": "pen_down",
  #|          "parent": "set_touch_mask",
  #|          "inputs": {
  #|            "COLOR": [1, [10, "#0000ff"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "pen_down": {
  #|          "opcode": "pen_penDown",
  #|          "next": "move_steps",
  #|          "parent": "pen_color",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "move_steps": {
  #|          "opcode": "motion_movesteps",
  #|          "next": "set_touch_pen",
  #|          "parent": "pen_down",
  #|          "inputs": {
  #|            "STEPS": [1, [4, 20]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_touch_pen": {
  #|          "opcode": "data_setvariableto",
  #|          "next": null,
  #|          "parent": "move_steps",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_touch_pen"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["touch_pen", "var_touch_pen"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_touch_pen": {
  #|          "opcode": "sensing_touchingcolor",
  #|          "next": null,
  #|          "parent": "set_touch_pen",
  #|          "inputs": {
  #|            "COLOR": [1, [10, "#0000ff"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
let pen_touching_assets =
  #|{
  #|  "bg_green": {
  #|    "width": 1,
  #|    "height": 1,
  #|    "rgbaBase64": "AP8A/w=="
  #|  },
  #|  "sprite_red": {
  #|    "width": 1,
  #|    "height": 1,
  #|    "rgbaBase64": "/wAA/w=="
  #|  }
  #|}

///|
test "pen opcodes draw into headless buffer and touching color reporters read it" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(
      pen_touching_project,
      assets_json=pen_touching_assets,
    ),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)
  for _ in 0..<60 {
    ignore(@moonscratch.vm_step(vm, 16))
  }

  let snapshot = unwrap_result(
    try? @json.parse(@moonscratch.vm_snapshot_json(vm)),
    "snapshot parse failed",
  )
  let root_obj = match snapshot {
    Object(obj) => obj
    _ => fail("snapshot must be object")
  }
  let targets = match root_obj["targets"] {
    Array(items) => items
    _ => fail("targets must be array")
  }
  let stage = match targets[0] {
    Object(obj) => obj
    _ => fail("stage must be object")
  }
  let vars = match stage["variables"] {
    Object(obj) => obj
    _ => fail("variables must be object")
  }
  assert_eq(vars["var_touch_bg"], Json::boolean(true))
  assert_eq(vars["var_touch_mask"], Json::boolean(true))
  assert_eq(vars["var_touch_pen"], Json::boolean(true))

  let effects = unwrap_result(
    try? @json.parse(@moonscratch.vm_take_effects_json(vm)),
    "effects parse failed",
  )
  let effect_items = match effects {
    Array(items) => items
    _ => fail("effects must be array")
  }
  for effect in effect_items {
    match effect {
      Object(obj) =>
        if obj["type"] == Json::string("log") {
          match obj["message"] {
            String(message) => assert_true(!message.contains("pen_"))
            _ => ()
          }
        }
      _ => ()
    }
  }
}

///|
test "render_svg outputs composited scene colors" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(
      pen_touching_project,
      assets_json=pen_touching_assets,
    ),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)
  for _ in 0..<60 {
    ignore(@moonscratch.vm_step(vm, 16))
  }

  let svg = @moonscratch.vm_render_svg(vm)
  assert_true(svg.contains("<svg"))
  assert_true(svg.contains("shape-rendering=\"crispEdges\""))
  assert_true(svg.contains("rgb(0,255,0)"))
  assert_true(svg.contains("rgb(255,0,0)"))
  assert_true(svg.contains("rgb(0,0,255)"))
  assert_true(svg.contains("</svg>"))
}
