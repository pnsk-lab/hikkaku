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
  let fields = object_get_object_or_empty(obj, "fields")
  let mutation = object_get_object_or_empty(obj, "mutation")
  let top_level = object_get_bool_or(obj, "topLevel", false)
  { id, opcode, next, parent, inputs, fields, mutation, top_level }
}

///|
fn parse_variables(
  raw : Map[String, Json],
) -> (Map[String, Json], Map[String, String]) {
  let values = {}
  let names = {}
  raw.each(fn(id, descriptor) {
    match descriptor {
      Array(parts) =>
        if parts.length() >= 2 {
          let name = json_to_string_value(parts[0])
          values[id] = parts[1]
          names[name] = id
        }
      _ => ()
    }
  })
  (values, names)
}

///|
fn parse_lists(
  raw : Map[String, Json],
) -> (Map[String, Array[Json]], Map[String, String]) {
  let values = {}
  let names = {}
  raw.each(fn(id, descriptor) {
    match descriptor {
      Array(parts) =>
        if parts.length() >= 2 {
          let name = json_to_string_value(parts[0])
          match parts[1] {
            Array(items) => {
              values[id] = items
              names[name] = id
            }
            _ => {
              values[id] = []
              names[name] = id
            }
          }
        }
      _ => ()
    }
  })
  (values, names)
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

  let (variables, variable_names) = parse_variables(raw_variables)
  let (lists, list_names) = parse_lists(raw_lists)
  let (blocks, hats) = parse_blocks(raw_blocks)

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
    lists,
    list_names,
    blocks,
    top_level_hats: hats,
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
