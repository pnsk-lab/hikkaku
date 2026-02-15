///|
const IMPORT_GET_VAR_NUM_INDEX : Int = 0

///|
const IMPORT_SET_VAR_NUM_INDEX : Int = 1

///|
const IMPORT_SET_VAR_JSON_INDEX : Int = 2

///|
const IMPORT_MOD_INDEX : Int = 3

///|
const IMPORT_EXEC_OPCODE_INDEX : Int = 4

///|
const IMPORT_EXEC_TAIL_INDEX : Int = 5

///|
const LOOP_COUNTER_LOCAL : Int = 0

///|
const LOOP_GUARD_LOCAL : Int = 1

///|
const LOOP_GUARD_MAX : Int = 10000

///|
priv struct RunnerLiteralRef {
  ptr : Int
  len : Int
}

///|
priv struct WasmDataSegment {
  offset : Int
  bytes : Array[Byte]
}

///|
priv enum RunnerNumExpr {
  Num(Double)
  VarNum(Int, String)
  BinNum(String, RunnerNumExpr, RunnerNumExpr)
  UnaryNum(String, RunnerNumExpr)
}

///|
priv enum RunnerBoolExpr {
  Bool(Bool)
  CmpNum(String, RunnerNumExpr, RunnerNumExpr)
  BinBool(String, RunnerBoolExpr, RunnerBoolExpr)
  Not(RunnerBoolExpr)
}

///|
priv enum RunnerCommand {
  SetNumExpr(Int, String, RunnerNumExpr)
  SetJsonConst(Int, String, String)
  ChangeNumExpr(Int, String, RunnerNumExpr)
  If(RunnerBoolExpr, Array[RunnerCommand])
  IfElse(RunnerBoolExpr, Array[RunnerCommand], Array[RunnerCommand])
  Repeat(RunnerNumExpr, Array[RunnerCommand])
  RepeatUntil(RunnerBoolExpr, Array[RunnerCommand])
  While(RunnerBoolExpr, Array[RunnerCommand])
  HostOpcode(Int, Int)
  HostTail(Int, Int)
}

///|
fn bytes_from_ints(values : Array[Int]) -> Array[Byte] {
  let out = []
  for value in values {
    out.push(value.to_byte())
  }
  out
}

///|
fn append_bytes(target : Array[Byte], source : Array[Byte]) -> Unit {
  for value in source {
    target.push(value)
  }
}

///|
fn encode_utf8_bytes(value : String) -> Array[Byte] {
  @utf8.encode(value.view()).to_array()
}

///|
fn encode_u32_leb_step(value : Int, out : Array[Byte]) -> Unit {
  let mut byte = value & 0x7f
  let next = value >> 7
  if next != 0 {
    byte = byte | 0x80
  }
  out.push(byte.to_byte())
  if next != 0 {
    encode_u32_leb_step(next, out)
  }
}

///|
fn encode_u32_leb(input : Int) -> Array[Byte] {
  if input < 0 {
    return []
  }
  let out = []
  encode_u32_leb_step(input, out)
  out
}

///|
fn encode_i32_leb_step(value : Int, out : Array[Byte]) -> Unit {
  let mut byte = value & 0x7f
  let next = value >> 7
  let sign_bit = (byte & 0x40) != 0
  let done = (next == 0 && !sign_bit) || (next == -1 && sign_bit)
  if !done {
    byte = byte | 0x80
  }
  out.push(byte.to_byte())
  if !done {
    encode_i32_leb_step(next, out)
  }
}

///|
fn encode_i32_leb(input : Int) -> Array[Byte] {
  let out = []
  encode_i32_leb_step(input, out)
  out
}

///|
fn encode_name(value : String) -> Array[Byte] {
  let bytes = encode_utf8_bytes(value)
  let out = []
  append_bytes(out, encode_u32_leb(bytes.length()))
  append_bytes(out, bytes)
  out
}

///|
fn encode_section(id : Int, payload : Array[Byte]) -> Array[Byte] {
  let out = [id.to_byte()]
  append_bytes(out, encode_u32_leb(payload.length()))
  append_bytes(out, payload)
  out
}

///|
fn push_i32_const(out : Array[Byte], input : Int) -> Unit {
  out.push((0x41).to_byte())
  append_bytes(out, encode_i32_leb(input))
}

///|
fn push_f64_const(out : Array[Byte], input : Double) -> Unit {
  out.push((0x44).to_byte())
  append_bytes(out, input.reinterpret_as_uint64().to_le_bytes().to_array())
}

///|
fn push_call(out : Array[Byte], function_index : Int) -> Unit {
  out.push((0x10).to_byte())
  append_bytes(out, encode_u32_leb(function_index))
}

