///|
fn repeat_frame(
  remaining : Int,
  substack : String?,
  after : String?,
) -> ControlFrame {
  { kind: ControlFrameKind::Repeat, remaining, substack, after }
}

///|
fn forever_frame(substack : String?, after : String?) -> ControlFrame {
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
fn unwind_control(vm : Vm, thread : Thread) -> Thread {
  let thread = thread
  while thread.pc is None {
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
          Some(frame) => thread.pc = frame.return_pc
          None => {
            thread.done = true
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
fn hat_broadcast_name(block : ScratchBlock) -> String {
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
  for hat_id in target.top_level_hats {
    match target.blocks.get(hat_id) {
      Some(hat) =>
        if hat.opcode == "control_start_as_clone" {
          match hat.next {
            Some(start) => {
              spawn_thread(vm, target_index, start, None)
              count += 1
            }
            None => ()
          }
        }
      None => ()
    }
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
  let angle = 90.0 - @math.atan2(dy, dx) * 180.0 / @math.PI
  vm.targets[target_index].direction = normalized_scratch_direction(angle)
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
  vm.targets[target_index].direction = normalized_scratch_direction(direction)
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
    for hat_id in target.top_level_hats {
      match target.blocks.get(hat_id) {
        Some(hat) =>
          if hat.opcode == "event_whenbackdropswitchesto" {
            let expected = match field_value(hat, "BACKDROP") {
              Some((name, _)) => name
              None => ""
            }
            if expected == backdrop_name {
              match hat.next {
                Some(start) => {
                  spawn_thread(vm, target_index, start, parent_waiter)
                  count += 1
                }
                None => ()
              }
            }
          }
        None => ()
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
) -> (String, Array[String], Array[String], Array[Json])? {
  for _, block in target.blocks {
    if block.opcode != "procedures_definition" {
      continue
    }
    match block_input_block_id(block, "custom_block") {
      Some(proto_id) =>
        match target.blocks.get(proto_id) {
          Some(prototype) =>
            if prototype.opcode == "procedures_prototype" {
              let code = match block_mutation_string(prototype, "proccode") {
                Some(value) => value
                None => ""
              }
              if code == proccode {
                match block.next {
                  Some(start_block) => {
                    let names = match
                      block_mutation_string(prototype, "argumentnames") {
                      Some(raw) => parse_json_string_array(raw)
                      None => []
                    }
                    let ids = match
                      block_mutation_string(prototype, "argumentids") {
                      Some(raw) => parse_json_string_array(raw)
                      None => []
                    }
                    let defaults = match
                      block_mutation_string(prototype, "argumentdefaults") {
                      Some(raw) => parse_json_value_array(raw)
                      None => []
                    }
                    return Some((start_block, names, ids, defaults))
                  }
                  None => return None
                }
              }
            }
          None => ()
        }
      None => ()
    }
  }
  None
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
fn take_io_signal(vm : Vm, key : String) -> Json? {
  match vm.io_state.get(key) {
    Some(value) => {
      vm.io_state.remove(key)
      Some(value)
    }
    None => None
  }
}

///|
fn spawn_hats_for_key(vm : Vm, key : String) -> Int {
  let key = lower_trim(key)
  let mut count = 0
  for target_index, target in vm.targets {
    if target.deleted {
      continue
    }
    for hat_id in target.top_level_hats {
      match target.blocks.get(hat_id) {
        Some(hat) =>
          if hat.opcode == "event_whenkeypressed" {
            let option = match field_value(hat, "KEY_OPTION") {
              Some((name, _)) => lower_trim(name)
              None => "any"
            }
            if option == "any" || option == key {
              match hat.next {
                Some(start) => {
                  spawn_thread(vm, target_index, start, None)
                  count += 1
                }
                None => ()
              }
            }
          }
        None => ()
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
  for hat_id in stage.top_level_hats {
    match stage.blocks.get(hat_id) {
      Some(hat) =>
        if hat.opcode == "event_whenstageclicked" {
          match hat.next {
            Some(start) => {
              spawn_thread(vm, target_index, start, None)
              count += 1
            }
            None => ()
          }
        }
      None => ()
    }
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
    for hat_id in target.top_level_hats {
      match target.blocks.get(hat_id) {
        Some(hat) =>
          if hat.opcode == "event_whenthisspriteclicked" {
            match hat.next {
              Some(start) => {
                spawn_thread(vm, target_index, start, None)
                count += 1
              }
              None => ()
            }
          }
        None => ()
      }
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
  hat : ScratchBlock,
) -> Bool {
  if hat.opcode == "event_whengreaterthan" {
    let threshold = json_to_number_value(
      value_from_input(vm, target_index, hat, "VALUE", 0),
    )
    let menu = match field_value(hat, "WHENGREATERTHANMENU") {
      Some((name, _)) => lower_trim(name)
      None => ""
    }
    let current = if menu == "timer" {
      Double::from_int(vm.now_ms - vm.timer_start_ms) / 1000.0
    } else if menu == "loudness" {
      read_loudness(vm)
    } else {
      0.0
    }
    return current > threshold
  }

  if hat.opcode == "event_whentouchingobject" {
    let option = match field_value(hat, "TOUCHINGOBJECTMENU") {
      Some((name, _)) => name
      None => ""
    }
    return read_touching_from_io(vm, target.name, option)
  }

  false
}

///|
fn spawn_predicate_hats(vm : Vm) -> Int {
  let mut count = 0
  for target_index, target in vm.targets {
    if target.deleted {
      continue
    }
    for hat_id in target.top_level_hats {
      match target.blocks.get(hat_id) {
        Some(hat) =>
          if hat.opcode == "event_whengreaterthan" ||
            hat.opcode == "event_whentouchingobject" {
            let key = predicate_state_key(target_index, hat.id)
            let previous = vm.hat_predicates.get_or_default(key, false)
            let current = hat_predicate_value(vm, target_index, target, hat)
            if current && !previous {
              match hat.next {
                Some(start) => {
                  spawn_thread(vm, target_index, start, None)
                  count += 1
                }
                None => ()
              }
            }
            vm.hat_predicates[key] = current
          }
        None => ()
      }
    }
  }
  count
}

///|
fn dispatch_io_event_hats(vm : Vm) -> Int {
  let mut count = 0

  match take_io_signal(vm, "key_pressed") {
    Some(payload) =>
      for key in parse_key_events(payload) {
        count += spawn_hats_for_key(vm, key)
      }
    None => ()
  }

  match take_io_signal(vm, "stage_clicked") {
    Some(payload) =>
      if json_to_bool_value(payload) {
        count += spawn_stage_clicked_hats(vm)
      }
    None => ()
  }

  match take_io_signal(vm, "sprite_clicked") {
    Some(payload) =>
      for name in parse_name_events(payload, "target", "targets") {
        count += spawn_sprite_clicked_hats(vm, name)
      }
    None => ()
  }

  match take_io_signal(vm, "backdrop_switched") {
    Some(payload) =>
      for name in parse_name_events(payload, "backdrop", "backdrops") {
        count += spawn_hats_for_backdrop(vm, name, None)
      }
    None => ()
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
    for hat_id in target.top_level_hats {
      match target.blocks.get(hat_id) {
        Some(hat) =>
          if hat.opcode == "event_whenbroadcastreceived" &&
            hat_broadcast_name(hat) == message {
            match hat.next {
              Some(start) => {
                spawn_thread(vm, target_index, start, parent_waiter)
                count += 1
              }
              None => ()
            }
          }
        None => ()
      }
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
    for hat_id in target.top_level_hats {
      match target.blocks.get(hat_id) {
        Some(hat) =>
          if hat.opcode == "event_whenflagclicked" {
            match hat.next {
              Some(start) => {
                spawn_thread(vm, target_index, start, None)
                count += 1
              }
              None => ()
            }
          }
        None => ()
      }
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
          vm.io_state.remove(key)
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
fn execute_list_delete(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
) -> Unit {
  match field_value(block, "LIST") {
    Some((list_name, list_id)) =>
      match with_list_mut(vm, target_index, list_id, Some(list_name)) {
        Some((owner, id)) => {
          let list = vm.targets[owner].lists.get_or_default(id, [])
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
          vm.targets[owner].lists[id] = list
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
        Some((owner, id)) => {
          let list = vm.targets[owner].lists.get_or_default(id, [])
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
          vm.targets[owner].lists[id] = list
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
        Some((owner, id)) => {
          let list = vm.targets[owner].lists.get_or_default(id, [])
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
          vm.targets[owner].lists[id] = list
        }
        None => ()
      }
    None => ()
  }
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

  let block_id = match thread.pc {
    Some(id) => id
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
  let block = match target.blocks.get(block_id) {
    Some(value) => value
    None => {
      thread.pc = None
      return unwind_control(vm, thread)
    }
  }

  let mut next_pc = block.next

  vm.current_thread_id = Some(thread.id)
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
      let degrees = json_to_number_value(
        value_from_input(vm, target_index, block, "DEGREES", 0),
      )
      vm.targets[target_index].direction += degrees
    }
    "motion_turnleft" => {
      let degrees = json_to_number_value(
        value_from_input(vm, target_index, block, "DEGREES", 0),
      )
      vm.targets[target_index].direction -= degrees
    }
    "motion_pointindirection" =>
      vm.targets[target_index].direction = normalized_scratch_direction(
        json_to_number_value(
          value_from_input(vm, target_index, block, "DIRECTION", 0),
        ),
      )
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
      let value = json_to_number_value(
        value_from_input(vm, target_index, block, "DX", 0),
      )
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x + value,
        vm.targets[target_index].y,
      )
    }
    "motion_changeyby" => {
      let value = json_to_number_value(
        value_from_input(vm, target_index, block, "DY", 0),
      )
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
        json_to_number_value(value_from_input(vm, target_index, block, "X", 0)),
        vm.targets[target_index].y,
      )
    "motion_sety" =>
      move_target_with_pen(
        vm,
        target_index,
        vm.targets[target_index].x,
        json_to_number_value(value_from_input(vm, target_index, block, "Y", 0)),
      )
    "motion_gotoxy" =>
      move_target_with_pen(
        vm,
        target_index,
        json_to_number_value(value_from_input(vm, target_index, block, "X", 0)),
        json_to_number_value(value_from_input(vm, target_index, block, "Y", 0)),
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
    "looks_show" => vm.targets[target_index].visible = true
    "looks_hide" => vm.targets[target_index].visible = false
    "looks_hideallsprites" =>
      for i, candidate in vm.targets {
        if !candidate.deleted && !candidate.is_stage {
          vm.targets[i].visible = false
        }
      }
    "looks_switchcostumeto" => {
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
    }
    "looks_nextcostume" => {
      let target = vm.targets[target_index]
      vm.targets[target_index].current_costume = normalized_target_costume_index(
        target,
        target.current_costume + 1,
      )
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
    }
    "looks_seteffectto" => {
      let effect = input_or_field_string(
        vm, target_index, block, "EFFECT", "EFFECT",
      )
      let amount = json_to_number_value(
        value_from_input(vm, target_index, block, "VALUE", 0),
      )
      set_target_looks_effect(vm, target_index, effect, amount, false)
    }
    "looks_cleargraphiceffects" => clear_target_looks_effect(vm, target_index)
    "looks_changestretchby"
    | "looks_setstretchto"
    | "looks_gotofrontback"
    | "looks_goforwardbackwardlayers" => ()
    "looks_changesizeby" => {
      let delta = json_to_number_value(
        value_from_input(vm, target_index, block, "CHANGE", 0),
      )
      vm.targets[target_index].size += delta
    }
    "looks_setsizeto" => {
      let size = json_to_number_value(
        value_from_input(vm, target_index, block, "SIZE", 0),
      )
      vm.targets[target_index].size = size
    }
    "looks_say" => {
      let message = json_to_string_value(
        value_from_input(vm, target_index, block, "MESSAGE", 0),
      )
      push_effect(vm, HostEffect::Say(vm.targets[target_index].name, message))
    }
    "looks_think" => {
      let message = json_to_string_value(
        value_from_input(vm, target_index, block, "MESSAGE", 0),
      )
      push_effect(vm, HostEffect::Think(vm.targets[target_index].name, message))
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
    }
    "pen_clear" => vm_clear_pen_pixels(vm)
    "pen_stamp" =>
      if target_index >= 0 &&
        target_index < vm.targets.length() &&
        !vm.targets[target_index].is_stage &&
        !vm.targets[target_index].deleted {
        for py in 0..<vm.pen_height {
          for px in 0..<vm.pen_width {
            let (stage_x, stage_y) = render_pixel_to_stage(vm, px, py)
            match
              render_sample_sprite_at(
                vm, target_index, stage_x, stage_y, true, false,
              ) {
              Some(color) => render_blend_pen_pixel(vm, px, py, color)
              None => ()
            }
          }
        }
      }
    "pen_penDown" => {
      vm.targets[target_index].pen_down = true
      render_draw_pen_point(vm, target_index)
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
        Some((name, id)) => {
          let value = value_from_input(vm, target_index, block, "VALUE", 0)
          write_variable(vm, target_index, id, Some(name), value)
        }
        None => ()
      }
    "data_changevariableby" =>
      match field_value(block, "VARIABLE") {
        Some((name, id)) => {
          let delta = json_to_number_value(
            value_from_input(vm, target_index, block, "VALUE", 0),
          )
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
            Some((owner, id)) => {
              let list = vm.targets[owner].lists.get_or_default(id, [])
              list.push(value_from_input(vm, target_index, block, "ITEM", 0))
              vm.targets[owner].lists[id] = list
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
            Some((owner, id)) => vm.targets[owner].lists[id] = []
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
    }
    "control_wait_until" => {
      let condition = json_to_bool_value(
        value_from_input(vm, target_index, block, "CONDITION", 0),
      )
      if !condition {
        next_pc = Some(block.id)
      }
    }
    "control_repeat" => {
      let times = json_to_number_value(
          value_from_input(vm, target_index, block, "TIMES", 0),
        )
        .floor()
        .to_int()
      if times > 0 {
        let substack = block_input_block_id(block, "SUBSTACK")
        thread.stack.push(repeat_frame(times, substack, block.next))
        next_pc = substack
      }
    }
    "control_repeat_until" => {
      let condition = json_to_bool_value(
        value_from_input(vm, target_index, block, "CONDITION", 0),
      )
      if !condition {
        let substack = block_input_block_id(block, "SUBSTACK")
        thread.stack.push(repeat_frame(1, substack, Some(block.id)))
        next_pc = substack
      }
    }
    "control_while" => {
      let condition = json_to_bool_value(
        value_from_input(vm, target_index, block, "CONDITION", 0),
      )
      if condition {
        let substack = block_input_block_id(block, "SUBSTACK")
        thread.stack.push(repeat_frame(1, substack, Some(block.id)))
        next_pc = substack
      }
    }
    "control_for_each" =>
      match field_value(block, "VARIABLE") {
        Some((name, id)) => {
          let limit = json_to_number_value(
            value_from_input(vm, target_index, block, "VALUE", 0),
          )
          let key = "for_each:\{block.id}"
          let index = thread.loop_counters.get_or_default(key, 0)
          if Double::from_int(index) < limit {
            let next_index = index + 1
            thread.loop_counters[key] = next_index
            write_variable(
              vm,
              target_index,
              id,
              Some(name),
              json_number(Double::from_int(next_index)),
            )
            let substack = block_input_block_id(block, "SUBSTACK")
            thread.stack.push(repeat_frame(1, substack, Some(block.id)))
            next_pc = substack
          } else {
            thread.loop_counters.remove(key)
          }
        }
        None => ()
      }
    "control_forever" => {
      let substack = block_input_block_id(block, "SUBSTACK")
      thread.stack.push(forever_frame(substack, Some(block.id)))
      next_pc = substack
    }
    "control_if" => {
      let condition = json_to_bool_value(
        value_from_input(vm, target_index, block, "CONDITION", 0),
      )
      if condition {
        let substack = block_input_block_id(block, "SUBSTACK")
        thread.stack.push(repeat_frame(1, substack, block.next))
        next_pc = substack
      }
    }
    "control_if_else" => {
      let condition = json_to_bool_value(
        value_from_input(vm, target_index, block, "CONDITION", 0),
      )
      let branch = if condition {
        block_input_block_id(block, "SUBSTACK")
      } else {
        block_input_block_id(block, "SUBSTACK2")
      }
      thread.stack.push(repeat_frame(1, branch, block.next))
      next_pc = branch
    }
    "control_all_at_once" => {
      let substack = block_input_block_id(block, "SUBSTACK")
      thread.stack.push(repeat_frame(1, substack, block.next))
      next_pc = substack
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
          Some((start_block, param_names, param_ids, param_defaults)) => {
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
            push_procedure_frame(vm, thread.id, {
              return_pc: block.next,
              params,
            })
            next_pc = Some(start_block)
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
fn green_flag_runtime(vm : Vm) -> Unit {
  clear_threads(vm)
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
  vm.pending_translate_requests.clear()
  vm.answer = ""
  vm.timer_start_ms = vm.now_ms
  vm.run_id += 1
  vm.running = true
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
fn step_runtime(vm : Vm, dt_ms : Int) -> StepReport {
  if dt_ms > 0 {
    vm.now_ms += dt_ms
  }

  let spawned_io = dispatch_io_event_hats(vm)
  let spawned_predicates = spawn_predicate_hats(vm)
  if spawned_io > 0 || spawned_predicates > 0 {
    vm.running = true
  }

  let mut stepped = 0
  if vm.running {
    let budget = current_step_budget(vm)
    let mut index = 0
    while index < vm.threads.length() && stepped < budget {
      let thread = vm.threads[index]
      let updated = execute_thread_once(vm, thread)
      vm.threads[index] = updated
      if !is_thread_blocked(vm, updated) && !updated.done {
        stepped += 1
      } else if updated.done {
        stepped += 1
      }
      index += 1
    }
  }

  cleanup_done_threads(vm)

  {
    now_ms: vm.now_ms,
    active_threads: vm.threads.length(),
    stepped_threads: stepped,
    emitted_effects: vm.effects.length(),
  }
}
