///|
fn is_hat_opcode(opcode : String) -> Bool {
  opcode == "event_whenflagclicked" ||
  opcode == "event_whenbroadcastreceived" ||
  opcode == "event_whenkeypressed" ||
  opcode == "event_whenthisspriteclicked" ||
  opcode == "event_whentouchingobject" ||
  opcode == "event_whenstageclicked" ||
  opcode == "event_whenbackdropswitchesto" ||
  opcode == "event_whengreaterthan" ||
  opcode == "control_start_as_clone"
}

///|
fn json_to_string_option(json : Json) -> String? {
  match json {
    String(value) => Some(value)
    Null => None
    _ => None
  }
}

///|
fn input_payload(raw : Json) -> Json? {
  match raw {
    Array(parts) =>
      if parts.length() >= 3 {
        match parts[1] {
          Null => Some(parts[2])
          _ => Some(parts[1])
        }
      } else if parts.length() >= 2 {
        Some(parts[1])
      } else {
        None
      }
    _ => Some(raw)
  }
}

///|
fn payload_const_number(payload : Json) -> Double? {
  match payload {
    Array(primitive) =>
      if primitive.length() >= 2 {
        let code = json_to_number_value(primitive[0]).to_int()
        if code >= 4 && code <= 8 {
          Some(json_to_number_value(primitive[1]))
        } else {
          None
        }
      } else {
        None
      }
    _ => None
  }
}

///|
fn extract_const_number_inputs(
  inputs : Map[String, Json],
) -> Map[String, Double] {
  let out = {}
  inputs.each((name, raw_input) => {
    match input_payload(raw_input) {
      Some(payload) =>
        match payload_const_number(payload) {
          Some(value) => out[name] = value
          None => ()
        }
      None => ()
    }
  })
  out
}

///|
fn extract_input_block_ids(inputs : Map[String, Json]) -> Map[String, String] {
  let out = {}
  inputs.each((name, raw_input) => {
    match input_payload(raw_input) {
      Some(String(id)) => out[name] = id
      _ => ()
    }
  })
  out
}

///|
fn opcode_tag_for(opcode : String) -> OpcodeTag {
  match opcode {
    "motion_changexby" => OpcodeTag::MotionChangeXBy
    "motion_changeyby" => OpcodeTag::MotionChangeYBy
    "motion_sety" => OpcodeTag::MotionSetY
    "pen_penDown" => OpcodeTag::PenPenDown
    "pen_penUp" => OpcodeTag::PenPenUp
    "control_repeat" => OpcodeTag::ControlRepeat
    "control_repeat_until" => OpcodeTag::ControlRepeatUntil
    "control_if" => OpcodeTag::ControlIf
    "data_setvariableto" => OpcodeTag::DataSetVariableTo
    "data_changevariableby" => OpcodeTag::DataChangeVariableBy
    _ => OpcodeTag::Unknown
  }
}

///|
fn parse_scratch_block(id : String, json : Json) -> ScratchBlock raise VmError {
  let obj = expect_object(json, "block \{id}")
  let opcode = object_get_string_or(obj, "opcode", "")
  if opcode == "" {
    invalid_project("block \{id} has no opcode")
  }
  let next = match object_get(obj, "next") {
    Some(value) => json_to_string_option(value)
    None => None
  }
  let parent = match object_get(obj, "parent") {
    Some(value) => json_to_string_option(value)
    None => None
  }
  let inputs = object_get_object_or_empty(obj, "inputs")
  let const_number_inputs = extract_const_number_inputs(inputs)
  let input_block_ids = extract_input_block_ids(inputs)
  let fields = object_get_object_or_empty(obj, "fields")
  let mutation = object_get_object_or_empty(obj, "mutation")
  let top_level = object_get_bool_or(obj, "topLevel", false)
  {
    id,
    opcode,
    opcode_tag: opcode_tag_for(opcode),
    next,
    parent,
    inputs,
    const_number_inputs,
    input_block_ids,
    fields,
    mutation,
    top_level,
  }
}

