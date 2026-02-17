///|
fn repeat_frame(remaining : Int, substack : Int?, after : Int?) -> ControlFrame {
  { kind: ControlFrameKind::Repeat, remaining, substack, after }
}

///|
fn forever_frame(substack : Int?, after : Int?) -> ControlFrame {
  { kind: ControlFrameKind::Forever, remaining: 0, substack, after }
}

///|
fn clamp_0_100(value : Double) -> Double {
  if value < 0.0 {
    0.0
  } else if value > 100.0 {
    100.0
  } else {
    value
  }
}

///|
fn clamp_double(value : Double, min : Double, max : Double) -> Double {
  if value < min {
    min
  } else if value > max {
    max
  } else {
    value
  }
}

///|
fn clamp_music_tempo(value : Double) -> Double {
  clamp_double(value, 20.0, 500.0)
}

///|
fn clamp_music_beats(value : Double) -> Double {
  clamp_double(value, 0.0, 100.0)
}

///|
fn wrap_int(value : Int, min : Int, max : Int) -> Int {
  if max < min {
    return min
  }
  let span = max - min + 1
  let shifted = (value - min).mod(span)
  if shifted < 0 {
    shifted + span + min
  } else {
    shifted + min
  }
}

///|
fn normalize_music_drum(drum : Double) -> Int {
  let raw = drum.round().to_int() - 1
  wrap_int(raw, 0, 17) + 1
}

///|
fn normalize_music_instrument_index(instrument : Double) -> Int {
  let raw = instrument.round().to_int() - 1
  wrap_int(raw, 0, 20)
}

///|
fn music_beats_to_ms(vm : Vm, beats : Double) -> Int {
  if vm.music_tempo <= 0.0 {
    0
  } else {
    (60.0 / vm.music_tempo * beats * 1000.0).to_int()
  }
}

///|
fn input_or_field_string(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
  input_name : String,
  field_name : String,
) -> String {
  let from_input = json_to_string_value(
      value_from_input(vm, target_index, block, input_name, 0),
    )
    .trim()
    .to_string()
  if from_input != "" {
    from_input
  } else {
    match field_value(block, field_name) {
      Some((value, _)) => value
      None => ""
    }
  }
}

///|
fn block_constant_number_input(
  block : ScratchBlock,
  input_name : String,
) -> Double? {
  block.const_number_inputs.get(input_name)
}

///|
fn reporter_opcode_guaranteed_number(opcode : String) -> Bool {
  match opcode {
    "math_number"
    | "math_integer"
    | "math_whole_number"
    | "math_positive_number"
    | "math_angle"
    | "operator_add"
    | "operator_subtract"
    | "operator_multiply"
    | "operator_divide"
    | "operator_mod"
    | "operator_round"
    | "operator_mathop"
    | "operator_random"
    | "motion_xposition"
    | "motion_yposition"
    | "motion_direction"
    | "looks_size"
    | "sound_volume"
    | "sensing_timer"
    | "sensing_mousex"
    | "sensing_mousey"
    | "sensing_current"
    | "sensing_dayssince2000"
    | "sensing_loudness"
    | "music_getTempo"
    | "control_get_counter" => true
    _ => false
  }
}

///|
fn fast_numeric_value_for_setvariable(
  vm : Vm,
  target : TargetState,
  target_index : Int,
  block : ScratchBlock,
) -> Double? {
  match block.const_number_inputs.get("VALUE") {
    Some(value) => return Some(value)
    None => ()
  }
  match block_input_block_id(block, "VALUE") {
    Some(reporter_id) =>
      match target.blocks.get(reporter_id) {
        Some(reporter) =>
          if reporter_opcode_guaranteed_number(reporter.opcode) {
            Some(number_from_input(vm, target_index, block, "VALUE", 0))
          } else {
            None
          }
        None => None
      }
    None => None
  }
}

///|
fn can_fast_numeric_value_for_setvariable(
  target : TargetState,
  block : ScratchBlock,
) -> Bool {
  if block.const_number_inputs.contains("VALUE") {
    return true
  }
  match block_input_block_id(block, "VALUE") {
    Some(reporter_id) =>
      match target.blocks.get(reporter_id) {
        Some(reporter) => reporter_opcode_guaranteed_number(reporter.opcode)
        None => false
      }
    None => false
  }
}

///|
fn eval_reporter_number_or_fallback(
  vm : Vm,
  target_index : Int,
  block_id : String,
) -> Double {
  match eval_reporter_number_block_depth(vm, target_index, block_id, 1) {
    Some(value) => value
    None =>
      json_to_number_value(
        eval_reporter_block_depth(vm, target_index, block_id, 1),
      )
  }
}

///|
fn try_fast_repeat_motion_step(
  vm : Vm,
  target_index : Int,
  times : Int,
  substack_pc : Int?,
) -> Bool {
  if times <= 0 {
    return true
  }
  if target_index < 0 || target_index >= vm.targets.length() {
    return false
  }
  let target = vm.targets[target_index]
  if target.pen_down {
    if target.pen_transparency > 0.0 || target.pen_size != 1.0 {
      return false
    }
    if target.x.floor() != target.x || target.y.floor() != target.y {
      return false
    }
  }
  match substack_pc {
    Some(block_pc) =>
      if block_pc >= 0 &&
        block_pc < vm.targets[target_index].blocks_by_pc.length() {
        let body = vm.targets[target_index].blocks_by_pc[block_pc]
        if body.next is None {
          match body.opcode {
            "motion_changexby" =>
              match block_constant_number_input(body, "DX") {
                Some(dx) => {
                  if target.pen_down && dx.abs() != 1.0 {
                    return false
                  }
                  let total = dx * Double::from_int(times)
                  move_target_with_pen(
                    vm,
                    target_index,
                    vm.targets[target_index].x + total,
                    vm.targets[target_index].y,
                  )
                  true
                }
                None => false
              }
            "motion_changeyby" =>
              match block_constant_number_input(body, "DY") {
                Some(dy) => {
                  if target.pen_down && dy.abs() != 1.0 {
                    return false
                  }
                  let total = dy * Double::from_int(times)
                  move_target_with_pen(
                    vm,
                    target_index,
                    vm.targets[target_index].x,
                    vm.targets[target_index].y + total,
                  )
                  true
                }
                None => false
              }
            _ => false
          }
        } else {
          false
        }
      } else {
        false
      }
    None => false
  }
}

///|
fn try_fast_repeat_numeric_variable_loop(
  vm : Vm,
  target_index : Int,
  times : Int,
  substack_pc : Int?,
) -> Bool {
  if times <= 0 {
    return true
  }
  if target_index < 0 || target_index >= vm.targets.length() {
    return false
  }
  let target = vm.targets[target_index]
  let start_pc = match substack_pc {
    Some(pc) => pc
    None => return false
  }
  if start_pc < 0 || start_pc >= target.blocks_by_pc.length() {
    return false
  }

  let op_block_pcs = []
  let op_kinds = []
  let op_owner_indices = []
  let op_variable_ids = []
  let op_variable_slots = []
  let op_value_modes = []
  let op_value_consts = []
  let op_value_reporters = []

  let mut cursor_pc : Int? = Some(start_pc)
  let mut traversed = 0
  while traversed < 64 {
    traversed += 1
    let block_pc = match cursor_pc {
      Some(pc) => pc
      None => break
    }
    if block_pc < 0 || block_pc >= target.blocks_by_pc.length() {
      return false
    }
    let block = target.blocks_by_pc[block_pc]
    match block.opcode {
      "data_setvariableto" =>
        match field_value(block, "VARIABLE") {
          Some((name, id)) =>
            match resolve_variable_ref(vm, target_index, id, Some(name)) {
              Some((owner_index, variable_id, variable_slot)) => {
                if !can_fast_numeric_value_for_setvariable(target, block) {
                  return false
                }
                op_block_pcs.push(block_pc)
                op_kinds.push(0)
                op_owner_indices.push(owner_index)
                op_variable_ids.push(variable_id)
                op_variable_slots.push(variable_slot)
                match block.const_number_inputs.get("VALUE") {
                  Some(value) => {
                    op_value_modes.push(0)
                    op_value_consts.push(value)
                    op_value_reporters.push("")
                  }
                  None =>
                    match block_input_block_id(block, "VALUE") {
                      Some(reporter_id) => {
                        op_value_modes.push(1)
                        op_value_consts.push(0.0)
                        op_value_reporters.push(reporter_id)
                      }
                      None => return false
                    }
                }
              }
              None => return false
            }
          None => return false
        }
      "data_changevariableby" =>
        match field_value(block, "VARIABLE") {
          Some((name, id)) =>
            match resolve_variable_ref(vm, target_index, id, Some(name)) {
              Some((owner_index, variable_id, variable_slot)) => {
                op_block_pcs.push(block_pc)
                op_kinds.push(1)
                op_owner_indices.push(owner_index)
                op_variable_ids.push(variable_id)
                op_variable_slots.push(variable_slot)
                match block.const_number_inputs.get("VALUE") {
                  Some(value) => {
                    op_value_modes.push(0)
                    op_value_consts.push(value)
                    op_value_reporters.push("")
                  }
                  None =>
                    match block_input_block_id(block, "VALUE") {
                      Some(reporter_id) => {
                        op_value_modes.push(1)
                        op_value_consts.push(0.0)
                        op_value_reporters.push(reporter_id)
                      }
                      None => {
                        op_value_modes.push(2)
                        op_value_consts.push(0.0)
                        op_value_reporters.push("")
                      }
                    }
                }
              }
              None => return false
            }
          None => return false
        }
      _ => return false
    }
    cursor_pc = target_block_pc_from_id(target, block.next)
  }

  if cursor_pc is Some(_) || op_block_pcs.is_empty() {
    return false
  }

  for _ in 0..<times {
    for i in 0..<op_block_pcs.length() {
      let block_pc = op_block_pcs[i]
      let block = vm.targets[target_index].blocks_by_pc[block_pc]
      let owner_index = op_owner_indices[i]
      let variable_id = op_variable_ids[i]
      let variable_slot = op_variable_slots[i]
      let value = match op_value_modes[i] {
        0 => op_value_consts[i]
        1 =>
          eval_reporter_number_or_fallback(
            vm,
            target_index,
            op_value_reporters[i],
          )
        _ => number_from_input(vm, target_index, block, "VALUE", 0)
      }
      if op_kinds[i] == 0 {
        write_variable_by_ref(
          vm,
          owner_index,
          variable_id,
          variable_slot,
          json_number(value),
        )
      } else {
        let current = json_to_number_value(
          read_variable_by_ref(vm, owner_index, variable_id, variable_slot),
        )
        write_variable_by_ref(
          vm,
          owner_index,
          variable_id,
          variable_slot,
          json_number(current + value),
        )
      }
    }
  }
  true
}

///|
fn text2speech_voice_ids() -> Array[String] {
  ["ALTO", "TENOR", "SQUEAK", "GIANT", "KITTEN"]
}

///|
fn normalize_tts_voice(raw : String, fallback : String) -> String {
  let input = raw.trim().to_string()
  if input == "" {
    return fallback
  }

  let voices = text2speech_voice_ids()
  match parse_double_or_none(input) {
    Some(number) => {
      let index = wrap_int(number.to_int() - 1, 0, voices.length() - 1)
      voices[index]
    }
    None => {
      let upper = input.to_upper().to_string()
      if voices.any(fn(voice) { voice == upper }) {
        upper
      } else {
        fallback
      }
    }
  }
}

///|
fn wrap_0_100(value : Double) -> Double {
  let wrapped = value.mod(100.0)
  if wrapped < 0.0 {
    wrapped + 100.0
  } else {
    wrapped
  }
}

///|
fn set_target_pen_color_param(
  vm : Vm,
  target_index : Int,
  param : String,
  value : Double,
  change : Bool,
) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  match lower_trim(param) {
    "color" => {
      let base = if change { vm.targets[target_index].pen_color } else { 0.0 }
      vm.targets[target_index].pen_color = wrap_0_100(base + value)
    }
    "saturation" => {
      let base = if change {
        vm.targets[target_index].pen_saturation
      } else {
        0.0
      }
      vm.targets[target_index].pen_saturation = clamp_0_100(base + value)
    }
    "brightness" => {
      let base = if change {
        vm.targets[target_index].pen_brightness
      } else {
        0.0
      }
      vm.targets[target_index].pen_brightness = clamp_0_100(base + value)
    }
    "transparency" => {
      let base = if change {
        vm.targets[target_index].pen_transparency
      } else {
        0.0
      }
      vm.targets[target_index].pen_transparency = clamp_0_100(base + value)
    }
    _ => ()
  }
}