///|
fn push_local_get(out : Array[Byte], local_index : Int) -> Unit {
  out.push((0x20).to_byte())
  append_bytes(out, encode_u32_leb(local_index))
}

///|
fn push_local_set(out : Array[Byte], local_index : Int) -> Unit {
  out.push((0x21).to_byte())
  append_bytes(out, encode_u32_leb(local_index))
}

///|
fn push_br(out : Array[Byte], depth : Int) -> Unit {
  out.push((0x0c).to_byte())
  append_bytes(out, encode_u32_leb(depth))
}

///|
fn push_br_if(out : Array[Byte], depth : Int) -> Unit {
  out.push((0x0d).to_byte())
  append_bytes(out, encode_u32_leb(depth))
}

///|
fn json_to_non_negative_int(raw : Json?) -> Int? {
  match raw {
    Some(Number(n, ..)) =>
      if n.is_nan() || n.is_inf() {
        None
      } else {
        let out = n.to_int()
        if out < 0 {
          None
        } else {
          Some(out)
        }
      }
    _ => None
  }
}

///|
fn parse_runner_num_expr(raw : Json, depth : Int) -> RunnerNumExpr? {
  if depth > 64 {
    return None
  }
  let obj = match raw {
    Object(value) => value
    _ => return None
  }
  let kind = object_get_string_or(obj, "kind", "")
  if kind == "num" {
    match obj.get("value") {
      Some(Number(value, ..)) =>
        if value.is_nan() || value.is_inf() {
          None
        } else {
          Some(RunnerNumExpr::Num(value))
        }
      _ => None
    }
  } else if kind == "var_num" {
    let target = json_to_non_negative_int(obj.get("target"))
    let variable_id = object_get_string_or(obj, "id", "")
    match target {
      Some(value) if variable_id != "" =>
        Some(RunnerNumExpr::VarNum(value, variable_id))
      _ => None
    }
  } else if kind == "bin_num" {
    let op = object_get_string_or(obj, "op", "")
    if op != "add" && op != "sub" && op != "mul" && op != "div" && op != "mod" {
      return None
    }
    match
      (
        parse_runner_num_expr(
          object_get_or(obj, "left", Json::null()),
          depth + 1,
        ),
        parse_runner_num_expr(
          object_get_or(obj, "right", Json::null()),
          depth + 1,
        ),
      ) {
      (Some(left), Some(right)) => Some(RunnerNumExpr::BinNum(op, left, right))
      _ => None
    }
  } else if kind == "unary_num" {
    let op = object_get_string_or(obj, "op", "")
    if op != "round" &&
      op != "abs" &&
      op != "floor" &&
      op != "ceil" &&
      op != "sqrt" {
      return None
    }
    match
      parse_runner_num_expr(
        object_get_or(obj, "value", Json::null()),
        depth + 1,
      ) {
      Some(value) => Some(RunnerNumExpr::UnaryNum(op, value))
      None => None
    }
  } else {
    None
  }
}

///|
fn parse_runner_bool_expr(raw : Json, depth : Int) -> RunnerBoolExpr? {
  if depth > 64 {
    return None
  }
  let obj = match raw {
    Object(value) => value
    _ => return None
  }
  let kind = object_get_string_or(obj, "kind", "")
  if kind == "bool" {
    match obj.get("value") {
      Some(True) => Some(RunnerBoolExpr::Bool(true))
      Some(False) => Some(RunnerBoolExpr::Bool(false))
      _ => None
    }
  } else if kind == "cmp_num" {
    let op = object_get_string_or(obj, "op", "")
    if op != "lt" && op != "gt" && op != "eq" && op != "ne" {
      return None
    }
    match
      (
        parse_runner_num_expr(
          object_get_or(obj, "left", Json::null()),
          depth + 1,
        ),
        parse_runner_num_expr(
          object_get_or(obj, "right", Json::null()),
          depth + 1,
        ),
      ) {
      (Some(left), Some(right)) => Some(RunnerBoolExpr::CmpNum(op, left, right))
      _ => None
    }
  } else if kind == "bin_bool" {
    let op = object_get_string_or(obj, "op", "")
    if op != "and" && op != "or" {
      return None
    }
    match
      (
        parse_runner_bool_expr(
          object_get_or(obj, "left", Json::null()),
          depth + 1,
        ),
        parse_runner_bool_expr(
          object_get_or(obj, "right", Json::null()),
          depth + 1,
        ),
      ) {
      (Some(left), Some(right)) =>
        Some(RunnerBoolExpr::BinBool(op, left, right))
      _ => None
    }
  } else if kind == "not" {
    match
      parse_runner_bool_expr(
        object_get_or(obj, "value", Json::null()),
        depth + 1,
      ) {
      Some(value) => Some(RunnerBoolExpr::Not(value))
      None => None
    }
  } else {
    None
  }
}