///|
fn parse_variables(
  raw : Map[String, Json],
) -> (
  Map[String, Json],
  Map[String, String],
  Map[String, Int],
  Map[String, Int],
  Array[String],
  Array[Json],
) {
  let values = {}
  let names = {}
  let slot_by_id = {}
  let slot_by_name = {}
  let ids_by_slot = []
  let values_by_slot = []
  raw.each(fn(id, descriptor) {
    match descriptor {
      Array(parts) =>
        if parts.length() >= 2 {
          let name = json_to_string_value(parts[0])
          values[id] = parts[1]
          names[name] = id
          let slot = values_by_slot.length()
          slot_by_id[id] = slot
          slot_by_name[name] = slot
          ids_by_slot.push(id)
          values_by_slot.push(parts[1])
        }
      _ => ()
    }
  })
  (values, names, slot_by_id, slot_by_name, ids_by_slot, values_by_slot)
}

///|
fn parse_lists(
  raw : Map[String, Json],
) -> (
  Map[String, Array[Json]],
  Map[String, String],
  Map[String, Int],
  Map[String, Int],
  Array[String],
  Array[Array[Json]],
) {
  let values = {}
  let names = {}
  let slot_by_id = {}
  let slot_by_name = {}
  let ids_by_slot = []
  let values_by_slot = []
  raw.each(fn(id, descriptor) {
    match descriptor {
      Array(parts) =>
        if parts.length() >= 2 {
          let name = json_to_string_value(parts[0])
          let mut list_items = []
          match parts[1] {
            Array(items) => list_items = items
            _ => ()
          }
          values[id] = list_items
          names[name] = id
          let slot = values_by_slot.length()
          slot_by_id[id] = slot
          slot_by_name[name] = slot
          ids_by_slot.push(id)
          values_by_slot.push(list_items)
        }
      _ => ()
    }
  })
  (values, names, slot_by_id, slot_by_name, ids_by_slot, values_by_slot)
}

///|
fn json_is_numeric_comparable(value : Json) -> Bool {
  match as_number_or_none(value) {
    Some(number) => number == number
    None => false
  }
}

///|
fn parse_blocks(
  raw : Map[String, Json],
) -> (Map[String, ScratchBlock], Array[String]) raise VmError {
  let blocks = {}
  let hats = []
  raw.each((id, block_json) => {
    let block = parse_scratch_block(id, block_json)
    if block.top_level && is_hat_opcode(block.opcode) {
      hats.push(id)
    }
    blocks[id] = block
  })
  (blocks, hats)
}

///|
fn build_block_pc_index(
  blocks : Map[String, ScratchBlock],
) -> (Map[String, Int], Array[ScratchBlock]) {
  let block_pc_by_id = {}
  let blocks_by_pc = []
  blocks.each((id, block) => {
    block_pc_by_id[id] = blocks_by_pc.length()
    blocks_by_pc.push(block)
  })
  (block_pc_by_id, blocks_by_pc)
}

///|
fn block_field_ref(block : ScratchBlock, field_name : String) -> BlockFieldRef? {
  match field_value(block, field_name) {
    Some((name, id)) => Some({ name, id })
    None => None
  }
}

///|
fn resolve_block_pc(
  block_pc_by_id : Map[String, Int],
  block_id : String?,
) -> Int? {
  match block_id {
    Some(id) => block_pc_by_id.get(id)
    None => None
  }
}

///|
fn build_block_fast_meta_by_pc(
  blocks_by_pc : Array[ScratchBlock],
  block_pc_by_id : Map[String, Int],
) -> Array[BlockFastMeta] {
  let out = []
  for block in blocks_by_pc {
    out.push({
      next_pc: resolve_block_pc(block_pc_by_id, block.next),
      substack_pc: resolve_block_pc(
        block_pc_by_id,
        block_input_block_id(block, "SUBSTACK"),
      ),
      substack2_pc: resolve_block_pc(
        block_pc_by_id,
        block_input_block_id(block, "SUBSTACK2"),
      ),
      variable: block_field_ref(block, "VARIABLE"),
      list: block_field_ref(block, "LIST"),
    })
  }
  out
}

