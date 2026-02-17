///|
fn precompiled_backdrop_cache_key(width : Int, height : Int) -> String {
  "\{width}x\{height}"
}

///|
fn precompiled_initial_opaque_backdrop_pixels(
  precompiled : PrecompiledProject,
  width : Int,
  height : Int,
) -> Array[Byte] {
  if width <= 0 || height <= 0 {
    return []
  }
  let key = precompiled_backdrop_cache_key(width, height)
  match precompiled.initial_opaque_backdrops.get(key) {
    Some(pixels) => pixels
    None => {
      let pixels = if precompiled.stage_index >= 0 &&
        precompiled.stage_index < precompiled.targets.length() {
        let stage = precompiled.targets[precompiled.stage_index]
        match render_current_costume(stage) {
          Some(costume) =>
            render_build_opaque_stage_pixels(costume, width, height)
          None => render_build_opaque_white_pixels(width, height)
        }
      } else {
        render_build_opaque_white_pixels(width, height)
      }
      precompiled.initial_opaque_backdrops[key] = pixels
      pixels
    }
  }
}

///|
fn target_has_renderable_costume(target : TargetState) -> Bool {
  if target.size <= 0.0 {
    return false
  }
  match render_current_costume(target) {
    Some(costume) =>
      costume.width > 0 &&
      costume.height > 0 &&
      costume.bitmap_resolution > 0 &&
      costume.pixels.length() >= costume.width * costume.height * 4
    None => false
  }
}

///|
fn has_initial_renderable_sprite(
  targets : Array[TargetState],
  stage_index : Int,
) -> Bool {
  for i, target in targets {
    if i == stage_index {
      continue
    }
    if target.deleted || target.is_stage || !target.visible {
      continue
    }
    if target_has_renderable_costume(target) {
      return true
    }
  }
  false
}