///|
fn set_target_pen_color_from_rgb(
  vm : Vm,
  target_index : Int,
  r : Int,
  g : Int,
  b : Int,
) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  let (h, s, v) = render_rgb_to_hsv01(
    Double::from_int(r) / 255.0,
    Double::from_int(g) / 255.0,
    Double::from_int(b) / 255.0,
  )
  vm.targets[target_index].pen_color = h * 100.0
  vm.targets[target_index].pen_saturation = s * 100.0
  vm.targets[target_index].pen_brightness = v * 100.0
  vm.targets[target_index].pen_transparency = 0.0
  vm.targets[target_index].pen_legacy_shade = vm.targets[target_index].pen_brightness /
    2.0
}

///|
fn apply_target_legacy_pen_shade(vm : Vm, target_index : Int) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  let (base_r, base_g, base_b) = render_hsv01_to_rgb(
    vm.targets[target_index].pen_color / 100.0,
    1.0,
    1.0,
  )
  let shade = if vm.targets[target_index].pen_legacy_shade > 100.0 {
    200.0 - vm.targets[target_index].pen_legacy_shade
  } else {
    vm.targets[target_index].pen_legacy_shade
  }
  let (mixed_r, mixed_g, mixed_b) = if shade < 50.0 {
    let ratio = (10.0 + shade) / 60.0
    (base_r * ratio, base_g * ratio, base_b * ratio)
  } else {
    let ratio = (shade - 50.0) / 60.0
    (
      base_r * (1.0 - ratio) + 1.0 * ratio,
      base_g * (1.0 - ratio) + 1.0 * ratio,
      base_b * (1.0 - ratio) + 1.0 * ratio,
    )
  }
  let (h, s, v) = render_rgb_to_hsv01(mixed_r, mixed_g, mixed_b)
  vm.targets[target_index].pen_color = h * 100.0
  vm.targets[target_index].pen_saturation = s * 100.0
  vm.targets[target_index].pen_brightness = v * 100.0
}

///|
fn set_target_looks_effect(
  vm : Vm,
  target_index : Int,
  effect : String,
  value : Double,
  change : Bool,
) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  match lower_trim(effect) {
    "color" =>
      vm.targets[target_index].looks_effect_color = if change {
        vm.targets[target_index].looks_effect_color + value
      } else {
        value
      }
    "fisheye" =>
      vm.targets[target_index].looks_effect_fisheye = if change {
        vm.targets[target_index].looks_effect_fisheye + value
      } else {
        value
      }
    "whirl" =>
      vm.targets[target_index].looks_effect_whirl = if change {
        vm.targets[target_index].looks_effect_whirl + value
      } else {
        value
      }
    "pixelate" =>
      vm.targets[target_index].looks_effect_pixelate = if change {
        vm.targets[target_index].looks_effect_pixelate + value
      } else {
        value
      }
    "mosaic" =>
      vm.targets[target_index].looks_effect_mosaic = if change {
        vm.targets[target_index].looks_effect_mosaic + value
      } else {
        value
      }
    "brightness" =>
      vm.targets[target_index].looks_effect_brightness = if change {
        vm.targets[target_index].looks_effect_brightness + value
      } else {
        value
      }
    "ghost" =>
      vm.targets[target_index].looks_effect_ghost = if change {
        vm.targets[target_index].looks_effect_ghost + value
      } else {
        value
      }
    _ => ()
  }
}

///|
fn clear_target_looks_effect(vm : Vm, target_index : Int) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  vm.targets[target_index].looks_effect_color = 0.0
  vm.targets[target_index].looks_effect_fisheye = 0.0
  vm.targets[target_index].looks_effect_whirl = 0.0
  vm.targets[target_index].looks_effect_pixelate = 0.0
  vm.targets[target_index].looks_effect_mosaic = 0.0
  vm.targets[target_index].looks_effect_brightness = 0.0
  vm.targets[target_index].looks_effect_ghost = 0.0
}

///|
fn sync_thread_warp_state(vm : Vm, thread : Thread) -> Unit {
  match vm.procedure_frames.get(thread.id) {
    Some(stack) =>
      if stack.is_empty() {
        thread.warp_mode = false
        thread.warp_started_ms = 0
      } else {
        let frame = stack[stack.length() - 1]
        thread.warp_mode = frame.warp_mode
        if thread.warp_mode && thread.warp_started_ms == 0 {
          thread.warp_started_ms = vm.now_ms
        } else if !thread.warp_mode {
          thread.warp_started_ms = 0
        }
      }
    None => {
      thread.warp_mode = false
      thread.warp_started_ms = 0
    }
  }
}

///|
fn unwind_control(vm : Vm, thread : Thread) -> Thread {
  let thread = thread
  while thread.pc is None {
    let mut should_pop_procedure_first = false
    match vm.procedure_frames.get(thread.id) {
      Some(proc_stack) =>
        if !proc_stack.is_empty() {
          let current_proc = proc_stack[proc_stack.length() - 1]
          if thread.stack.length() <= current_proc.control_depth {
            should_pop_procedure_first = true
          }
        }
      None => ()
    }

    if should_pop_procedure_first {
      match pop_procedure_frame(vm, thread.id) {
        Some(frame) => {
          thread.pc = frame.return_pc
          sync_thread_warp_state(vm, thread)
          continue
        }
        None => ()
      }
    }

    match thread.stack.pop() {
      Some(frame) =>
        match frame.kind {
          ControlFrameKind::Repeat =>
            if frame.remaining > 1 {
              let next_frame = frame
              next_frame.remaining = frame.remaining - 1
              thread.stack.push(next_frame)
              thread.pc = frame.substack
            } else {
              thread.pc = frame.after
            }
          ControlFrameKind::Forever =>
            match frame.substack {
              Some(substack) => {
                // Re-push forever frame so the loop does not terminate after one unwind.
                thread.stack.push(frame)
                thread.pc = Some(substack)
              }
              None => thread.pc = frame.after
            }
        }
      None =>
        match pop_procedure_frame(vm, thread.id) {
          Some(frame) => {
            thread.pc = frame.return_pc
            sync_thread_warp_state(vm, thread)
          }
          None => {
            thread.done = true
            thread.warp_mode = false
            thread.warp_started_ms = 0
            return thread
          }
        }
    }
  }
  thread
}

///|
fn kill_other_scripts_for_target(
  vm : Vm,
  target_index : Int,
  current_thread_id : Int,
) -> Unit {
  for i, thread in vm.threads {
    if thread.target_index == target_index && thread.id != current_thread_id {
      vm.threads[i].done = true
    }
  }
}

///|
fn block_broadcast_name(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
) -> String {
  let from_input = value_from_input(
    vm, target_index, block, "BROADCAST_INPUT", 0,
  )
  let from_input_text = json_to_string_value(from_input)
  if from_input_text != "" {
    return from_input_text
  }
  match field_value(block, "BROADCAST_OPTION") {
    Some((name, _)) => name
    None => ""
  }
}

///|
fn block_clone_option(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
) -> String {
  let from_input = json_to_string_value(
    value_from_input(vm, target_index, block, "CLONE_OPTION", 0),
  )
  if from_input != "" {
    return from_input
  }
  match field_value(block, "CLONE_OPTION") {
    Some((name, _)) => name
    None => ""
  }
}

///|
fn find_clone_source_target(
  vm : Vm,
  current_target_index : Int,
  name : String,
) -> Int? {
  if name == "_myself_" {
    if current_target_index >= 0 &&
      current_target_index < vm.targets.length() &&
      !vm.targets[current_target_index].deleted {
      return Some(current_target_index)
    }
    return None
  }

  for i, target in vm.targets {
    if !target.deleted &&
      !target.is_stage &&
      target.is_original &&
      target.name == name {
      return Some(i)
    }
  }
  for i, target in vm.targets {
    if !target.deleted && !target.is_stage && target.name == name {
      return Some(i)
    }
  }
  None
}

///|
fn spawn_clone_start_hats(vm : Vm, target_index : Int) -> Int {
  if target_index < 0 || target_index >= vm.targets.length() {
    return 0
  }
  let target = vm.targets[target_index]
  if target.deleted {
    return 0
  }

  let mut count = 0
  for start in target.clone_start_starts {
    spawn_thread(vm, target_index, start, None)
    count += 1
  }
  count
}

///|
fn find_target_by_name(vm : Vm, name : String) -> Int? {
  for i, target in vm.targets {
    if !target.deleted && !target.is_stage && target.name == name {
      return Some(i)
    }
  }
  None
}

///|
fn read_mouse_xy(vm : Vm) -> (Double, Double) {
  match vm.io_state.get("mouse") {
    Some(Object(obj)) => {
      let x = object_get_number_or(obj, "x", 0.0)
      let y = object_get_number_or(obj, "y", 0.0)
      (x, y)
    }
    _ => (0.0, 0.0)
  }
}

///|
fn resolve_motion_menu_target(
  vm : Vm,
  current_target_index : Int,
  menu_value : String,
) -> (Double, Double)? {
  let key = menu_value.trim().to_string()
  if key == "_myself_" {
    if current_target_index >= 0 && current_target_index < vm.targets.length() {
      let target = vm.targets[current_target_index]
      if !target.deleted {
        return Some((target.x, target.y))
      }
    }
    return None
  }
  if key == "_mouse_" {
    return Some(read_mouse_xy(vm))
  }
  if key == "_random_" {
    let x = next_random_unit(vm) * 480.0 - 240.0
    let y = next_random_unit(vm) * 360.0 - 180.0
    return Some((x, y))
  }
  match find_target_by_name(vm, key) {
    Some(index) => {
      let target = vm.targets[index]
      Some((target.x, target.y))
    }
    None => None
  }
}

///|
fn normalized_scratch_direction(direction : Double) -> Double {
  let mut out = direction
  while out > 180.0 {
    out -= 360.0
  }
  while out <= -180.0 {
    out += 360.0
  }
  out
}

///|
fn point_towards_position(
  vm : Vm,
  target_index : Int,
  dest_x : Double,
  dest_y : Double,
) -> Unit {
  let dx = dest_x - vm.targets[target_index].x
  let dy = dest_y - vm.targets[target_index].y
  if dx == 0.0 && dy == 0.0 {
    return
  }
  let old_direction = vm.targets[target_index].direction
  let angle = 90.0 - @math.atan2(dy, dx) * 180.0 / @math.PI
  let new_direction = normalized_scratch_direction(angle)
  vm.targets[target_index].direction = new_direction
  if old_direction != new_direction {
    request_redraw(vm)
  }
}

///|
fn apply_if_on_edge_bounce(vm : Vm, target_index : Int) -> Unit {
  let original_x = vm.targets[target_index].x
  let original_y = vm.targets[target_index].y
  let mut x = original_x
  let mut y = original_y
  let mut direction = vm.targets[target_index].direction

  if x > 240.0 {
    x = 240.0
    direction = 180.0 - direction
  } else if x < -240.0 {
    x = -240.0
    direction = 180.0 - direction
  }

  if y > 180.0 {
    y = 180.0
    direction = -direction
  } else if y < -180.0 {
    y = -180.0
    direction = -direction
  }

  if x != original_x || y != original_y {
    move_target_with_pen(vm, target_index, x, y)
  }
  let old_direction = vm.targets[target_index].direction
  let new_direction = normalized_scratch_direction(direction)
  vm.targets[target_index].direction = new_direction
  if old_direction != new_direction {
    request_redraw(vm)
  }
}

///|
fn wrap_index(index : Int, count : Int) -> Int {
  if count <= 0 {
    return 0
  }
  let wrapped = index % count
  if wrapped < 0 {
    wrapped + count
  } else {
    wrapped
  }
}

///|
fn target_costume_count(target : TargetState) -> Int {
  if target.costume_names.is_empty() {
    1
  } else {
    target.costume_names.length()
  }
}

///|
fn normalized_target_costume_index(target : TargetState, index : Int) -> Int {
  wrap_index(index, target_costume_count(target))
}

///|
fn target_costume_name(target : TargetState, index : Int) -> String {
  if target.costume_names.is_empty() {
    "costume_\{index + 1}"
  } else {
    let normalized = normalized_target_costume_index(target, index)
    if normalized >= 0 && normalized < target.costume_names.length() {
      target.costume_names[normalized]
    } else {
      "costume_\{normalized + 1}"
    }
  }
}

///|
fn find_costume_index_by_name(target : TargetState, name : String) -> Int? {
  for i, costume_name in target.costume_names {
    if costume_name == name {
      return Some(i)
    }
  }
  let lowered = name.to_lower().to_string()
  for i, costume_name in target.costume_names {
    if costume_name.to_lower().to_string() == lowered {
      return Some(i)
    }
  }
  None
}