///|
fn parse_runner_command_array(
  raw : Array[Json],
  depth : Int,
) -> Array[RunnerCommand]? {
  let out = []
  for item in raw {
    match parse_runner_command(item, depth + 1) {
      Some(parsed) => out.push(parsed)
      None => return None
    }
  }
  Some(out)
}

///|
fn parse_runner_command(raw : Json, depth : Int) -> RunnerCommand? {
  if depth > 64 {
    return None
  }
  let obj = match raw {
    Object(value) => value
    _ => return None
  }
  let op = object_get_string_or(obj, "op", "")
  let target = json_to_non_negative_int(obj.get("target"))
  let variable_id = object_get_string_or(obj, "id", "")

  if op == "set_var" || op == "set_var_num_expr" || op == "set_var_json_const" {
    match target {
      Some(target_value) if variable_id != "" =>
        if op == "set_var_num_expr" {
          match
            parse_runner_num_expr(
              object_get_or(obj, "expr", Json::null()),
              depth + 1,
            ) {
            Some(expr) =>
              Some(RunnerCommand::SetNumExpr(target_value, variable_id, expr))
            None => None
          }
        } else if op == "set_var_json_const" {
          let value_json = object_get_or(obj, "value", Json::null()).stringify()
          Some(
            RunnerCommand::SetJsonConst(target_value, variable_id, value_json),
          )
        } else {
          match obj.get("value") {
            Some(Number(value, ..)) if !value.is_nan() && !value.is_inf() =>
              Some(
                RunnerCommand::SetNumExpr(
                  target_value,
                  variable_id,
                  RunnerNumExpr::Num(value),
                ),
              )
            _ =>
              Some(
                RunnerCommand::SetJsonConst(
                  target_value,
                  variable_id,
                  object_get_or(obj, "value", Json::null()).stringify(),
                ),
              )
          }
        }
      _ => None
    }
  } else if op == "change_var" || op == "change_var_num_expr" {
    match target {
      Some(target_value) if variable_id != "" =>
        if op == "change_var_num_expr" {
          match
            parse_runner_num_expr(
              object_get_or(obj, "expr", Json::null()),
              depth + 1,
            ) {
            Some(expr) =>
              Some(
                RunnerCommand::ChangeNumExpr(target_value, variable_id, expr),
              )
            None => None
          }
        } else {
          let delta = match obj.get("delta") {
            Some(Number(value, ..)) if !value.is_nan() && !value.is_inf() =>
              value
            _ => 0.0
          }
          Some(
            RunnerCommand::ChangeNumExpr(
              target_value,
              variable_id,
              RunnerNumExpr::Num(delta),
            ),
          )
        }
      _ => None
    }
  } else if op == "if" {
    match
      (
        parse_runner_bool_expr(
          object_get_or(obj, "cond", Json::null()),
          depth + 1,
        ),
        match obj.get("then") {
          Some(Array(values)) => parse_runner_command_array(values, depth + 1)
          _ => None
        },
      ) {
      (Some(cond), Some(then_commands)) =>
        Some(RunnerCommand::If(cond, then_commands))
      _ => None
    }
  } else if op == "if_else" {
    match
      (
        parse_runner_bool_expr(
          object_get_or(obj, "cond", Json::null()),
          depth + 1,
        ),
        match obj.get("then") {
          Some(Array(values)) => parse_runner_command_array(values, depth + 1)
          _ => None
        },
        match obj.get("else") {
          Some(Array(values)) => parse_runner_command_array(values, depth + 1)
          _ => None
        },
      ) {
      (Some(cond), Some(then_commands), Some(else_commands)) =>
        Some(RunnerCommand::IfElse(cond, then_commands, else_commands))
      _ => None
    }
  } else if op == "repeat" {
    match
      (
        parse_runner_num_expr(
          object_get_or(obj, "times", Json::null()),
          depth + 1,
        ),
        match obj.get("body") {
          Some(Array(values)) => parse_runner_command_array(values, depth + 1)
          _ => None
        },
      ) {
      (Some(times), Some(body)) => Some(RunnerCommand::Repeat(times, body))
      _ => None
    }
  } else if op == "repeat_until" {
    match
      (
        parse_runner_bool_expr(
          object_get_or(obj, "cond", Json::null()),
          depth + 1,
        ),
        match obj.get("body") {
          Some(Array(values)) => parse_runner_command_array(values, depth + 1)
          _ => None
        },
      ) {
      (Some(cond), Some(body)) => Some(RunnerCommand::RepeatUntil(cond, body))
      _ => None
    }
  } else if op == "while" {
    match
      (
        parse_runner_bool_expr(
          object_get_or(obj, "cond", Json::null()),
          depth + 1,
        ),
        match obj.get("body") {
          Some(Array(values)) => parse_runner_command_array(values, depth + 1)
          _ => None
        },
      ) {
      (Some(cond), Some(body)) => Some(RunnerCommand::While(cond, body))
      _ => None
    }
  } else if op == "host_tail" {
    match (target, json_to_non_negative_int(obj.get("pc"))) {
      (Some(target_value), Some(start_pc)) =>
        Some(RunnerCommand::HostTail(target_value, start_pc))
      _ => None
    }
  } else if op == "host_opcode" {
    match (target, json_to_non_negative_int(obj.get("pc"))) {
      (Some(target_value), Some(pc)) =>
        Some(RunnerCommand::HostOpcode(target_value, pc))
      _ => None
    }
  } else {
    None
  }
}

