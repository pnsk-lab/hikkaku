///|
const PROGRAM_ABI_VERSION : Int = 2

///|
fn page_count_for_bytes(total_bytes : Int) -> Int {
  if total_bytes <= 0 {
    1
  } else {
    (total_bytes + 65535) / 65536
  }
}

///|
fn base64_utf8(raw : String) -> String {
  let encoded = @utf8.encode(raw.view())
  @base64.encode(encoded[:])
}

///|
fn json_number_or_null(value : Int?) -> Json {
  match value {
    Some(v) => json_number(Double::from_int(v))
    None => Json::null()
  }
}

///|
fn command_json_opcode_catalog(
  target_index : Int,
  pc : Int,
  block : ScratchBlock,
  meta : BlockFastMeta,
) -> Json {
  json_object({
    "op": json_string("opcode"),
    "target": json_number(Double::from_int(target_index)),
    "pc": json_number(Double::from_int(pc)),
    "id": json_string(block.id),
    "opcode": json_string(block.opcode),
    "top_level": json_bool(block.top_level),
    "next_pc": json_number_or_null(meta.next_pc),
    "substack_pc": json_number_or_null(meta.substack_pc),
    "substack2_pc": json_number_or_null(meta.substack2_pc),
  })
}

///|
fn command_json_full_green_flag_start_entry(
  target_index : Int,
  start_pcs : Array[Int],
) -> Json {
  let pcs = start_pcs.map(fn(pc) { json_number(Double::from_int(pc)) })
  json_object({
    "target": json_number(Double::from_int(target_index)),
    "pcs": json_array(pcs),
  })
}

///|
fn target_is_aot_eligible(target : TargetState) -> Bool {
  target.top_level_hats.length() == target.green_flag_starts.length() &&
  target.stage_clicked_starts.is_empty() &&
  target.sprite_clicked_starts.is_empty() &&
  target.clone_start_starts.is_empty() &&
  target.key_pressed_hats.is_empty() &&
  target.broadcast_hats.is_empty() &&
  target.backdrop_hats.is_empty() &&
  target.predicate_hats.is_empty()
}

///|
priv enum AotCompileStmtResult {
  Noop
  Emit(Json)
  EmitAndStop(Json)
}

///|
fn expr_json_num(value : Double) -> Json {
  json_object({ "kind": json_string("num"), "value": json_number(value) })
}

///|
fn expr_json_var_num(target_index : Int, variable_id : String) -> Json {
  json_object({
    "kind": json_string("var_num"),
    "target": json_number(Double::from_int(target_index)),
    "id": json_string(variable_id),
  })
}

///|
fn expr_json_bin_num(op : String, left : Json, right : Json) -> Json {
  json_object({
    "kind": json_string("bin_num"),
    "op": json_string(op),
    "left": left,
    "right": right,
  })
}

///|
fn expr_json_unary_num(op : String, value : Json) -> Json {
  json_object({
    "kind": json_string("unary_num"),
    "op": json_string(op),
    "value": value,
  })
}

///|
fn expr_json_bool(value : Bool) -> Json {
  json_object({ "kind": json_string("bool"), "value": json_bool(value) })
}

///|
fn expr_json_cmp_num(op : String, left : Json, right : Json) -> Json {
  json_object({
    "kind": json_string("cmp_num"),
    "op": json_string(op),
    "left": left,
    "right": right,
  })
}

///|
fn expr_json_bin_bool(op : String, left : Json, right : Json) -> Json {
  json_object({
    "kind": json_string("bin_bool"),
    "op": json_string(op),
    "left": left,
    "right": right,
  })
}

///|
fn expr_json_not(value : Json) -> Json {
  json_object({ "kind": json_string("not"), "value": value })
}

///|
fn expr_json_bool_from_number(expr : Json) -> Json {
  expr_json_cmp_num("ne", expr, expr_json_num(0.0))
}

///|
fn command_json_set_var_num_expr(
  target_index : Int,
  variable_id : String,
  expr : Json,
) -> Json {
  json_object({
    "op": json_string("set_var_num_expr"),
    "target": json_number(Double::from_int(target_index)),
    "id": json_string(variable_id),
    "expr": expr,
  })
}

///|
fn command_json_set_var_json_const(
  target_index : Int,
  variable_id : String,
  value : Json,
) -> Json {
  json_object({
    "op": json_string("set_var_json_const"),
    "target": json_number(Double::from_int(target_index)),
    "id": json_string(variable_id),
    "value": value,
  })
}

///|
fn command_json_change_var_num_expr(
  target_index : Int,
  variable_id : String,
  expr : Json,
) -> Json {
  json_object({
    "op": json_string("change_var_num_expr"),
    "target": json_number(Double::from_int(target_index)),
    "id": json_string(variable_id),
    "expr": expr,
  })
}

///|
fn command_json_if(cond : Json, then_commands : Array[Json]) -> Json {
  json_object({
    "op": json_string("if"),
    "cond": cond,
    "then": json_array(then_commands),
  })
}

///|
fn command_json_if_else(
  cond : Json,
  then_commands : Array[Json],
  else_commands : Array[Json],
) -> Json {
  json_object({
    "op": json_string("if_else"),
    "cond": cond,
    "then": json_array(then_commands),
    "else": json_array(else_commands),
  })
}

///|
fn command_json_repeat(times : Json, body_commands : Array[Json]) -> Json {
  json_object({
    "op": json_string("repeat"),
    "times": times,
    "body": json_array(body_commands),
  })
}

///|
fn command_json_repeat_until(cond : Json, body_commands : Array[Json]) -> Json {
  json_object({
    "op": json_string("repeat_until"),
    "cond": cond,
    "body": json_array(body_commands),
  })
}