///|
fn resolve_target_costume_index(
  vm : Vm,
  target_index : Int,
  value : Json,
  backdrop_mode : Bool,
) -> Int? {
  if target_index < 0 || target_index >= vm.targets.length() {
    return None
  }
  let target = vm.targets[target_index]
  let count = target_costume_count(target)
  let current = normalized_target_costume_index(target, target.current_costume)

  let raw = json_to_string_value(value).trim().to_string()
  let lowered = raw.to_lower().to_string()
  if backdrop_mode {
    if lowered == "next backdrop" {
      return Some(wrap_index(current + 1, count))
    }
    if lowered == "previous backdrop" {
      return Some(wrap_index(current - 1, count))
    }
    if lowered == "random backdrop" {
      let sampled = (next_random_unit(vm) * Double::from_int(count))
        .floor()
        .to_int()
      return Some(sampled.clamp(min=0, max=count - 1))
    }
  } else {
    if lowered == "next costume" {
      return Some(wrap_index(current + 1, count))
    }
    if lowered == "previous costume" {
      return Some(wrap_index(current - 1, count))
    }
    if lowered == "random costume" {
      let sampled = (next_random_unit(vm) * Double::from_int(count))
        .floor()
        .to_int()
      return Some(sampled.clamp(min=0, max=count - 1))
    }
  }

  match value {
    Number(n, ..) => {
      let index = n.floor().to_int() - 1
      return Some(wrap_index(index, count))
    }
    _ => ()
  }

  match parse_double_or_none(raw) {
    Some(parsed) => {
      let index = parsed.floor().to_int() - 1
      return Some(wrap_index(index, count))
    }
    None => ()
  }

  match find_costume_index_by_name(target, raw) {
    Some(index) => Some(index)
    None => None
  }
}

///|
fn block_backdrop_value(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
) -> Json {
  let from_input = value_from_input(vm, target_index, block, "BACKDROP", 0)
  match from_input {
    Null =>
      match field_value(block, "BACKDROP") {
        Some((name, _)) => json_string(name)
        None => Json::null()
      }
    _ => from_input
  }
}

///|
fn spawn_hats_for_backdrop(
  vm : Vm,
  backdrop_name : String,
  parent_waiter : Int?,
) -> Int {
  let mut count = 0
  for target_index, target in vm.targets {
    if target.deleted {
      continue
    }
    for hat in target.backdrop_hats {
      if hat.backdrop_name == backdrop_name {
        spawn_thread(vm, target_index, hat.start_block, parent_waiter)
        count += 1
      }
    }
  }
  count
}

///|
fn set_stage_backdrop_index(
  vm : Vm,
  next_index : Int,
  parent_waiter : Int?,
) -> Int {
  if vm.stage_index < 0 || vm.stage_index >= vm.targets.length() {
    return 0
  }
  let stage_index = vm.stage_index
  let stage = vm.targets[stage_index]
  let normalized = normalized_target_costume_index(stage, next_index)
  let before = target_costume_name(stage, stage.current_costume)
  vm.targets[stage_index].current_costume = normalized
  let after = target_costume_name(vm.targets[stage_index], normalized)
  if after != before {
    request_redraw(vm)
    spawn_hats_for_backdrop(vm, after, parent_waiter)
  } else {
    0
  }
}

///|
fn set_stage_backdrop_from_value(
  vm : Vm,
  value : Json,
  parent_waiter : Int?,
) -> Int {
  match resolve_target_costume_index(vm, vm.stage_index, value, true) {
    Some(index) => set_stage_backdrop_index(vm, index, parent_waiter)
    None => 0
  }
}

///|
fn block_mutation_string(block : ScratchBlock, key : String) -> String? {
  match block.mutation.get(key) {
    Some(String(value)) => Some(value)
    Some(Number(value, ..)) => Some(value.to_string())
    Some(True) => Some("true")
    Some(False) => Some("false")
    _ => None
  }
}

///|
fn block_mutation_bool(block : ScratchBlock, key : String) -> Bool {
  match block.mutation.get(key) {
    Some(True) => true
    Some(False) => false
    Some(String(value)) => {
      let normalized = value.trim().to_lower()
      if normalized == "true" || normalized == "1" {
        true
      } else {
        false
      }
    }
    Some(Number(value, ..)) => value.to_int() != 0
    _ => false
  }
}

///|
fn parse_json_string_array(raw : String) -> Array[String] {
  let parsed = try? @json.parse(raw)
  match parsed {
    Ok(Array(values)) => values.map(json_to_string_value)
    _ => []
  }
}

///|
fn parse_json_value_array(raw : String) -> Array[Json] {
  let parsed = try? @json.parse(raw)
  match parsed {
    Ok(Array(values)) => values
    _ => []
  }
}

///|
fn find_procedure_body(
  target : TargetState,
  proccode : String,
) -> (String, Array[String], Array[String], Array[Json], Bool)? {
  match target.procedures.get(proccode) {
    Some(spec) =>
      Some(
        (
          spec.start_block,
          spec.param_names.copy(),
          spec.param_ids.copy(),
          spec.param_defaults.copy(),
          spec.warp_mode,
        ),
      )
    None => None
  }
}

///|
fn push_procedure_frame(
  vm : Vm,
  thread_id : Int,
  frame : ProcedureFrame,
) -> Unit {
  let stack = vm.procedure_frames.get_or_default(thread_id, [])
  stack.push(frame)
  vm.procedure_frames[thread_id] = stack
}

///|
fn pop_procedure_frame(vm : Vm, thread_id : Int) -> ProcedureFrame? {
  let stack = vm.procedure_frames.get_or_default(thread_id, [])
  match stack.pop() {
    Some(frame) => {
      if stack.is_empty() {
        vm.procedure_frames.remove(thread_id)
      } else {
        vm.procedure_frames[thread_id] = stack
      }
      Some(frame)
    }
    None => None
  }
}

///|
fn lower_trim(value : String) -> String {
  value.trim().to_lower().to_string()
}

///|
fn push_string_if_non_empty(
  out : Array[String],
  raw : Json,
  lower : Bool,
) -> Unit {
  let text = json_to_string_value(raw).trim().to_string()
  if text == "" {
    return
  }
  if lower {
    out.push(text.to_lower().to_string())
  } else {
    out.push(text)
  }
}

///|
fn parse_key_events(payload : Json) -> Array[String] {
  let out = []
  match payload {
    String(_) | Number(_, ..) => push_string_if_non_empty(out, payload, true)
    Array(items) =>
      for item in items {
        push_string_if_non_empty(out, item, true)
      }
    Object(obj) => {
      match obj.get("key") {
        Some(value) => push_string_if_non_empty(out, value, true)
        None => ()
      }
      match obj.get("keys") {
        Some(Array(items)) =>
          for item in items {
            push_string_if_non_empty(out, item, true)
          }
        _ => ()
      }
      match obj.get("pressed") {
        Some(Array(items)) =>
          for item in items {
            push_string_if_non_empty(out, item, true)
          }
        _ => ()
      }
    }
    _ => ()
  }
  out
}

///|
fn parse_name_events(
  payload : Json,
  single_key : String,
  array_key : String,
) -> Array[String] {
  let out = []
  match payload {
    String(_) | Number(_, ..) => push_string_if_non_empty(out, payload, false)
    Array(items) =>
      for item in items {
        push_string_if_non_empty(out, item, false)
      }
    Object(obj) => {
      match obj.get(single_key) {
        Some(value) => push_string_if_non_empty(out, value, false)
        None => ()
      }
      match obj.get(array_key) {
        Some(Array(items)) =>
          for item in items {
            push_string_if_non_empty(out, item, false)
          }
        _ => ()
      }
    }
    _ => ()
  }
  out
}

///|
fn parse_key_state_from_io(io_state : Map[String, Json]) -> Array[String] {
  let out = []
  match io_state.get("keys_down") {
    Some(payload) =>
      for key in parse_key_events(payload) {
        out.push(lower_trim(key))
      }
    None => ()
  }
  match io_state.get("keyboard") {
    Some(payload) =>
      for key in parse_key_events(payload) {
        out.push(lower_trim(key))
      }
    None => ()
  }
  out
}

///|
fn parse_backdrop_state_from_io(io_state : Map[String, Json]) -> Array[String] {
  let out = []
  match io_state.get("backdrop") {
    Some(payload) =>
      for name in parse_name_events(payload, "backdrop", "backdrops") {
        out.push(name)
      }
    None => ()
  }
  out
}

///|
fn unique_names(values : Array[String]) -> Array[String] {
  let seen = {}
  let out = []
  for raw in values {
    let value = raw.trim().to_string()
    if value == "" || seen.get_or_default(value, false) {
      continue
    }
    seen[value] = true
    out.push(value)
  }
  out
}

///|
fn newly_added_names(
  current_values : Array[String],
  previous_values : Array[String],
) -> Array[String] {
  let previous_set = {}
  for raw in previous_values {
    let value = raw.trim().to_string()
    if value == "" {
      continue
    }
    previous_set[value] = true
  }

  let seen = {}
  let out = []
  for raw in current_values {
    let value = raw.trim().to_string()
    if value == "" ||
      previous_set.get_or_default(value, false) ||
      seen.get_or_default(value, false) {
      continue
    }
    seen[value] = true
    out.push(value)
  }
  out
}

///|
fn read_mouse_down_from_io_state(io_state : Map[String, Json]) -> Bool {
  match io_state.get("mouse") {
    Some(Object(obj)) =>
      match obj.get("isDown") {
        Some(value) => json_to_bool_value(value)
        None =>
          match obj.get("down") {
            Some(value) => json_to_bool_value(value)
            None => false
          }
      }
    Some(value) => json_to_bool_value(value)
    None =>
      match io_state.get("mousedown") {
        Some(value) => json_to_bool_value(value)
        None => false
      }
  }
}

///|
fn read_mouse_targets_from_io_state(
  io_state : Map[String, Json],
) -> (Bool, Array[String]) {
  let mut stage = false
  let targets = []
  match io_state.get("mouse_targets") {
    Some(True) => stage = true
    Some(False) => ()
    Some(payload) =>
      match payload {
        String(_) | Number(_, ..) =>
          push_string_if_non_empty(targets, payload, false)
        Array(items) =>
          for item in items {
            push_string_if_non_empty(targets, item, false)
          }
        Object(obj) => {
          match obj.get("stage") {
            Some(value) => stage = json_to_bool_value(value)
            None => ()
          }
          match obj.get("target") {
            Some(value) => push_string_if_non_empty(targets, value, false)
            None => ()
          }
          match obj.get("targets") {
            Some(Array(items)) =>
              for item in items {
                push_string_if_non_empty(targets, item, false)
              }
            _ => ()
          }
          match obj.get("sprite") {
            Some(value) => push_string_if_non_empty(targets, value, false)
            None => ()
          }
          match obj.get("sprites") {
            Some(Array(items)) =>
              for item in items {
                push_string_if_non_empty(targets, item, false)
              }
            _ => ()
          }
        }
        _ => ()
      }
    _ => ()
  }
  (stage, unique_names(targets))
}

///|
fn has_mouse_down_rising_edge(vm : Vm) -> Bool {
  let current = read_mouse_down_from_io_state(vm.io_state)
  let previous = read_mouse_down_from_io_state(vm.io_prev_state)
  current && !previous
}

///|
fn dispatch_io_event_hats(vm : Vm) -> Int {
  let mut count = 0

  let current_keys = parse_key_state_from_io(vm.io_state)
  let previous_keys = parse_key_state_from_io(vm.io_prev_state)
  for key in newly_added_names(current_keys, previous_keys) {
    count += spawn_hats_for_key(vm, key)
  }

  if has_mouse_down_rising_edge(vm) {
    let (stage_clicked, sprite_targets) = read_mouse_targets_from_io_state(
      vm.io_state,
    )
    if stage_clicked {
      count += spawn_stage_clicked_hats(vm)
    }
    for name in sprite_targets {
      count += spawn_sprite_clicked_hats(vm, name)
    }
  }

  let current_backdrops = parse_backdrop_state_from_io(vm.io_state)
  let previous_backdrops = parse_backdrop_state_from_io(vm.io_prev_state)
  for name in newly_added_names(current_backdrops, previous_backdrops) {
    count += spawn_hats_for_backdrop(vm, name, None)
  }
  count
}

///|
fn spawn_hats_for_key(vm : Vm, key : String) -> Int {
  let key = lower_trim(key)
  let mut count = 0
  for target_index, target in vm.targets {
    if target.deleted {
      continue
    }
    for hat in target.key_pressed_hats {
      if hat.key_option == "any" || hat.key_option == key {
        spawn_thread(vm, target_index, hat.start_block, None)
        count += 1
      }
    }
  }
  count
}

///|
fn spawn_stage_clicked_hats(vm : Vm) -> Int {
  if vm.stage_index < 0 || vm.stage_index >= vm.targets.length() {
    return 0
  }
  let target_index = vm.stage_index
  let stage = vm.targets[target_index]
  if stage.deleted {
    return 0
  }

  let mut count = 0
  for start in stage.stage_clicked_starts {
    spawn_thread(vm, target_index, start, None)
    count += 1
  }
  count
}

