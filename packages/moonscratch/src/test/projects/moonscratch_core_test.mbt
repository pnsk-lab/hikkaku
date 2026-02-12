///|
let broadcast_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_score": ["score", 0]
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
  #|          "next": "set_score",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "set_score": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "broadcast_go",
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 1]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["score", "var_score"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "broadcast_go": {
  #|          "opcode": "event_broadcast",
  #|          "next": null,
  #|          "parent": "set_score",
  #|          "inputs": {
  #|            "BROADCAST_INPUT": [1, "broadcast_menu"]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "broadcast_menu": {
  #|          "opcode": "event_broadcast_menu",
  #|          "next": null,
  #|          "parent": "broadcast_go",
  #|          "inputs": {},
  #|          "fields": {
  #|            "BROADCAST_OPTION": ["go", "broadcast_go_id"]
  #|          },
  #|          "topLevel": false,
  #|          "shadow": true
  #|        },
  #|        "hat_broadcast": {
  #|          "opcode": "event_whenbroadcastreceived",
  #|          "next": "change_score",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {
  #|            "BROADCAST_OPTION": ["go", "broadcast_go_id"]
  #|          },
  #|          "topLevel": true
  #|        },
  #|        "change_score": {
  #|          "opcode": "data_changevariableby",
  #|          "next": null,
  #|          "parent": "hat_broadcast",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 5]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["score", "var_score"]
  #|          },
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
let ask_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_answer": ["answerVar", ""]
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
  #|          "next": "ask_name",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "ask_name": {
  #|          "opcode": "sensing_askandwait",
  #|          "next": "set_answer",
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "QUESTION": [1, [10, "your name?"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_answer": {
  #|          "opcode": "data_setvariableto",
  #|          "next": null,
  #|          "parent": "ask_name",
  #|          "inputs": {
  #|            "VALUE": [1, "answer_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["answerVar", "var_answer"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "answer_reporter": {
  #|          "opcode": "sensing_answer",
  #|          "next": null,
  #|          "parent": "set_answer",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
fn[T, E] unwrap_result(result : Result[T, E], message : String) -> T raise {
  match result {
    Ok(value) => value
    Err(_) => fail(message)
  }
}

///|
test "green flag + broadcast updates variable" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(broadcast_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)
  ignore(@moonscratch.vm_step(vm, 16))
  ignore(@moonscratch.vm_step(vm, 16))

  let snapshot = @moonscratch.vm_snapshot_json(vm)
  let root = unwrap_result(try? @json.parse(snapshot), "snapshot parse failed")
  let root_obj = match root {
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
  assert_eq(vars["var_score"], Json::number(6.0))
}

///|
test "ask waits for answer and resumes via post_io" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(ask_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)

  ignore(@moonscratch.vm_step(vm, 16))
  let effects_before = unwrap_result(
    try? @json.parse(@moonscratch.vm_take_effects_json(vm)),
    "effects parse failed",
  )
  json_inspect(effects_before, content=[
    { "type": "ask", "question": "your name?" },
  ])

  @moonscratch.vm_post_io_json(vm, "answer", "\"moonscratch\"")
  ignore(@moonscratch.vm_step(vm, 16))

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
  assert_eq(vars["var_answer"], Json::string("moonscratch"))
}

///|
let control_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_sum": ["sum", 0],
  #|        "var_i": ["i", 0],
  #|        "var_counter": ["counter_result", 0]
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
  #|          "next": "clear_counter",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "clear_counter": {
  #|          "opcode": "control_clear_counter",
  #|          "next": "repeat_until",
  #|          "parent": "hat_flag",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "repeat_until": {
  #|          "opcode": "control_repeat_until",
  #|          "next": "set_counter_result",
  #|          "parent": "clear_counter",
  #|          "inputs": {
  #|            "CONDITION": [2, "counter_gt_2"],
  #|            "SUBSTACK": [2, "incr_counter"]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "counter_gt_2": {
  #|          "opcode": "operator_gt",
  #|          "next": null,
  #|          "parent": "repeat_until",
  #|          "inputs": {
  #|            "OPERAND1": [2, "counter_reporter"],
  #|            "OPERAND2": [1, [4, 2]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "counter_reporter": {
  #|          "opcode": "control_get_counter",
  #|          "next": null,
  #|          "parent": "counter_gt_2",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "incr_counter": {
  #|          "opcode": "control_incr_counter",
  #|          "next": null,
  #|          "parent": "repeat_until",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_counter_result": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "for_each",
  #|          "parent": "repeat_until",
  #|          "inputs": {
  #|            "VALUE": [2, "counter_reporter_after"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["counter_result", "var_counter"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "counter_reporter_after": {
  #|          "opcode": "control_get_counter",
  #|          "next": null,
  #|          "parent": "set_counter_result",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "for_each": {
  #|          "opcode": "control_for_each",
  #|          "next": null,
  #|          "parent": "set_counter_result",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 3]],
  #|            "SUBSTACK": [2, "change_sum"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["i", "var_i"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "change_sum": {
  #|          "opcode": "data_changevariableby",
  #|          "next": null,
  #|          "parent": "for_each",
  #|          "inputs": {
  #|            "VALUE": [2, "i_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["sum", "var_sum"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "i_reporter": {
  #|          "opcode": "data_variable",
  #|          "next": null,
  #|          "parent": "change_sum",
  #|          "inputs": {},
  #|          "fields": {
  #|            "VARIABLE": ["i", "var_i"]
  #|          },
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
let clone_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_clones": ["clones", 0]
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
  #|          "next": "create_clone",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "create_clone": {
  #|          "opcode": "control_create_clone_of",
  #|          "next": null,
  #|          "parent": "hat_flag",
  #|          "inputs": {},
  #|          "fields": {
  #|            "CLONE_OPTION": ["_myself_", "_myself_"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "hat_clone": {
  #|          "opcode": "control_start_as_clone",
  #|          "next": "inc_clones",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "inc_clones": {
  #|          "opcode": "data_changevariableby",
  #|          "next": "delete_clone",
  #|          "parent": "hat_clone",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 1]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["clones", "var_clones"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "delete_clone": {
  #|          "opcode": "control_delete_this_clone",
  #|          "next": null,
  #|          "parent": "inc_clones",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
let list_itemnum_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_pos": ["pos", 0]
  #|      },
  #|      "lists": {
  #|        "list_numbers": ["numbers", [4, 7, "123", 9]]
  #|      },
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
  #|          "next": "set_pos",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "set_pos": {
  #|          "opcode": "data_setvariableto",
  #|          "next": null,
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "VALUE": [2, "itemnum_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["pos", "var_pos"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "itemnum_reporter": {
  #|          "opcode": "data_itemnumoflist",
  #|          "next": null,
  #|          "parent": "set_pos",
  #|          "inputs": {
  #|            "ITEM": [1, [4, 123]]
  #|          },
  #|          "fields": {
  #|            "LIST": ["numbers", "list_numbers"]
  #|          },
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
let motion_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {
  #|        "var_dir": ["dir", 0],
  #|        "var_x": ["xv", 0],
  #|        "var_y": ["yv", 0]
  #|      },
  #|      "lists": {},
  #|      "blocks": {}
  #|    },
  #|    {
  #|      "isStage": false,
  #|      "name": "Sprite2",
  #|      "x": 0,
  #|      "y": 100,
  #|      "variables": {},
  #|      "lists": {},
  #|      "blocks": {}
  #|    },
  #|    {
  #|      "isStage": false,
  #|      "name": "Sprite1",
  #|      "x": 0,
  #|      "y": 0,
  #|      "variables": {},
  #|      "lists": {},
  #|      "blocks": {
  #|        "hat_flag": {
  #|          "opcode": "event_whenflagclicked",
  #|          "next": "point_towards",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "point_towards": {
  #|          "opcode": "motion_pointtowards",
  #|          "next": "set_dir",
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "TOWARDS": [1, [10, "Sprite2"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_dir": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "glide_xy",
  #|          "parent": "point_towards",
  #|          "inputs": {
  #|            "VALUE": [2, "dir_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["dir", "var_dir"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "dir_reporter": {
  #|          "opcode": "motion_direction",
  #|          "next": null,
  #|          "parent": "set_dir",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "glide_xy": {
  #|          "opcode": "motion_glidesecstoxy",
  #|          "next": "set_x",
  #|          "parent": "set_dir",
  #|          "inputs": {
  #|            "SECS": [1, [4, 0]],
  #|            "X": [1, [4, 50]],
  #|            "Y": [1, [4, -20]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_x": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_y",
  #|          "parent": "glide_xy",
  #|          "inputs": {
  #|            "VALUE": [2, "x_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["xv", "var_x"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "x_reporter": {
  #|          "opcode": "motion_xposition",
  #|          "next": null,
  #|          "parent": "set_x",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_y": {
  #|          "opcode": "data_setvariableto",
  #|          "next": null,
  #|          "parent": "set_x",
  #|          "inputs": {
  #|            "VALUE": [2, "y_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["yv", "var_y"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "y_reporter": {
  #|          "opcode": "motion_yposition",
  #|          "next": null,
  #|          "parent": "set_y",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
let forever_motion_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "variables": {},
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
  #|          "next": "forever_loop",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "forever_loop": {
  #|          "opcode": "control_forever",
  #|          "next": null,
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "SUBSTACK": [2, "move_steps"]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "move_steps": {
  #|          "opcode": "motion_movesteps",
  #|          "next": null,
  #|          "parent": "forever_loop",
  #|          "inputs": {
  #|            "STEPS": [1, [4, 1]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
test "control repeat_until, for_each and counter reporter" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(control_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)

  for _ in 0..<32 {
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
  assert_eq(vars["var_counter"], Json::number(3.0))
  assert_eq(vars["var_sum"], Json::number(6.0))
  assert_eq(vars["var_i"], Json::number(3.0))
}

///|
test "control forever keeps repeating substack blocks" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(forever_motion_project),
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
  let sprite = match targets[1] {
    Object(obj) => obj
    _ => fail("sprite must be object")
  }
  assert_eq(sprite["x"], Json::number(19.0))
}

///|
test "control create clone starts control_start_as_clone hats" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(clone_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)

  for _ in 0..<16 {
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
  assert_eq(vars["var_clones"], Json::number(1.0))
}

///|
test "data_itemnumoflist uses scratch-style equality" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(list_itemnum_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)
  for _ in 0..<8 {
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
  assert_eq(vars["var_pos"], Json::number(3.0))
}

///|
test "motion reporters and target-based motion commands" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(motion_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)
  for _ in 0..<12 {
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
  assert_eq(vars["var_dir"], Json::number(0.0))
  assert_eq(vars["var_x"], Json::number(50.0))
  assert_eq(vars["var_y"], Json::number(-20.0))
}

///|
let looks_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "currentCostume": 0,
  #|      "costumes": [
  #|        { "name": "bg1" },
  #|        { "name": "bg2" },
  #|        { "name": "bg3" }
  #|      ],
  #|      "variables": {
  #|        "var_cn": ["costume_name", ""],
  #|        "var_cnum": ["costume_num", 0],
  #|        "var_bn": ["backdrop_name", ""],
  #|        "var_bnum": ["backdrop_num", 0],
  #|        "var_size": ["size_value", 0]
  #|      },
  #|      "lists": {},
  #|      "blocks": {}
  #|    },
  #|    {
  #|      "isStage": false,
  #|      "name": "Sprite1",
  #|      "currentCostume": 0,
  #|      "costumes": [
  #|        { "name": "a" },
  #|        { "name": "b" }
  #|      ],
  #|      "variables": {},
  #|      "lists": {},
  #|      "blocks": {
  #|        "hat_flag": {
  #|          "opcode": "event_whenflagclicked",
  #|          "next": "switch_costume",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "switch_costume": {
  #|          "opcode": "looks_switchcostumeto",
  #|          "next": "set_costume_name",
  #|          "parent": "hat_flag",
  #|          "inputs": {
  #|            "COSTUME": [1, [10, "b"]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_costume_name": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_costume_num",
  #|          "parent": "switch_costume",
  #|          "inputs": {
  #|            "VALUE": [2, "costume_name_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["costume_name", "var_cn"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "costume_name_reporter": {
  #|          "opcode": "looks_costumenumbername",
  #|          "next": null,
  #|          "parent": "set_costume_name",
  #|          "inputs": {},
  #|          "fields": {
  #|            "NUMBER_NAME": ["name", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_costume_num": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_size",
  #|          "parent": "set_costume_name",
  #|          "inputs": {
  #|            "VALUE": [2, "costume_num_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["costume_num", "var_cnum"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "costume_num_reporter": {
  #|          "opcode": "looks_costumenumbername",
  #|          "next": null,
  #|          "parent": "set_costume_num",
  #|          "inputs": {},
  #|          "fields": {
  #|            "NUMBER_NAME": ["number", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_size": {
  #|          "opcode": "looks_setsizeto",
  #|          "next": "set_size_var",
  #|          "parent": "set_costume_num",
  #|          "inputs": {
  #|            "SIZE": [1, [4, 80]]
  #|          },
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_size_var": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "switch_backdrop",
  #|          "parent": "set_size",
  #|          "inputs": {
  #|            "VALUE": [2, "size_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["size_value", "var_size"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "size_reporter": {
  #|          "opcode": "looks_size",
  #|          "next": null,
  #|          "parent": "set_size_var",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "switch_backdrop": {
  #|          "opcode": "looks_switchbackdropto",
  #|          "next": "next_backdrop",
  #|          "parent": "set_size_var",
  #|          "inputs": {},
  #|          "fields": {
  #|            "BACKDROP": ["bg2", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "next_backdrop": {
  #|          "opcode": "looks_nextbackdrop",
  #|          "next": "set_backdrop_name",
  #|          "parent": "switch_backdrop",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        },
  #|        "set_backdrop_name": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "set_backdrop_num",
  #|          "parent": "next_backdrop",
  #|          "inputs": {
  #|            "VALUE": [2, "backdrop_name_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["backdrop_name", "var_bn"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "backdrop_name_reporter": {
  #|          "opcode": "looks_backdropnumbername",
  #|          "next": null,
  #|          "parent": "set_backdrop_name",
  #|          "inputs": {},
  #|          "fields": {
  #|            "NUMBER_NAME": ["name", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "set_backdrop_num": {
  #|          "opcode": "data_setvariableto",
  #|          "next": "hide_all",
  #|          "parent": "set_backdrop_name",
  #|          "inputs": {
  #|            "VALUE": [2, "backdrop_num_reporter"]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["backdrop_num", "var_bnum"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "backdrop_num_reporter": {
  #|          "opcode": "looks_backdropnumbername",
  #|          "next": null,
  #|          "parent": "set_backdrop_num",
  #|          "inputs": {},
  #|          "fields": {
  #|            "NUMBER_NAME": ["number", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "hide_all": {
  #|          "opcode": "looks_hideallsprites",
  #|          "next": null,
  #|          "parent": "set_backdrop_num",
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
let event_project =
  #|{
  #|  "targets": [
  #|    {
  #|      "isStage": true,
  #|      "name": "Stage",
  #|      "currentCostume": 0,
  #|      "costumes": [
  #|        { "name": "bg1" },
  #|        { "name": "bg2" }
  #|      ],
  #|      "variables": {
  #|        "var_total": ["total", 0]
  #|      },
  #|      "lists": {},
  #|      "blocks": {
  #|        "hat_flag": {
  #|          "opcode": "event_whenflagclicked",
  #|          "next": "switch_bg2",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "switch_bg2": {
  #|          "opcode": "looks_switchbackdropto",
  #|          "next": null,
  #|          "parent": "hat_flag",
  #|          "inputs": {},
  #|          "fields": {
  #|            "BACKDROP": ["bg2", null]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "hat_backdrop": {
  #|          "opcode": "event_whenbackdropswitchesto",
  #|          "next": "add_1",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {
  #|            "BACKDROP": ["bg2", null]
  #|          },
  #|          "topLevel": true
  #|        },
  #|        "add_1": {
  #|          "opcode": "data_changevariableby",
  #|          "next": null,
  #|          "parent": "hat_backdrop",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 1]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["total", "var_total"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "hat_stage_click": {
  #|          "opcode": "event_whenstageclicked",
  #|          "next": "add_10",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "add_10": {
  #|          "opcode": "data_changevariableby",
  #|          "next": null,
  #|          "parent": "hat_stage_click",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 10]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["total", "var_total"]
  #|          },
  #|          "topLevel": false
  #|        }
  #|      }
  #|    },
  #|    {
  #|      "isStage": false,
  #|      "name": "Sprite1",
  #|      "variables": {},
  #|      "lists": {},
  #|      "blocks": {
  #|        "hat_key": {
  #|          "opcode": "event_whenkeypressed",
  #|          "next": "add_100",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {
  #|            "KEY_OPTION": ["space", "space"]
  #|          },
  #|          "topLevel": true
  #|        },
  #|        "add_100": {
  #|          "opcode": "data_changevariableby",
  #|          "next": null,
  #|          "parent": "hat_key",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 100]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["total", "var_total"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "hat_sprite_click": {
  #|          "opcode": "event_whenthisspriteclicked",
  #|          "next": "add_1000",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {},
  #|          "topLevel": true
  #|        },
  #|        "add_1000": {
  #|          "opcode": "data_changevariableby",
  #|          "next": null,
  #|          "parent": "hat_sprite_click",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 1000]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["total", "var_total"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "hat_timer": {
  #|          "opcode": "event_whengreaterthan",
  #|          "next": "add_10000",
  #|          "parent": null,
  #|          "inputs": {
  #|            "VALUE": [1, [4, 0.05]]
  #|          },
  #|          "fields": {
  #|            "WHENGREATERTHANMENU": ["TIMER", null]
  #|          },
  #|          "topLevel": true
  #|        },
  #|        "add_10000": {
  #|          "opcode": "data_changevariableby",
  #|          "next": null,
  #|          "parent": "hat_timer",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 10000]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["total", "var_total"]
  #|          },
  #|          "topLevel": false
  #|        },
  #|        "hat_touch": {
  #|          "opcode": "event_whentouchingobject",
  #|          "next": "add_100000",
  #|          "parent": null,
  #|          "inputs": {},
  #|          "fields": {
  #|            "TOUCHINGOBJECTMENU": ["_mouse_", null]
  #|          },
  #|          "topLevel": true
  #|        },
  #|        "add_100000": {
  #|          "opcode": "data_changevariableby",
  #|          "next": null,
  #|          "parent": "hat_touch",
  #|          "inputs": {
  #|            "VALUE": [1, [4, 100000]]
  #|          },
  #|          "fields": {
  #|            "VARIABLE": ["total", "var_total"]
  #|          },
  #|          "topLevel": false
  #|        }
  #|      }
  #|    }
  #|  ]
  #|}

///|
test "looks reporters and backdrop opcodes update state" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(looks_project),
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
  let sprite = match targets[1] {
    Object(obj) => obj
    _ => fail("sprite must be object")
  }
  let vars = match stage["variables"] {
    Object(obj) => obj
    _ => fail("variables must be object")
  }
  assert_eq(vars["var_cn"], Json::string("b"))
  assert_eq(vars["var_cnum"], Json::number(2.0))
  assert_eq(vars["var_bn"], Json::string("bg3"))
  assert_eq(vars["var_bnum"], Json::number(3.0))
  assert_eq(vars["var_size"], Json::number(80.0))
  assert_eq(sprite["visible"], Json::boolean(false))
}

///|
test "event hats for key, click, backdrop, greaterthan and touchingobject" {
  let vm = unwrap_result(
    try? @moonscratch.vm_new_from_json(event_project),
    "vm init failed",
  )
  @moonscratch.vm_green_flag(vm)

  @moonscratch.vm_post_io_json(vm, "key_pressed", "\"space\"")
  @moonscratch.vm_post_io_json(vm, "stage_clicked", "true")
  @moonscratch.vm_post_io_json(vm, "sprite_clicked", "\"Sprite1\"")
  @moonscratch.vm_post_io_json(vm, "touching", "{\"Sprite1\":[\"_mouse_\"]}")

  for _ in 0..<24 {
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
  assert_eq(vars["var_total"], Json::number(111111.0))
}