///|
fn parse_runner_commands_json(commands_json : String) -> Array[RunnerCommand] {
  if commands_json.trim().is_empty() {
    return []
  }
  let parsed = try? @json.parse(commands_json)
  let commands_raw = match parsed {
    Ok(Array(values)) => values
    Ok(Object(obj)) =>
      match obj.get("exec") {
        Some(Array(values)) => values
        _ => []
      }
    _ => []
  }
  match parse_runner_command_array(commands_raw, 0) {
    Some(commands) => commands
    None => []
  }
}

///|
fn runner_register_literal(
  refs : Map[String, RunnerLiteralRef],
  bytes : Array[Byte],
  base_ptr : Int,
  key : String,
  literal : String,
) -> Unit {
  match refs.get(key) {
    Some(_) => return
    None => ()
  }
  let encoded = encode_utf8_bytes(literal)
  refs[key] = { ptr: base_ptr + bytes.length(), len: encoded.length() }
  append_bytes(bytes, encoded)
}

///|
fn collect_num_expr_literals(
  expr : RunnerNumExpr,
  refs : Map[String, RunnerLiteralRef],
  bytes : Array[Byte],
  base_ptr : Int,
) -> Unit {
  match expr {
    Num(_) => ()
    VarNum(_, variable_id) =>
      runner_register_literal(
        refs,
        bytes,
        base_ptr,
        "id:\{variable_id}",
        variable_id,
      )
    BinNum(_, left, right) => {
      collect_num_expr_literals(left, refs, bytes, base_ptr)
      collect_num_expr_literals(right, refs, bytes, base_ptr)
    }
    UnaryNum(_, value) =>
      collect_num_expr_literals(value, refs, bytes, base_ptr)
  }
}

///|
fn collect_bool_expr_literals(
  expr : RunnerBoolExpr,
  refs : Map[String, RunnerLiteralRef],
  bytes : Array[Byte],
  base_ptr : Int,
) -> Unit {
  match expr {
    Bool(_) => ()
    CmpNum(_, left, right) => {
      collect_num_expr_literals(left, refs, bytes, base_ptr)
      collect_num_expr_literals(right, refs, bytes, base_ptr)
    }
    BinBool(_, left, right) => {
      collect_bool_expr_literals(left, refs, bytes, base_ptr)
      collect_bool_expr_literals(right, refs, bytes, base_ptr)
    }
    Not(value) => collect_bool_expr_literals(value, refs, bytes, base_ptr)
  }
}

