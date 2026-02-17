///|
fn parse_aot_command(raw : Json, index : Int) -> AotCommand? raise VmError {
  let obj = expect_object(raw, "aot_commands[\{index}]")
  let op = object_get_string_or(obj, "op", "")
  match op {
    "set_var" => {
      let target_index = object_get_number_or(obj, "target", -1.0).to_int()
      if target_index < 0 {
        invalid_project("aot_commands[\{index}].target must be >= 0")
      }
      let variable_id = object_get_string_or(obj, "id", "")
      if variable_id == "" {
        invalid_project("aot_commands[\{index}].id must be non-empty")
      }
      let value = object_get_or(obj, "value", Json::null())
      Some(AotCommand::SetVariable(target_index, variable_id, value))
    }
    "change_var" => {
      let target_index = object_get_number_or(obj, "target", -1.0).to_int()
      if target_index < 0 {
        invalid_project("aot_commands[\{index}].target must be >= 0")
      }
      let variable_id = object_get_string_or(obj, "id", "")
      if variable_id == "" {
        invalid_project("aot_commands[\{index}].id must be non-empty")
      }
      let delta = object_get_number_or(obj, "delta", 0.0)
      Some(AotCommand::ChangeVariable(target_index, variable_id, delta))
    }
    "host_tail" => {
      let target_index = object_get_number_or(obj, "target", -1.0).to_int()
      if target_index < 0 {
        invalid_project("aot_commands[\{index}].target must be >= 0")
      }
      let start_pc = object_get_number_or(obj, "pc", -1.0).to_int()
      if start_pc < 0 {
        invalid_project("aot_commands[\{index}].pc must be >= 0")
      }
      Some(AotCommand::HostTail(target_index, start_pc))
    }
    "host_opcode" => {
      let target_index = object_get_number_or(obj, "target", -1.0).to_int()
      if target_index < 0 {
        invalid_project("aot_commands[\{index}].target must be >= 0")
      }
      let pc = object_get_number_or(obj, "pc", -1.0).to_int()
      if pc < 0 {
        invalid_project("aot_commands[\{index}].pc must be >= 0")
      }
      Some(AotCommand::HostOpcode(target_index, pc))
    }
    _ => None
  }
}

///|
fn parse_aot_exec_commands(parsed : Json) -> Array[AotCommand] raise VmError {
  let commands = match parsed {
    Array(values) => values
    Object(obj) =>
      match obj.get("exec") {
        Some(raw_exec) => expect_array(raw_exec, "aot_commands.exec")
        None => []
      }
    _ => expect_array(parsed, "aot_commands")
  }
  let out = []
  for index, command in commands {
    match parse_aot_command(command, index) {
      Some(parsed) => out.push(parsed)
      None => ()
    }
  }
  out
}

///|
fn parse_aot_full_green_flag_start_entries(
  raw : Json,
) -> (Map[Int, Array[Int]], Bool) raise VmError {
  let entries = expect_array(raw, "aot_commands.full_green_flag_starts")
  let out : Map[Int, Array[Int]] = {}
  let mut has_any_start = false
  for entry_index, raw_entry in entries {
    let entry = expect_object(
      raw_entry,
      "aot_commands.full_green_flag_starts[\{entry_index}]",
    )
    let target_index = object_get_number_or(entry, "target", -1.0).to_int()
    if target_index < 0 {
      invalid_project(
        "aot_commands.full_green_flag_starts[\{entry_index}].target must be >= 0",
      )
    }
    let pcs_json = expect_array(
      object_get_or(entry, "pcs", json_array([])),
      "aot_commands.full_green_flag_starts[\{entry_index}].pcs",
    )
    let merged = match out.get(target_index) {
      Some(existing) => existing.copy()
      None => []
    }
    for pc_index, raw_pc in pcs_json {
      let pc = json_to_number_value(raw_pc).to_int()
      if pc < 0 {
        invalid_project(
          "aot_commands.full_green_flag_starts[\{entry_index}].pcs[\{pc_index}] must be >= 0",
        )
      }
      merged.push(pc)
      has_any_start = true
    }
    out[target_index] = merged
  }
  (out, has_any_start)
}

///|
fn parse_aot_full_green_flag_starts(
  parsed : Json,
) -> (Map[Int, Array[Int]], Bool) raise VmError {
  match parsed {
    Object(obj) =>
      match obj.get("full_green_flag_starts") {
        Some(raw) => parse_aot_full_green_flag_start_entries(raw)
        None => ({}, false)
      }
    _ => ({}, false)
  }
}

///|
fn parse_aot_exec_mode(parsed : Json, has_any_start : Bool) -> (Bool, Bool) {
  match parsed {
    Object(obj) =>
      match obj.get("exec_mode") {
        Some(String(raw_mode)) => {
          let mode = raw_mode.trim().to_lower()
          if mode == "full" || mode == "wasm" || mode == "wasm_full" {
            (true, false)
          } else if mode == "wasm_only" {
            (false, true)
          } else if mode == "linear" || mode == "linear_fast" {
            (false, false)
          } else {
            (has_any_start, false)
          }
        }
        _ => (has_any_start, false)
      }
    _ => (false, false)
  }
}

///|
fn parse_aot_commands_json(
  commands_json : String,
) -> (Array[AotCommand], Map[Int, Array[Int]], Bool, Bool) raise VmError {
  if commands_json.trim().is_empty() {
    return ([], {}, false, false)
  }
  let parsed = parse_json_or_fail(commands_json)
  let commands = parse_aot_exec_commands(parsed)
  let (full_green_flag_starts, has_any_start) = parse_aot_full_green_flag_starts(
    parsed,
  )
  let (use_full_exec, wasm_only) = parse_aot_exec_mode(parsed, has_any_start)
  (commands, full_green_flag_starts, use_full_exec, wasm_only)
}

///|
fn set_aot_commands_runtime(
  vm : Vm,
  commands_json : String,
) -> Unit raise VmError {
  let (commands, full_green_flag_starts, use_full_exec, wasm_only) = parse_aot_commands_json(
    commands_json,
  )
  vm.aot_commands = commands
  vm.aot_full_green_flag_starts = full_green_flag_starts
  vm.aot_use_full_exec = use_full_exec
  vm.aot_wasm_only = wasm_only
  vm.aot_pending = false
}
