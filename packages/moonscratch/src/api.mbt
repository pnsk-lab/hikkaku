///|
pub fn vm_compile_from_json(
  project_json : String,
  assets_json? : String,
) -> PrecompiledProject raise VmError {
  let bundle = parse_bundle(project_json, assets_json)
  compile_project(bundle)
}

///|
pub fn vm_new_from_compiled(
  precompiled : PrecompiledProject,
  options_json? : String,
) -> Vm raise VmError {
  let options = parse_options_json(options_json)
  vm_new_internal(precompiled, options)
}

///|
pub fn vm_start(vm : Vm) -> Unit {
  start_vm_runtime(vm)
}

///|
pub fn vm_green_flag(vm : Vm) -> Unit {
  green_flag_runtime(vm)
}

///|
pub fn vm_step_frame(vm : Vm) -> FrameReport {
  step_frame_runtime(vm)
}

///|
pub fn vm_set_time(vm : Vm, now_ms : Int) -> Unit {
  set_time_runtime(vm, now_ms)
}

///|
pub fn vm_post_io_json(vm : Vm, device : String, payload_json : String) -> Unit {
  post_io_json_runtime(vm, device, payload_json)
}

///|
pub fn vm_set_aot_commands_json(
  vm : Vm,
  commands_json : String,
) -> Unit raise VmError {
  set_aot_commands_runtime(vm, commands_json)
}

///|
pub fn vm_get_variable_number_by_id(
  vm : Vm,
  target_index : Int,
  variable_id : String,
) -> Double {
  if variable_id == "" {
    return 0.0
  }
  if target_index < 0 || target_index >= vm.targets.length() {
    return 0.0
  }
  let current = read_variable(vm, target_index, Some(variable_id), None)
  json_to_number_value(current)
}

///|
pub fn vm_set_variable_number_by_id(
  vm : Vm,
  target_index : Int,
  variable_id : String,
  value : Double,
) -> Unit {
  if variable_id == "" {
    return
  }
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  write_variable(vm, target_index, Some(variable_id), None, json_number(value))
}

///|
pub fn vm_set_variable_json_by_id(
  vm : Vm,
  target_index : Int,
  variable_id : String,
  value_json : String,
) -> Unit {
  if variable_id == "" {
    return
  }
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  if value_json.trim().is_empty() {
    write_variable(vm, target_index, Some(variable_id), None, Json::null())
    return
  }
  let parsed = try? @json.parse(value_json)
  match parsed {
    Ok(value) =>
      write_variable(vm, target_index, Some(variable_id), None, value)
    Err(_) =>
      write_variable(vm, target_index, Some(variable_id), None, Json::null())
  }
}

///|
pub fn vm_exec_script_tail_by_pc(
  vm : Vm,
  target_index : Int,
  start_pc : Int,
) -> Int {
  exec_script_tail_runtime(vm, target_index, start_pc)
}

///|
pub fn vm_exec_opcode_once_by_pc(vm : Vm, target_index : Int, pc : Int) -> Int {
  exec_opcode_once_runtime(vm, target_index, pc)
}

///|
pub fn vm_exec_draw_opcode(
  vm : Vm,
  target_index : Int,
  opcode : String,
  arg0 : Double,
  arg1 : Double,
  extra : Int,
) -> Int {
  exec_draw_opcode_runtime(vm, target_index, opcode, arg0, arg1, extra)
}

///|
pub fn vm_broadcast(vm : Vm, message : String) -> Unit {
  broadcast_runtime(vm, message)
}

///|
pub fn vm_stop_all(vm : Vm) -> Unit {
  clear_threads(vm)
  push_effect(vm, HostEffect::StopAllSounds)
}

///|
pub fn vm_take_effects_json(vm : Vm) -> String {
  let effects = take_effects(vm).map(effect_to_json)
  json_array(effects).stringify()
}

///|
pub fn vm_snapshot_json(vm : Vm) -> String {
  snapshot_to_json(vm).stringify(indent=2)
}

///|
pub fn vm_render_frame(vm : Vm) -> RenderFrame {
  render_scene_to_frame(vm)
}
