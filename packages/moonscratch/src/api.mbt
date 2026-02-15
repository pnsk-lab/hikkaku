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