///|
fn spawn_sprite_clicked_hats(vm : Vm, sprite_name : String) -> Int {
  let mut count = 0
  for target_index, target in vm.targets {
    if target.deleted || target.is_stage || target.name != sprite_name {
      continue
    }
    for start in target.sprite_clicked_starts {
      spawn_thread(vm, target_index, start, None)
      count += 1
    }
  }
  count
}

///|
fn read_loudness(vm : Vm) -> Double {
  match vm.io_state.get("loudness") {
    Some(Number(n, ..)) => n
    Some(Object(obj)) => object_get_number_or(obj, "value", 0.0)
    Some(String(raw)) =>
      match parse_double_or_none(raw) {
        Some(value) => value
        None => 0.0
      }
    _ => 0.0
  }
}

///|
fn read_touching_from_io(
  vm : Vm,
  target_name : String,
  option : String,
) -> Bool {
  let option = lower_trim(option)
  match vm.io_state.get("touching") {
    Some(Object(map)) =>
      match map.get(target_name) {
        Some(True) => true
        Some(False) => false
        Some(String(raw)) => {
          let value = lower_trim(raw)
          value == option || value == "any" || value == "_any_"
        }
        Some(Array(items)) =>
          items.any(fn(item) {
            let value = lower_trim(json_to_string_value(item))
            value == option || value == "any" || value == "_any_"
          })
        Some(Object(obj)) =>
          match obj.get(option) {
            Some(value) => json_to_bool_value(value)
            None =>
              match obj.get("any") {
                Some(value) => json_to_bool_value(value)
                None => false
              }
          }
        _ => false
      }
    _ => false
  }
}

///|
fn predicate_state_key(target_index : Int, hat_id : String) -> String {
  "\{target_index}:\{hat_id}"
}

///|
fn hat_predicate_value(
  vm : Vm,
  target_index : Int,
  target : TargetState,
  predicate : PredicateHatStart,
) -> Bool {
  match target.blocks.get(predicate.hat_id) {
    Some(hat) =>
      match predicate.kind {
        PredicateHatKind::WhenGreaterThan => {
          let threshold = json_to_number_value(
            value_from_input(vm, target_index, hat, "VALUE", 0),
          )
          let current = if predicate.menu == "timer" {
            Double::from_int(vm.now_ms - vm.timer_start_ms) / 1000.0
          } else if predicate.menu == "loudness" {
            read_loudness(vm)
          } else {
            0.0
          }
          current > threshold
        }
        PredicateHatKind::WhenTouchingObject =>
          read_touching_from_io(vm, target.name, predicate.menu)
      }
    None => false
  }
}

///|
fn spawn_predicate_hats(vm : Vm) -> Int {
  let mut count = 0
  for target_index, target in vm.targets {
    if target.deleted {
      continue
    }
    for predicate in target.predicate_hats {
      let key = predicate_state_key(target_index, predicate.hat_id)
      let previous = vm.hat_predicates.get_or_default(key, false)
      let current = hat_predicate_value(vm, target_index, target, predicate)
      if current && !previous {
        spawn_thread(vm, target_index, predicate.start_block, None)
        count += 1
      }
      vm.hat_predicates[key] = current
    }
  }
  count
}

///|
fn spawn_hats_for_message(
  vm : Vm,
  message : String,
  parent_waiter : Int?,
) -> Int {
  let mut count = 0
  for target_index, target in vm.targets {
    if target.deleted {
      continue
    }
    for hat in target.broadcast_hats {
      if hat.message == message {
        spawn_thread(vm, target_index, hat.start_block, parent_waiter)
        count += 1
      }
    }
  }
  count
}

///|
fn spawn_aot_green_flag_hats(vm : Vm) -> Int {
  let mut count = 0
  for target_index, target in vm.targets {
    if target.deleted {
      continue
    }
    match vm.aot_full_green_flag_starts.get(target_index) {
      Some(start_pcs) =>
        for start_pc in start_pcs {
          if spawn_thread_pc(vm, target_index, start_pc, None) {
            count += 1
          }
        }
      None => ()
    }
  }
  count
}

///|
fn spawn_green_flag_hats(vm : Vm) -> Int {
  let mut count = 0
  for target_index, target in vm.targets {
    if target.deleted {
      continue
    }
    for start in target.green_flag_starts {
      spawn_thread(vm, target_index, start, None)
      count += 1
    }
  }
  count
}

///|
fn resolve_thread_input_wait(vm : Vm, thread : Thread) -> Thread {
  match thread.wait_for_input {
    Some(key) => {
      match vm.io_state.get(key) {
        Some(value) => {
          if key == "answer" {
            vm.answer = json_to_string_value(value)
          }
          thread.wait_for_input = None
        }
        None => ()
      }
      thread
    }
    None => thread
  }
}

///|
fn is_thread_blocked(vm : Vm, thread : Thread) -> Bool {
  let waiting_time = match thread.wait_until_ms {
    Some(until_ms) if vm.now_ms < until_ms => true
    Some(_) => false
    None => false
  }
  let waiting_input = match thread.wait_for_input {
    Some(_) => true
    None => false
  }
  let waiting_children = vm.waiting_children.get_or_default(thread.id, 0) > 0
  waiting_time || waiting_input || waiting_children
}

///|
fn is_warp_window_active(vm : Vm, thread : Thread) -> Bool {
  ignore(vm)
  thread.warp_mode
}

///|
fn has_active_warp_thread(vm : Vm) -> Bool {
  for thread in vm.threads {
    if thread.done {
      continue
    }
    if thread.warp_mode {
      return true
    }
    match vm.procedure_frames.get(thread.id) {
      Some(frames) =>
        for frame in frames {
          if frame.warp_mode {
            return true
          }
        }
      None => ()
    }
  }
  false
}

///|
fn is_current_thread_in_warp_context(vm : Vm) -> Bool {
  match vm.current_thread_id {
    Some(thread_id) => {
      for thread in vm.threads {
        if thread.id == thread_id {
          if thread.warp_mode {
            return true
          }
          break
        }
      }
      match vm.procedure_frames.get(thread_id) {
        Some(frames) =>
          for frame in frames {
            if frame.warp_mode {
              return true
            }
          }
        None => ()
      }
      false
    }
    None => false
  }
}

///|
fn request_redraw(vm : Vm) -> Unit {
  if !vm.redraw_requested {
    vm.render_revision += 1
  }
  vm.redraw_requested = true
  vm.render_cache_valid = false
  if is_current_thread_in_warp_context(vm) {
    vm.redraw_requested_while_warp = true
  }
}

///|
fn target_block_pc_from_id(target : TargetState, block_id : String?) -> Int? {
  match block_id {
    Some(id) => target.block_pc_by_id.get(id)
    None => None
  }
}

///|
fn target_block_from_pc(target : TargetState, block_pc : Int) -> ScratchBlock? {
  if block_pc < 0 || block_pc >= target.blocks_by_pc.length() {
    None
  } else {
    Some(target.blocks_by_pc[block_pc])
  }
}

///|
fn execute_list_delete(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
) -> Unit {
  match field_value(block, "LIST") {
    Some((list_name, list_id)) =>
      match with_list_mut(vm, target_index, list_id, Some(list_name)) {
        Some((owner, id, slot)) => {
          let list = read_list_by_ref(vm, owner, id, slot)
          let index_value = value_from_input(
            vm, target_index, block, "INDEX", 0,
          )
          let key = json_to_string_value(index_value).trim().to_lower()
          if key == "all" {
            list.clear()
          } else {
            match
              normalize_index(index_value, list.length(), next_random_unit(vm)) {
              Some(index) =>
                if index >= 0 && index < list.length() {
                  ignore(list.remove(index))
                }
              None => ()
            }
          }
          write_list_by_ref(vm, owner, id, slot, list)
        }
        None => ()
      }
    None => ()
  }
}

///|
fn execute_list_insert(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
) -> Unit {
  match field_value(block, "LIST") {
    Some((list_name, list_id)) =>
      match with_list_mut(vm, target_index, list_id, Some(list_name)) {
        Some((owner, id, slot)) => {
          let list = read_list_by_ref(vm, owner, id, slot)
          let item = value_from_input(vm, target_index, block, "ITEM", 0)
          let index_value = value_from_input(
            vm, target_index, block, "INDEX", 0,
          )
          let raw = json_to_string_value(index_value).trim().to_lower()
          let idx = if raw == "last" {
            list.length()
          } else if raw == "random" || raw == "any" {
            let sampled = (next_random_unit(vm) *
              Double::from_int(list.length() + 1))
              .floor()
              .to_int()
            sampled.clamp(min=0, max=list.length())
          } else {
            let n = json_to_number_value(index_value).to_int() - 1
            n.clamp(min=0, max=list.length())
          }
          list.insert(idx, item)
          write_list_by_ref(vm, owner, id, slot, list)
        }
        None => ()
      }
    None => ()
  }
}

///|
fn execute_list_replace(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
) -> Unit {
  match field_value(block, "LIST") {
    Some((list_name, list_id)) =>
      match with_list_mut(vm, target_index, list_id, Some(list_name)) {
        Some((owner, id, slot)) => {
          let list = read_list_by_ref(vm, owner, id, slot)
          let item = value_from_input(vm, target_index, block, "ITEM", 0)
          let index_value = value_from_input(
            vm, target_index, block, "INDEX", 0,
          )
          match
            normalize_index(index_value, list.length(), next_random_unit(vm)) {
            Some(index) =>
              if index >= 0 && index < list.length() {
                list[index] = item
              }
            None => ()
          }
          write_list_by_ref(vm, owner, id, slot, list)
        }
        None => ()
      }
    None => ()
  }
}

///|
fn increment_block_hot_count(
  vm : Vm,
  target_index : Int,
  block_id : String,
) -> Int {
  let block_hot_key = "\{target_index}:\{block_id}"
  let block_hot_count = vm.hot_op_counts.get_or_default(block_hot_key, 0) + 1
  vm.hot_op_counts[block_hot_key] = block_hot_count
  block_hot_count
}