///|
fn const_mathop(name : String, value : Double) -> Double {
  match lower_trim(name) {
    "abs" => value.abs()
    "floor" => value.floor()
    "ceiling" => value.ceil()
    "sqrt" => value.sqrt()
    "sin" => @math.sin(value * @math.PI / 180.0)
    "cos" => @math.cos(value * @math.PI / 180.0)
    "tan" => @math.tan(value * @math.PI / 180.0)
    "asin" => @math.asin(value) * 180.0 / @math.PI
    "acos" => @math.acos(value) * 180.0 / @math.PI
    "atan" => @math.atan(value) * 180.0 / @math.PI
    "ln" => @math.ln(value)
    "log" => @math.log10(value)
    "e ^" => @math.exp(value)
    "10 ^" => @math.pow(10.0, value)
    _ => value
  }
}

///|
fn const_number_input_from_block(
  blocks : Map[String, ScratchBlock],
  block : ScratchBlock,
  input_name : String,
  cache : Map[String, Double],
  visiting : Map[String, Bool],
) -> Double? {
  match block.const_number_inputs.get(input_name) {
    Some(value) => Some(value)
    None =>
      match block.input_block_ids.get(input_name) {
        Some(child_id) =>
          const_number_block_value(blocks, child_id, cache, visiting)
        None => None
      }
  }
}

///|
fn const_number_block_value(
  blocks : Map[String, ScratchBlock],
  block_id : String,
  cache : Map[String, Double],
  visiting : Map[String, Bool],
) -> Double? {
  match cache.get(block_id) {
    Some(value) => return Some(value)
    None => ()
  }
  if visiting.contains(block_id) {
    return None
  }
  visiting[block_id] = true
  let block = match blocks.get(block_id) {
    Some(value) => value
    None => {
      visiting.remove(block_id)
      return None
    }
  }

  let resolved = match block.opcode {
    "math_number"
    | "math_integer"
    | "math_whole_number"
    | "math_positive_number"
    | "math_angle" =>
      match field_value(block, "NUM") {
        Some((raw, _)) =>
          Some(
            match parse_double_or_none(raw) {
              Some(parsed) => parsed
              None => 0.0
            },
          )
        None => Some(0.0)
      }
    "operator_add" =>
      match
        (
          const_number_input_from_block(blocks, block, "NUM1", cache, visiting),
          const_number_input_from_block(blocks, block, "NUM2", cache, visiting),
        ) {
        (Some(left), Some(right)) => Some(left + right)
        _ => None
      }
    "operator_subtract" =>
      match
        (
          const_number_input_from_block(blocks, block, "NUM1", cache, visiting),
          const_number_input_from_block(blocks, block, "NUM2", cache, visiting),
        ) {
        (Some(left), Some(right)) => Some(left - right)
        _ => None
      }
    "operator_multiply" =>
      match
        (
          const_number_input_from_block(blocks, block, "NUM1", cache, visiting),
          const_number_input_from_block(blocks, block, "NUM2", cache, visiting),
        ) {
        (Some(left), Some(right)) => Some(left * right)
        _ => None
      }
    "operator_divide" =>
      match
        (
          const_number_input_from_block(blocks, block, "NUM1", cache, visiting),
          const_number_input_from_block(blocks, block, "NUM2", cache, visiting),
        ) {
        (Some(left), Some(right)) =>
          if right == 0.0 {
            Some(0.0)
          } else {
            Some(left / right)
          }
        _ => None
      }
    "operator_mod" =>
      match
        (
          const_number_input_from_block(blocks, block, "NUM1", cache, visiting),
          const_number_input_from_block(blocks, block, "NUM2", cache, visiting),
        ) {
        (Some(left), Some(right)) =>
          if right == 0.0 {
            Some(0.0)
          } else {
            Some(left.mod(right))
          }
        _ => None
      }
    "operator_round" =>
      match
        const_number_input_from_block(blocks, block, "NUM", cache, visiting) {
        Some(value) => Some(value.round())
        None => None
      }
    "operator_mathop" => {
      let op = match field_value(block, "OPERATOR") {
        Some((name, _)) => name
        None => ""
      }
      match
        const_number_input_from_block(blocks, block, "NUM", cache, visiting) {
        Some(value) => Some(const_mathop(op, value))
        None => None
      }
    }
    _ => None
  }
  visiting.remove(block_id)
  match resolved {
    Some(value) => {
      cache[block_id] = value
      Some(value)
    }
    None => None
  }
}