///|
fn command_json_while(cond : Json, body_commands : Array[Json]) -> Json {
  json_object({
    "op": json_string("while"),
    "cond": cond,
    "body": json_array(body_commands),
  })
}

///|
fn command_json_host_tail(target_index : Int, start_pc : Int) -> Json {
  json_object({
    "op": json_string("host_tail"),
    "target": json_number(Double::from_int(target_index)),
    "pc": json_number(Double::from_int(start_pc)),
  })
}

///|
fn command_json_host_opcode(target_index : Int, pc : Int) -> Json {
  json_object({
    "op": json_string("host_opcode"),
    "target": json_number(Double::from_int(target_index)),
    "pc": json_number(Double::from_int(pc)),
  })
}

///|
fn command_json_draw_opcode(
  target_index : Int,
  opcode : String,
  arg0 : Json,
  arg1 : Json,
  extra : Int,
) -> Json {
  json_object({
    "op": json_string("draw_opcode"),
    "target": json_number(Double::from_int(target_index)),
    "opcode": json_string(opcode),
    "arg0": arg0,
    "arg1": arg1,
    "extra": json_number(Double::from_int(extra)),
  })
}

///|
fn normalize_looks_effect_name_for_draw(raw : String) -> Int? {
  match raw.trim().to_lower() {
    "color" => Some(1)
    "fisheye" => Some(2)
    "whirl" => Some(3)
    "pixelate" => Some(4)
    "mosaic" => Some(5)
    "brightness" => Some(6)
    "ghost" => Some(7)
    _ => None
  }
}

///|
fn normalize_pen_color_param_for_draw(raw : String) -> Int? {
  match raw.trim().to_lower() {
    "color" => Some(1)
    "saturation" => Some(2)
    "brightness" => Some(3)
    "transparency" => Some(4)
    _ => None
  }
}

///|
fn literal_string_from_input_or_field(
  block : ScratchBlock,
  input_name : String,
  field_name : String,
) -> String? {
  let from_input = match block.input_block_ids.get(input_name) {
    Some(_) => None
    None =>
      match block.inputs.get(input_name) {
        Some(raw_input) =>
          match input_payload(raw_input) {
            Some(payload) =>
              match literal_value_from_payload(payload) {
                Some(value) => {
                  let text = json_to_string_value(value).trim().to_string()
                  if text == "" {
                    None
                  } else {
                    Some(text)
                  }
                }
                None => None
              }
            None => None
          }
        None => None
      }
  }
  match from_input {
    Some(value) => Some(value)
    None =>
      match field_value(block, field_name) {
        Some((raw, _)) => {
          let text = raw.trim().to_string()
          if text == "" {
            None
          } else {
            Some(text)
          }
        }
        None => None
      }
  }
}

///|
fn command_is_host_tail(command : Json) -> Bool {
  match command {
    Object(obj) =>
      match obj.get("op") {
        Some(String("host_tail")) => true
        Some(String("if")) =>
          match obj.get("then") {
            Some(Array(children)) => command_list_contains_host_tail(children)
            _ => false
          }
        Some(String("if_else")) =>
          match (obj.get("then"), obj.get("else")) {
            (Some(Array(then_children)), Some(Array(else_children))) =>
              command_list_contains_host_tail(then_children) ||
              command_list_contains_host_tail(else_children)
            _ => false
          }
        Some(String("repeat"))
        | Some(String("repeat_until"))
        | Some(String("while")) =>
          match obj.get("body") {
            Some(Array(children)) => command_list_contains_host_tail(children)
            _ => false
          }
        _ => false
      }
    _ => false
  }
}

///|
fn command_list_contains_host_tail(commands : Array[Json]) -> Bool {
  for command in commands {
    if command_is_host_tail(command) {
      return true
    }
  }
  false
}

///|
fn opcode_uses_safe_host_opcode(opcode : String) -> Bool {
  match opcode {
    "music_setInstrument"
    | "music_midiSetInstrument"
    | "music_setTempo"
    | "music_changeTempo"
    | "text2speech_setVoice"
    | "text2speech_setLanguage"
    | "sound_play"
    | "sound_playuntildone"
    | "sound_stopallsounds"
    | "sound_setvolumeto"
    | "sound_changevolumeby"
    | "sound_seteffectto"
    | "sound_changeeffectby"
    | "sound_cleareffects"
    | "data_setvariableto"
    | "data_changevariableby"
    | "data_addtolist"
    | "data_deleteoflist"
    | "data_deletealloflist"
    | "data_insertatlist"
    | "data_replaceitemoflist"
    | "data_showvariable"
    | "data_hidevariable"
    | "data_showlist"
    | "data_hidelist"
    | "event_broadcast"
    | "sensing_resettimer"
    | "sensing_setdragmode"
    | "control_clear_counter"
    | "control_incr_counter"
    | "motion_movesteps"
    | "motion_turnright"
    | "motion_turnleft"
    | "motion_pointindirection"
    | "motion_pointtowards"
    | "motion_changexby"
    | "motion_changeyby"
    | "motion_setx"
    | "motion_sety"
    | "motion_gotoxy"
    | "motion_goto"
    | "motion_ifonedgebounce"
    | "motion_setrotationstyle"
    | "motion_align_scene"
    | "motion_scroll_right"
    | "motion_scroll_up"
    | "looks_show"
    | "looks_hide"
    | "looks_hideallsprites"
    | "looks_switchcostumeto"
    | "looks_nextcostume"
    | "looks_switchbackdropto"
    | "looks_nextbackdrop"
    | "looks_changeeffectby"
    | "looks_seteffectto"
    | "looks_cleargraphiceffects"
    | "looks_changestretchby"
    | "looks_setstretchto"
    | "looks_gotofrontback"
    | "looks_goforwardbackwardlayers"
    | "looks_changesizeby"
    | "looks_setsizeto"
    | "looks_say"
    | "looks_think"
    | "pen_clear"
    | "pen_stamp"
    | "pen_penDown"
    | "pen_penUp"
    | "pen_setPenColorToColor"
    | "pen_changePenColorParamBy"
    | "pen_setPenColorParamTo"
    | "pen_changePenSizeBy"
    | "pen_setPenSizeTo"
    | "pen_setPenHueToNumber"
    | "pen_changePenHueBy"
    | "pen_setPenShadeToNumber"
    | "pen_changePenShadeBy" => true
    _ => false
  }
}