///|
fn collect_command_literals(
  command : RunnerCommand,
  refs : Map[String, RunnerLiteralRef],
  bytes : Array[Byte],
  base_ptr : Int,
) -> Unit {
  match command {
    SetNumExpr(_, variable_id, expr) => {
      runner_register_literal(
        refs,
        bytes,
        base_ptr,
        "id:\{variable_id}",
        variable_id,
      )
      collect_num_expr_literals(expr, refs, bytes, base_ptr)
    }
    SetJsonConst(_, variable_id, value_json) => {
      runner_register_literal(
        refs,
        bytes,
        base_ptr,
        "id:\{variable_id}",
        variable_id,
      )
      runner_register_literal(
        refs,
        bytes,
        base_ptr,
        "json:\{value_json}",
        value_json,
      )
    }
    ChangeNumExpr(_, variable_id, expr) => {
      runner_register_literal(
        refs,
        bytes,
        base_ptr,
        "id:\{variable_id}",
        variable_id,
      )
      collect_num_expr_literals(expr, refs, bytes, base_ptr)
    }
    If(cond, then_commands) => {
      collect_bool_expr_literals(cond, refs, bytes, base_ptr)
      for child in then_commands {
        collect_command_literals(child, refs, bytes, base_ptr)
      }
    }
    IfElse(cond, then_commands, else_commands) => {
      collect_bool_expr_literals(cond, refs, bytes, base_ptr)
      for child in then_commands {
        collect_command_literals(child, refs, bytes, base_ptr)
      }
      for child in else_commands {
        collect_command_literals(child, refs, bytes, base_ptr)
      }
    }
    Repeat(times, body) => {
      collect_num_expr_literals(times, refs, bytes, base_ptr)
      for child in body {
        collect_command_literals(child, refs, bytes, base_ptr)
      }
    }
    RepeatUntil(cond, body) => {
      collect_bool_expr_literals(cond, refs, bytes, base_ptr)
      for child in body {
        collect_command_literals(child, refs, bytes, base_ptr)
      }
    }
    While(cond, body) => {
      collect_bool_expr_literals(cond, refs, bytes, base_ptr)
      for child in body {
        collect_command_literals(child, refs, bytes, base_ptr)
      }
    }
    HostOpcode(_, _) | HostTail(_, _) => ()
  }
}

///|
fn build_runner_literal_pool(
  commands : Array[RunnerCommand],
  base_ptr : Int,
) -> (Array[Byte], Map[String, RunnerLiteralRef]) {
  let refs : Map[String, RunnerLiteralRef] = {}
  let bytes = []
  for command in commands {
    collect_command_literals(command, refs, bytes, base_ptr)
  }
  (bytes, refs)
}

///|
fn emit_runner_num_expr(
  expr : RunnerNumExpr,
  refs : Map[String, RunnerLiteralRef],
  out : Array[Byte],
) -> Bool {
  match expr {
    Num(value) => {
      push_f64_const(out, value)
      true
    }
    VarNum(target, variable_id) =>
      match refs.get("id:\{variable_id}") {
        Some(id_ref) => {
          push_i32_const(out, target)
          push_i32_const(out, id_ref.ptr)
          push_i32_const(out, id_ref.len)
          push_call(out, IMPORT_GET_VAR_NUM_INDEX)
          true
        }
        None => false
      }
    BinNum(op, left, right) => {
      if !emit_runner_num_expr(left, refs, out) ||
        !emit_runner_num_expr(right, refs, out) {
        return false
      }
      if op == "add" {
        out.push((0xa0).to_byte())
      } else if op == "sub" {
        out.push((0xa1).to_byte())
      } else if op == "mul" {
        out.push((0xa2).to_byte())
      } else if op == "div" {
        out.push((0xa3).to_byte())
      } else {
        push_call(out, IMPORT_MOD_INDEX)
      }
      true
    }
    UnaryNum(op, value) => {
      if !emit_runner_num_expr(value, refs, out) {
        return false
      }
      if op == "round" {
        out.push((0x9e).to_byte())
      } else if op == "abs" {
        out.push((0x99).to_byte())
      } else if op == "floor" {
        out.push((0x9c).to_byte())
      } else if op == "ceil" {
        out.push((0x9b).to_byte())
      } else {
        out.push((0x9f).to_byte())
      }
      true
    }
  }
}

///|
fn emit_runner_bool_expr(
  expr : RunnerBoolExpr,
  refs : Map[String, RunnerLiteralRef],
  out : Array[Byte],
) -> Bool {
  match expr {
    Bool(value) => {
      push_i32_const(out, if value { 1 } else { 0 })
      true
    }
    CmpNum(op, left, right) => {
      if !emit_runner_num_expr(left, refs, out) ||
        !emit_runner_num_expr(right, refs, out) {
        return false
      }
      if op == "lt" {
        out.push((0x63).to_byte())
      } else if op == "gt" {
        out.push((0x64).to_byte())
      } else if op == "eq" {
        out.push((0x61).to_byte())
      } else {
        out.push((0x61).to_byte())
        out.push((0x45).to_byte())
      }
      true
    }
    BinBool(op, left, right) => {
      if !emit_runner_bool_expr(left, refs, out) ||
        !emit_runner_bool_expr(right, refs, out) {
        return false
      }
      out.push(if op == "and" { (0x71).to_byte() } else { (0x72).to_byte() })
      true
    }
    Not(value) => {
      if !emit_runner_bool_expr(value, refs, out) {
        return false
      }
      out.push((0x45).to_byte())
      true
    }
  }
}

