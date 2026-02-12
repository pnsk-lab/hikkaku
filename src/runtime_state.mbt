///|
fn vm_new_internal(
  bundle : ProjectBundle,
  options : VmOptions,
) -> Vm raise VmError {
  let (targets, stage_index) = parse_project_targets(
    bundle.project_json,
    bundle.assets,
  )
  let pen_width = if options.pen_width > 0 { options.pen_width } else { 480 }
  let pen_height = if options.pen_height > 0 { options.pen_height } else { 360 }
  let pen_pixels = []
  for _ in 0..<(pen_width * pen_height * 4) {
    pen_pixels.push(b'\x00')
  }
  {
    targets,
    stage_index,
    assets: bundle.assets,
    options,
    pen_width,
    pen_height,
    pen_pixels,
    threads: [],
    next_thread_id: 1,
    run_id: 0,
    now_ms: 0,
    running: false,
    answer: "",
    effects: [],
    io_state: {},
    waiting_children: {},
    rng_state: options.seed,
    control_counter: 0,
    next_clone_id: 1,
    hat_predicates: {},
    timer_start_ms: 0,
    music_tempo: 60.0,
    tts_language: "en",
    procedure_frames: {},
    pending_translate_requests: {},
    current_thread_id: None,
  }
}

///|
fn push_effect(vm : Vm, effect : HostEffect) -> Unit {
  vm.effects.push(effect)
}

///|
fn take_effects(vm : Vm) -> Array[HostEffect] {
  let out = vm.effects.copy()
  vm.effects.clear()
  out
}

///|
fn next_random_unit(vm : Vm) -> Double {
  // 32-bit LCG for deterministic stepping.
  vm.rng_state = vm.rng_state * 1664525 + 1013904223
  let unsigned = vm.rng_state.abs()
  let x = unsigned % 1000000
  Double::from_int(x) / 1000000.0
}

///|
fn current_step_budget(vm : Vm) -> Int {
  if vm.options.turbo {
    1000
  } else {
    200
  }
}

///|
fn resolve_variable_ref(
  vm : Vm,
  target_index : Int,
  variable_id : String?,
  variable_name : String?,
) -> (Int, String)? {
  let target = vm.targets[target_index]
  let stage = vm.targets[vm.stage_index]

  match variable_id {
    Some(id) => {
      if target.variables.contains(id) {
        return Some((target_index, id))
      }
      if stage.variables.contains(id) {
        return Some((vm.stage_index, id))
      }
      None
    }
    None =>
      match variable_name {
        Some(name) =>
          match target.variable_names.get(name) {
            Some(id) => Some((target_index, id))
            None =>
              match stage.variable_names.get(name) {
                Some(id) => Some((vm.stage_index, id))
                None => None
              }
          }
        None => None
      }
  }
}

///|
fn read_variable(
  vm : Vm,
  target_index : Int,
  variable_id : String?,
  variable_name : String?,
) -> Json {
  match resolve_variable_ref(vm, target_index, variable_id, variable_name) {
    Some((owner_index, id)) =>
      vm.targets[owner_index].variables.get_or_default(id, Json::null())
    None => Json::null()
  }
}

///|
fn write_variable(
  vm : Vm,
  target_index : Int,
  variable_id : String?,
  variable_name : String?,
  value : Json,
) -> Unit {
  match resolve_variable_ref(vm, target_index, variable_id, variable_name) {
    Some((owner_index, id)) => vm.targets[owner_index].variables[id] = value
    None =>
      match variable_name {
        Some(name) => {
          let stage_index = vm.stage_index
          let new_id = "stage_var_\{name}"
          vm.targets[stage_index].variables[new_id] = value
          vm.targets[stage_index].variable_names[name] = new_id
        }
        None => ()
      }
  }
}

///|
fn resolve_list_ref(
  vm : Vm,
  target_index : Int,
  list_id : String?,
  list_name : String?,
) -> (Int, String)? {
  let target = vm.targets[target_index]
  let stage = vm.targets[vm.stage_index]

  match list_id {
    Some(id) => {
      if target.lists.contains(id) {
        return Some((target_index, id))
      }
      if stage.lists.contains(id) {
        return Some((vm.stage_index, id))
      }
      None
    }
    None =>
      match list_name {
        Some(name) =>
          match target.list_names.get(name) {
            Some(id) => Some((target_index, id))
            None =>
              match stage.list_names.get(name) {
                Some(id) => Some((vm.stage_index, id))
                None => None
              }
          }
        None => None
      }
  }
}

///|
fn read_list(
  vm : Vm,
  target_index : Int,
  list_id : String?,
  list_name : String?,
) -> Array[Json] {
  match resolve_list_ref(vm, target_index, list_id, list_name) {
    Some((owner_index, id)) =>
      vm.targets[owner_index].lists.get_or_default(id, [])
    None => []
  }
}

///|
fn with_list_mut(
  vm : Vm,
  target_index : Int,
  list_id : String?,
  list_name : String?,
) -> (Int, String)? {
  match resolve_list_ref(vm, target_index, list_id, list_name) {
    Some(pair) => Some(pair)
    None =>
      match list_name {
        Some(name) => {
          let stage_index = vm.stage_index
          let created = "stage_list_\{name}"
          vm.targets[stage_index].lists[created] = []
          vm.targets[stage_index].list_names[name] = created
          Some((stage_index, created))
        }
        None => None
      }
  }
}

///|
fn copy_json_map(source : Map[String, Json]) -> Map[String, Json] {
  let out = {}
  source.each((key, value) => out[key] = value)
  out
}