///|
fn opcode_fallback_stmt(
  opcode : String,
  target_index : Int,
  pc : Int,
) -> AotCompileStmtResult {
  if opcode_uses_safe_host_opcode(opcode) {
    AotCompileStmtResult::Emit(command_json_host_opcode(target_index, pc))
  } else {
    AotCompileStmtResult::EmitAndStop(command_json_host_tail(target_index, pc))
  }
}

///|
fn variable_id_from_field(block : ScratchBlock) -> String? {
  match field_value(block, "VARIABLE") {
    Some((_, Some(id))) if id != "" => Some(id)
    _ => None
  }
}

///|
fn literal_value_from_payload(payload : Json) -> Json? {
  match payload {
    Array(primitive) =>
      if primitive.length() >= 2 {
        let kind = json_to_number_value(primitive[0]).to_int()
        if kind >= 4 && kind <= 8 {
          Some(json_number(json_to_number_value(primitive[1])))
        } else if kind == 10 || kind == 11 {
          Some(json_string(json_to_string_value(primitive[1])))
        } else if kind == 12 || kind == 13 {
          None
        } else {
          match primitive[1] {
            String(_) | Number(_, ..) | True | False | Null =>
              Some(primitive[1])
            _ => None
          }
        }
      } else {
        None
      }
    String(_) | Number(_, ..) | True | False | Null => Some(payload)
    _ => None
  }
}

///|
fn literal_value_from_input(block : ScratchBlock, input_name : String) -> Json? {
  match block.input_block_ids.get(input_name) {
    Some(_) => None
    None =>
      match block.inputs.get(input_name) {
        Some(raw_input) =>
          match input_payload(raw_input) {
            Some(payload) => literal_value_from_payload(payload)
            None => None
          }
        None => None
      }
  }
}

///|
fn json_finite_number_or_none(value : Json) -> Double? {
  match value {
    Number(n, ..) => if n.is_nan() || n.is_inf() { None } else { Some(n) }
    _ => None
  }
}

///|
fn resolve_reporter_block_id(
  block : ScratchBlock,
  input_name : String,
) -> String? {
  match block.input_block_ids.get(input_name) {
    Some(id) => Some(id)
    None =>
      match block.inputs.get(input_name) {
        Some(raw_input) =>
          match input_payload(raw_input) {
            Some(String(id)) => Some(id)
            _ => None
          }
        None => None
      }
  }
}

///|
fn variable_id_from_primitive(primitive : Array[Json]) -> String? {
  if primitive.length() >= 3 {
    let id = json_to_string_value(primitive[2])
    if id != "" {
      return Some(id)
    }
  }
  None
}

///|
fn json_is_numeric_comparable_for_aot(value : Json) -> Bool {
  match value {
    Number(n, ..) => n == n
    String(s) =>
      match parse_double_or_none(s) {
        Some(number) => number == number
        None => false
      }
    True => true
    False => true
    _ => false
  }
}

///|
fn build_aot_variable_numeric_map(
  targets : Array[TargetState],
) -> Map[String, Bool] {
  let out = {}
  for target in targets {
    target.variables.each((variable_id, value) => {
      out[variable_id] = json_is_numeric_comparable_for_aot(value)
    })
  }
  out
}

///|
fn number_expr_uses_only_numeric_variables(
  expr : Json,
  variable_numeric_by_id : Map[String, Bool],
  depth : Int,
) -> Bool {
  if depth > 64 {
    return false
  }
  match expr {
    Object(obj) =>
      match obj.get("kind") {
        Some(String("num")) => true
        Some(String("var_num")) =>
          match obj.get("id") {
            Some(String(variable_id)) =>
              match variable_numeric_by_id.get(variable_id) {
                Some(is_numeric) => is_numeric
                None => false
              }
            _ => false
          }
        Some(String("bin_num")) =>
          match (obj.get("left"), obj.get("right")) {
            (Some(left), Some(right)) =>
              number_expr_uses_only_numeric_variables(
                left,
                variable_numeric_by_id,
                depth + 1,
              ) &&
              number_expr_uses_only_numeric_variables(
                right,
                variable_numeric_by_id,
                depth + 1,
              )
            _ => false
          }
        Some(String("unary_num")) =>
          match obj.get("value") {
            Some(value) =>
              number_expr_uses_only_numeric_variables(
                value,
                variable_numeric_by_id,
                depth + 1,
              )
            None => false
          }
        _ => false
      }
    _ => false
  }
}