///|
fn build_const_number_block_values(
  blocks : Map[String, ScratchBlock],
) -> Map[String, Double] {
  let cache = {}
  blocks.each((block_id, _) => {
    ignore(const_number_block_value(blocks, block_id, cache, {}))
  })
  cache
}

///|
fn build_procedure_specs(
  blocks : Map[String, ScratchBlock],
) -> Map[String, ProcedureSpec] {
  let procedures = {}
  blocks.each((_, block) => {
    if block.opcode == "procedures_definition" {
      match block_input_block_id(block, "custom_block") {
        Some(proto_id) =>
          match blocks.get(proto_id) {
            Some(prototype) =>
              if prototype.opcode == "procedures_prototype" {
                let proccode = match
                  block_mutation_string(prototype, "proccode") {
                  Some(value) => value
                  None => ""
                }
                if proccode != "" {
                  match block.next {
                    Some(start_block) => {
                      let param_names = match
                        block_mutation_string(prototype, "argumentnames") {
                        Some(raw) => parse_json_string_array(raw)
                        None => []
                      }
                      let param_ids = match
                        block_mutation_string(prototype, "argumentids") {
                        Some(raw) => parse_json_string_array(raw)
                        None => []
                      }
                      let param_defaults = match
                        block_mutation_string(prototype, "argumentdefaults") {
                        Some(raw) => parse_json_value_array(raw)
                        None => []
                      }
                      let warp_mode = block_mutation_bool(prototype, "warp")
                      procedures[proccode] = {
                        start_block,
                        param_names,
                        param_ids,
                        param_defaults,
                        warp_mode,
                      }
                    }
                    None => ()
                  }
                }
              }
            None => ()
          }
        None => ()
      }
    }
  })
  procedures
}

///|
fn empty_rgba_pixels(width : Int, height : Int) -> Array[Byte] {
  let out = []
  if width <= 0 || height <= 0 {
    return out
  }
  for _ in 0..<(width * height * 4) {
    out.push(b'\x00')
  }
  out
}

///|
fn parse_costume_asset_pixels(
  asset_json : Json,
  context : String,
) -> (Int, Int, Array[Byte]) raise VmError {
  let asset_obj = expect_object(asset_json, context)
  let width = object_get_number_or(asset_obj, "width", 0.0).to_int()
  let height = object_get_number_or(asset_obj, "height", 0.0).to_int()
  let rgba_base64 = object_get_string_or(asset_obj, "rgbaBase64", "")
  if width <= 0 || height <= 0 || rgba_base64 == "" {
    invalid_project("invalid RGBA asset for \{context}")
  }
  let decoded = @base64.decode(rgba_base64.view()) catch {
    _ => invalid_project("invalid base64 RGBA asset for \{context}")
  }
  let pixels = decoded.to_array()
  if pixels.length() < width * height * 4 {
    invalid_project("RGBA asset too short for \{context}")
  }
  (width, height, pixels)
}

///|
fn parse_costumes(
  raw_costumes : Array[Json],
  assets : Map[String, Json],
) -> (Array[String], Array[CostumeImage]) raise VmError {
  let costume_names = []
  let costumes = []
  for i, costume_json in raw_costumes {
    let costume_obj = match costume_json {
      Object(values) => values
      _ => {}
    }
    let name = object_get_string_or(costume_obj, "name", "costume_\{i + 1}")
    let asset_id = object_get_string_or(costume_obj, "assetId", "")
    let md5ext = object_get_string_or(costume_obj, "md5ext", "")
    let bitmap_resolution = {
      let raw = object_get_number_or(costume_obj, "bitmapResolution", 1.0).to_int()
      if raw <= 0 {
        1
      } else {
        raw
      }
    }
    let rotation_center_x = object_get_number_or(
      costume_obj, "rotationCenterX", 0.0,
    )
    let rotation_center_y = object_get_number_or(
      costume_obj, "rotationCenterY", 0.0,
    )
    let fallback_width = object_get_number_or(costume_obj, "width", 0.0).to_int()
    let fallback_height = object_get_number_or(costume_obj, "height", 0.0).to_int()

    let mut width = if fallback_width > 0 { fallback_width } else { 0 }
    let mut height = if fallback_height > 0 { fallback_height } else { 0 }
    let mut pixels = empty_rgba_pixels(width, height)

    let asset_key = if asset_id != "" && assets.contains(asset_id) {
      Some(asset_id)
    } else if md5ext != "" && assets.contains(md5ext) {
      Some(md5ext)
    } else {
      None
    }
    match asset_key {
      Some(key) =>
        match assets.get(key) {
          Some(asset_json) => {
            let (asset_width, asset_height, asset_pixels) = parse_costume_asset_pixels(
              asset_json,
              "costume:\{name}",
            )
            width = asset_width
            height = asset_height
            pixels = asset_pixels
          }
          None => ()
        }
      None => ()
    }

    costume_names.push(name)
    costumes.push({
      name,
      asset_id,
      bitmap_resolution,
      rotation_center_x,
      rotation_center_y,
      width,
      height,
      pixels,
    })
  }
  (costume_names, costumes)
}