///|
fn emit_runner_commands(
  commands : Array[RunnerCommand],
  refs : Map[String, RunnerLiteralRef],
  out : Array[Byte],
) -> Bool {
  for command in commands {
    match command {
      SetNumExpr(target, variable_id, expr) =>
        match refs.get("id:\{variable_id}") {
          Some(id_ref) => {
            push_i32_const(out, target)
            push_i32_const(out, id_ref.ptr)
            push_i32_const(out, id_ref.len)
            if !emit_runner_num_expr(expr, refs, out) {
              return false
            }
            push_call(out, IMPORT_SET_VAR_NUM_INDEX)
          }
          None => return false
        }
      SetJsonConst(target, variable_id, value_json) =>
        match (refs.get("id:\{variable_id}"), refs.get("json:\{value_json}")) {
          (Some(id_ref), Some(json_ref)) => {
            push_i32_const(out, target)
            push_i32_const(out, id_ref.ptr)
            push_i32_const(out, id_ref.len)
            push_i32_const(out, json_ref.ptr)
            push_i32_const(out, json_ref.len)
            push_call(out, IMPORT_SET_VAR_JSON_INDEX)
          }
          _ => return false
        }
      ChangeNumExpr(target, variable_id, expr) =>
        match refs.get("id:\{variable_id}") {
          Some(id_ref) => {
            push_i32_const(out, target)
            push_i32_const(out, id_ref.ptr)
            push_i32_const(out, id_ref.len)
            push_i32_const(out, target)
            push_i32_const(out, id_ref.ptr)
            push_i32_const(out, id_ref.len)
            push_call(out, IMPORT_GET_VAR_NUM_INDEX)
            if !emit_runner_num_expr(expr, refs, out) {
              return false
            }
            out.push((0xa0).to_byte())
            push_call(out, IMPORT_SET_VAR_NUM_INDEX)
          }
          None => return false
        }
      If(cond, then_commands) => {
        if !emit_runner_bool_expr(cond, refs, out) {
          return false
        }
        out.push((0x04).to_byte())
        out.push((0x40).to_byte())
        if !emit_runner_commands(then_commands, refs, out) {
          return false
        }
        out.push((0x0b).to_byte())
      }
      IfElse(cond, then_commands, else_commands) => {
        if !emit_runner_bool_expr(cond, refs, out) {
          return false
        }
        out.push((0x04).to_byte())
        out.push((0x40).to_byte())
        if !emit_runner_commands(then_commands, refs, out) {
          return false
        }
        out.push((0x05).to_byte())
        if !emit_runner_commands(else_commands, refs, out) {
          return false
        }
        out.push((0x0b).to_byte())
      }
      Repeat(times, body) => {
        if !emit_runner_num_expr(times, refs, out) {
          return false
        }
        push_local_set(out, LOOP_COUNTER_LOCAL)
        push_i32_const(out, LOOP_GUARD_MAX)
        push_local_set(out, LOOP_GUARD_LOCAL)
        out.push((0x02).to_byte())
        out.push((0x40).to_byte())
        out.push((0x03).to_byte())
        out.push((0x40).to_byte())
        push_local_get(out, LOOP_GUARD_LOCAL)
        out.push((0x45).to_byte())
        push_br_if(out, 1)
        push_local_get(out, LOOP_COUNTER_LOCAL)
        push_f64_const(out, 0.0)
        out.push((0x65).to_byte())
        push_br_if(out, 1)
        if !emit_runner_commands(body, refs, out) {
          return false
        }
        push_local_get(out, LOOP_COUNTER_LOCAL)
        push_f64_const(out, 1.0)
        out.push((0xa1).to_byte())
        push_local_set(out, LOOP_COUNTER_LOCAL)
        push_local_get(out, LOOP_GUARD_LOCAL)
        push_i32_const(out, 1)
        out.push((0x6b).to_byte())
        push_local_set(out, LOOP_GUARD_LOCAL)
        push_br(out, 0)
        out.push((0x0b).to_byte())
        out.push((0x0b).to_byte())
      }
      RepeatUntil(cond, body) => {
        push_i32_const(out, LOOP_GUARD_MAX)
        push_local_set(out, LOOP_GUARD_LOCAL)
        out.push((0x02).to_byte())
        out.push((0x40).to_byte())
        out.push((0x03).to_byte())
        out.push((0x40).to_byte())
        push_local_get(out, LOOP_GUARD_LOCAL)
        out.push((0x45).to_byte())
        push_br_if(out, 1)
        if !emit_runner_bool_expr(cond, refs, out) {
          return false
        }
        push_br_if(out, 1)
        if !emit_runner_commands(body, refs, out) {
          return false
        }
        push_local_get(out, LOOP_GUARD_LOCAL)
        push_i32_const(out, 1)
        out.push((0x6b).to_byte())
        push_local_set(out, LOOP_GUARD_LOCAL)
        push_br(out, 0)
        out.push((0x0b).to_byte())
        out.push((0x0b).to_byte())
      }
      While(cond, body) => {
        push_i32_const(out, LOOP_GUARD_MAX)
        push_local_set(out, LOOP_GUARD_LOCAL)
        out.push((0x02).to_byte())
        out.push((0x40).to_byte())
        out.push((0x03).to_byte())
        out.push((0x40).to_byte())
        push_local_get(out, LOOP_GUARD_LOCAL)
        out.push((0x45).to_byte())
        push_br_if(out, 1)
        if !emit_runner_bool_expr(cond, refs, out) {
          return false
        }
        out.push((0x45).to_byte())
        push_br_if(out, 1)
        if !emit_runner_commands(body, refs, out) {
          return false
        }
        push_local_get(out, LOOP_GUARD_LOCAL)
        push_i32_const(out, 1)
        out.push((0x6b).to_byte())
        push_local_set(out, LOOP_GUARD_LOCAL)
        push_br(out, 0)
        out.push((0x0b).to_byte())
        out.push((0x0b).to_byte())
      }
      HostTail(target, start_pc) => {
        push_i32_const(out, target)
        push_i32_const(out, start_pc)
        push_call(out, IMPORT_EXEC_TAIL_INDEX)
        out.push((0x1a).to_byte())
      }
      HostOpcode(target, pc) => {
        push_i32_const(out, target)
        push_i32_const(out, pc)
        push_call(out, IMPORT_EXEC_OPCODE_INDEX)
        out.push((0x1a).to_byte())
      }
    }
  }
  true
}