///|
fn execute_thread_once(vm : Vm, thread : Thread) -> Thread {
  let mut thread = thread
  if thread.done {
    return thread
  }

  thread = resolve_thread_input_wait(vm, thread)
  if thread.wait_for_input is Some(_) {
    return thread
  }

  match thread.wait_until_ms {
    Some(until_ms) => {
      if vm.now_ms < until_ms {
        return thread
      }
      thread.wait_until_ms = None
    }
    None => ()
  }

  if vm.waiting_children.get_or_default(thread.id, 0) > 0 {
    return thread
  }

  let block_pc = match thread.pc {
    Some(pc) => pc
    None => {
      thread.done = true
      return thread
    }
  }

  let target_index = thread.target_index
  if target_index < 0 || target_index >= vm.targets.length() {
    thread.done = true
    return thread
  }
  if vm.targets[target_index].deleted {
    thread.done = true
    return thread
  }
  let target = vm.targets[target_index]
  let block = match target_block_from_pc(target, block_pc) {
    Some(value) => value
    None => {
      thread.pc = None
      return unwind_control(vm, thread)
    }
  }
  let block_meta = target.block_fast_meta_by_pc[block_pc]
  let mut next_pc = block_meta.next_pc
  let mut handled_hot_opcode = false

  vm.current_thread_id = Some(thread.id)
  match block.opcode_tag {
    OpcodeTag::MotionChangeXBy => {
      let value = number_from_input(vm, target_index, block, "DX", 0)
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x + value,
        vm.targets[target_index].y,
      )
      handled_hot_opcode = true
    }
    OpcodeTag::MotionChangeYBy => {
      let value = number_from_input(vm, target_index, block, "DY", 0)
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x,
        vm.targets[target_index].y + value,
      )
      handled_hot_opcode = true
    }
    OpcodeTag::MotionSetY => {
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x,
        number_from_input(vm, target_index, block, "Y", 0),
      )
      handled_hot_opcode = true
    }
    OpcodeTag::PenPenDown => {
      vm.targets[target_index].pen_down = true
      render_draw_pen_point(vm, target_index)
      request_redraw(vm)
      handled_hot_opcode = true
    }
    OpcodeTag::PenPenUp => {
      vm.targets[target_index].pen_down = false
      handled_hot_opcode = true
    }
    OpcodeTag::ControlRepeat => {
      let block_hot_count = increment_block_hot_count(
        vm,
        target_index,
        block.id,
      )
      let times = json_to_number_value(
          value_from_input(vm, target_index, block, "TIMES", 0),
        )
        .floor()
        .to_int()
      if times > 0 {
        let substack_pc = block_meta.substack_pc
        let use_fast_path = times >= 32 || block_hot_count >= 8
        if use_fast_path &&
          try_fast_repeat_numeric_variable_loop(
            vm, target_index, times, substack_pc,
          ) {
          next_pc = block_meta.next_pc
        } else if use_fast_path &&
          try_fast_repeat_motion_step(vm, target_index, times, substack_pc) {
          next_pc = block_meta.next_pc
        } else {
          thread.stack.push(
            repeat_frame(times, substack_pc, block_meta.next_pc),
          )
          next_pc = substack_pc
        }
      }
      handled_hot_opcode = true
    }
    OpcodeTag::ControlRepeatUntil => {
      let condition = bool_from_input(vm, target_index, block, "CONDITION", 0)
      if !condition {
        thread.stack.push(
          repeat_frame(1, block_meta.substack_pc, Some(block_pc)),
        )
        next_pc = block_meta.substack_pc
      }
      handled_hot_opcode = true
    }
    OpcodeTag::ControlIf => {
      let condition = bool_from_input(vm, target_index, block, "CONDITION", 0)
      if condition {
        thread.stack.push(
          repeat_frame(1, block_meta.substack_pc, block_meta.next_pc),
        )
        next_pc = block_meta.substack_pc
      }
      handled_hot_opcode = true
    }
    OpcodeTag::DataSetVariableTo => {
      match block_meta.variable {
        Some(variable_ref) => {
          let resolved = match variable_ref.id {
            Some(variable_id) =>
              resolve_variable_ref_by_id(vm, target_index, variable_id)
            None =>
              resolve_variable_ref(
                vm,
                target_index,
                None,
                Some(variable_ref.name),
              )
          }
          match
            fast_numeric_value_for_setvariable(vm, target, target_index, block) {
            Some(value) =>
              match resolved {
                Some((owner_index, variable_id, variable_slot)) =>
                  write_variable_by_ref(
                    vm,
                    owner_index,
                    variable_id,
                    variable_slot,
                    json_number(value),
                  )
                None =>
                  write_variable(
                    vm,
                    target_index,
                    variable_ref.id,
                    Some(variable_ref.name),
                    json_number(value),
                  )
              }
            None => {
              let value = value_from_input(vm, target_index, block, "VALUE", 0)
              match resolved {
                Some((owner_index, variable_id, variable_slot)) =>
                  write_variable_by_ref(
                    vm, owner_index, variable_id, variable_slot, value,
                  )
                None =>
                  write_variable(
                    vm,
                    target_index,
                    variable_ref.id,
                    Some(variable_ref.name),
                    value,
                  )
              }
            }
          }
        }
        None => ()
      }
      handled_hot_opcode = true
    }
    OpcodeTag::DataChangeVariableBy => {
      match block_meta.variable {
        Some(variable_ref) => {
          let delta = number_from_input(vm, target_index, block, "VALUE", 0)
          let resolved = match variable_ref.id {
            Some(variable_id) =>
              resolve_variable_ref_by_id(vm, target_index, variable_id)
            None =>
              resolve_variable_ref(
                vm,
                target_index,
                None,
                Some(variable_ref.name),
              )
          }
          match resolved {
            Some((owner_index, variable_id, variable_slot)) => {
              let current = json_to_number_value(
                read_variable_by_ref(
                  vm, owner_index, variable_id, variable_slot,
                ),
              )
              write_variable_by_ref(
                vm,
                owner_index,
                variable_id,
                variable_slot,
                json_number(current + delta),
              )
            }
            None => {
              let current = json_to_number_value(
                read_variable(
                  vm,
                  target_index,
                  variable_ref.id,
                  Some(variable_ref.name),
                ),
              )
              write_variable(
                vm,
                target_index,
                variable_ref.id,
                Some(variable_ref.name),
                json_number(current + delta),
              )
            }
          }
        }
        None => ()
      }
      handled_hot_opcode = true
    }
    OpcodeTag::Unknown => ()
  }
  if handled_hot_opcode {
    vm.current_thread_id = None
    if thread.done {
      return thread
    }
    thread.pc = next_pc
    if thread.pc is None {
      return unwind_control(vm, thread)
    }
    return thread
  }
  match block.opcode {
    "motion_movesteps" => {
      let steps = json_to_number_value(
        value_from_input(vm, target_index, block, "STEPS", 0),
      )
      let radians = (90.0 - vm.targets[target_index].direction) *
        @math.PI /
        180.0
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x + @math.cos(radians) * steps,
        vm.targets[target_index].y + @math.sin(radians) * steps,
      )
    }
    "motion_turnright" => {
      let old_direction = vm.targets[target_index].direction
      let degrees = json_to_number_value(
        value_from_input(vm, target_index, block, "DEGREES", 0),
      )
      vm.targets[target_index].direction += degrees
      if old_direction != vm.targets[target_index].direction {
        request_redraw(vm)
      }
    }
    "motion_turnleft" => {
      let old_direction = vm.targets[target_index].direction
      let degrees = json_to_number_value(
        value_from_input(vm, target_index, block, "DEGREES", 0),
      )
      vm.targets[target_index].direction -= degrees
      if old_direction != vm.targets[target_index].direction {
        request_redraw(vm)
      }
    }
    "motion_pointindirection" => {
      let old_direction = vm.targets[target_index].direction
      vm.targets[target_index].direction = normalized_scratch_direction(
        json_to_number_value(
          value_from_input(vm, target_index, block, "DIRECTION", 0),
        ),
      )
      if old_direction != vm.targets[target_index].direction {
        request_redraw(vm)
      }
    }
    "motion_pointtowards" => {
      let menu_value = json_to_string_value(
        value_from_input(vm, target_index, block, "TOWARDS", 0),
      )
      match resolve_motion_menu_target(vm, target_index, menu_value) {
        Some((x, y)) => point_towards_position(vm, target_index, x, y)
        None => ()
      }
    }
    "motion_changexby" => {
      let value = number_from_input(vm, target_index, block, "DX", 0)
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x + value,
        vm.targets[target_index].y,
      )
    }
    "motion_changeyby" => {
      let value = number_from_input(vm, target_index, block, "DY", 0)
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x,
        vm.targets[target_index].y + value,
      )
    }
    "motion_setx" =>
      move_target_with_pen(
        vm,
        target_index,
        number_from_input(vm, target_index, block, "X", 0),
        vm.targets[target_index].y,
      )
    "motion_sety" =>
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x,
        number_from_input(vm, target_index, block, "Y", 0),
      )
    "motion_gotoxy" =>
      move_target_with_pen(
        vm,
        target_index,
        number_from_input(vm, target_index, block, "X", 0),
        number_from_input(vm, target_index, block, "Y", 0),
      )
    "motion_goto" => {
      let menu_value = json_to_string_value(
        value_from_input(vm, target_index, block, "TO", 0),
      )
      match resolve_motion_menu_target(vm, target_index, menu_value) {
        Some((x, y)) => move_target_with_pen(vm, target_index, x, y)
        None => ()
      }
    }
    "motion_glidesecstoxy" => {
      let seconds = json_to_number_value(
        value_from_input(vm, target_index, block, "SECS", 0),
      )
      move_target_with_pen(
        vm,
        target_index,
        json_to_number_value(value_from_input(vm, target_index, block, "X", 0)),
        json_to_number_value(value_from_input(vm, target_index, block, "Y", 0)),
      )
      let duration = if seconds < 0.0 { 0.0 } else { seconds }
      thread.wait_until_ms = Some(vm.now_ms + (duration * 1000.0).to_int())
    }
    "motion_glideto" => {
      let seconds = json_to_number_value(
        value_from_input(vm, target_index, block, "SECS", 0),
      )
      let menu_value = json_to_string_value(
        value_from_input(vm, target_index, block, "TO", 0),
      )
      match resolve_motion_menu_target(vm, target_index, menu_value) {
        Some((x, y)) => move_target_with_pen(vm, target_index, x, y)
        None => ()
      }
      let duration = if seconds < 0.0 { 0.0 } else { seconds }
      thread.wait_until_ms = Some(vm.now_ms + (duration * 1000.0).to_int())
    }
    "motion_ifonedgebounce" => apply_if_on_edge_bounce(vm, target_index)
    "motion_setrotationstyle"
    | "motion_align_scene"
    | "motion_scroll_right"
    | "motion_scroll_up" => ()
    "looks_show" => {
      let was_visible = vm.targets[target_index].visible
      vm.targets[target_index].visible = true
      if !was_visible {
        request_redraw(vm)
      }
    }
    "looks_hide" => {
      let was_visible = vm.targets[target_index].visible
      vm.targets[target_index].visible = false
      if was_visible {
        request_redraw(vm)
      }
    }
    "looks_hideallsprites" => {
      let mut changed = false
      for i, candidate in vm.targets {
        if !candidate.deleted && !candidate.is_stage {
          if vm.targets[i].visible {
            changed = true
          }
          vm.targets[i].visible = false
        }
      }
      if changed {
        request_redraw(vm)
      }
    }
    "looks_switchcostumeto" => {
      let before = vm.targets[target_index].current_costume
      let input_value = value_from_input(vm, target_index, block, "COSTUME", 0)
      let resolved = match
        resolve_target_costume_index(vm, target_index, input_value, false) {
        Some(index) => Some(index)
        None =>
          match field_value(block, "COSTUME") {
            Some((name, _)) =>
              resolve_target_costume_index(
                vm,
                target_index,
                json_string(name),
                false,
              )
            None => None
          }
      }
      match resolved {
        Some(index) => vm.targets[target_index].current_costume = index
        None => ()
      }
      if before != vm.targets[target_index].current_costume {
        request_redraw(vm)
      }
    }
    "looks_nextcostume" => {
      let target = vm.targets[target_index]
      let before = target.current_costume
      vm.targets[target_index].current_costume = normalized_target_costume_index(
        target,
        target.current_costume + 1,
      )
      if before != vm.targets[target_index].current_costume {
        request_redraw(vm)
      }
    }
    "looks_switchbackdropto" => {
      let value = block_backdrop_value(vm, target_index, block)
      ignore(set_stage_backdrop_from_value(vm, value, None))
    }
    "looks_switchbackdroptoandwait" => {
      let value = block_backdrop_value(vm, target_index, block)
      let spawned = set_stage_backdrop_from_value(vm, value, Some(thread.id))
      if spawned > 0 {
        vm.waiting_children[thread.id] = spawned
      }
    }
    "looks_nextbackdrop" =>
      if vm.stage_index >= 0 && vm.stage_index < vm.targets.length() {
        let stage = vm.targets[vm.stage_index]
        ignore(set_stage_backdrop_index(vm, stage.current_costume + 1, None))
      }
    "looks_changeeffectby" => {
      let effect = input_or_field_string(
        vm, target_index, block, "EFFECT", "EFFECT",
      )
      let amount = json_to_number_value(
        value_from_input(vm, target_index, block, "CHANGE", 0),
      )
      set_target_looks_effect(vm, target_index, effect, amount, true)
      request_redraw(vm)
    }
    "looks_seteffectto" => {
      let effect = input_or_field_string(
        vm, target_index, block, "EFFECT", "EFFECT",
      )
      let amount = json_to_number_value(
        value_from_input(vm, target_index, block, "VALUE", 0),
      )
      set_target_looks_effect(vm, target_index, effect, amount, false)
      request_redraw(vm)
    }
    "looks_cleargraphiceffects" => {
      clear_target_looks_effect(vm, target_index)
      request_redraw(vm)
    }
    "looks_changestretchby"
    | "looks_setstretchto"
    | "looks_gotofrontback"
    | "looks_goforwardbackwardlayers" => ()
    "looks_changesizeby" => {
      let delta = json_to_number_value(
        value_from_input(vm, target_index, block, "CHANGE", 0),
      )
      vm.targets[target_index].size += delta
      request_redraw(vm)
    }
    "looks_setsizeto" => {
      let size = json_to_number_value(
        value_from_input(vm, target_index, block, "SIZE", 0),
      )
      vm.targets[target_index].size = size
      request_redraw(vm)
    }
    "looks_say" => {
      let message = json_to_string_value(
        value_from_input(vm, target_index, block, "MESSAGE", 0),
      )
      push_effect(vm, HostEffect::Say(vm.targets[target_index].name, message))
      request_redraw(vm)
    }
    "looks_think" => {
      let message = json_to_string_value(
        value_from_input(vm, target_index, block, "MESSAGE", 0),
      )
      push_effect(vm, HostEffect::Think(vm.targets[target_index].name, message))
      request_redraw(vm)
    }
    "looks_sayforsecs" => {
      let message = json_to_string_value(
        value_from_input(vm, target_index, block, "MESSAGE", 0),
      )
      let seconds = json_to_number_value(
        value_from_input(vm, target_index, block, "SECS", 0),
      )
      push_effect(vm, HostEffect::Say(vm.targets[target_index].name, message))
      let duration = if seconds < 0.0 { 0.0 } else { seconds }
      thread.wait_until_ms = Some(vm.now_ms + (duration * 1000.0).to_int())
      request_redraw(vm)
    }
    "looks_thinkforsecs" => {
      let message = json_to_string_value(
        value_from_input(vm, target_index, block, "MESSAGE", 0),
      )
      let seconds = json_to_number_value(
        value_from_input(vm, target_index, block, "SECS", 0),
      )
      push_effect(vm, HostEffect::Think(vm.targets[target_index].name, message))
      let duration = if seconds < 0.0 { 0.0 } else { seconds }
      thread.wait_until_ms = Some(vm.now_ms + (duration * 1000.0).to_int())
      request_redraw(vm)
    }
    "pen_clear" => {
      vm_clear_pen_pixels(vm)
      request_redraw(vm)
    }
    "pen_stamp" =>
      if target_index >= 0 &&
        target_index < vm.targets.length() &&
        !vm.targets[target_index].is_stage &&
        !vm.targets[target_index].deleted {
        render_stamp_sprite_to_pen(vm, target_index)
        request_redraw(vm)
      }
    "pen_penDown" => {
      vm.targets[target_index].pen_down = true
      render_draw_pen_point(vm, target_index)
      request_redraw(vm)
    }
    "pen_penUp" => vm.targets[target_index].pen_down = false
    "pen_setPenColorToColor" => {
      let color = value_from_input(vm, target_index, block, "COLOR", 0)
      let (r, g, b) = render_json_to_rgb(color)
      set_target_pen_color_from_rgb(vm, target_index, r, g, b)
    }
    "pen_changePenColorParamBy" => {
      let param = input_or_field_string(
        vm, target_index, block, "COLOR_PARAM", "COLOR_PARAM",
      )
      let value = json_to_number_value(
        value_from_input(vm, target_index, block, "VALUE", 0),
      )
      set_target_pen_color_param(vm, target_index, param, value, true)
    }
    "pen_setPenColorParamTo" => {
      let param = input_or_field_string(
        vm, target_index, block, "COLOR_PARAM", "COLOR_PARAM",
      )
      let value = json_to_number_value(
        value_from_input(vm, target_index, block, "VALUE", 0),
      )
      set_target_pen_color_param(vm, target_index, param, value, false)
    }
    "pen_changePenSizeBy" => {
      let delta = json_to_number_value(
        value_from_input(vm, target_index, block, "SIZE", 0),
      )
      vm.targets[target_index].pen_size = clamp_double(
        vm.targets[target_index].pen_size + delta,
        1.0,
        1200.0,
      )
    }
    "pen_setPenSizeTo" => {
      let size = json_to_number_value(
        value_from_input(vm, target_index, block, "SIZE", 0),
      )
      vm.targets[target_index].pen_size = clamp_double(size, 1.0, 1200.0)
    }
    "pen_setPenHueToNumber" => {
      let hue = json_to_number_value(
        value_from_input(vm, target_index, block, "HUE", 0),
      )
      set_target_pen_color_param(vm, target_index, "color", hue / 2.0, false)
      set_target_pen_color_param(vm, target_index, "transparency", 0.0, false)
      apply_target_legacy_pen_shade(vm, target_index)
    }
    "pen_changePenHueBy" => {
      let hue = json_to_number_value(
        value_from_input(vm, target_index, block, "HUE", 0),
      )
      set_target_pen_color_param(vm, target_index, "color", hue / 2.0, true)
      apply_target_legacy_pen_shade(vm, target_index)
    }
    "pen_setPenShadeToNumber" => {
      let mut shade = json_to_number_value(
        value_from_input(vm, target_index, block, "SHADE", 0),
      )
      shade = shade.mod(200.0)
      if shade < 0.0 {
        shade += 200.0
      }
      vm.targets[target_index].pen_legacy_shade = shade
      apply_target_legacy_pen_shade(vm, target_index)
    }
    "pen_changePenShadeBy" => {
      let delta = json_to_number_value(
        value_from_input(vm, target_index, block, "SHADE", 0),
      )
      let mut shade = vm.targets[target_index].pen_legacy_shade + delta
      shade = shade.mod(200.0)
      if shade < 0.0 {
        shade += 200.0
      }
      vm.targets[target_index].pen_legacy_shade = shade
      apply_target_legacy_pen_shade(vm, target_index)
    }
    "music_playDrumForBeats" => {
      let drum = normalize_music_drum(
        json_to_number_value(
          value_from_input(vm, target_index, block, "DRUM", 0),
        ),
      )
      let beats = clamp_music_beats(
        json_to_number_value(
          value_from_input(vm, target_index, block, "BEATS", 0),
        ),
      )
      push_effect(
        vm,
        HostEffect::PlayDrum(
          vm.targets[target_index].name,
          drum,
          beats,
          vm.music_tempo,
        ),
      )
      let duration_ms = music_beats_to_ms(vm, beats)
      if duration_ms > 0 {
        thread.wait_until_ms = Some(vm.now_ms + duration_ms)
      }
    }
    "music_midiPlayDrumForBeats" => {
      let drum = normalize_music_drum(
        json_to_number_value(
          value_from_input(vm, target_index, block, "DRUM", 0),
        ),
      )
      let beats = clamp_music_beats(
        json_to_number_value(
          value_from_input(vm, target_index, block, "BEATS", 0),
        ),
      )
      push_effect(
        vm,
        HostEffect::PlayDrum(
          vm.targets[target_index].name,
          drum,
          beats,
          vm.music_tempo,
        ),
      )
      let duration_ms = music_beats_to_ms(vm, beats)
      if duration_ms > 0 {
        thread.wait_until_ms = Some(vm.now_ms + duration_ms)
      }
    }
    "music_restForBeats" => {
      let beats = clamp_music_beats(
        json_to_number_value(
          value_from_input(vm, target_index, block, "BEATS", 0),
        ),
      )
      let duration_ms = music_beats_to_ms(vm, beats)
      if duration_ms > 0 {
        thread.wait_until_ms = Some(vm.now_ms + duration_ms)
      }
    }
    "music_playNoteForBeats" => {
      let note = clamp_double(
        json_to_number_value(
          value_from_input(vm, target_index, block, "NOTE", 0),
        ),
        0.0,
        130.0,
      ).to_int()
      let beats = clamp_music_beats(
        json_to_number_value(
          value_from_input(vm, target_index, block, "BEATS", 0),
        ),
      )
      if beats > 0.0 {
        push_effect(
          vm,
          HostEffect::PlayNote(
            vm.targets[target_index].name,
            note,
            beats,
            vm.targets[target_index].music_instrument + 1,
            vm.music_tempo,
          ),
        )
        let duration_ms = music_beats_to_ms(vm, beats)
        if duration_ms > 0 {
          thread.wait_until_ms = Some(vm.now_ms + duration_ms)
        }
      }
    }
    "music_setInstrument" => {
      let raw = json_to_number_value(
        value_from_input(vm, target_index, block, "INSTRUMENT", 0),
      )
      vm.targets[target_index].music_instrument = normalize_music_instrument_index(
        raw,
      )
    }
    "music_midiSetInstrument" => {
      let raw = json_to_number_value(
        value_from_input(vm, target_index, block, "INSTRUMENT", 0),
      )
      vm.targets[target_index].music_instrument = normalize_music_instrument_index(
        raw,
      )
    }
    "music_setTempo" => {
      let tempo = json_to_number_value(
        value_from_input(vm, target_index, block, "TEMPO", 0),
      )
      vm.music_tempo = clamp_music_tempo(tempo)
    }
    "music_changeTempo" => {
      let delta = json_to_number_value(
        value_from_input(vm, target_index, block, "TEMPO", 0),
      )
      vm.music_tempo = clamp_music_tempo(vm.music_tempo + delta)
    }
    "text2speech_setVoice" => {
      let voice = input_or_field_string(
        vm, target_index, block, "VOICE", "VOICE",
      )
      vm.targets[target_index].tts_voice = normalize_tts_voice(
        voice,
        vm.targets[target_index].tts_voice,
      )
    }
    "text2speech_setLanguage" => {
      let language = input_or_field_string(
        vm, target_index, block, "LANGUAGE", "LANGUAGE",
      )
      if language != "" {
        vm.tts_language = lower_trim(language)
      }
    }
    "text2speech_speakAndWait" => {
      let words = json_to_string_value(
        value_from_input(vm, target_index, block, "WORDS", 0),
      )
      if words.trim() != "" {
        let wait_key = "text2speech_done_\{thread.id}"
        push_effect(
          vm,
          HostEffect::TextToSpeech(
            vm.targets[target_index].name,
            words,
            vm.targets[target_index].tts_voice,
            vm.tts_language,
            wait_key,
          ),
        )
        thread.wait_for_input = Some(wait_key)
      }
    }
    "sound_play" | "sound_playuntildone" => {
      let sound = json_to_string_value(
        value_from_input(vm, target_index, block, "SOUND_MENU", 0),
      )
      push_effect(
        vm,
        HostEffect::PlaySound(vm.targets[target_index].name, sound),
      )
    }
    "sound_stopallsounds" => push_effect(vm, HostEffect::StopAllSounds)
    "sound_setvolumeto" => {
      let volume = json_to_number_value(
        value_from_input(vm, target_index, block, "VOLUME", 0),
      )
      vm.targets[target_index].volume = clamp_0_100(volume)
    }
    "sound_changevolumeby" => {
      let delta = json_to_number_value(
        value_from_input(vm, target_index, block, "VOLUME", 0),
      )
      let next = vm.targets[target_index].volume + delta
      vm.targets[target_index].volume = clamp_0_100(next)
    }
    "sound_seteffectto" | "sound_changeeffectby" | "sound_cleareffects" => ()
    "data_setvariableto" =>
      match field_value(block, "VARIABLE") {
        Some((name, id)) =>
          match
            fast_numeric_value_for_setvariable(vm, target, target_index, block) {
            Some(value) =>
              write_variable(
                vm,
                target_index,
                id,
                Some(name),
                json_number(value),
              )
            None => {
              let value = value_from_input(vm, target_index, block, "VALUE", 0)
              write_variable(vm, target_index, id, Some(name), value)
            }
          }
        None => ()
      }
    "data_changevariableby" =>
      match field_value(block, "VARIABLE") {
        Some((name, id)) => {
          let delta = number_from_input(vm, target_index, block, "VALUE", 0)
          let current = json_to_number_value(
            read_variable(vm, target_index, id, Some(name)),
          )
          write_variable(
            vm,
            target_index,
            id,
            Some(name),
            json_number(current + delta),
          )
        }
        None => ()
      }
    "data_addtolist" =>
      match field_value(block, "LIST") {
        Some((list_name, list_id)) =>
          match with_list_mut(vm, target_index, list_id, Some(list_name)) {
            Some((owner, id, slot)) => {
              let list = read_list_by_ref(vm, owner, id, slot)
              list.push(value_from_input(vm, target_index, block, "ITEM", 0))
              write_list_by_ref(vm, owner, id, slot, list)
            }
            None => ()
          }
        None => ()
      }
    "data_deleteoflist" => execute_list_delete(vm, target_index, block)
    "data_deletealloflist" =>
      match field_value(block, "LIST") {
        Some((list_name, list_id)) =>
          match with_list_mut(vm, target_index, list_id, Some(list_name)) {
            Some((owner, id, slot)) =>
              write_list_by_ref(vm, owner, id, slot, [])
            None => ()
          }
        None => ()
      }
    "data_insertatlist" => execute_list_insert(vm, target_index, block)
    "data_replaceitemoflist" => execute_list_replace(vm, target_index, block)
    "data_showvariable"
    | "data_hidevariable"
    | "data_showlist"
    | "data_hidelist" => ()
    "control_wait" => {
      let duration_raw = json_to_number_value(
        value_from_input(vm, target_index, block, "DURATION", 0),
      )
      let duration = if duration_raw < 0.0 { 0.0 } else { duration_raw }
      thread.wait_until_ms = Some(vm.now_ms + (duration * 1000.0).to_int())
      request_redraw(vm)
    }
    "control_wait_until" => {
      let condition = bool_from_input(vm, target_index, block, "CONDITION", 0)
      if !condition {
        next_pc = Some(block_pc)
      }
    }
    "control_repeat" => {
      let block_hot_count = increment_block_hot_count(
        vm,
        target_index,
        block.id,
      )
      let times = json_to_number_value(
          value_from_input(vm, target_index, block, "TIMES", 0),
        )
        .floor()
        .to_int()
      if times > 0 {
        let substack_pc = block_meta.substack_pc
        let use_fast_path = times >= 32 || block_hot_count >= 8
        if use_fast_path &&
          try_fast_repeat_motion_step(vm, target_index, times, substack_pc) {
          next_pc = block_meta.next_pc
        } else {
          thread.stack.push(
            repeat_frame(times, substack_pc, block_meta.next_pc),
          )
          next_pc = substack_pc
        }
      }
    }
    "control_repeat_until" => {
      let condition = bool_from_input(vm, target_index, block, "CONDITION", 0)
      if !condition {
        thread.stack.push(
          repeat_frame(1, block_meta.substack_pc, Some(block_pc)),
        )
        next_pc = block_meta.substack_pc
      }
    }
    "control_while" => {
      let condition = bool_from_input(vm, target_index, block, "CONDITION", 0)
      if condition {
        thread.stack.push(
          repeat_frame(1, block_meta.substack_pc, Some(block_pc)),
        )
        next_pc = block_meta.substack_pc
      }
    }
    "control_for_each" =>
      match block_meta.variable {
        Some(variable_ref) => {
          let limit = json_to_number_value(
            value_from_input(vm, target_index, block, "VALUE", 0),
          )
          let key = block.id
          let index = thread.loop_counters.get_or_default(key, 0)
          if Double::from_int(index) < limit {
            let next_index = index + 1
            thread.loop_counters[key] = next_index
            write_variable(
              vm,
              target_index,
              variable_ref.id,
              Some(variable_ref.name),
              json_number(Double::from_int(next_index)),
            )
            thread.stack.push(
              repeat_frame(1, block_meta.substack_pc, Some(block_pc)),
            )
            next_pc = block_meta.substack_pc
          } else {
            thread.loop_counters.remove(key)
          }
        }
        None => ()
      }
    "control_forever" => {
      thread.stack.push(forever_frame(block_meta.substack_pc, Some(block_pc)))
      next_pc = block_meta.substack_pc
    }
    "control_if" => {
      let condition = bool_from_input(vm, target_index, block, "CONDITION", 0)
      if condition {
        thread.stack.push(
          repeat_frame(1, block_meta.substack_pc, block_meta.next_pc),
        )
        next_pc = block_meta.substack_pc
      }
    }
    "control_if_else" => {
      let condition = bool_from_input(vm, target_index, block, "CONDITION", 0)
      let branch_pc = if condition {
        block_meta.substack_pc
      } else {
        block_meta.substack2_pc
      }
      thread.stack.push(repeat_frame(1, branch_pc, block_meta.next_pc))
      next_pc = branch_pc
    }
    "control_all_at_once" => {
      thread.stack.push(
        repeat_frame(1, block_meta.substack_pc, block_meta.next_pc),
      )
      next_pc = block_meta.substack_pc
    }
    "control_stop" => {
      let option = json_to_string_value(
        value_from_input(vm, target_index, block, "STOP_OPTION", 0),
      ).to_lower()
      if option == "all" {
        clear_threads(vm)
        push_effect(vm, HostEffect::StopAllSounds)
      } else if option == "other scripts in sprite" ||
        option == "other scripts in stage" {
        kill_other_scripts_for_target(vm, target_index, thread.id)
      }
      if option == "this script" ||
        option == "all" ||
        option == "other scripts in sprite" ||
        option == "other scripts in stage" {
        thread.done = true
      }
    }
    "control_create_clone_of" => {
      let option = block_clone_option(vm, target_index, block)
      if option != "" {
        match find_clone_source_target(vm, target_index, option) {
          Some(source_index) =>
            match spawn_clone_target(vm, source_index) {
              Some(clone_target_index) =>
                ignore(spawn_clone_start_hats(vm, clone_target_index))
              None => ()
            }
          None => ()
        }
      }
    }
    "control_delete_this_clone" =>
      if !vm.targets[target_index].is_original &&
        !vm.targets[target_index].is_stage {
        dispose_clone_target(vm, target_index, thread.id)
        thread.done = true
      }
    "control_clear_counter" => vm.control_counter = 0
    "control_incr_counter" => vm.control_counter += 1
    "procedures_call" => {
      let proccode = match block_mutation_string(block, "proccode") {
        Some(value) => value
        None => ""
      }
      if proccode != "" {
        match find_procedure_body(target, proccode) {
          Some(
            (
              start_block,
              param_names,
              param_ids,
              param_defaults,
              procedure_warp_mode,
            )
          ) => {
            let params = {}
            for i, param_id in param_ids {
              let name = if i < param_names.length() {
                param_names[i]
              } else {
                param_id
              }
              let default_value = if i < param_defaults.length() {
                param_defaults[i]
              } else {
                json_number(0.0)
              }
              let value = if block.inputs.contains(param_id) {
                value_from_input(vm, target_index, block, param_id, 0)
              } else {
                default_value
              }
              params[name] = value
            }
            let next_warp_mode = thread.warp_mode || procedure_warp_mode
            if next_warp_mode && thread.warp_started_ms == 0 {
              thread.warp_started_ms = vm.now_ms
            } else if !next_warp_mode {
              thread.warp_started_ms = 0
            }
            thread.warp_mode = next_warp_mode
            if next_warp_mode {
              vm.redraw_requested_while_warp = true
            }
            push_procedure_frame(vm, thread.id, {
              return_pc: target_block_pc_from_id(target, block.next),
              control_depth: thread.stack.length(),
              params,
              proccode,
              warp_mode: next_warp_mode,
            })
            next_pc = target.block_pc_by_id.get(start_block)
          }
          None => ()
        }
      }
    }
    "event_broadcast" => {
      let message = block_broadcast_name(vm, target_index, block)
      if message != "" {
        ignore(spawn_hats_for_message(vm, message, None))
        push_effect(vm, HostEffect::Broadcast(message))
      }
    }
    "event_broadcastandwait" => {
      let message = block_broadcast_name(vm, target_index, block)
      if message != "" {
        let spawned = spawn_hats_for_message(vm, message, Some(thread.id))
        if spawned > 0 {
          vm.waiting_children[thread.id] = spawned
        }
        push_effect(vm, HostEffect::Broadcast(message))
      }
    }
    "sensing_askandwait" => {
      let question = json_to_string_value(
        value_from_input(vm, target_index, block, "QUESTION", 0),
      )
      push_effect(vm, HostEffect::Ask(question))
      thread.wait_for_input = Some("answer")
    }
    "sensing_resettimer" => vm.timer_start_ms = vm.now_ms
    "sensing_setdragmode"
    | "procedures_definition"
    | "procedures_prototype"
    | "control_start_as_clone"
    | "event_whenflagclicked"
    | "event_whenbroadcastreceived"
    | "event_whenkeypressed"
    | "event_whenstageclicked"
    | "event_whenthisspriteclicked"
    | "event_whenbackdropswitchesto"
    | "event_whengreaterthan"
    | "event_whentouchingobject" => ()
    _ =>
      push_effect(
        vm,
        HostEffect::Log("warn", "unimplemented opcode: \{block.opcode}"),
      )
  }
  vm.current_thread_id = None

  if thread.done {
    return thread
  }

  thread.pc = next_pc
  if thread.pc is None {
    unwind_control(vm, thread)
  } else {
    thread
  }
}