///|
fn copy_string_map(source : Map[String, String]) -> Map[String, String] {
  let out = {}
  source.each((key, value) => out[key] = value)
  out
}

///|
fn copy_string_array(source : Array[String]) -> Array[String] {
  source.copy()
}

///|
fn copy_list_map(source : Map[String, Array[Json]]) -> Map[String, Array[Json]] {
  let out = {}
  source.each((key, value) => out[key] = value.copy())
  out
}

///|
fn copy_block_map(
  source : Map[String, ScratchBlock],
) -> Map[String, ScratchBlock] {
  let out = {}
  source.each((key, value) => out[key] = value)
  out
}

///|
fn active_clone_count(vm : Vm) -> Int {
  let mut count = 0
  for target in vm.targets {
    if !target.is_stage && !target.is_original && !target.deleted {
      count += 1
    }
  }
  count
}

///|
fn find_reusable_clone_slot(vm : Vm) -> Int? {
  for i, target in vm.targets {
    if !target.is_stage && !target.is_original && target.deleted {
      return Some(i)
    }
  }
  None
}

///|
fn clone_target_state(source : TargetState, clone_id : Int) -> TargetState {
  {
    id: "\{source.id}#clone_\{clone_id}",
    name: source.name,
    is_stage: source.is_stage,
    is_original: false,
    deleted: false,
    x: source.x,
    y: source.y,
    direction: source.direction,
    size: source.size,
    volume: source.volume,
    music_instrument: source.music_instrument,
    tts_voice: source.tts_voice,
    visible: source.visible,
    current_costume: source.current_costume,
    costume_names: copy_string_array(source.costume_names),
    costumes: source.costumes.copy(),
    pen_down: source.pen_down,
    pen_color: source.pen_color,
    pen_saturation: source.pen_saturation,
    pen_brightness: source.pen_brightness,
    pen_transparency: source.pen_transparency,
    pen_size: source.pen_size,
    pen_legacy_shade: source.pen_legacy_shade,
    looks_effect_color: source.looks_effect_color,
    looks_effect_fisheye: source.looks_effect_fisheye,
    looks_effect_whirl: source.looks_effect_whirl,
    looks_effect_pixelate: source.looks_effect_pixelate,
    looks_effect_mosaic: source.looks_effect_mosaic,
    looks_effect_brightness: source.looks_effect_brightness,
    looks_effect_ghost: source.looks_effect_ghost,
    variables: copy_json_map(source.variables),
    variable_names: copy_string_map(source.variable_names),
    lists: copy_list_map(source.lists),
    list_names: copy_string_map(source.list_names),
    blocks: copy_block_map(source.blocks),
    top_level_hats: source.top_level_hats.copy(),
  }
}

///|
fn spawn_clone_target(vm : Vm, source_index : Int) -> Int? {
  if source_index < 0 || source_index >= vm.targets.length() {
    return None
  }
  let source = vm.targets[source_index]
  if source.is_stage || source.deleted {
    return None
  }
  if active_clone_count(vm) >= vm.options.max_clones {
    return None
  }

  let clone_id = vm.next_clone_id
  vm.next_clone_id += 1
  let clone_target = clone_target_state(source, clone_id)

  match find_reusable_clone_slot(vm) {
    Some(slot) => {
      vm.targets[slot] = clone_target
      Some(slot)
    }
    None => {
      vm.targets.push(clone_target)
      Some(vm.targets.length() - 1)
    }
  }
}

///|
fn dispose_clone_target(
  vm : Vm,
  target_index : Int,
  current_thread_id : Int,
) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  let target = vm.targets[target_index]
  if target.is_stage || target.is_original || target.deleted {
    return
  }
  vm.targets[target_index].deleted = true
  vm.targets[target_index].visible = false
  for i, thread in vm.threads {
    if thread.target_index == target_index && thread.id != current_thread_id {
      vm.threads[i].done = true
    }
  }
}

///|
fn reset_targets_for_green_flag(vm : Vm) -> Unit {
  for i, target in vm.targets {
    if target.is_original {
      vm.targets[i].deleted = false
    } else {
      vm.targets[i].deleted = true
    }
  }
}

///|
fn spawn_thread(
  vm : Vm,
  target_index : Int,
  start_block : String,
  parent_waiter : Int?,
) -> Unit {
  let thread_id = vm.next_thread_id
  vm.next_thread_id += 1
  let thread : Thread = {
    id: thread_id,
    target_index,
    pc: Some(start_block),
    wait_until_ms: None,
    wait_for_input: None,
    done: false,
    stack: [],
    loop_counters: {},
    parent_waiter,
  }
  vm.threads.push(thread)
}

///|
fn clear_threads(vm : Vm) -> Unit {
  vm.threads.clear()
  vm.waiting_children.clear()
  vm.procedure_frames.clear()
  vm.current_thread_id = None
  vm.running = false
}

///|
fn decrement_waiting_child(vm : Vm, waiter_id : Int) -> Unit {
  let current = vm.waiting_children.get_or_default(waiter_id, 0)
  if current <= 1 {
    vm.waiting_children.remove(waiter_id)
  } else {
    vm.waiting_children[waiter_id] = current - 1
  }
}

///|
fn cleanup_done_threads(vm : Vm) -> Unit {
  let survivors = []
  for thread in vm.threads {
    if thread.done {
      match thread.parent_waiter {
        Some(waiter) => decrement_waiting_child(vm, waiter)
        None => ()
      }
      vm.procedure_frames.remove(thread.id)
    } else {
      survivors.push(thread)
    }
  }
  vm.threads = survivors
  if vm.threads.is_empty() {
    vm.running = false
  }
}