///|
fn compile_number_expr_from_payload(
  target_index : Int,
  payload : Json,
  allow_variable : Bool,
) -> Json? {
  match payload {
    Array(primitive) =>
      if primitive.length() >= 2 {
        let kind = json_to_number_value(primitive[0]).to_int()
        if kind >= 4 && kind <= 8 {
          Some(expr_json_num(json_to_number_value(primitive[1])))
        } else if kind == 10 || kind == 11 {
          None
        } else if kind == 12 {
          if !allow_variable {
            None
          } else {
            match variable_id_from_primitive(primitive) {
              Some(id) => Some(expr_json_var_num(target_index, id))
              None => None
            }
          }
        } else {
          match primitive[1] {
            String(_) => None
            _ => Some(expr_json_num(json_to_number_value(primitive[1])))
          }
        }
      } else {
        None
      }
    String(_) => None
    _ => Some(expr_json_num(json_to_number_value(payload)))
  }
}

///|
fn compile_bool_expr_from_payload(target_index : Int, payload : Json) -> Json? {
  match payload {
    Array(primitive) =>
      if primitive.length() >= 2 {
        let kind = json_to_number_value(primitive[0]).to_int()
        if kind == 12 {
          match variable_id_from_primitive(primitive) {
            Some(id) =>
              Some(
                expr_json_bool_from_number(expr_json_var_num(target_index, id)),
              )
            None => None
          }
        } else {
          Some(expr_json_bool(json_to_bool_value(primitive[1])))
        }
      } else {
        None
      }
    _ => Some(expr_json_bool(json_to_bool_value(payload)))
  }
}

///|
fn compile_number_expr_from_block(
  target : TargetState,
  target_index : Int,
  block_id : String,
  depth : Int,
  allow_variable : Bool,
) -> Json? {
  if depth > 64 {
    return None
  }
  let block = match target.blocks.get(block_id) {
    Some(value) => value
    None => return None
  }
  match block.opcode {
    "math_number"
    | "math_integer"
    | "math_whole_number"
    | "math_positive_number"
    | "math_angle" =>
      match field_value(block, "NUM") {
        Some((raw, _)) =>
          Some(
            expr_json_num(
              match parse_double_or_none(raw) {
                Some(value) => value
                None => 0.0
              },
            ),
          )
        None => Some(expr_json_num(0.0))
      }
    "data_variable" =>
      if !allow_variable {
        None
      } else {
        match field_value(block, "VARIABLE") {
          Some((_, Some(id))) if id != "" =>
            Some(expr_json_var_num(target_index, id))
          _ => None
        }
      }
    "operator_add" =>
      match
        (
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM1",
            depth + 1,
            allow_variable,
          ),
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM2",
            depth + 1,
            allow_variable,
          ),
        ) {
        (Some(left), Some(right)) => Some(expr_json_bin_num("add", left, right))
        _ => None
      }
    "operator_subtract" =>
      match
        (
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM1",
            depth + 1,
            allow_variable,
          ),
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM2",
            depth + 1,
            allow_variable,
          ),
        ) {
        (Some(left), Some(right)) => Some(expr_json_bin_num("sub", left, right))
        _ => None
      }
    "operator_multiply" =>
      match
        (
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM1",
            depth + 1,
            allow_variable,
          ),
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM2",
            depth + 1,
            allow_variable,
          ),
        ) {
        (Some(left), Some(right)) => Some(expr_json_bin_num("mul", left, right))
        _ => None
      }
    "operator_divide" =>
      match
        (
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM1",
            depth + 1,
            allow_variable,
          ),
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM2",
            depth + 1,
            allow_variable,
          ),
        ) {
        (Some(left), Some(right)) => Some(expr_json_bin_num("div", left, right))
        _ => None
      }
    "operator_mod" =>
      match
        (
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM1",
            depth + 1,
            allow_variable,
          ),
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM2",
            depth + 1,
            allow_variable,
          ),
        ) {
        (Some(left), Some(right)) => Some(expr_json_bin_num("mod", left, right))
        _ => None
      }
    "operator_round" =>
      match
        compile_number_expr_from_input(
          target,
          target_index,
          block,
          "NUM",
          depth + 1,
          allow_variable,
        ) {
        Some(value) => Some(expr_json_unary_num("round", value))
        None => None
      }
    "operator_mathop" =>
      match
        (
          field_value(block, "OPERATOR"),
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "NUM",
            depth + 1,
            allow_variable,
          ),
        ) {
        (Some((raw_op, _)), Some(value)) =>
          match raw_op.trim().to_lower() {
            "abs" => Some(expr_json_unary_num("abs", value))
            "floor" => Some(expr_json_unary_num("floor", value))
            "ceiling" => Some(expr_json_unary_num("ceil", value))
            "sqrt" => Some(expr_json_unary_num("sqrt", value))
            "round" => Some(expr_json_unary_num("round", value))
            _ => None
          }
        _ => None
      }
    _ => None
  }
}

///|
fn compile_number_expr_from_input(
  target : TargetState,
  target_index : Int,
  block : ScratchBlock,
  input_name : String,
  depth : Int,
  allow_variable : Bool,
) -> Json? {
  if depth > 64 {
    return None
  }
  match resolve_reporter_block_id(block, input_name) {
    Some(block_id) =>
      compile_number_expr_from_block(
        target,
        target_index,
        block_id,
        depth + 1,
        allow_variable,
      )
    None =>
      match block.inputs.get(input_name) {
        Some(raw_input) =>
          match input_payload(raw_input) {
            Some(payload) =>
              compile_number_expr_from_payload(
                target_index, payload, allow_variable,
              )
            None => Some(expr_json_num(0.0))
          }
        None => Some(expr_json_num(0.0))
      }
  }
}