///|
fn start_vm_runtime(vm : Vm) -> Unit {
  vm.running = true
}

///|
fn exec_script_tail_runtime(vm : Vm, target_index : Int, start_pc : Int) -> Int {
  vm.frame_override = None
  if !spawn_thread_pc(vm, target_index, start_pc, None) {
    return 0
  }
  vm.running = true
  let frame = step_frame_runtime(vm)
  vm.frame_override = Some(frame)
  frame.op_count
}

///|
fn try_exec_host_opcode_fast(vm : Vm, target_index : Int, pc : Int) -> Bool {
  let block = vm.targets[target_index].blocks_by_pc[pc]
  match block.opcode {
    "data_addtolist" =>
      match field_value(block, "LIST") {
        Some((list_name, list_id)) =>
          match with_list_mut(vm, target_index, list_id, Some(list_name)) {
            Some((owner, id, slot)) => {
              let list = read_list_by_ref(vm, owner, id, slot)
              list.push(value_from_input(vm, target_index, block, "ITEM", 0))
              write_list_by_ref(vm, owner, id, slot, list)
              true
            }
            None => true
          }
        None => true
      }
    _ => false
  }
}

///|
fn draw_effect_name_from_id(effect_id : Int) -> String? {
  match effect_id {
    1 => Some("color")
    2 => Some("fisheye")
    3 => Some("whirl")
    4 => Some("pixelate")
    5 => Some("mosaic")
    6 => Some("brightness")
    7 => Some("ghost")
    _ => None
  }
}