///|
fn vm_new_internal(precompiled : PrecompiledProject, options : VmOptions) -> Vm {
  let targets = instantiate_targets(precompiled.targets)
  let pen_width = if options.pen_width > 0 { options.pen_width } else { 480 }
  let pen_height = if options.pen_height > 0 { options.pen_height } else { 360 }
  let pen_pixels = []
  let pen_vectors = []

  let stage = if precompiled.stage_index >= 0 &&
    precompiled.stage_index < targets.length() {
    Some(targets[precompiled.stage_index])
  } else {
    None
  }
  let backdrop_cache_pixels = precompiled_initial_opaque_backdrop_pixels(
    precompiled, pen_width, pen_height,
  )
  let backdrop_cache_valid = backdrop_cache_pixels.length() ==
    pen_width * pen_height * 4
  let backdrop_cache_stage_index = match stage {
    Some(_) => precompiled.stage_index
    None => -1
  }
  let backdrop_cache_stage_costume_index = match stage {
    Some(stage) => render_stage_costume_index_for_cache(stage)
    None => -1
  }
  let (
    backdrop_cache_effect_color,
    backdrop_cache_effect_fisheye,
    backdrop_cache_effect_whirl,
    backdrop_cache_effect_pixelate,
    backdrop_cache_effect_mosaic,
    backdrop_cache_effect_brightness,
    backdrop_cache_effect_ghost,
  ) = match stage {
    Some(stage) =>
      (
        stage.looks_effect_color,
        stage.looks_effect_fisheye,
        stage.looks_effect_whirl,
        stage.looks_effect_pixelate,
        stage.looks_effect_mosaic,
        stage.looks_effect_brightness,
        stage.looks_effect_ghost,
      )
    None => (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
  }
  let stage_uniforms = match stage {
    Some(stage) => render_effect_uniforms(stage)
    None => render_no_effect_uniforms()
  }
  let stage_has_effects = stage_uniforms.enable_mosaic ||
    stage_uniforms.enable_pixelate ||
    stage_uniforms.enable_whirl ||
    stage_uniforms.enable_fisheye ||
    stage_uniforms.enable_color ||
    stage_uniforms.enable_brightness ||
    stage_uniforms.enable_ghost
  let can_seed_render_cache = backdrop_cache_valid &&
    !stage_has_effects &&
    !has_initial_renderable_sprite(targets, precompiled.stage_index)

  {
    targets,
    stage_index: precompiled.stage_index,
    assets: precompiled.assets,
    options,
    pen_width,
    pen_height,
    pen_pixels,
    pen_vectors,
    render_revision: 0,
    render_cache_valid: can_seed_render_cache,
    render_cache_revision: if can_seed_render_cache {
      0
    } else {
      -1
    },
    render_cache_pixels: if can_seed_render_cache {
      backdrop_cache_pixels
    } else {
      []
    },
    pen_bounds_valid: false,
    pen_min_x: 0,
    pen_min_y: 0,
    pen_max_x: 0,
    pen_max_y: 0,
    backdrop_cache_valid,
    backdrop_cache_pixels,
    backdrop_cache_width: if backdrop_cache_valid {
      pen_width
    } else {
      0
    },
    backdrop_cache_height: if backdrop_cache_valid {
      pen_height
    } else {
      0
    },
    backdrop_cache_stage_index,
    backdrop_cache_stage_costume_index,
    backdrop_cache_effect_color,
    backdrop_cache_effect_fisheye,
    backdrop_cache_effect_whirl,
    backdrop_cache_effect_pixelate,
    backdrop_cache_effect_mosaic,
    backdrop_cache_effect_brightness,
    backdrop_cache_effect_ghost,
    threads: [],
    next_thread_id: 1,
    run_id: 0,
    now_ms: 0,
    running: false,
    answer: "",
    effects: [],
    io_state: {},
    io_prev_state: {},
    waiting_children: {},
    rng_state: options.seed,
    control_counter: 0,
    hot_op_counts: {},
    next_clone_id: 1,
    hat_predicates: {},
    timer_start_ms: 0,
    music_tempo: 60.0,
    tts_language: "en",
    procedure_frames: {},
    pending_translate_requests: {},
    redraw_requested: false,
    redraw_requested_while_warp: false,
    current_thread_id: None,
    mathop_sin_cache_valid: false,
    mathop_sin_cache_input: 0.0,
    mathop_sin_cache_output: 0.0,
    mathop_cos_cache_valid: false,
    mathop_cos_cache_input: 0.0,
    mathop_cos_cache_output: 0.0,
    aot_commands: [],
    aot_pending: false,
    aot_full_green_flag_starts: {},
    aot_use_full_exec: false,
    aot_wasm_only: false,
    frame_override: None,
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
) -> (Int, String, Int?)? {
  let target = vm.targets[target_index]
  let stage = vm.targets[vm.stage_index]

  match variable_id {
    Some(id) => resolve_variable_ref_by_id(vm, target_index, id)
    None =>
      match variable_name {
        Some(name) =>
          match target.variable_names.get(name) {
            Some(id) =>
              Some((target_index, id, target.variable_slot_by_name.get(name)))
            None =>
              match stage.variable_names.get(name) {
                Some(id) =>
                  Some(
                    (vm.stage_index, id, stage.variable_slot_by_name.get(name)),
                  )
                None => None
              }
          }
        None => None
      }
  }
}

///|
fn resolve_variable_ref_by_id(
  vm : Vm,
  target_index : Int,
  variable_id : String,
) -> (Int, String, Int?)? {
  let target = vm.targets[target_index]
  let stage = vm.targets[vm.stage_index]

  match target.variable_slot_by_id.get(variable_id) {
    Some(slot) => return Some((target_index, variable_id, Some(slot)))
    None => ()
  }
  if target.variables.contains(variable_id) {
    return Some((target_index, variable_id, None))
  }
  match stage.variable_slot_by_id.get(variable_id) {
    Some(slot) => return Some((vm.stage_index, variable_id, Some(slot)))
    None => ()
  }
  if stage.variables.contains(variable_id) {
    return Some((vm.stage_index, variable_id, None))
  }
  None
}

///|
fn read_variable(
  vm : Vm,
  target_index : Int,
  variable_id : String?,
  variable_name : String?,
) -> Json {
  match resolve_variable_ref(vm, target_index, variable_id, variable_name) {
    Some((owner_index, id, slot)) =>
      read_variable_by_ref(vm, owner_index, id, slot)
    None => Json::null()
  }
}

///|
fn read_variable_by_ref(
  vm : Vm,
  owner_index : Int,
  variable_id : String,
  slot : Int?,
) -> Json {
  match slot {
    Some(slot) =>
      if slot >= 0 && slot < vm.targets[owner_index].variable_values.length() {
        vm.targets[owner_index].variable_values[slot]
      } else {
        vm.targets[owner_index].variables.get_or_default(
          variable_id,
          Json::null(),
        )
      }
    None =>
      vm.targets[owner_index].variables.get_or_default(
        variable_id,
        Json::null(),
      )
  }
}

///|
fn write_variable_by_ref(
  vm : Vm,
  owner_index : Int,
  variable_id : String,
  slot : Int?,
  value : Json,
) -> Unit {
  vm.targets[owner_index].variables[variable_id] = value
  match slot {
    Some(slot) =>
      if slot >= 0 && slot < vm.targets[owner_index].variable_values.length() {
        vm.targets[owner_index].variable_values[slot] = value
        vm.targets[owner_index].variable_numeric_flags[slot] = json_is_numeric_comparable(
          value,
        )
      }
    None => ()
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
    Some((owner_index, id, slot)) =>
      write_variable_by_ref(vm, owner_index, id, slot, value)
    None =>
      match variable_name {
        Some(name) => {
          let stage_index = vm.stage_index
          let new_id = "stage_var_\{name}"
          let new_slot = vm.targets[stage_index].variable_values.length()
          vm.targets[stage_index].variables[new_id] = value
          vm.targets[stage_index].variable_names[name] = new_id
          vm.targets[stage_index].variable_slot_by_id[new_id] = new_slot
          vm.targets[stage_index].variable_slot_by_name[name] = new_slot
          vm.targets[stage_index].variable_id_by_slot.push(new_id)
          vm.targets[stage_index].variable_values.push(value)
          vm.targets[stage_index].variable_numeric_flags.push(
            json_is_numeric_comparable(value),
          )
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
) -> (Int, String, Int?)? {
  let target = vm.targets[target_index]
  let stage = vm.targets[vm.stage_index]

  match list_id {
    Some(id) => {
      match target.list_slot_by_id.get(id) {
        Some(slot) => return Some((target_index, id, Some(slot)))
        None => ()
      }
      if target.lists.contains(id) {
        return Some((target_index, id, None))
      }
      match stage.list_slot_by_id.get(id) {
        Some(slot) => return Some((vm.stage_index, id, Some(slot)))
        None => ()
      }
      if stage.lists.contains(id) {
        return Some((vm.stage_index, id, None))
      }
      None
    }
    None =>
      match list_name {
        Some(name) =>
          match target.list_names.get(name) {
            Some(id) =>
              Some((target_index, id, target.list_slot_by_name.get(name)))
            None =>
              match stage.list_names.get(name) {
                Some(id) =>
                  Some((vm.stage_index, id, stage.list_slot_by_name.get(name)))
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
    Some((owner_index, id, slot)) => read_list_by_ref(vm, owner_index, id, slot)
    None => []
  }
}

///|
fn read_list_by_ref(
  vm : Vm,
  owner_index : Int,
  list_id : String,
  slot : Int?,
) -> Array[Json] {
  match slot {
    Some(slot) =>
      if slot >= 0 && slot < vm.targets[owner_index].list_values.length() {
        vm.targets[owner_index].list_values[slot]
      } else {
        vm.targets[owner_index].lists.get_or_default(list_id, [])
      }
    None => vm.targets[owner_index].lists.get_or_default(list_id, [])
  }
}

///|
fn write_list_by_ref(
  vm : Vm,
  owner_index : Int,
  list_id : String,
  slot : Int?,
  value : Array[Json],
) -> Unit {
  vm.targets[owner_index].lists[list_id] = value
  match slot {
    Some(slot) =>
      if slot >= 0 && slot < vm.targets[owner_index].list_values.length() {
        vm.targets[owner_index].list_values[slot] = value
      }
    None => ()
  }
}

///|
fn with_list_mut(
  vm : Vm,
  target_index : Int,
  list_id : String?,
  list_name : String?,
) -> (Int, String, Int?)? {
  match resolve_list_ref(vm, target_index, list_id, list_name) {
    Some(pair) => Some(pair)
    None =>
      match list_name {
        Some(name) => {
          let stage_index = vm.stage_index
          let created = "stage_list_\{name}"
          let new_slot = vm.targets[stage_index].list_values.length()
          vm.targets[stage_index].lists[created] = []
          vm.targets[stage_index].list_names[name] = created
          vm.targets[stage_index].list_slot_by_id[created] = new_slot
          vm.targets[stage_index].list_slot_by_name[name] = new_slot
          vm.targets[stage_index].list_id_by_slot.push(created)
          vm.targets[stage_index].list_values.push([])
          Some((stage_index, created, Some(new_slot)))
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
fn copy_int_map(source : Map[String, Int]) -> Map[String, Int] {
  let out = {}
  source.each((key, value) => out[key] = value)
  out
}

///|
fn copy_double_map(source : Map[String, Double]) -> Map[String, Double] {
  let out = {}
  source.each((key, value) => out[key] = value)
  out
}

///|
fn copy_string_array(source : Array[String]) -> Array[String] {
  source.copy()
}

///|
fn copy_json_array(source : Array[Json]) -> Array[Json] {
  source.copy()
}

///|
fn copy_nested_json_array(source : Array[Array[Json]]) -> Array[Array[Json]] {
  source.map(fn(values) { values.copy() })
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
fn copy_procedure_map(
  source : Map[String, ProcedureSpec],
) -> Map[String, ProcedureSpec] {
  let out = {}
  source.each((key, value) => {
    out[key] = {
      start_block: value.start_block,
      param_names: value.param_names.copy(),
      param_ids: value.param_ids.copy(),
      param_defaults: value.param_defaults.copy(),
      warp_mode: value.warp_mode,
    }
  })
  out
}

///|
fn copy_target_state_with_meta(
  source : TargetState,
  id : String,
  is_original : Bool,
  deleted : Bool,
) -> TargetState {
  {
    id,
    name: source.name,
    is_stage: source.is_stage,
    is_original,
    deleted,
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
    variable_slot_by_id: copy_int_map(source.variable_slot_by_id),
    variable_slot_by_name: copy_int_map(source.variable_slot_by_name),
    variable_id_by_slot: source.variable_id_by_slot.copy(),
    variable_values: copy_json_array(source.variable_values),
    variable_numeric_flags: source.variable_numeric_flags.copy(),
    lists: copy_list_map(source.lists),
    list_names: copy_string_map(source.list_names),
    list_slot_by_id: copy_int_map(source.list_slot_by_id),
    list_slot_by_name: copy_int_map(source.list_slot_by_name),
    list_id_by_slot: source.list_id_by_slot.copy(),
    list_values: copy_nested_json_array(source.list_values),
    blocks: copy_block_map(source.blocks),
    const_number_block_values: copy_double_map(source.const_number_block_values),
    procedures: copy_procedure_map(source.procedures),
    block_pc_by_id: copy_int_map(source.block_pc_by_id),
    blocks_by_pc: source.blocks_by_pc.copy(),
    block_fast_meta_by_pc: source.block_fast_meta_by_pc.copy(),
    numeric_program_cache: {},
    numeric_program_compile_failed: {},
    bool_program_cache: {},
    bool_program_compile_failed: {},
    top_level_hats: source.top_level_hats.copy(),
    green_flag_starts: source.green_flag_starts.copy(),
    stage_clicked_starts: source.stage_clicked_starts.copy(),
    sprite_clicked_starts: source.sprite_clicked_starts.copy(),
    clone_start_starts: source.clone_start_starts.copy(),
    key_pressed_hats: source.key_pressed_hats.copy(),
    broadcast_hats: source.broadcast_hats.copy(),
    backdrop_hats: source.backdrop_hats.copy(),
    predicate_hats: source.predicate_hats.copy(),
  }
}

///|
fn instantiate_targets(
  source_targets : Array[TargetState],
) -> Array[TargetState] {
  let targets = []
  for source in source_targets {
    targets.push(
      copy_target_state_with_meta(
        source,
        source.id,
        source.is_original,
        source.deleted,
      ),
    )
  }
  targets
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
  copy_target_state_with_meta(
    source,
    "\{source.id}#clone_\{clone_id}",
    false,
    false,
  )
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
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  let start_pc = match
    vm.targets[target_index].block_pc_by_id.get(start_block) {
    Some(pc) => pc
    None => return
  }
  ignore(spawn_thread_pc(vm, target_index, start_pc, parent_waiter))
}

///|
fn spawn_thread_pc(
  vm : Vm,
  target_index : Int,
  start_pc : Int,
  parent_waiter : Int?,
) -> Bool {
  if target_index < 0 || target_index >= vm.targets.length() {
    return false
  }
  if start_pc < 0 || start_pc >= vm.targets[target_index].blocks_by_pc.length() {
    return false
  }
  let thread_id = vm.next_thread_id
  vm.next_thread_id += 1
  let thread : Thread = {
    id: thread_id,
    target_index,
    pc: Some(start_pc),
    wait_until_ms: None,
    wait_for_input: None,
    done: false,
    warp_mode: false,
    warp_started_ms: 0,
    stack: [],
    loop_counters: {},
    parent_waiter,
  }
  vm.threads.push(thread)
  true
}

///|
fn clear_threads(vm : Vm) -> Unit {
  vm.threads.clear()
  vm.waiting_children.clear()
  vm.procedure_frames.clear()
  vm.frame_override = None
  vm.current_thread_id = None
  vm.redraw_requested_while_warp = false
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