///|
fn compile_bool_expr_from_block(
  target : TargetState,
  target_index : Int,
  block_id : String,
  depth : Int,
  variable_numeric_by_id : Map[String, Bool],
) -> Json? {
  if depth > 64 {
    return None
  }
  let block = match target.blocks.get(block_id) {
    Some(value) => value
    None => return None
  }
  match block.opcode {
    "operator_lt" =>
      match
        (
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND1",
            depth + 1,
            true,
          ),
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND2",
            depth + 1,
            true,
          ),
        ) {
        (Some(left), Some(right)) =>
          if number_expr_uses_only_numeric_variables(
              left, variable_numeric_by_id, 0,
            ) &&
            number_expr_uses_only_numeric_variables(
              right, variable_numeric_by_id, 0,
            ) {
            Some(expr_json_cmp_num("lt", left, right))
          } else {
            None
          }
        _ => None
      }
    "operator_gt" =>
      match
        (
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND1",
            depth + 1,
            true,
          ),
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND2",
            depth + 1,
            true,
          ),
        ) {
        (Some(left), Some(right)) =>
          if number_expr_uses_only_numeric_variables(
              left, variable_numeric_by_id, 0,
            ) &&
            number_expr_uses_only_numeric_variables(
              right, variable_numeric_by_id, 0,
            ) {
            Some(expr_json_cmp_num("gt", left, right))
          } else {
            None
          }
        _ => None
      }
    "operator_equals" =>
      match
        (
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND1",
            depth + 1,
            true,
          ),
          compile_number_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND2",
            depth + 1,
            true,
          ),
        ) {
        (Some(left), Some(right)) =>
          if number_expr_uses_only_numeric_variables(
              left, variable_numeric_by_id, 0,
            ) &&
            number_expr_uses_only_numeric_variables(
              right, variable_numeric_by_id, 0,
            ) {
            Some(expr_json_cmp_num("eq", left, right))
          } else {
            None
          }
        _ => None
      }
    "operator_and" =>
      match
        (
          compile_bool_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND1",
            depth + 1,
            variable_numeric_by_id,
          ),
          compile_bool_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND2",
            depth + 1,
            variable_numeric_by_id,
          ),
        ) {
        (Some(left), Some(right)) =>
          Some(expr_json_bin_bool("and", left, right))
        _ => None
      }
    "operator_or" =>
      match
        (
          compile_bool_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND1",
            depth + 1,
            variable_numeric_by_id,
          ),
          compile_bool_expr_from_input(
            target,
            target_index,
            block,
            "OPERAND2",
            depth + 1,
            variable_numeric_by_id,
          ),
        ) {
        (Some(left), Some(right)) => Some(expr_json_bin_bool("or", left, right))
        _ => None
      }
    "operator_not" =>
      match
        compile_bool_expr_from_input(
          target,
          target_index,
          block,
          "OPERAND",
          depth + 1,
          variable_numeric_by_id,
        ) {
        Some(value) => Some(expr_json_not(value))
        None => None
      }
    _ =>
      match
        compile_number_expr_from_block(
          target,
          target_index,
          block_id,
          depth + 1,
          true,
        ) {
        Some(num_expr) => Some(expr_json_bool_from_number(num_expr))
        None => None
      }
  }
}

///|
fn compile_bool_expr_from_input(
  target : TargetState,
  target_index : Int,
  block : ScratchBlock,
  input_name : String,
  depth : Int,
  variable_numeric_by_id : Map[String, Bool],
) -> Json? {
  if depth > 64 {
    return None
  }
  match resolve_reporter_block_id(block, input_name) {
    Some(block_id) =>
      compile_bool_expr_from_block(
        target,
        target_index,
        block_id,
        depth + 1,
        variable_numeric_by_id,
      )
    None =>
      match block.inputs.get(input_name) {
        Some(raw_input) =>
          match input_payload(raw_input) {
            Some(payload) =>
              compile_bool_expr_from_payload(target_index, payload)
            None => Some(expr_json_bool(false))
          }
        None => Some(expr_json_bool(false))
      }
  }
}