///|
fn draw_pen_param_name_from_id(param_id : Int) -> String? {
  match param_id {
    1 => Some("color")
    2 => Some("saturation")
    3 => Some("brightness")
    4 => Some("transparency")
    _ => None
  }
}

///|
fn finite_or_zero(value : Double) -> Double {
  if value.is_nan() || value.is_inf() {
    0.0
  } else {
    value
  }
}

///|
fn exec_draw_opcode_runtime(
  vm : Vm,
  target_index : Int,
  opcode : String,
  arg0 : Double,
  arg1 : Double,
  extra : Int,
) -> Int {
  if target_index < 0 || target_index >= vm.targets.length() {
    return 0
  }
  let value0 = finite_or_zero(arg0)
  let value1 = finite_or_zero(arg1)
  match opcode {
    "motion_movesteps" => {
      let steps = value0
      let radians = (90.0 - vm.targets[target_index].direction) *
        @math.PI /
        180.0
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x + @math.cos(radians) * steps,
        vm.targets[target_index].y + @math.sin(radians) * steps,
      )
      1
    }
    "motion_turnright" => {
      let old_direction = vm.targets[target_index].direction
      vm.targets[target_index].direction += value0
      if old_direction != vm.targets[target_index].direction {
        request_redraw(vm)
      }
      1
    }
    "motion_turnleft" => {
      let old_direction = vm.targets[target_index].direction
      vm.targets[target_index].direction -= value0
      if old_direction != vm.targets[target_index].direction {
        request_redraw(vm)
      }
      1
    }
    "motion_pointindirection" => {
      let old_direction = vm.targets[target_index].direction
      vm.targets[target_index].direction = normalized_scratch_direction(value0)
      if old_direction != vm.targets[target_index].direction {
        request_redraw(vm)
      }
      1
    }
    "motion_changexby" => {
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x + value0,
        vm.targets[target_index].y,
      )
      1
    }
    "motion_changeyby" => {
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x,
        vm.targets[target_index].y + value0,
      )
      1
    }
    "motion_setx" => {
      move_target_with_pen(vm, target_index, value0, vm.targets[target_index].y)
      1
    }
    "motion_sety" => {
      move_target_with_pen(vm, target_index, vm.targets[target_index].x, value0)
      1
    }
    "motion_gotoxy" => {
      move_target_with_pen(vm, target_index, value0, value1)
      1
    }
    "motion_ifonedgebounce" => {
      apply_if_on_edge_bounce(vm, target_index)
      1
    }
    "looks_show" => {
      let was_visible = vm.targets[target_index].visible
      vm.targets[target_index].visible = true
      if !was_visible {
        request_redraw(vm)
      }
      1
    }
    "looks_hide" => {
      let was_visible = vm.targets[target_index].visible
      vm.targets[target_index].visible = false
      if was_visible {
        request_redraw(vm)
      }
      1
    }
    "looks_hideallsprites" => {
      let mut changed = false
      for i, candidate in vm.targets {
        if !candidate.deleted && !candidate.is_stage {
          if vm.targets[i].visible {
            changed = true
          }
          vm.targets[i].visible = false
        }
      }
      if changed {
        request_redraw(vm)
      }
      1
    }
    "looks_nextcostume" => {
      let target = vm.targets[target_index]
      let before = target.current_costume
      vm.targets[target_index].current_costume = normalized_target_costume_index(
        target,
        target.current_costume + 1,
      )
      if before != vm.targets[target_index].current_costume {
        request_redraw(vm)
      }
      1
    }
    "looks_changeeffectby" =>
      match draw_effect_name_from_id(extra) {
        Some(effect_name) => {
          set_target_looks_effect(vm, target_index, effect_name, value0, true)
          request_redraw(vm)
          1
        }
        None => 0
      }
    "looks_seteffectto" =>
      match draw_effect_name_from_id(extra) {
        Some(effect_name) => {
          set_target_looks_effect(vm, target_index, effect_name, value0, false)
          request_redraw(vm)
          1
        }
        None => 0
      }
    "looks_cleargraphiceffects" => {
      clear_target_looks_effect(vm, target_index)
      request_redraw(vm)
      1
    }
    "looks_changesizeby" => {
      vm.targets[target_index].size += value0
      request_redraw(vm)
      1
    }
    "looks_setsizeto" => {
      vm.targets[target_index].size = value0
      request_redraw(vm)
      1
    }
    "pen_clear" => {
      vm_clear_pen_pixels(vm)
      request_redraw(vm)
      1
    }
    "pen_stamp" =>
      if target_index >= 0 &&
        target_index < vm.targets.length() &&
        !vm.targets[target_index].is_stage &&
        !vm.targets[target_index].deleted {
        render_stamp_sprite_to_pen(vm, target_index)
        request_redraw(vm)
        1
      } else {
        0
      }
    "pen_penDown" => {
      vm.targets[target_index].pen_down = true
      render_draw_pen_point(vm, target_index)
      request_redraw(vm)
      1
    }
    "pen_penUp" => {
      vm.targets[target_index].pen_down = false
      1
    }
    "pen_changePenColorParamBy" =>
      match draw_pen_param_name_from_id(extra) {
        Some(param_name) => {
          set_target_pen_color_param(vm, target_index, param_name, value0, true)
          1
        }
        None => 0
      }
    "pen_setPenColorParamTo" =>
      match draw_pen_param_name_from_id(extra) {
        Some(param_name) => {
          set_target_pen_color_param(
            vm, target_index, param_name, value0, false,
          )
          1
        }
        None => 0
      }
    "pen_changePenSizeBy" => {
      vm.targets[target_index].pen_size = clamp_double(
        vm.targets[target_index].pen_size + value0,
        1.0,
        1200.0,
      )
      1
    }
    "pen_setPenSizeTo" => {
      vm.targets[target_index].pen_size = clamp_double(value0, 1.0, 1200.0)
      1
    }
    "pen_setPenHueToNumber" => {
      set_target_pen_color_param(vm, target_index, "color", value0 / 2.0, false)
      set_target_pen_color_param(vm, target_index, "transparency", 0.0, false)
      apply_target_legacy_pen_shade(vm, target_index)
      1
    }
    "pen_changePenHueBy" => {
      set_target_pen_color_param(vm, target_index, "color", value0 / 2.0, true)
      apply_target_legacy_pen_shade(vm, target_index)
      1
    }
    "pen_setPenShadeToNumber" => {
      let mut shade = value0.mod(200.0)
      if shade < 0.0 {
        shade += 200.0
      }
      vm.targets[target_index].pen_legacy_shade = shade
      apply_target_legacy_pen_shade(vm, target_index)
      1
    }
    "pen_changePenShadeBy" => {
      let mut shade = (vm.targets[target_index].pen_legacy_shade + value0).mod(
        200.0,
      )
      if shade < 0.0 {
        shade += 200.0
      }
      vm.targets[target_index].pen_legacy_shade = shade
      apply_target_legacy_pen_shade(vm, target_index)
      1
    }
    _ => 0
  }
}