///|
fn build_runner_exec_body(
  commands : Array[RunnerCommand],
  refs : Map[String, RunnerLiteralRef],
) -> Array[Byte] {
  let body = bytes_from_ints([0x02, 0x01, 0x7c, 0x01, 0x7f])
  if !emit_runner_commands(commands, refs, body) {
    push_i32_const(body, 0)
    body.push((0x0b).to_byte())
    return body
  }
  push_i32_const(body, commands.length())
  body.push((0x0b).to_byte())
  body
}

///|
fn append_const_i32_function_body(
  code_payload : Array[Byte],
  value : Int,
) -> Unit {
  let body = bytes_from_ints([0x00, 0x41])
  append_bytes(body, encode_i32_leb(value))
  body.push((0x0b).to_byte())
  append_bytes(code_payload, encode_u32_leb(body.length()))
  append_bytes(code_payload, body)
}

///|
fn build_program_wasm_binary(
  abi_version : Int,
  project_base64 : String,
  assets_base64 : String,
  commands_base64 : String,
  runner_commands : Array[RunnerCommand],
) -> Array[Byte] {
  let project_bytes = encode_utf8_bytes(project_base64)
  let assets_bytes = encode_utf8_bytes(assets_base64)
  let commands_bytes = encode_utf8_bytes(commands_base64)
  let project_len = project_bytes.length()
  let assets_ptr = project_len
  let assets_len = assets_bytes.length()
  let commands_ptr = assets_ptr + assets_len
  let commands_len = commands_bytes.length()
  let runner_literal_pool_ptr = commands_ptr + commands_len
  let (runner_literal_pool_bytes, runner_literal_pool_refs) = build_runner_literal_pool(
    runner_commands, runner_literal_pool_ptr,
  )
  let total_bytes = project_len +
    assets_len +
    commands_len +
    runner_literal_pool_bytes.length()
  let memory_pages = page_count_for_bytes(total_bytes)
  let has_exec_runner = if runner_commands.is_empty() { 0 } else { 1 }

  let module_bytes = bytes_from_ints([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  ])

  let type_payload = bytes_from_ints([
    0x06, 0x60, 0x00, 0x01, 0x7f, 0x60, 0x03, 0x7f, 0x7f, 0x7f, 0x01, 0x7c, 0x60,
    0x04, 0x7f, 0x7f, 0x7f, 0x7c, 0x00, 0x60, 0x05, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
    0x00, 0x60, 0x02, 0x7c, 0x7c, 0x01, 0x7c, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f,
  ])
  append_bytes(module_bytes, encode_section(1, type_payload))

  let import_payload = []
  append_bytes(import_payload, encode_u32_leb(6))
  let imports : Array[(String, String, Int)] = [
    ("env", "ms_get_var_num", 1),
    ("env", "ms_set_var_num", 2),
    ("env", "ms_set_var_json", 3),
    ("env", "ms_mod", 4),
    ("env", "ms_exec_opcode", 5),
    ("env", "ms_exec_tail", 5),
  ]
  for item in imports {
    append_bytes(import_payload, encode_name(item.0))
    append_bytes(import_payload, encode_name(item.1))
    import_payload.push((0x00).to_byte())
    append_bytes(import_payload, encode_u32_leb(item.2))
  }
  append_bytes(module_bytes, encode_section(2, import_payload))

  let function_payload = []
  append_bytes(function_payload, encode_u32_leb(9))
  append_bytes(function_payload, bytes_from_ints([0, 0, 0, 0, 0, 0, 0, 0, 0]))
  append_bytes(module_bytes, encode_section(3, function_payload))

  let memory_payload = [(0x01).to_byte(), (0x00).to_byte()]
  append_bytes(memory_payload, encode_u32_leb(memory_pages))
  append_bytes(module_bytes, encode_section(5, memory_payload))

  let exports_payload = []
  let defined_function_base = 6
  let exports : Array[(String, Int, Int)] = [
    ("memory", 0x02, 0),
    ("ms_abi_version", 0x00, defined_function_base + 0),
    ("ms_project_ptr", 0x00, defined_function_base + 1),
    ("ms_project_len", 0x00, defined_function_base + 2),
    ("ms_assets_ptr", 0x00, defined_function_base + 3),
    ("ms_assets_len", 0x00, defined_function_base + 4),
    ("ms_commands_ptr", 0x00, defined_function_base + 5),
    ("ms_commands_len", 0x00, defined_function_base + 6),
    ("ms_has_exec_runner", 0x00, defined_function_base + 7),
    ("ms_exec_green_flag", 0x00, defined_function_base + 8),
  ]
  append_bytes(exports_payload, encode_u32_leb(exports.length()))
  for item in exports {
    append_bytes(exports_payload, encode_name(item.0))
    exports_payload.push(item.1.to_byte())
    append_bytes(exports_payload, encode_u32_leb(item.2))
  }
  append_bytes(module_bytes, encode_section(7, exports_payload))

  let code_payload = []
  let function_consts = [
    abi_version, 0, project_len, assets_ptr, assets_len, commands_ptr, commands_len,
    has_exec_runner,
  ]
  append_bytes(code_payload, encode_u32_leb(function_consts.length() + 1))
  for value in function_consts {
    append_const_i32_function_body(code_payload, value)
  }
  let exec_body = build_runner_exec_body(
    runner_commands, runner_literal_pool_refs,
  )
  append_bytes(code_payload, encode_u32_leb(exec_body.length()))
  append_bytes(code_payload, exec_body)
  append_bytes(module_bytes, encode_section(10, code_payload))

  let segments : Array[WasmDataSegment] = [
    { offset: 0, bytes: project_bytes },
    { offset: assets_ptr, bytes: assets_bytes },
    { offset: commands_ptr, bytes: commands_bytes },
  ]
  if !runner_literal_pool_bytes.is_empty() {
    segments.push({
      offset: runner_literal_pool_ptr,
      bytes: runner_literal_pool_bytes,
    })
  }
  let data_payload = []
  append_bytes(data_payload, encode_u32_leb(segments.length()))
  for segment in segments {
    data_payload.push((0x00).to_byte())
    data_payload.push((0x41).to_byte())
    append_bytes(data_payload, encode_i32_leb(segment.offset))
    data_payload.push((0x0b).to_byte())
    append_bytes(data_payload, encode_u32_leb(segment.bytes.length()))
    append_bytes(data_payload, segment.bytes)
  }
  append_bytes(module_bytes, encode_section(11, data_payload))

  module_bytes
}

///|
pub fn vm_compile_project_to_wasm(
  project_json : String,
  assets_json? : String,
) -> String raise VmError {
  let bundle = parse_bundle(project_json, assets_json)
  let (targets, _) = parse_project_targets(bundle.project_json, bundle.assets)
  let project_base64 = base64_utf8(bundle.project_json)
  let assets_raw = json_object(bundle.assets).stringify()
  let assets_base64 = base64_utf8(assets_raw)
  let commands_json = match compile_aot_commands_json(targets) {
    Some(commands) => commands
    None => ""
  }
  let commands_base64 = base64_utf8(commands_json)
  let runner_commands = parse_runner_commands_json(commands_json)
  let wasm_bytes = build_program_wasm_binary(
    PROGRAM_ABI_VERSION,
    project_base64,
    assets_base64,
    commands_base64,
    runner_commands,
  )
  let wasm = Bytes::from_array(wasm_bytes[:])
  @base64.encode(wasm[:])
}