///|
fn parse_target(
  index : Int,
  json : Json,
  assets : Map[String, Json],
) -> TargetState raise VmError {
  let obj = expect_object(json, "target")
  let name = object_get_string_or(obj, "name", "target_\{index}")
  let is_stage = object_get_bool_or(obj, "isStage", false)
  let target_id = if is_stage { "__stage__" } else { "target_\{index}_\{name}" }

  let x = object_get_number_or(obj, "x", 0.0)
  let y = object_get_number_or(obj, "y", 0.0)
  let direction = object_get_number_or(obj, "direction", 90.0)
  let size = object_get_number_or(obj, "size", 100.0)
  let volume = object_get_number_or(obj, "volume", 100.0)
  let music_instrument = object_get_number_or(obj, "musicInstrument", 1.0).to_int() -
    1
  let tts_voice = object_get_string_or(obj, "textToSpeechVoice", "ALTO")
  let visible = object_get_bool_or(obj, "visible", true)
  let current_costume = object_get_number_or(obj, "currentCostume", 0.0).to_int()

  let raw_variables = object_get_object_or_empty(obj, "variables")
  let raw_lists = object_get_object_or_empty(obj, "lists")
  let raw_blocks = object_get_object_or_empty(obj, "blocks")
  let raw_costumes = object_get_or(obj, "costumes", json_array([]))
  let costume_values = expect_array(raw_costumes, "target.costumes")
  let (costume_names, costumes) = parse_costumes(costume_values, assets)

  let (
    variables,
    variable_names,
    variable_slot_by_id,
    variable_slot_by_name,
    variable_id_by_slot,
    variable_values,
  ) = parse_variables(raw_variables)
  let variable_numeric_flags = variable_values.map(json_is_numeric_comparable)
  let (
    lists,
    list_names,
    list_slot_by_id,
    list_slot_by_name,
    list_id_by_slot,
    list_values,
  ) = parse_lists(raw_lists)
  let (blocks, hats) = parse_blocks(raw_blocks)
  let const_number_block_values = build_const_number_block_values(blocks)
  let procedures = build_procedure_specs(blocks)
  let (block_pc_by_id, blocks_by_pc) = build_block_pc_index(blocks)
  let block_fast_meta_by_pc = build_block_fast_meta_by_pc(
    blocks_by_pc, block_pc_by_id,
  )
  let green_flag_starts = []
  let stage_clicked_starts = []
  let sprite_clicked_starts = []
  let clone_start_starts = []
  let key_pressed_hats = []
  let broadcast_hats = []
  let backdrop_hats = []
  let predicate_hats = []

  for hat_id in hats {
    match blocks.get(hat_id) {
      Some(hat) =>
        match hat.next {
          Some(start_block) =>
            match hat.opcode {
              "event_whenflagclicked" => green_flag_starts.push(start_block)
              "event_whenstageclicked" => stage_clicked_starts.push(start_block)
              "event_whenthisspriteclicked" =>
                sprite_clicked_starts.push(start_block)
              "control_start_as_clone" => clone_start_starts.push(start_block)
              "event_whenkeypressed" => {
                let option = match field_value(hat, "KEY_OPTION") {
                  Some((name, _)) => {
                    let normalized = lower_trim(name)
                    if normalized == "" {
                      "any"
                    } else {
                      normalized
                    }
                  }
                  None => "any"
                }
                key_pressed_hats.push({ key_option: option, start_block })
              }
              "event_whenbroadcastreceived" => {
                let message = match field_value(hat, "BROADCAST_OPTION") {
                  Some((name, _)) => name
                  None => ""
                }
                broadcast_hats.push({ message, start_block })
              }
              "event_whenbackdropswitchesto" => {
                let backdrop_name = match field_value(hat, "BACKDROP") {
                  Some((name, _)) => name
                  None => ""
                }
                backdrop_hats.push({ backdrop_name, start_block })
              }
              "event_whengreaterthan" => {
                let menu = match field_value(hat, "WHENGREATERTHANMENU") {
                  Some((name, _)) => lower_trim(name)
                  None => ""
                }
                predicate_hats.push({
                  kind: PredicateHatKind::WhenGreaterThan,
                  hat_id,
                  menu,
                  start_block,
                })
              }
              "event_whentouchingobject" => {
                let menu = match field_value(hat, "TOUCHINGOBJECTMENU") {
                  Some((name, _)) => name
                  None => ""
                }
                predicate_hats.push({
                  kind: PredicateHatKind::WhenTouchingObject,
                  hat_id,
                  menu,
                  start_block,
                })
              }
              _ => ()
            }
          None => ()
        }
      None => ()
    }
  }

  {
    id: target_id,
    name,
    is_stage,
    is_original: true,
    deleted: false,
    x,
    y,
    direction,
    size,
    volume,
    music_instrument,
    tts_voice,
    visible,
    current_costume,
    costume_names,
    costumes,
    pen_down: false,
    pen_color: 66.66,
    pen_saturation: 100.0,
    pen_brightness: 100.0,
    pen_transparency: 0.0,
    pen_size: 1.0,
    pen_legacy_shade: 50.0,
    looks_effect_color: 0.0,
    looks_effect_fisheye: 0.0,
    looks_effect_whirl: 0.0,
    looks_effect_pixelate: 0.0,
    looks_effect_mosaic: 0.0,
    looks_effect_brightness: 0.0,
    looks_effect_ghost: 0.0,
    variables,
    variable_names,
    variable_slot_by_id,
    variable_slot_by_name,
    variable_id_by_slot,
    variable_values,
    variable_numeric_flags,
    lists,
    list_names,
    list_slot_by_id,
    list_slot_by_name,
    list_id_by_slot,
    list_values,
    blocks,
    const_number_block_values,
    procedures,
    block_pc_by_id,
    blocks_by_pc,
    block_fast_meta_by_pc,
    numeric_program_cache: {},
    numeric_program_compile_failed: {},
    bool_program_cache: {},
    bool_program_compile_failed: {},
    top_level_hats: hats,
    green_flag_starts,
    stage_clicked_starts,
    sprite_clicked_starts,
    clone_start_starts,
    key_pressed_hats,
    broadcast_hats,
    backdrop_hats,
    predicate_hats,
  }
}