///|
fn exec_opcode_once_runtime(vm : Vm, target_index : Int, pc : Int) -> Int {
  if target_index < 0 || target_index >= vm.targets.length() {
    return 0
  }
  if pc < 0 || pc >= vm.targets[target_index].blocks_by_pc.length() {
    return 0
  }
  if try_exec_host_opcode_fast(vm, target_index, pc) {
    return 1
  }

  // Execute exactly one opcode in an ephemeral thread context.
  let thread_id = -1
  ignore(
    execute_thread_once(vm, {
      id: thread_id,
      target_index,
      pc: Some(pc),
      wait_until_ms: None,
      wait_for_input: None,
      done: false,
      warp_mode: false,
      warp_started_ms: 0,
      stack: [],
      loop_counters: {},
      parent_waiter: None,
    }),
  )
  vm.waiting_children.remove(thread_id)
  vm.procedure_frames.remove(thread_id)
  vm.current_thread_id = None
  if !vm.threads.is_empty() {
    vm.running = true
  }
  1
}

///|
fn apply_aot_commands_frame(vm : Vm) -> FrameReport {
  let effect_count_before = vm.effects.length()
  let mut op_count = 0
  let mut has_host_tail = false
  vm.aot_pending = false
  for command in vm.aot_commands {
    match command {
      AotCommand::SetVariable(target_index, variable_id, value) =>
        if target_index >= 0 && target_index < vm.targets.length() {
          write_variable(vm, target_index, Some(variable_id), None, value)
          op_count += 1
        }
      AotCommand::ChangeVariable(target_index, variable_id, delta) =>
        if target_index >= 0 && target_index < vm.targets.length() {
          let current = read_variable(vm, target_index, Some(variable_id), None)
          let next_value = json_number(json_to_number_value(current) + delta)
          write_variable(vm, target_index, Some(variable_id), None, next_value)
          op_count += 1
        }
      AotCommand::HostOpcode(target_index, pc) =>
        op_count += exec_opcode_once_runtime(vm, target_index, pc)
      AotCommand::HostTail(target_index, start_pc) =>
        if spawn_thread_pc(vm, target_index, start_pc, None) {
          has_host_tail = true
        }
    }
  }
  if has_host_tail {
    vm.running = true
    let host_frame = step_frame_runtime(vm)
    return {
      active_threads: host_frame.active_threads,
      tick_count: host_frame.tick_count,
      op_count: op_count + host_frame.op_count,
      emitted_effects: vm.effects.length() - effect_count_before,
      stop_reason: host_frame.stop_reason,
      should_render: host_frame.should_render,
      is_in_warp: host_frame.is_in_warp,
    }
  }
  let active_threads = vm.threads.length()
  if active_threads <= 0 {
    vm.running = false
    vm.redraw_requested = false
    vm.redraw_requested_while_warp = false
  } else {
    vm.running = true
  }
  let stop_reason = if active_threads <= 0 { "finished" } else { "timeout" }
  {
    active_threads,
    tick_count: 1,
    op_count,
    emitted_effects: vm.effects.length() - effect_count_before,
    stop_reason,
    should_render: true,
    is_in_warp: has_active_warp_thread(vm),
  }
}

///|
fn green_flag_runtime(vm : Vm) -> Unit {
  clear_threads(vm)
  vm.frame_override = None
  reset_targets_for_green_flag(vm)
  vm_clear_pen_pixels(vm)
  for i, target in vm.targets {
    if target.is_original {
      vm.targets[i].pen_down = false
      vm.targets[i].pen_color = 66.66
      vm.targets[i].pen_saturation = 100.0
      vm.targets[i].pen_brightness = 100.0
      vm.targets[i].pen_transparency = 0.0
      vm.targets[i].pen_size = 1.0
      vm.targets[i].pen_legacy_shade = 50.0
      clear_target_looks_effect(vm, i)
    }
  }
  vm.hat_predicates.clear()
  vm.hot_op_counts.clear()
  vm.pending_translate_requests.clear()
  vm.io_prev_state = copy_json_map(vm.io_state)
  vm.answer = ""
  vm.timer_start_ms = vm.now_ms
  vm.run_id += 1
  vm.redraw_requested = false
  vm.redraw_requested_while_warp = false
  vm.running = true
  if vm.aot_wasm_only {
    vm.aot_pending = false
    vm.running = false
    return
  }
  if vm.aot_use_full_exec {
    let spawned = spawn_aot_green_flag_hats(vm)
    if spawned == 0 {
      vm.running = false
    }
    return
  }
  if !vm.aot_commands.is_empty() {
    vm.aot_pending = true
    return
  }
  let spawned = spawn_green_flag_hats(vm)
  if spawned == 0 {
    vm.running = false
  }
}

///|
fn broadcast_runtime(vm : Vm, message : String) -> Unit {
  if message == "" {
    return
  }
  let spawned = spawn_hats_for_message(vm, message, None)
  if spawned > 0 {
    vm.running = true
  }
  push_effect(vm, HostEffect::Broadcast(message))
}

///|
fn post_io_json_runtime(
  vm : Vm,
  device : String,
  payload_json : String,
) -> Unit {
  if payload_json.trim().is_empty() {
    vm.io_state[device] = Json::null()
    return
  }
  let parsed = try? @json.parse(payload_json)
  match parsed {
    Ok(payload) => vm.io_state[device] = payload
    Err(err) =>
      push_effect(vm, HostEffect::Log("error", "invalid io payload: \{err}"))
  }
}

///|
fn set_time_runtime(vm : Vm, now_ms : Int) -> Unit {
  vm.now_ms = now_ms
}

///|
fn step_frame_runtime(vm : Vm) -> FrameReport {
  match vm.frame_override {
    Some(report) => {
      vm.frame_override = None
      return report
    }
    None => ()
  }
  if vm.aot_pending {
    return apply_aot_commands_frame(vm)
  }

  let spawned_io = dispatch_io_event_hats(vm)
  let spawned_predicates = spawn_predicate_hats(vm)
  if spawned_io > 0 || spawned_predicates > 0 {
    vm.running = true
  }

  let mut total_ticks = 0
  let mut total_ops = 0
  let mut stop_reason = "timeout"
  let mut should_render = false
  let tick_timeout = if vm.options.step_timeout_ticks > 0 {
    vm.options.step_timeout_ticks
  } else {
    2048
  }

  if vm.running {
    let mut saw_warp_context = has_active_warp_thread(vm) ||
      vm.redraw_requested_while_warp
    while total_ticks < tick_timeout {
      let thread_count = vm.threads.length()
      if thread_count <= 0 {
        stop_reason = "finished"
        should_render = true
        break
      }

      let mut progressed = false
      let mut warp_active_in_tick = false
      let mut warp_exit_detected = false
      let budget = current_step_budget(vm)
      let warp_window_extra_steps = budget * 8
      let non_warp_extra_steps = if vm.options.turbo {
        budget
      } else {
        budget / 4
      }

      for index in 0..<thread_count {
        let thread = vm.threads[index]
        if thread.done {
          continue
        }

        let mut updated = execute_thread_once(vm, thread)
        let mut warp_steps = warp_window_extra_steps
        let mut non_warp_steps = non_warp_extra_steps
        let mut thread_saw_warp_context = false
        while true {
          vm.threads[index] = updated
          let in_warp_window = is_warp_window_active(vm, updated)
          if in_warp_window {
            thread_saw_warp_context = true
            warp_active_in_tick = true
          } else if thread_saw_warp_context && !has_active_warp_thread(vm) {
            stop_reason = "warp-exit"
            should_render = true
            vm.redraw_requested = false
            vm.redraw_requested_while_warp = false
            warp_exit_detected = true
            break
          }
          let is_blocked = is_thread_blocked(vm, updated)
          if !is_blocked && !updated.done {
            total_ops += 1
            progressed = true
            if in_warp_window && warp_steps > 0 {
              warp_steps -= 1
              updated = execute_thread_once(vm, updated)
              continue
            }
            if !in_warp_window && non_warp_steps > 0 {
              non_warp_steps -= 1
              updated = execute_thread_once(vm, updated)
              continue
            }
          } else if updated.done {
            total_ops += 1
            progressed = true
          }
          break
        }
        if warp_exit_detected {
          break
        }

        if warp_active_in_tick {
          saw_warp_context = true
        }
        if vm.redraw_requested_while_warp {
          saw_warp_context = true
        }
        if saw_warp_context && !has_active_warp_thread(vm) {
          stop_reason = "warp-exit"
          should_render = true
          vm.redraw_requested = false
          vm.redraw_requested_while_warp = false
          warp_exit_detected = true
          break
        }
      }

      total_ticks += 1
      cleanup_done_threads(vm)

      if warp_exit_detected {
        break
      }

      if vm.threads.length() <= 0 {
        stop_reason = "finished"
        should_render = true
        break
      }

      if warp_active_in_tick {
        saw_warp_context = true
      }
      let warp_active_after_tick = has_active_warp_thread(vm)
      if vm.redraw_requested_while_warp {
        saw_warp_context = true
      }
      if saw_warp_context && !warp_active_after_tick {
        stop_reason = "warp-exit"
        should_render = true
        vm.redraw_requested = false
        vm.redraw_requested_while_warp = false
        break
      }

      if vm.redraw_requested &&
        !vm.options.turbo &&
        !warp_active_in_tick &&
        !vm.redraw_requested_while_warp &&
        !warp_active_after_tick {
        stop_reason = "rerender"
        should_render = true
        vm.redraw_requested = false
        vm.redraw_requested_while_warp = false
        break
      }

      if !progressed {
        stop_reason = "timeout"
        break
      }
    }
  }

  cleanup_done_threads(vm)
  if vm.threads.length() <= 0 {
    vm.running = false
    if stop_reason != "warp-exit" {
      stop_reason = "finished"
    }
    should_render = true
    vm.redraw_requested = false
    vm.redraw_requested_while_warp = false
  } else if stop_reason != "rerender" &&
    stop_reason != "warp-exit" &&
    stop_reason != "finished" {
    stop_reason = "timeout"
    should_render = false
  }

  vm.io_prev_state = copy_json_map(vm.io_state)

  {
    active_threads: vm.threads.length(),
    tick_count: total_ticks,
    op_count: total_ops,
    emitted_effects: vm.effects.length(),
    stop_reason,
    should_render,
    is_in_warp: has_active_warp_thread(vm),
  }
}