///|
fn compile_sequence_from_pc(
  target : TargetState,
  target_index : Int,
  start_pc : Int?,
  depth : Int,
  variable_numeric_by_id : Map[String, Bool],
) -> Array[Json]? {
  if depth > 96 {
    return None
  }
  let out = []
  let mut cursor = start_pc
  let mut steps = 0
  while true {
    match cursor {
      Some(pc) => {
        if pc < 0 || pc >= target.blocks_by_pc.length() {
          return None
        }
        if steps > target.blocks_by_pc.length() * 4 {
          return None
        }
        steps += 1
        let block = target.blocks_by_pc[pc]
        let fast_meta = target.block_fast_meta_by_pc[pc]
        let host_fallback_stmt = opcode_fallback_stmt(
          block.opcode,
          target_index,
          pc,
        )
        let host_tail_stmt = AotCompileStmtResult::EmitAndStop(
          command_json_host_tail(target_index, pc),
        )
        let stmt = match block.opcode {
          "event_whenflagclicked" => AotCompileStmtResult::Noop
          "data_setvariableto" =>
            match variable_id_from_field(block) {
              Some(variable_id) =>
                match literal_value_from_input(block, "VALUE") {
                  Some(value) =>
                    match json_finite_number_or_none(value) {
                      Some(number_value) =>
                        AotCompileStmtResult::Emit(
                          command_json_set_var_num_expr(
                            target_index,
                            variable_id,
                            expr_json_num(number_value),
                          ),
                        )
                      None =>
                        AotCompileStmtResult::Emit(
                          command_json_set_var_json_const(
                            target_index, variable_id, value,
                          ),
                        )
                    }
                  None =>
                    match
                      compile_number_expr_from_input(
                        target,
                        target_index,
                        block,
                        "VALUE",
                        depth + 1,
                        true,
                      ) {
                      Some(expr) =>
                        AotCompileStmtResult::Emit(
                          command_json_set_var_num_expr(
                            target_index, variable_id, expr,
                          ),
                        )
                      None => host_fallback_stmt
                    }
                }
              None => host_fallback_stmt
            }
          "data_changevariableby" =>
            match variable_id_from_field(block) {
              Some(variable_id) =>
                match
                  compile_number_expr_from_input(
                    target,
                    target_index,
                    block,
                    "VALUE",
                    depth + 1,
                    true,
                  ) {
                  Some(expr) =>
                    AotCompileStmtResult::Emit(
                      command_json_change_var_num_expr(
                        target_index, variable_id, expr,
                      ),
                    )
                  None => host_fallback_stmt
                }
              None => host_fallback_stmt
            }
          "motion_movesteps" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "STEPS",
                depth + 1,
                true,
              ) {
              Some(steps_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "motion_movesteps",
                    steps_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "motion_turnright" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "DEGREES",
                depth + 1,
                true,
              ) {
              Some(degrees_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "motion_turnright",
                    degrees_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "motion_turnleft" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "DEGREES",
                depth + 1,
                true,
              ) {
              Some(degrees_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "motion_turnleft",
                    degrees_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "motion_pointindirection" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "DIRECTION",
                depth + 1,
                true,
              ) {
              Some(direction_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "motion_pointindirection",
                    direction_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "motion_changexby" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "DX",
                depth + 1,
                true,
              ) {
              Some(dx_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "motion_changexby",
                    dx_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "motion_changeyby" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "DY",
                depth + 1,
                true,
              ) {
              Some(dy_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "motion_changeyby",
                    dy_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "motion_setx" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "X",
                depth + 1,
                true,
              ) {
              Some(x_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "motion_setx",
                    x_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "motion_sety" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "Y",
                depth + 1,
                true,
              ) {
              Some(y_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "motion_sety",
                    y_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "motion_gotoxy" =>
            match
              (
                compile_number_expr_from_input(
                  target,
                  target_index,
                  block,
                  "X",
                  depth + 1,
                  true,
                ),
                compile_number_expr_from_input(
                  target,
                  target_index,
                  block,
                  "Y",
                  depth + 1,
                  true,
                ),
              ) {
              (Some(x_expr), Some(y_expr)) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index, "motion_gotoxy", x_expr, y_expr, 0,
                  ),
                )
              _ => host_fallback_stmt
            }
          "motion_ifonedgebounce" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "motion_ifonedgebounce",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "looks_show" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "looks_show",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "looks_hide" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "looks_hide",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "looks_hideallsprites" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "looks_hideallsprites",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "looks_nextcostume" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "looks_nextcostume",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "looks_changesizeby" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "CHANGE",
                depth + 1,
                true,
              ) {
              Some(delta_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "looks_changesizeby",
                    delta_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "looks_setsizeto" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "SIZE",
                depth + 1,
                true,
              ) {
              Some(size_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "looks_setsizeto",
                    size_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "looks_changeeffectby" =>
            match
              (
                literal_string_from_input_or_field(block, "EFFECT", "EFFECT"),
                compile_number_expr_from_input(
                  target,
                  target_index,
                  block,
                  "CHANGE",
                  depth + 1,
                  true,
                ),
              ) {
              (Some(effect_name), Some(amount_expr)) =>
                match normalize_looks_effect_name_for_draw(effect_name) {
                  Some(effect_id) =>
                    AotCompileStmtResult::Emit(
                      command_json_draw_opcode(
                        target_index,
                        "looks_changeeffectby",
                        amount_expr,
                        expr_json_num(0.0),
                        effect_id,
                      ),
                    )
                  None => host_fallback_stmt
                }
              _ => host_fallback_stmt
            }
          "looks_seteffectto" =>
            match
              (
                literal_string_from_input_or_field(block, "EFFECT", "EFFECT"),
                compile_number_expr_from_input(
                  target,
                  target_index,
                  block,
                  "VALUE",
                  depth + 1,
                  true,
                ),
              ) {
              (Some(effect_name), Some(amount_expr)) =>
                match normalize_looks_effect_name_for_draw(effect_name) {
                  Some(effect_id) =>
                    AotCompileStmtResult::Emit(
                      command_json_draw_opcode(
                        target_index,
                        "looks_seteffectto",
                        amount_expr,
                        expr_json_num(0.0),
                        effect_id,
                      ),
                    )
                  None => host_fallback_stmt
                }
              _ => host_fallback_stmt
            }
          "looks_cleargraphiceffects" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "looks_cleargraphiceffects",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "pen_clear" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "pen_clear",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "pen_stamp" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "pen_stamp",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "pen_penDown" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "pen_penDown",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "pen_penUp" =>
            AotCompileStmtResult::Emit(
              command_json_draw_opcode(
                target_index,
                "pen_penUp",
                expr_json_num(0.0),
                expr_json_num(0.0),
                0,
              ),
            )
          "pen_changePenColorParamBy" =>
            match
              (
                literal_string_from_input_or_field(
                  block, "COLOR_PARAM", "COLOR_PARAM",
                ),
                compile_number_expr_from_input(
                  target,
                  target_index,
                  block,
                  "VALUE",
                  depth + 1,
                  true,
                ),
              ) {
              (Some(param_name), Some(value_expr)) =>
                match normalize_pen_color_param_for_draw(param_name) {
                  Some(param_id) =>
                    AotCompileStmtResult::Emit(
                      command_json_draw_opcode(
                        target_index,
                        "pen_changePenColorParamBy",
                        value_expr,
                        expr_json_num(0.0),
                        param_id,
                      ),
                    )
                  None => host_fallback_stmt
                }
              _ => host_fallback_stmt
            }
          "pen_setPenColorParamTo" =>
            match
              (
                literal_string_from_input_or_field(
                  block, "COLOR_PARAM", "COLOR_PARAM",
                ),
                compile_number_expr_from_input(
                  target,
                  target_index,
                  block,
                  "VALUE",
                  depth + 1,
                  true,
                ),
              ) {
              (Some(param_name), Some(value_expr)) =>
                match normalize_pen_color_param_for_draw(param_name) {
                  Some(param_id) =>
                    AotCompileStmtResult::Emit(
                      command_json_draw_opcode(
                        target_index,
                        "pen_setPenColorParamTo",
                        value_expr,
                        expr_json_num(0.0),
                        param_id,
                      ),
                    )
                  None => host_fallback_stmt
                }
              _ => host_fallback_stmt
            }
          "pen_changePenSizeBy" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "SIZE",
                depth + 1,
                true,
              ) {
              Some(delta_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "pen_changePenSizeBy",
                    delta_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "pen_setPenSizeTo" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "SIZE",
                depth + 1,
                true,
              ) {
              Some(size_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "pen_setPenSizeTo",
                    size_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "pen_setPenHueToNumber" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "HUE",
                depth + 1,
                true,
              ) {
              Some(hue_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "pen_setPenHueToNumber",
                    hue_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "pen_changePenHueBy" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "HUE",
                depth + 1,
                true,
              ) {
              Some(hue_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "pen_changePenHueBy",
                    hue_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "pen_setPenShadeToNumber" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "SHADE",
                depth + 1,
                true,
              ) {
              Some(shade_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "pen_setPenShadeToNumber",
                    shade_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "pen_changePenShadeBy" =>
            match
              compile_number_expr_from_input(
                target,
                target_index,
                block,
                "SHADE",
                depth + 1,
                true,
              ) {
              Some(shade_expr) =>
                AotCompileStmtResult::Emit(
                  command_json_draw_opcode(
                    target_index,
                    "pen_changePenShadeBy",
                    shade_expr,
                    expr_json_num(0.0),
                    0,
                  ),
                )
              None => host_fallback_stmt
            }
          "control_if" =>
            match
              (
                compile_bool_expr_from_input(
                  target,
                  target_index,
                  block,
                  "CONDITION",
                  depth + 1,
                  variable_numeric_by_id,
                ),
                compile_sequence_from_pc(
                  target,
                  target_index,
                  fast_meta.substack_pc,
                  depth + 1,
                  variable_numeric_by_id,
                ),
              ) {
              (Some(cond), Some(body)) =>
                if command_list_contains_host_tail(body) {
                  host_tail_stmt
                } else {
                  AotCompileStmtResult::Emit(command_json_if(cond, body))
                }
              _ => host_fallback_stmt
            }
          "control_if_else" =>
            match
              (
                compile_bool_expr_from_input(
                  target,
                  target_index,
                  block,
                  "CONDITION",
                  depth + 1,
                  variable_numeric_by_id,
                ),
                compile_sequence_from_pc(
                  target,
                  target_index,
                  fast_meta.substack_pc,
                  depth + 1,
                  variable_numeric_by_id,
                ),
                compile_sequence_from_pc(
                  target,
                  target_index,
                  fast_meta.substack2_pc,
                  depth + 1,
                  variable_numeric_by_id,
                ),
              ) {
              (Some(cond), Some(then_body), Some(else_body)) =>
                if command_list_contains_host_tail(then_body) ||
                  command_list_contains_host_tail(else_body) {
                  host_tail_stmt
                } else {
                  AotCompileStmtResult::Emit(
                    command_json_if_else(cond, then_body, else_body),
                  )
                }
              _ => host_fallback_stmt
            }
          "control_repeat" =>
            match
              (
                compile_number_expr_from_input(
                  target,
                  target_index,
                  block,
                  "TIMES",
                  depth + 1,
                  true,
                ),
                compile_sequence_from_pc(
                  target,
                  target_index,
                  fast_meta.substack_pc,
                  depth + 1,
                  variable_numeric_by_id,
                ),
              ) {
              (Some(times), Some(body)) =>
                if command_list_contains_host_tail(body) {
                  host_tail_stmt
                } else {
                  AotCompileStmtResult::Emit(command_json_repeat(times, body))
                }
              _ => host_fallback_stmt
            }
          "control_repeat_until" =>
            match
              (
                compile_bool_expr_from_input(
                  target,
                  target_index,
                  block,
                  "CONDITION",
                  depth + 1,
                  variable_numeric_by_id,
                ),
                compile_sequence_from_pc(
                  target,
                  target_index,
                  fast_meta.substack_pc,
                  depth + 1,
                  variable_numeric_by_id,
                ),
              ) {
              (Some(cond), Some(body)) =>
                if command_list_contains_host_tail(body) {
                  host_tail_stmt
                } else {
                  AotCompileStmtResult::Emit(
                    command_json_repeat_until(cond, body),
                  )
                }
              _ => host_fallback_stmt
            }
          "control_while" =>
            match
              (
                compile_bool_expr_from_input(
                  target,
                  target_index,
                  block,
                  "CONDITION",
                  depth + 1,
                  variable_numeric_by_id,
                ),
                compile_sequence_from_pc(
                  target,
                  target_index,
                  fast_meta.substack_pc,
                  depth + 1,
                  variable_numeric_by_id,
                ),
              ) {
              (Some(cond), Some(body)) =>
                if command_list_contains_host_tail(body) {
                  host_tail_stmt
                } else {
                  AotCompileStmtResult::Emit(command_json_while(cond, body))
                }
              _ => host_fallback_stmt
            }
          _ => host_fallback_stmt
        }
        match stmt {
          AotCompileStmtResult::Noop => ()
          AotCompileStmtResult::Emit(command) => out.push(command)
          AotCompileStmtResult::EmitAndStop(command) => {
            out.push(command)
            return Some(out)
          }
        }
        cursor = fast_meta.next_pc
      }
      None => break
    }
  }
  Some(out)
}

///|
fn append_compiled_green_flag_commands(
  target : TargetState,
  target_index : Int,
  variable_numeric_by_id : Map[String, Bool],
  out : Array[Json],
) -> Bool {
  for start_id in target.green_flag_starts {
    let start_pc = match target.block_pc_by_id.get(start_id) {
      Some(pc) => Some(pc)
      None => return false
    }
    let commands = match
      compile_sequence_from_pc(
        target, target_index, start_pc, 0, variable_numeric_by_id,
      ) {
      Some(value) => value
      None => return false
    }
    for command in commands {
      out.push(command)
    }
  }
  true
}

///|
fn compile_aot_full_green_flag_starts_json(
  targets : Array[TargetState],
) -> (Array[Json], Bool) {
  let starts = []
  let mut has_any_start = false
  for target_index, target in targets {
    let pcs = []
    for start_id in target.green_flag_starts {
      match target.block_pc_by_id.get(start_id) {
        Some(pc) => pcs.push(pc)
        None => ()
      }
    }
    if !pcs.is_empty() {
      starts.push(command_json_full_green_flag_start_entry(target_index, pcs))
      has_any_start = true
    }
  }
  (starts, has_any_start)
}

///|
fn compile_aot_commands_json(targets : Array[TargetState]) -> String? {
  let commands = []
  let variable_numeric_by_id = build_aot_variable_numeric_map(targets)
  for target_index, target in targets {
    if !target_is_aot_eligible(target) {
      commands.clear()
      break
    }
    if !append_compiled_green_flag_commands(
        target, target_index, variable_numeric_by_id, commands,
      ) {
      commands.clear()
      break
    }
  }
  let opcode_catalog = []
  for target_index, target in targets {
    for pc, block in target.blocks_by_pc {
      opcode_catalog.push(
        command_json_opcode_catalog(
          target_index,
          pc,
          block,
          target.block_fast_meta_by_pc[pc],
        ),
      )
    }
  }
  let (full_green_flag_starts, has_any_start) = compile_aot_full_green_flag_starts_json(
    targets,
  )
  let exec_mode = if !commands.is_empty() {
    "linear"
  } else if has_any_start {
    "full"
  } else {
    "linear"
  }
  Some(
    json_object({
      "exec": json_array(commands),
      "exec_mode": json_string(exec_mode),
      "full_green_flag_starts": json_array(full_green_flag_starts),
      "catalog": json_array(opcode_catalog),
    }).stringify(),
  )
}

///|
fn program_wat_from_payload(
  project_base64 : String,
  assets_base64 : String,
  commands_base64 : String,
) -> String {
  let project_len = project_base64.length()
  let assets_offset = project_len
  let assets_len = assets_base64.length()
  let commands_offset = assets_offset + assets_len
  let commands_len = commands_base64.length()
  let memory_pages = page_count_for_bytes(
    project_len + assets_len + commands_len,
  )
  (
    $|;; moonscratch_program_v1
    $|;; abi_version=\{PROGRAM_ABI_VERSION}
    $|;; project_base64=\{project_base64}
    $|;; assets_base64=\{assets_base64}
    $|;; commands_base64=\{commands_base64}
    $|(module
    $|  (memory (export "memory") \{memory_pages})
    $|  (data (i32.const 0) "\{project_base64}")
    $|  (data (i32.const \{assets_offset}) "\{assets_base64}")
    $|  (data (i32.const \{commands_offset}) "\{commands_base64}")
    $|  (func (export "ms_abi_version") (result i32)
    $|    i32.const \{PROGRAM_ABI_VERSION}
    $|  )
    $|  (func (export "ms_project_ptr") (result i32)
    $|    i32.const 0
    $|  )
    $|  (func (export "ms_project_len") (result i32)
    $|    i32.const \{project_len}
    $|  )
    $|  (func (export "ms_assets_ptr") (result i32)
    $|    i32.const \{assets_offset}
    $|  )
    $|  (func (export "ms_assets_len") (result i32)
    $|    i32.const \{assets_len}
    $|  )
    $|  (func (export "ms_commands_ptr") (result i32)
    $|    i32.const \{commands_offset}
    $|  )
    $|  (func (export "ms_commands_len") (result i32)
    $|    i32.const \{commands_len}
    $|  )
    $|)
    $|
  )
}

///|
pub fn vm_abi_version() -> Int {
  PROGRAM_ABI_VERSION
}

///|
pub fn vm_compile_project_to_wat(
  project_json : String,
  assets_json? : String,
) -> String raise VmError {
  let bundle = parse_bundle(project_json, assets_json)
  let (targets, _) = parse_project_targets(bundle.project_json, bundle.assets)
  let project_base64 = base64_utf8(bundle.project_json)
  let assets_raw = json_object(bundle.assets).stringify()
  let assets_base64 = base64_utf8(assets_raw)
  let commands_base64 = match compile_aot_commands_json(targets) {
    Some(commands_json) => base64_utf8(commands_json)
    None => ""
  }
  program_wat_from_payload(project_base64, assets_base64, commands_base64)
}
