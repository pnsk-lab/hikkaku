///|
let procedures_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_inside": ["inside", 0],
  #|        "var_outside": ["outside", 0]
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
  #|          "next": "set_outside",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "set_outside": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "call_proc",
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "VALUE": [2, "arg_outside"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["outside", "var_outside"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "arg_outside": {
  #|          "opcode": "argument_reporter_string_number",
  #|          "next": null,
  #|          "parent": "set_outside",
  #|          "inputs": {},
  #|          "fields": {
  #|            "VALUE": ["x", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "call_proc": {
  #|          "opcode": "procedures_call",
  #|          "next": null,
  #|          "parent": "set_outside",
  #|          "inputs": {
  #|            "arg_id": [1, [4, 7]]
  #|          },
  #|          "fields": {},
  #|          "mutation": {
  #|            "proccode": "set inside %s",
  #|            "argumentids": "[\"arg_id\"]",
  #|            "argumentnames": "[\"x\"]",
  #|            "argumentdefaults": "[0]",
  #|            "warp": "false"
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "proc_def": {
  #|          "opcode": "procedures_definition",
  #|          "next": "set_inside",
  #|          "parent": null,
  #|          "inputs": {
  #|            "custom_block": [1, "proc_proto"]
  #|          },
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "proc_proto": {
  #|          "opcode": "procedures_prototype",
  #|          "next": null,
  #|          "parent": "proc_def",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "mutation": {
  #|            "proccode": "set inside %s",
  #|            "argumentids": "[\"arg_id\"]",
  #|            "argumentnames": "[\"x\"]",
  #|            "argumentdefaults": "[0]",
  #|            "warp": "false"
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_inside": {
  #|          "opcode": "data_setvariableto",
  #|          "next": null,
  #|          "parent": "proc_def",
  #|          "inputs": {
  #|            "VALUE": [2, "arg_inside"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["inside", "var_inside"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "arg_inside": {
  #|          "opcode": "argument_reporter_string_number",
  #|          "next": null,
  #|          "parent": "set_inside",
  #|          "inputs": {},
  #|          "fields": {
  #|            "VALUE": ["x", null]
  #|          },
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
test "procedures call and argument reporters" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(procedures_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)
  for _ in 0..<20 {
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
  assert_eq(vars["var_inside"], Json::number(7.0))
  assert_eq(vars["var_outside"], Json::number(0.0))
}

///|
let sensing_sound_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_timer": ["timer_value", 0],
  #|        "var_sm": ["sound_menu", ""],
  #|        "var_em": ["effect_menu", ""],
  #|        "var_bm": ["beats_menu", ""],
  #|        "var_vol": ["volume", 0],
  #|        "var_mx": ["mouse_x", 0],
  #|        "var_my": ["mouse_y", 0],
  #|        "var_md": ["mouse_down", false],
  #|        "var_key": ["space_down", false],
  #|        "var_touch": ["touching_mouse", false],
  #|        "var_dist": ["distance", 0],
  #|        "var_loudness": ["loudness", 0],
  #|        "var_loud": ["loud", false],
  #|        "var_online": ["online", false],
  #|        "var_username": ["username", ""],
  #|        "var_userid": ["userid", 0],
  #|        "var_current_year": ["current_year", 0],
  #|        "var_days": ["days_since_2000", 0],
  #|        "var_of_x": ["of_x", 0],
  #|        "var_of_volume": ["of_volume", 0],
  #|        "var_touchingcolor": ["touching_color", false],
  #|        "var_color_touch": ["color_touch", false]
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
  #|          "next": "set_volume",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "set_volume": {
  #|          "opcode": "sound_setvolumeto",
  #|          "next": "change_volume",
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "VOLUME": [1, [4, 20]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "change_volume": {
  #|          "opcode": "sound_changevolumeby",
  #|          "next": "set_effect",
  #|          "parent": "set_volume",
  #|          "inputs": {
  #|            "VOLUME": [1, [4, 5]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_effect": {
  #|          "opcode": "sound_seteffectto",
  #|          "next": "change_effect",
  #|          "parent": "change_volume",
  #|          "inputs": {
  #|            "EFFECT": [1, [10, "pitch"]],
  #|            "VALUE": [1, [4, 30]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "change_effect": {
  #|          "opcode": "sound_changeeffectby",
  #|          "next": "clear_effect",
  #|          "parent": "set_effect",
  #|          "inputs": {
  #|            "EFFECT": [1, [10, "pitch"]],
  #|            "VALUE": [1, [4, 5]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "clear_effect": {
  #|          "opcode": "sound_cleareffects",
  #|          "next": "reset_timer",
  #|          "parent": "change_effect",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "reset_timer": {
  #|          "opcode": "sensing_resettimer",
  #|          "next": "wait_short",
  #|          "parent": "clear_effect",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "wait_short": {
  #|          "opcode": "control_wait",
  #|          "next": "set_timer",
  #|          "parent": "reset_timer",
  #|          "inputs": {
  #|            "DURATION": [1, [4, 0.05]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_timer": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_sound_menu",
  #|          "parent": "wait_short",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_timer"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["timer_value", "var_timer"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_sound_menu": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_effect_menu",
  #|          "parent": "set_timer",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_sound_menu"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["sound_menu", "var_sm"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_effect_menu": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_beats_menu",
  #|          "parent": "set_sound_menu",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_effect_menu"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["effect_menu", "var_em"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_beats_menu": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_volume_reporter",
  #|          "parent": "set_effect_menu",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_beats_menu"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["beats_menu", "var_bm"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_volume_reporter": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_mousex",
  #|          "parent": "set_beats_menu",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_volume"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["volume", "var_vol"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_mousex": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_mousey",
  #|          "parent": "set_volume_reporter",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_mousex"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["mouse_x", "var_mx"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_mousey": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_mousedown",
  #|          "parent": "set_mousex",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_mousey"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["mouse_y", "var_my"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_mousedown": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_key",
  #|          "parent": "set_mousey",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_mousedown"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["mouse_down", "var_md"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_key": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_touch",
  #|          "parent": "set_mousedown",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_key"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["space_down", "var_key"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_touch": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_dist",
  #|          "parent": "set_key",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_touch"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["touching_mouse", "var_touch"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_dist": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_loudness",
  #|          "parent": "set_touch",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_dist"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["distance", "var_dist"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_loudness": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_loud",
  #|          "parent": "set_dist",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_loudness"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["loudness", "var_loudness"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_loud": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_online",
  #|          "parent": "set_loudness",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_loud"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["loud", "var_loud"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_online": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_username",
  #|          "parent": "set_loud",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_online"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["online", "var_online"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_username": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_userid",
  #|          "parent": "set_online",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_username"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["username", "var_username"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_userid": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_current_year",
  #|          "parent": "set_username",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_userid"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["userid", "var_userid"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_current_year": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_days",
  #|          "parent": "set_userid",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_current"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["current_year", "var_current_year"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_days": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_of_x",
  #|          "parent": "set_current_year",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_days"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["days_since_2000", "var_days"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_of_x": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_of_volume",
  #|          "parent": "set_days",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_of_x"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["of_x", "var_of_x"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_of_volume": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_touchingcolor",
  #|          "parent": "set_of_x",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_of_volume"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["of_volume", "var_of_volume"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_touchingcolor": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_color_touch",
  #|          "parent": "set_of_volume",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_touchingcolor"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["touching_color", "var_touchingcolor"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_color_touch": {
  #|          "opcode": "data_setvariableto",
  #|          "next": null,
  #|          "parent": "set_touchingcolor",
  #|          "inputs": {
  #|            "VALUE": [2, "rep_color_touch"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["color_touch", "var_color_touch"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_timer": {
  #|          "opcode": "sensing_timer",
  #|          "next": null,
  #|          "parent": "set_timer",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_sound_menu": {
  #|          "opcode": "sound_sounds_menu",
  #|          "next": null,
  #|          "parent": "set_sound_menu",
  #|          "inputs": {},
  #|          "fields": {
  #|            "SOUND_MENU": ["pop", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_effect_menu": {
  #|          "opcode": "sound_effects_menu",
  #|          "next": null,
  #|          "parent": "set_effect_menu",
  #|          "inputs": {},
  #|          "fields": {
  #|            "EFFECT": ["pitch", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_beats_menu": {
  #|          "opcode": "sound_beats_menu",
  #|          "next": null,
  #|          "parent": "set_beats_menu",
  #|          "inputs": {},
  #|          "fields": {
  #|            "BEATS": ["0.5", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_volume": {
  #|          "opcode": "sound_volume",
  #|          "next": null,
  #|          "parent": "set_volume_reporter",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_mousex": {
  #|          "opcode": "sensing_mousex",
  #|          "next": null,
  #|          "parent": "set_mousex",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_mousey": {
  #|          "opcode": "sensing_mousey",
  #|          "next": null,
  #|          "parent": "set_mousey",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_mousedown": {
  #|          "opcode": "sensing_mousedown",
  #|          "next": null,
  #|          "parent": "set_mousedown",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_key": {
  #|          "opcode": "sensing_keypressed",
  #|          "next": null,
  #|          "parent": "set_key",
  #|          "inputs": {},
  #|          "fields": {
  #|            "KEY_OPTION": ["space", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_touch": {
  #|          "opcode": "sensing_touchingobject",
  #|          "next": null,
  #|          "parent": "set_touch",
  #|          "inputs": {},
  #|          "fields": {
  #|            "TOUCHINGOBJECTMENU": ["_mouse_", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_dist": {
  #|          "opcode": "sensing_distanceto",
  #|          "next": null,
  #|          "parent": "set_dist",
  #|          "inputs": {},
  #|          "fields": {
  #|            "DISTANCETOMENU": ["_mouse_", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_loudness": {
  #|          "opcode": "sensing_loudness",
  #|          "next": null,
  #|          "parent": "set_loudness",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_loud": {
  #|          "opcode": "sensing_loud",
  #|          "next": null,
  #|          "parent": "set_loud",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_online": {
  #|          "opcode": "sensing_online",
  #|          "next": null,
  #|          "parent": "set_online",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_username": {
  #|          "opcode": "sensing_username",
  #|          "next": null,
  #|          "parent": "set_username",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_userid": {
  #|          "opcode": "sensing_userid",
  #|          "next": null,
  #|          "parent": "set_userid",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_current": {
  #|          "opcode": "sensing_current",
  #|          "next": null,
  #|          "parent": "set_current_year",
  #|          "inputs": {},
  #|          "fields": {
  #|            "CURRENTMENU": ["year", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_days": {
  #|          "opcode": "sensing_dayssince2000",
  #|          "next": null,
  #|          "parent": "set_days",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_of_x": {
  #|          "opcode": "sensing_of",
  #|          "next": null,
  #|          "parent": "set_of_x",
  #|          "inputs": {},
  #|          "fields": {
  #|            "PROPERTY": ["x position", null],
  #|            "OBJECT": ["Sprite1", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_of_volume": {
  #|          "opcode": "sensing_of",
  #|          "next": null,
  #|          "parent": "set_of_volume",
  #|          "inputs": {},
  #|          "fields": {
  #|            "PROPERTY": ["volume", null],
  #|            "OBJECT": ["_stage_", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "rep_touchingcolor": {
  #|          "opcode": "sensing_touchingcolor",
  #|          "next": null,
  #|          "parent": "set_touchingcolor",
  #|          "inputs": {
  #|            "COLOR": [1, [10, "#ff0000"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "rep_color_touch": {
  #|          "opcode": "sensing_coloristouchingcolor",
  #|          "next": null,
  #|          "parent": "set_color_touch",
  #|          "inputs": {
  #|            "COLOR": [1, [10, "#ff0000"]],
  #|            "COLOR2": [1, [10, "#00ff00"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
test "sensing and sound reporters work in headless runtime" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(sensing_sound_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)

  @moonscratch.vm_post_io_json(vm, "mouse", "{\"x\":3,\"y\":4,\"isDown\":true}")
  @moonscratch.vm_post_io_json(vm, "keys_down", "[\"space\"]")
  @moonscratch.vm_post_io_json(vm, "touching", "{\"Sprite1\":[\"_mouse_\"]}")
  @moonscratch.vm_post_io_json(vm, "loudness", "12")
  @moonscratch.vm_post_io_json(vm, "online", "true")
  @moonscratch.vm_post_io_json(vm, "username", "\"alice\"")
  @moonscratch.vm_post_io_json(vm, "userid", "123")
  @moonscratch.vm_post_io_json(vm, "current_timestamp_ms", "946684800000")

  for _ in 0..<90 {
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
  match vars["var_timer"] {
    Number(n, ..) => assert_true(n > 0.0)
    _ => fail("var_timer must be number")
  }
  assert_eq(vars["var_sm"], Json::string("pop"))
  assert_eq(vars["var_em"], Json::string("pitch"))
  assert_eq(vars["var_bm"], Json::string("0.5"))
  assert_eq(vars["var_vol"], Json::number(25.0))
  assert_eq(vars["var_mx"], Json::number(3.0))
  assert_eq(vars["var_my"], Json::number(4.0))
  assert_eq(vars["var_md"], Json::boolean(true))
  assert_eq(vars["var_key"], Json::boolean(true))
  assert_eq(vars["var_touch"], Json::boolean(true))
  assert_eq(vars["var_dist"], Json::number(5.0))
  assert_eq(vars["var_loudness"], Json::number(12.0))
  assert_eq(vars["var_loud"], Json::boolean(true))
  assert_eq(vars["var_online"], Json::boolean(true))
  assert_eq(vars["var_username"], Json::string("alice"))
  assert_eq(vars["var_userid"], Json::number(123.0))
  assert_eq(vars["var_current_year"], Json::number(2000.0))
  assert_eq(vars["var_days"], Json::number(0.0))
  assert_eq(vars["var_of_x"], Json::number(0.0))
  assert_eq(vars["var_of_volume"], Json::number(100.0))
  assert_eq(vars["var_touchingcolor"], Json::boolean(false))
  assert_eq(vars["var_color_touch"], Json::boolean(false))
}