///|
fn parse_bundle(
  project_json : String,
  assets_json : String?,
) -> ProjectBundle raise VmError {
  let assets = match assets_json {
    Some(raw) =>
      if raw.trim().is_empty() {
        {}
      } else {
        let json = parse_json_or_fail(raw)
        expect_object(json, "assets")
      }
    None => {}
  }
  { project_json, assets }
}

///|
fn parse_project_targets(
  project_json : String,
  assets : Map[String, Json],
) -> (Array[TargetState], Int) raise VmError {
  let root = parse_json_or_fail(project_json)
  let root_obj = expect_object(root, "project")
  let targets_json = object_get_or(root_obj, "targets", json_array([]))
  let target_values = expect_array(targets_json, "project.targets")

  let targets = []
  let mut stage_index = 0
  for i, target_json in target_values {
    let target = parse_target(i, target_json, assets)
    if target.is_stage {
      stage_index = i
    }
    targets.push(target)
  }

  if targets.is_empty() {
    invalid_project("project has no targets")
  }

  (targets, stage_index)
}

///|
fn compile_project(bundle : ProjectBundle) -> PrecompiledProject raise VmError {
  let (targets, stage_index) = parse_project_targets(
    bundle.project_json,
    bundle.assets,
  )
  { targets, stage_index, assets: bundle.assets, initial_opaque_backdrops: {} }
}
