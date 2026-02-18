///|
fn json_is_null(value : Json) -> Bool {
  match value {
    Null => true
    _ => false
  }
}

///|
fn block_input_payload(block : ScratchBlock, input_name : String) -> Json? {
  match block.inputs.get(input_name) {
    Some(Array(parts)) =>
      if parts.length() >= 3 && json_is_null(parts[1]) {
        Some(parts[2])
      } else if parts.length() >= 2 {
        Some(parts[1])
      } else {
        None
      }
    Some(value) => Some(value)
    None => None
  }
}

///|
fn block_input_block_id(block : ScratchBlock, input_name : String) -> String? {
  match block.input_block_ids.get(input_name) {
    Some(id) => return Some(id)
    None => ()
  }
  match block_input_payload(block, input_name) {
    Some(String(id)) => Some(id)
    _ => None
  }
}

///|
fn decode_primitive(
  vm : Vm,
  target_index : Int,
  primitive : Array[Json],
) -> Json {
  if primitive.length() < 2 {
    return Json::null()
  }
  let code = json_to_number_value(primitive[0]).to_int()
  match code {
    4 | 5 | 6 | 7 | 8 => json_number(json_to_number_value(primitive[1]))
    9 => primitive[1]
    10 => json_string(json_to_string_value(primitive[1]))
    11 => json_string(json_to_string_value(primitive[1]))
    12 => {
      let variable_name = json_to_string_value(primitive[1])
      let variable_id = if primitive.length() >= 3 {
        Some(json_to_string_value(primitive[2]))
      } else {
        None
      }
      read_variable(vm, target_index, variable_id, Some(variable_name))
    }
    13 => {
      let list_name = json_to_string_value(primitive[1])
      let list_id = if primitive.length() >= 3 {
        Some(json_to_string_value(primitive[2]))
      } else {
        None
      }
      let items = read_list(vm, target_index, list_id, Some(list_name))
      json_string(items.map(json_to_string_value).join(" "))
    }
    _ => primitive[1]
  }
}

///|
fn field_value(block : ScratchBlock, field_name : String) -> (String, String?)? {
  match block.fields.get(field_name) {
    Some(Array(parts)) =>
      if parts.length() >= 2 {
        Some(
          (json_to_string_value(parts[0]), Some(json_to_string_value(parts[1]))),
        )
      } else if parts.length() == 1 {
        Some((json_to_string_value(parts[0]), None))
      } else {
        None
      }
    Some(String(value)) => Some((value, None))
    Some(value) => Some((json_to_string_value(value), None))
    None => None
  }
}

///|
fn value_from_input(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
  input_name : String,
  depth : Int,
) -> Json {
  match block.input_block_ids.get(input_name) {
    Some(block_id) =>
      return eval_reporter_block_depth(vm, target_index, block_id, depth + 1)
    None => ()
  }
  match block_input_payload(block, input_name) {
    Some(String(block_id)) =>
      eval_reporter_block_depth(vm, target_index, block_id, depth + 1)
    Some(Array(primitive)) => decode_primitive(vm, target_index, primitive)
    Some(value) => value
    None => Json::null()
  }
}

///|
fn compile_numeric_operand_ops(
  vm : Vm,
  target_index : Int,
  target : TargetState,
  block : ScratchBlock,
  input_name : String,
  ops : Array[NumericReporterOp],
  visiting : Map[String, Bool],
  depth : Int,
) -> Bool {
  match block.const_number_inputs.get(input_name) {
    Some(value) => {
      ops.push(NumericReporterOp::PushConst(value))
      true
    }
    None =>
      match block.input_block_ids.get(input_name) {
        Some(child_id) =>
          compile_numeric_reporter_ops(
            vm,
            target_index,
            target,
            child_id,
            ops,
            visiting,
            depth + 1,
          )
        None => false
      }
  }
}

///|
fn compile_numeric_reporter_ops(
  vm : Vm,
  target_index : Int,
  target : TargetState,
  block_id : String,
  ops : Array[NumericReporterOp],
  visiting : Map[String, Bool],
  depth : Int,
) -> Bool {
  if depth > 64 || visiting.contains(block_id) {
    return false
  }
  visiting[block_id] = true
  let block = match target.blocks.get(block_id) {
    Some(value) => value
    None => {
      visiting.remove(block_id)
      return false
    }
  }

  let compiled = match block.opcode {
    "math_number"
    | "math_integer"
    | "math_whole_number"
    | "math_positive_number"
    | "math_angle" =>
      match field_value(block, "NUM") {
        Some((value, _)) => {
          ops.push(
            NumericReporterOp::PushConst(
              match parse_double_or_none(value) {
                Some(parsed) => parsed
                None => 0.0
              },
            ),
          )
          true
        }
        None => {
          ops.push(NumericReporterOp::PushConst(0.0))
          true
        }
      }
    "data_variable" =>
      match field_value(block, "VARIABLE") {
        Some((name, id)) => {
          let encoded_id = match id {
            Some(value) => value
            None => ""
          }
          let resolved = match id {
            Some(variable_id) =>
              resolve_variable_ref_by_id(vm, target_index, variable_id)
            None => resolve_variable_ref(vm, target_index, None, Some(name))
          }
          match resolved {
            Some((owner_index, variable_id, variable_slot)) => {
              let owner_kind = if owner_index == vm.stage_index { 1 } else { 0 }
              ops.push(
                NumericReporterOp::LoadVariableByRef(
                  owner_kind, variable_id, variable_slot,
                ),
              )
            }
            None => ops.push(NumericReporterOp::LoadVariable(encoded_id, name))
          }
          true
        }
        None => false
      }
    "operator_add" =>
      if compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM1", ops, visiting, depth,
        ) &&
        compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM2", ops, visiting, depth,
        ) {
        ops.push(NumericReporterOp::Add)
        true
      } else {
        false
      }
    "operator_subtract" =>
      if compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM1", ops, visiting, depth,
        ) &&
        compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM2", ops, visiting, depth,
        ) {
        ops.push(NumericReporterOp::Subtract)
        true
      } else {
        false
      }
    "operator_multiply" =>
      if compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM1", ops, visiting, depth,
        ) &&
        compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM2", ops, visiting, depth,
        ) {
        ops.push(NumericReporterOp::Multiply)
        true
      } else {
        false
      }
    "operator_divide" =>
      if compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM1", ops, visiting, depth,
        ) &&
        compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM2", ops, visiting, depth,
        ) {
        ops.push(NumericReporterOp::Divide)
        true
      } else {
        false
      }
    "operator_mod" =>
      if compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM1", ops, visiting, depth,
        ) &&
        compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM2", ops, visiting, depth,
        ) {
        ops.push(NumericReporterOp::Mod)
        true
      } else {
        false
      }
    "operator_round" =>
      if compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM", ops, visiting, depth,
        ) {
        ops.push(NumericReporterOp::Round)
        true
      } else {
        false
      }
    "operator_mathop" => {
      let op = match field_value(block, "OPERATOR") {
        Some((name, _)) => name
        None => ""
      }
      if compile_numeric_operand_ops(
          vm, target_index, target, block, "NUM", ops, visiting, depth,
        ) {
        ops.push(NumericReporterOp::MathOp(op))
        true
      } else {
        false
      }
    }
    "motion_xposition" => {
      ops.push(NumericReporterOp::LoadXPosition)
      true
    }
    "motion_yposition" => {
      ops.push(NumericReporterOp::LoadYPosition)
      true
    }
    "motion_direction" => {
      ops.push(NumericReporterOp::LoadDirection)
      true
    }
    "looks_size" => {
      ops.push(NumericReporterOp::LoadSize)
      true
    }
    "sound_volume" => {
      ops.push(NumericReporterOp::LoadVolume)
      true
    }
    "music_getTempo" => {
      ops.push(NumericReporterOp::LoadTempo)
      true
    }
    "sensing_timer" => {
      ops.push(NumericReporterOp::LoadTimer)
      true
    }
    "sensing_mousex" => {
      ops.push(NumericReporterOp::LoadMouseX)
      true
    }
    "sensing_mousey" => {
      ops.push(NumericReporterOp::LoadMouseY)
      true
    }
    "control_get_counter" => {
      ops.push(NumericReporterOp::LoadControlCounter)
      true
    }
    _ => false
  }
  visiting.remove(block_id)
  compiled
}

///|
fn compile_numeric_reporter_program(
  vm : Vm,
  target_index : Int,
  target : TargetState,
  block_id : String,
) -> NumericReporterProgram? {
  let ops = []
  let visiting = {}
  if compile_numeric_reporter_ops(
      vm, target_index, target, block_id, ops, visiting, 0,
    ) {
    Some({ ops, })
  } else {
    None
  }
}

///|
fn eval_numeric_reporter_program(
  vm : Vm,
  target_index : Int,
  program : NumericReporterProgram,
) -> Double? {
  let stack = []
  for op in program.ops {
    match op {
      NumericReporterOp::PushConst(value) => stack.push(value)
      NumericReporterOp::LoadVariable(encoded_id, name) => {
        let variable_id = if encoded_id == "" { None } else { Some(encoded_id) }
        stack.push(
          json_to_number_value(
            read_variable(vm, target_index, variable_id, Some(name)),
          ),
        )
      }
      NumericReporterOp::LoadVariableByRef(owner_kind, variable_id, slot) => {
        let owner_index = if owner_kind == 1 {
          vm.stage_index
        } else {
          target_index
        }
        stack.push(
          json_to_number_value(
            read_variable_by_ref(vm, owner_index, variable_id, slot),
          ),
        )
      }
      NumericReporterOp::Add =>
        match (stack.pop(), stack.pop()) {
          (Some(right), Some(left)) => stack.push(left + right)
          _ => return None
        }
      NumericReporterOp::Subtract =>
        match (stack.pop(), stack.pop()) {
          (Some(right), Some(left)) => stack.push(left - right)
          _ => return None
        }
      NumericReporterOp::Multiply =>
        match (stack.pop(), stack.pop()) {
          (Some(right), Some(left)) => stack.push(left * right)
          _ => return None
        }
      NumericReporterOp::Divide =>
        match (stack.pop(), stack.pop()) {
          (Some(right), Some(left)) =>
            if right == 0.0 {
              stack.push(0.0)
            } else {
              stack.push(left / right)
            }
          _ => return None
        }
      NumericReporterOp::Mod =>
        match (stack.pop(), stack.pop()) {
          (Some(right), Some(left)) =>
            if right == 0.0 {
              stack.push(0.0)
            } else {
              stack.push(left.mod(right))
            }
          _ => return None
        }
      NumericReporterOp::Round =>
        match stack.pop() {
          Some(value) => stack.push(value.round())
          None => return None
        }
      NumericReporterOp::MathOp(name) =>
        match stack.pop() {
          Some(value) => stack.push(mathop(vm, name, value))
          None => return None
        }
      NumericReporterOp::LoadXPosition => stack.push(vm.targets[target_index].x)
      NumericReporterOp::LoadYPosition => stack.push(vm.targets[target_index].y)
      NumericReporterOp::LoadDirection =>
        stack.push(vm.targets[target_index].direction)
      NumericReporterOp::LoadSize => stack.push(vm.targets[target_index].size)
      NumericReporterOp::LoadVolume =>
        stack.push(vm.targets[target_index].volume)
      NumericReporterOp::LoadTempo => stack.push(vm.music_tempo)
      NumericReporterOp::LoadTimer =>
        stack.push(Double::from_int(vm.now_ms - vm.timer_start_ms) / 1000.0)
      NumericReporterOp::LoadMouseX => {
        let (x, _) = read_mouse_xy(vm)
        stack.push(x)
      }
      NumericReporterOp::LoadMouseY => {
        let (_, y) = read_mouse_xy(vm)
        stack.push(y)
      }
      NumericReporterOp::LoadControlCounter =>
        stack.push(Double::from_int(vm.control_counter))
    }
  }
  if stack.length() == 1 {
    Some(stack[0])
  } else {
    None
  }
}

///|
fn get_compiled_numeric_reporter_program(
  vm : Vm,
  target_index : Int,
  block_id : String,
) -> NumericReporterProgram? {
  if target_index < 0 || target_index >= vm.targets.length() {
    return None
  }
  let target = vm.targets[target_index]
  match target.numeric_program_cache.get(block_id) {
    Some(program) => Some(program)
    None =>
      if target.numeric_program_compile_failed.contains(block_id) {
        None
      } else {
        match
          compile_numeric_reporter_program(vm, target_index, target, block_id) {
          Some(program) => {
            vm.targets[target_index].numeric_program_cache[block_id] = program
            Some(program)
          }
          None => {
            vm.targets[target_index].numeric_program_compile_failed[block_id] = true
            None
          }
        }
      }
  }
}

///|
fn is_strict_numeric_reporter_for_compare(
  target : TargetState,
  block_id : String,
  depth : Int,
) -> Bool {
  if depth > 64 {
    return false
  }
  let block = match target.blocks.get(block_id) {
    Some(value) => value
    None => return false
  }
  match block.opcode {
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
fn is_strict_numeric_input_for_compare(
  target : TargetState,
  block : ScratchBlock,
  input_name : String,
) -> Bool {
  if block.const_number_inputs.contains(input_name) {
    return true
  }
  match block.input_block_ids.get(input_name) {
    Some(block_id) =>
      is_strict_numeric_reporter_for_compare(target, block_id, 0)
    None => false
  }
}

///|
fn compile_compare_input_guard(
  vm : Vm,
  target_index : Int,
  target : TargetState,
  block : ScratchBlock,
  input_name : String,
) -> CompareNumericGuard? {
  match block.input_block_ids.get(input_name) {
    Some(block_id) =>
      match target.blocks.get(block_id) {
        Some(input_block) =>
          if input_block.opcode == "data_variable" {
            match field_value(input_block, "VARIABLE") {
              Some((name, id)) => {
                let resolved = match id {
                  Some(variable_id) =>
                    resolve_variable_ref_by_id(vm, target_index, variable_id)
                  None =>
                    resolve_variable_ref(vm, target_index, None, Some(name))
                }
                match resolved {
                  Some((owner_index, variable_id, slot)) =>
                    Some({
                      owner_kind: if owner_index == vm.stage_index {
                        1
                      } else {
                        0
                      },
                      variable_id,
                      slot,
                    })
                  None => None
                }
              }
              None => None
            }
          } else {
            None
          }
        None => None
      }
    None => None
  }
}

///|
fn compile_numeric_input_program_for_bool(
  vm : Vm,
  target_index : Int,
  target : TargetState,
  block : ScratchBlock,
  input_name : String,
  numeric_programs : Array[NumericReporterProgram],
) -> Int? {
  match block.const_number_inputs.get(input_name) {
    Some(value) => {
      numeric_programs.push({ ops: [NumericReporterOp::PushConst(value)] })
      Some(numeric_programs.length() - 1)
    }
    None =>
      match block.input_block_ids.get(input_name) {
        Some(block_id) =>
          match
            compile_numeric_reporter_program(vm, target_index, target, block_id) {
            Some(program) => {
              numeric_programs.push(program)
              Some(numeric_programs.length() - 1)
            }
            None => None
          }
        None => None
      }
  }
}

///|
fn compile_bool_reporter_ops(
  vm : Vm,
  target_index : Int,
  target : TargetState,
  block_id : String,
  numeric_programs : Array[NumericReporterProgram],
  ops : Array[BoolReporterOp],
  visiting : Map[String, Bool],
  depth : Int,
) -> Bool {
  if depth > 64 || visiting.contains(block_id) {
    return false
  }
  visiting[block_id] = true
  let block = match target.blocks.get(block_id) {
    Some(value) => value
    None => {
      visiting.remove(block_id)
      return false
    }
  }
  let compiled = match block.opcode {
    "operator_and" =>
      match
        (
          block.input_block_ids.get("OPERAND1"),
          block.input_block_ids.get("OPERAND2"),
        ) {
        (Some(left_id), Some(right_id)) =>
          if compile_bool_reporter_ops(
              vm,
              target_index,
              target,
              left_id,
              numeric_programs,
              ops,
              visiting,
              depth + 1,
            ) &&
            compile_bool_reporter_ops(
              vm,
              target_index,
              target,
              right_id,
              numeric_programs,
              ops,
              visiting,
              depth + 1,
            ) {
            ops.push(BoolReporterOp::And)
            true
          } else {
            false
          }
        _ => false
      }
    "operator_or" =>
      match
        (
          block.input_block_ids.get("OPERAND1"),
          block.input_block_ids.get("OPERAND2"),
        ) {
        (Some(left_id), Some(right_id)) =>
          if compile_bool_reporter_ops(
              vm,
              target_index,
              target,
              left_id,
              numeric_programs,
              ops,
              visiting,
              depth + 1,
            ) &&
            compile_bool_reporter_ops(
              vm,
              target_index,
              target,
              right_id,
              numeric_programs,
              ops,
              visiting,
              depth + 1,
            ) {
            ops.push(BoolReporterOp::Or)
            true
          } else {
            false
          }
        _ => false
      }
    "operator_not" =>
      match block.input_block_ids.get("OPERAND") {
        Some(input_id) =>
          if compile_bool_reporter_ops(
              vm,
              target_index,
              target,
              input_id,
              numeric_programs,
              ops,
              visiting,
              depth + 1,
            ) {
            ops.push(BoolReporterOp::Not)
            true
          } else {
            false
          }
        None => false
      }
    "operator_lt" =>
      match
        (
          compile_numeric_input_program_for_bool(
            vm, target_index, target, block, "OPERAND1", numeric_programs,
          ),
          compile_numeric_input_program_for_bool(
            vm, target_index, target, block, "OPERAND2", numeric_programs,
          ),
        ) {
        (Some(left_index), Some(right_index)) => {
          let strict_left = is_strict_numeric_input_for_compare(
            target, block, "OPERAND1",
          )
          let strict_right = is_strict_numeric_input_for_compare(
            target, block, "OPERAND2",
          )
          ops.push(
            BoolReporterOp::CompareLt(
              left_index,
              right_index,
              strict_left && strict_right,
              if strict_left {
                None
              } else {
                compile_compare_input_guard(
                  vm, target_index, target, block, "OPERAND1",
                )
              },
              if strict_right {
                None
              } else {
                compile_compare_input_guard(
                  vm, target_index, target, block, "OPERAND2",
                )
              },
            ),
          )
          true
        }
        _ => false
      }
    "operator_gt" =>
      match
        (
          compile_numeric_input_program_for_bool(
            vm, target_index, target, block, "OPERAND1", numeric_programs,
          ),
          compile_numeric_input_program_for_bool(
            vm, target_index, target, block, "OPERAND2", numeric_programs,
          ),
        ) {
        (Some(left_index), Some(right_index)) => {
          let strict_left = is_strict_numeric_input_for_compare(
            target, block, "OPERAND1",
          )
          let strict_right = is_strict_numeric_input_for_compare(
            target, block, "OPERAND2",
          )
          ops.push(
            BoolReporterOp::CompareGt(
              left_index,
              right_index,
              strict_left && strict_right,
              if strict_left {
                None
              } else {
                compile_compare_input_guard(
                  vm, target_index, target, block, "OPERAND1",
                )
              },
              if strict_right {
                None
              } else {
                compile_compare_input_guard(
                  vm, target_index, target, block, "OPERAND2",
                )
              },
            ),
          )
          true
        }
        _ => false
      }
    "operator_equals" =>
      match
        (
          compile_numeric_input_program_for_bool(
            vm, target_index, target, block, "OPERAND1", numeric_programs,
          ),
          compile_numeric_input_program_for_bool(
            vm, target_index, target, block, "OPERAND2", numeric_programs,
          ),
        ) {
        (Some(left_index), Some(right_index)) => {
          let strict_left = is_strict_numeric_input_for_compare(
            target, block, "OPERAND1",
          )
          let strict_right = is_strict_numeric_input_for_compare(
            target, block, "OPERAND2",
          )
          ops.push(
            BoolReporterOp::CompareEq(
              left_index,
              right_index,
              strict_left && strict_right,
              if strict_left {
                None
              } else {
                compile_compare_input_guard(
                  vm, target_index, target, block, "OPERAND1",
                )
              },
              if strict_right {
                None
              } else {
                compile_compare_input_guard(
                  vm, target_index, target, block, "OPERAND2",
                )
              },
            ),
          )
          true
        }
        _ => false
      }
    _ => false
  }
  visiting.remove(block_id)
  compiled
}

///|
fn compile_bool_reporter_program(
  vm : Vm,
  target_index : Int,
  target : TargetState,
  block_id : String,
) -> BoolReporterProgram? {
  let numeric_programs = []
  let ops = []
  let visiting = {}
  if compile_bool_reporter_ops(
      vm, target_index, target, block_id, numeric_programs, ops, visiting, 0,
    ) {
    Some({ numeric_programs, ops })
  } else {
    None
  }
}

///|
fn compare_guard_is_numeric(
  vm : Vm,
  target_index : Int,
  numeric_guard : CompareNumericGuard,
) -> Bool {
  let owner_index = if numeric_guard.owner_kind == 1 {
    vm.stage_index
  } else {
    target_index
  }
  if owner_index < 0 || owner_index >= vm.targets.length() {
    return false
  }
  match numeric_guard.slot {
    Some(slot) =>
      if slot >= 0 &&
        slot < vm.targets[owner_index].variable_numeric_flags.length() {
        vm.targets[owner_index].variable_numeric_flags[slot]
      } else {
        match
          as_number_or_none(
            read_variable_by_ref(
              vm,
              owner_index,
              numeric_guard.variable_id,
              numeric_guard.slot,
            ),
          ) {
          Some(value) => value == value
          None => false
        }
      }
    None =>
      match
        as_number_or_none(
          read_variable_by_ref(
            vm,
            owner_index,
            numeric_guard.variable_id,
            numeric_guard.slot,
          ),
        ) {
        Some(value) => value == value
        None => false
      }
  }
}

///|
fn eval_bool_reporter_program(
  vm : Vm,
  target_index : Int,
  program : BoolReporterProgram,
) -> Bool? {
  let stack = []
  for op in program.ops {
    match op {
      BoolReporterOp::CompareLt(
        left_index,
        right_index,
        strict,
        left_guard,
        right_guard
      ) => {
        if !strict {
          match (left_guard, right_guard) {
            (Some(left_guard), Some(right_guard)) =>
              if !compare_guard_is_numeric(vm, target_index, left_guard) ||
                !compare_guard_is_numeric(vm, target_index, right_guard) {
                return None
              }
            _ => return None
          }
        }
        if left_index >= 0 &&
          right_index >= 0 &&
          left_index < program.numeric_programs.length() &&
          right_index < program.numeric_programs.length() {
          match
            (
              eval_numeric_reporter_program(
                vm,
                target_index,
                program.numeric_programs[left_index],
              ),
              eval_numeric_reporter_program(
                vm,
                target_index,
                program.numeric_programs[right_index],
              ),
            ) {
            (Some(left), Some(right)) =>
              if left == left && right == right {
                stack.push(left < right)
              } else {
                return None
              }
            _ => return None
          }
        } else {
          return None
        }
      }
      BoolReporterOp::CompareGt(
        left_index,
        right_index,
        strict,
        left_guard,
        right_guard
      ) => {
        if !strict {
          match (left_guard, right_guard) {
            (Some(left_guard), Some(right_guard)) =>
              if !compare_guard_is_numeric(vm, target_index, left_guard) ||
                !compare_guard_is_numeric(vm, target_index, right_guard) {
                return None
              }
            _ => return None
          }
        }
        if left_index >= 0 &&
          right_index >= 0 &&
          left_index < program.numeric_programs.length() &&
          right_index < program.numeric_programs.length() {
          match
            (
              eval_numeric_reporter_program(
                vm,
                target_index,
                program.numeric_programs[left_index],
              ),
              eval_numeric_reporter_program(
                vm,
                target_index,
                program.numeric_programs[right_index],
              ),
            ) {
            (Some(left), Some(right)) =>
              if left == left && right == right {
                stack.push(left > right)
              } else {
                return None
              }
            _ => return None
          }
        } else {
          return None
        }
      }
      BoolReporterOp::CompareEq(
        left_index,
        right_index,
        strict,
        left_guard,
        right_guard
      ) => {
        if !strict {
          match (left_guard, right_guard) {
            (Some(left_guard), Some(right_guard)) =>
              if !compare_guard_is_numeric(vm, target_index, left_guard) ||
                !compare_guard_is_numeric(vm, target_index, right_guard) {
                return None
              }
            _ => return None
          }
        }
        if left_index >= 0 &&
          right_index >= 0 &&
          left_index < program.numeric_programs.length() &&
          right_index < program.numeric_programs.length() {
          match
            (
              eval_numeric_reporter_program(
                vm,
                target_index,
                program.numeric_programs[left_index],
              ),
              eval_numeric_reporter_program(
                vm,
                target_index,
                program.numeric_programs[right_index],
              ),
            ) {
            (Some(left), Some(right)) =>
              if left == left && right == right {
                stack.push(left == right)
              } else {
                return None
              }
            _ => return None
          }
        } else {
          return None
        }
      }
      BoolReporterOp::And =>
        match (stack.pop(), stack.pop()) {
          (Some(right), Some(left)) => stack.push(left && right)
          _ => return None
        }
      BoolReporterOp::Or =>
        match (stack.pop(), stack.pop()) {
          (Some(right), Some(left)) => stack.push(left || right)
          _ => return None
        }
      BoolReporterOp::Not =>
        match stack.pop() {
          Some(value) => stack.push(!value)
          None => return None
        }
    }
  }
  if stack.length() == 1 {
    Some(stack[0])
  } else {
    None
  }
}

///|
fn get_compiled_bool_reporter_program(
  vm : Vm,
  target_index : Int,
  block_id : String,
) -> BoolReporterProgram? {
  if target_index < 0 || target_index >= vm.targets.length() {
    return None
  }
  let target = vm.targets[target_index]
  match target.bool_program_cache.get(block_id) {
    Some(program) => Some(program)
    None =>
      if target.bool_program_compile_failed.contains(block_id) {
        None
      } else {
        match
          compile_bool_reporter_program(vm, target_index, target, block_id) {
          Some(program) => {
            vm.targets[target_index].bool_program_cache[block_id] = program
            Some(program)
          }
          None => {
            vm.targets[target_index].bool_program_compile_failed[block_id] = true
            None
          }
        }
      }
  }
}

///|
fn number_from_input(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
  input_name : String,
  depth : Int,
) -> Double {
  match block.const_number_inputs.get(input_name) {
    Some(value) => return value
    None => ()
  }
  match block.input_block_ids.get(input_name) {
    Some(block_id) => {
      if target_index >= 0 && target_index < vm.targets.length() {
        match vm.targets[target_index].const_number_block_values.get(block_id) {
          Some(value) => return value
          None => ()
        }
      }
      match get_compiled_numeric_reporter_program(vm, target_index, block_id) {
        Some(program) =>
          match eval_numeric_reporter_program(vm, target_index, program) {
            Some(value) => return value
            None => ()
          }
        None => ()
      }
      match
        eval_reporter_number_block_depth(vm, target_index, block_id, depth + 1) {
        Some(value) => return value
        None =>
          return json_to_number_value(
            eval_reporter_block_depth(vm, target_index, block_id, depth + 1),
          )
      }
    }
    None => ()
  }
  match block_input_payload(block, input_name) {
    Some(Array(primitive)) =>
      if primitive.length() >= 2 {
        let code = json_to_number_value(primitive[0]).to_int()
        if code >= 4 && code <= 8 {
          json_to_number_value(primitive[1])
        } else {
          json_to_number_value(decode_primitive(vm, target_index, primitive))
        }
      } else {
        0.0
      }
    Some(String(block_id)) =>
      if target_index >= 0 && target_index < vm.targets.length() {
        match vm.targets[target_index].const_number_block_values.get(block_id) {
          Some(value) => value
          None =>
            match
              get_compiled_numeric_reporter_program(vm, target_index, block_id) {
              Some(program) =>
                match eval_numeric_reporter_program(vm, target_index, program) {
                  Some(value) => value
                  None =>
                    match
                      eval_reporter_number_block_depth(
                        vm,
                        target_index,
                        block_id,
                        depth + 1,
                      ) {
                      Some(value) => value
                      None =>
                        json_to_number_value(
                          eval_reporter_block_depth(
                            vm,
                            target_index,
                            block_id,
                            depth + 1,
                          ),
                        )
                    }
                }
              None =>
                match
                  eval_reporter_number_block_depth(
                    vm,
                    target_index,
                    block_id,
                    depth + 1,
                  ) {
                  Some(value) => value
                  None =>
                    json_to_number_value(
                      eval_reporter_block_depth(
                        vm,
                        target_index,
                        block_id,
                        depth + 1,
                      ),
                    )
                }
            }
        }
      } else {
        match
          get_compiled_numeric_reporter_program(vm, target_index, block_id) {
          Some(program) =>
            match eval_numeric_reporter_program(vm, target_index, program) {
              Some(value) => value
              None =>
                match
                  eval_reporter_number_block_depth(
                    vm,
                    target_index,
                    block_id,
                    depth + 1,
                  ) {
                  Some(value) => value
                  None =>
                    json_to_number_value(
                      eval_reporter_block_depth(
                        vm,
                        target_index,
                        block_id,
                        depth + 1,
                      ),
                    )
                }
            }
          None =>
            match
              eval_reporter_number_block_depth(
                vm,
                target_index,
                block_id,
                depth + 1,
              ) {
              Some(value) => value
              None =>
                json_to_number_value(
                  eval_reporter_block_depth(
                    vm,
                    target_index,
                    block_id,
                    depth + 1,
                  ),
                )
            }
        }
      }
    Some(value) => json_to_number_value(value)
    None => 0.0
  }
}

///|
fn mathop(vm : Vm, name : String, value : Double) -> Double {
  let op = if name == "sin" || name == "cos" { name } else { name.to_lower() }
  match op {
    "abs" => value.abs()
    "floor" => value.floor()
    "ceiling" => value.ceil()
    "sqrt" => value.sqrt()
    "sin" =>
      if vm.mathop_sin_cache_valid && vm.mathop_sin_cache_input == value {
        vm.mathop_sin_cache_output
      } else {
        let computed = @math.sin(value * @math.PI / 180.0)
        vm.mathop_sin_cache_valid = true
        vm.mathop_sin_cache_input = value
        vm.mathop_sin_cache_output = computed
        computed
      }
    "cos" =>
      if vm.mathop_cos_cache_valid && vm.mathop_cos_cache_input == value {
        vm.mathop_cos_cache_output
      } else {
        let computed = @math.cos(value * @math.PI / 180.0)
        vm.mathop_cos_cache_valid = true
        vm.mathop_cos_cache_input = value
        vm.mathop_cos_cache_output = computed
        computed
      }
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
fn eval_reporter_number_block_depth(
  vm : Vm,
  target_index : Int,
  block_id : String,
  depth : Int,
) -> Double? {
  if depth > 40 {
    return None
  }
  if target_index < 0 || target_index >= vm.targets.length() {
    return None
  }
  let target = vm.targets[target_index]
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
        Some((value, _)) =>
          Some(
            match parse_double_or_none(value) {
              Some(parsed) => parsed
              None => 0.0
            },
          )
        None => Some(0.0)
      }
    "operator_add" =>
      Some(
        number_from_input(vm, target_index, block, "NUM1", depth) +
        number_from_input(vm, target_index, block, "NUM2", depth),
      )
    "operator_subtract" =>
      Some(
        number_from_input(vm, target_index, block, "NUM1", depth) -
        number_from_input(vm, target_index, block, "NUM2", depth),
      )
    "operator_multiply" =>
      Some(
        number_from_input(vm, target_index, block, "NUM1", depth) *
        number_from_input(vm, target_index, block, "NUM2", depth),
      )
    "operator_divide" => {
      let right = number_from_input(vm, target_index, block, "NUM2", depth)
      if right == 0.0 {
        Some(0.0)
      } else {
        Some(number_from_input(vm, target_index, block, "NUM1", depth) / right)
      }
    }
    "operator_mod" => {
      let right = number_from_input(vm, target_index, block, "NUM2", depth)
      if right == 0.0 {
        Some(0.0)
      } else {
        Some(
          number_from_input(vm, target_index, block, "NUM1", depth).mod(right),
        )
      }
    }
    "operator_round" =>
      Some(number_from_input(vm, target_index, block, "NUM", depth).round())
    "operator_mathop" => {
      let op = match field_value(block, "OPERATOR") {
        Some((name, _)) => name
        None => ""
      }
      Some(
        mathop(vm, op, number_from_input(vm, target_index, block, "NUM", depth)),
      )
    }
    "data_variable" =>
      match field_value(block, "VARIABLE") {
        Some((name, id)) =>
          Some(
            json_to_number_value(
              read_variable(vm, target_index, id, Some(name)),
            ),
          )
        None => Some(0.0)
      }
    "data_itemoflist" =>
      match field_value(block, "LIST") {
        Some((name, id)) => {
          let list = read_list(vm, target_index, id, Some(name))
          let index_value = value_from_input(
            vm, target_index, block, "INDEX", depth,
          )
          match
            normalize_index(index_value, list.length(), next_random_unit(vm)) {
            Some(index) =>
              match list.get(index) {
                Some(value) => Some(json_to_number_value(value))
                None => Some(0.0)
              }
            None => Some(0.0)
          }
        }
        None => Some(0.0)
      }
    "data_lengthoflist" =>
      match field_value(block, "LIST") {
        Some((name, id)) => {
          let list = read_list(vm, target_index, id, Some(name))
          Some(Double::from_int(list.length()))
        }
        None => Some(0.0)
      }
    "argument_reporter_string_number" | "argument_reporter_boolean" => {
      let arg_name = block_input_or_field_string(
        vm, target_index, block, "VALUE", "VALUE", depth,
      )
      if arg_name == "" {
        Some(0.0)
      } else {
        match current_procedure_param(vm, arg_name) {
          Some(value) => Some(json_to_number_value(value))
          None => Some(0.0)
        }
      }
    }
    "music_getTempo" => Some(vm.music_tempo)
    "motion_xposition" => Some(vm.targets[target_index].x)
    "motion_yposition" => Some(vm.targets[target_index].y)
    "motion_direction" => Some(vm.targets[target_index].direction)
    "looks_size" => Some(vm.targets[target_index].size)
    "sound_volume" => Some(vm.targets[target_index].volume)
    "sensing_timer" =>
      Some(Double::from_int(vm.now_ms - vm.timer_start_ms) / 1000.0)
    "sensing_mousex" => {
      let (x, _) = read_mouse_xy(vm)
      Some(x)
    }
    "sensing_mousey" => {
      let (_, y) = read_mouse_xy(vm)
      Some(y)
    }
    "sensing_current" => {
      let menu = block_input_or_field_string(
        vm, target_index, block, "CURRENTMENU", "CURRENTMENU", depth,
      )
      Some(current_menu_value(vm, menu))
    }
    "sensing_dayssince2000" => Some(days_since_2000(vm))
    "sensing_loudness" => Some(read_loudness(vm))
    "control_get_counter" => Some(Double::from_int(vm.control_counter))
    _ => None
  }
}

///|
fn as_number_or_none(value : Json) -> Double? {
  match value {
    Number(n, ..) => Some(n)
    String(s) => parse_double_or_none(s)
    True => Some(1.0)
    False => Some(0.0)
    _ => None
  }
}

///|
fn scratch_compare_as_string(left : Json, right : Json) -> Int {
  let left_text = json_to_string_value(left).to_lower()
  let right_text = json_to_string_value(right).to_lower()
  if left_text < right_text {
    -1
  } else if left_text > right_text {
    1
  } else {
    0
  }
}

///|
fn scratch_compare(left : Json, right : Json) -> Int {
  match (as_number_or_none(left), as_number_or_none(right)) {
    (Some(left_number), Some(right_number)) =>
      if left_number != left_number || right_number != right_number {
        scratch_compare_as_string(left, right)
      } else if left_number < right_number {
        -1
      } else if left_number > right_number {
        1
      } else {
        0
      }
    _ => scratch_compare_as_string(left, right)
  }
}

///|
fn scratch_equals(left : Json, right : Json) -> Bool {
  scratch_compare(left, right) == 0
}

///|
fn normalize_index(
  index_value : Json,
  length : Int,
  random_unit : Double,
) -> Int? {
  match index_value {
    Number(n, ..) => {
      let index = n.to_int() - 1
      if index < 0 || index >= length {
        None
      } else {
        Some(index)
      }
    }
    String(raw_input) => {
      let raw = raw_input.trim().to_lower()
      if raw == "last" {
        if length <= 0 {
          None
        } else {
          Some(length - 1)
        }
      } else if raw == "random" || raw == "any" {
        if length <= 0 {
          None
        } else {
          let sampled = (random_unit * Double::from_int(length))
            .floor()
            .to_int()
          Some(sampled.clamp(min=0, max=length - 1))
        }
      } else {
        let index = json_to_number_value(index_value).to_int() - 1
        if index < 0 || index >= length {
          None
        } else {
          Some(index)
        }
      }
    }
    _ => {
      let index = json_to_number_value(index_value).to_int() - 1
      if index < 0 || index >= length {
        None
      } else {
        Some(index)
      }
    }
  }
}

///|
fn reporter_target_costume_count(target : TargetState) -> Int {
  if target.costume_names.is_empty() {
    1
  } else {
    target.costume_names.length()
  }
}

///|
fn reporter_normalized_target_costume_index(
  target : TargetState,
  index : Int,
) -> Int {
  let count = reporter_target_costume_count(target)
  let wrapped = index % count
  if wrapped < 0 {
    wrapped + count
  } else {
    wrapped
  }
}

///|
fn reporter_target_costume_name(target : TargetState, index : Int) -> String {
  if target.costume_names.is_empty() {
    "costume_\{index + 1}"
  } else {
    let normalized = reporter_normalized_target_costume_index(target, index)
    if normalized >= 0 && normalized < target.costume_names.length() {
      target.costume_names[normalized]
    } else {
      "costume_\{normalized + 1}"
    }
  }
}

///|
fn looks_number_name_json(target : TargetState, number_name : String) -> Json {
  let normalized = reporter_normalized_target_costume_index(
    target,
    target.current_costume,
  )
  if number_name.trim().to_lower() == "name" {
    json_string(reporter_target_costume_name(target, normalized))
  } else {
    json_number(Double::from_int(normalized + 1))
  }
}

///|
fn block_input_or_field_string(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
  input_name : String,
  field_name : String,
  depth : Int,
) -> String {
  let mut from_input = ""

  if target_index >= 0 && target_index < vm.targets.length() {
    match block.input_block_ids.get(input_name) {
      Some(input_block_id) =>
        match vm.targets[target_index].blocks.get(input_block_id) {
          Some(input_block) =>
            match field_value(input_block, field_name) {
              Some((value, _)) =>
                if value.trim() != "" {
                  from_input = value
                }
              None => ()
            }
          None => ()
        }
      None => ()
    }
  }

  if from_input == "" {
    match block_input_payload(block, input_name) {
      Some(String(raw)) =>
        if target_index >= 0 && target_index < vm.targets.length() {
          match vm.targets[target_index].blocks.get(raw) {
            Some(input_block) =>
              match field_value(input_block, field_name) {
                Some((value, _)) =>
                  if value.trim() != "" {
                    from_input = value
                  } else if raw.trim() != "" {
                    from_input = raw
                  }
                None =>
                  if raw.trim() != "" {
                    from_input = raw
                  }
              }
            None =>
              if raw.trim() != "" {
                from_input = raw
              }
          }
        } else if raw.trim() != "" {
          from_input = raw
        }
      Some(_) => {
        let resolved = json_to_string_value(
            value_from_input(vm, target_index, block, input_name, depth),
          )
          .trim()
          .to_string()
        if resolved != "" {
          from_input = resolved
        }
      }
      None => ()
    }
  }

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
fn current_procedure_param(vm : Vm, key : String) -> Json? {
  match vm.current_thread_id {
    Some(thread_id) =>
      match vm.procedure_frames.get(thread_id) {
        Some(stack) =>
          if stack.is_empty() {
            None
          } else {
            let frame = stack[stack.length() - 1]
            frame.params.get(key)
          }
        None => None
      }
    None => None
  }
}

///|
fn timestamp_from_json(value : Json) -> Double? {
  match value {
    Number(n, ..) => Some(n)
    String(raw) => parse_double_or_none(raw)
    Object(obj) =>
      match obj.get("timestamp_ms") {
        Some(raw) => as_number_or_none(raw)
        None =>
          match obj.get("timestampMs") {
            Some(raw) => as_number_or_none(raw)
            None =>
              match obj.get("timestamp") {
                Some(raw) =>
                  match as_number_or_none(raw) {
                    Some(seconds) => Some(seconds * 1000.0)
                    None => None
                  }
                None => None
              }
          }
      }
    _ => None
  }
}

///|
fn current_timestamp_ms(vm : Vm) -> Double {
  let base = 946684800000.0
  match vm.io_state.get("current_timestamp_ms") {
    Some(value) =>
      match timestamp_from_json(value) {
        Some(timestamp) => timestamp
        None => base + Double::from_int(vm.now_ms)
      }
    None =>
      match vm.io_state.get("current") {
        Some(value) =>
          match timestamp_from_json(value) {
            Some(timestamp) => timestamp
            None =>
              match vm.io_state.get("clock") {
                Some(clock) =>
                  match timestamp_from_json(clock) {
                    Some(timestamp) => timestamp
                    None => base + Double::from_int(vm.now_ms)
                  }
                None => base + Double::from_int(vm.now_ms)
              }
          }
        None =>
          match vm.io_state.get("clock") {
            Some(clock) =>
              match timestamp_from_json(clock) {
                Some(timestamp) => timestamp
                None => base + Double::from_int(vm.now_ms)
              }
            None => base + Double::from_int(vm.now_ms)
          }
      }
  }
}

///|
fn unix_day_and_second(unix_seconds : Int) -> (Int, Int) {
  let day = if unix_seconds >= 0 {
    unix_seconds / 86400
  } else {
    (unix_seconds - 86399) / 86400
  }
  let second = unix_seconds - day * 86400
  (day, second)
}

///|
fn civil_from_unix_days(unix_days : Int) -> (Int, Int, Int) {
  let z = unix_days + 719468
  let era = if z >= 0 { z / 146097 } else { (z - 146096) / 146097 }
  let doe = z - era * 146097
  let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365
  let y = yoe + era * 400
  let doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
  let mp = (5 * doy + 2) / 153
  let day = doy - (153 * mp + 2) / 5 + 1
  let month = if mp < 10 { mp + 3 } else { mp - 9 }
  let year = if month <= 2 { y + 1 } else { y }
  (year, month, day)
}

///|
fn scratch_day_of_week(unix_days : Int) -> Int {
  let raw = (unix_days + 4).mod(7)
  if raw < 0 {
    raw + 7 + 1
  } else {
    raw + 1
  }
}

///|
fn current_menu_value(vm : Vm, menu : String) -> Double {
  let timestamp_ms = current_timestamp_ms(vm)
  let unix_seconds = (timestamp_ms / 1000.0).floor().to_int()
  let (unix_days, second_of_day) = unix_day_and_second(unix_seconds)
  let (year, month, date) = civil_from_unix_days(unix_days)
  let hour = second_of_day / 3600
  let minute = second_of_day.mod(3600) / 60
  let second = second_of_day.mod(60)

  match lower_trim(menu) {
    "year" => Double::from_int(year)
    "month" => Double::from_int(month)
    "date" => Double::from_int(date)
    "dayofweek" => Double::from_int(scratch_day_of_week(unix_days))
    "hour" => Double::from_int(hour)
    "minute" => Double::from_int(minute)
    "second" => Double::from_int(second)
    _ => 0.0
  }
}

///|
fn days_since_2000(vm : Vm) -> Double {
  (current_timestamp_ms(vm) - 946684800000.0) / 86400000.0
}

///|
fn normalize_key_name(raw : String) -> String {
  let key = lower_trim(raw)
  match key {
    "spacebar" | " " => "space"
    "left" | "arrowleft" => "left arrow"
    "right" | "arrowright" => "right arrow"
    "up" | "arrowup" => "up arrow"
    "down" | "arrowdown" => "down arrow"
    _ => key
  }
}

///|
fn append_key_events(out : Array[String], payload : Json) -> Unit {
  for key in parse_key_events(payload) {
    out.push(normalize_key_name(key))
  }
}

///|
fn pressed_keys(vm : Vm) -> Array[String] {
  let keys = []
  match vm.io_state.get("keys_down") {
    Some(payload) => append_key_events(keys, payload)
    None => ()
  }
  match vm.io_state.get("keyboard") {
    Some(payload) => append_key_events(keys, payload)
    None => ()
  }
  keys
}

///|
fn key_is_pressed(vm : Vm, key_option : String) -> Bool {
  let option = normalize_key_name(key_option)
  let keys = pressed_keys(vm)
  if option == "any" {
    !keys.is_empty()
  } else {
    keys.any(fn(key) { key == option })
  }
}

///|
fn read_mouse_down(vm : Vm) -> Bool {
  match vm.io_state.get("mouse") {
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
      match vm.io_state.get("mousedown") {
        Some(value) => json_to_bool_value(value)
        None => false
      }
  }
}

///|
fn resolve_sensing_object_target(
  vm : Vm,
  current_target_index : Int,
  menu : String,
) -> Int? {
  let key = lower_trim(menu)
  if key == "_myself_" {
    if current_target_index >= 0 && current_target_index < vm.targets.length() {
      return Some(current_target_index)
    }
    return None
  }
  if key == "_stage_" {
    if vm.stage_index >= 0 && vm.stage_index < vm.targets.length() {
      return Some(vm.stage_index)
    }
    return None
  }
  if vm.stage_index >= 0 &&
    vm.stage_index < vm.targets.length() &&
    lower_trim(vm.targets[vm.stage_index].name) == key {
    return Some(vm.stage_index)
  }
  find_target_by_name(vm, menu)
}

///|
fn touching_stage_edge(target : TargetState) -> Bool {
  target.x <= -240.0 ||
  target.x >= 240.0 ||
  target.y <= -180.0 ||
  target.y >= 180.0
}

///|
fn sensing_of_builtin_value(
  target : TargetState,
  property_key : String,
) -> Json? {
  if target.is_stage {
    match property_key {
      "background #" | "backdrop #" =>
        Some(
          json_number(
            Double::from_int(
              reporter_normalized_target_costume_index(
                target,
                target.current_costume,
              ) +
              1,
            ),
          ),
        )
      "backdrop name" =>
        Some(
          json_string(
            reporter_target_costume_name(target, target.current_costume),
          ),
        )
      "volume" => Some(json_number(target.volume))
      _ => None
    }
  } else {
    match property_key {
      "x position" => Some(json_number(target.x))
      "y position" => Some(json_number(target.y))
      "direction" => Some(json_number(target.direction))
      "costume #" =>
        Some(
          json_number(
            Double::from_int(
              reporter_normalized_target_costume_index(
                target,
                target.current_costume,
              ) +
              1,
            ),
          ),
        )
      "costume name" =>
        Some(
          json_string(
            reporter_target_costume_name(target, target.current_costume),
          ),
        )
      "size" => Some(json_number(target.size))
      "volume" => Some(json_number(target.volume))
      _ => None
    }
  }
}

///|
fn io_object_field(vm : Vm, device : String, key : String) -> Json? {
  match vm.io_state.get(device) {
    Some(Object(obj)) => obj.get(key)
    _ => None
  }
}

///|
fn online_status(vm : Vm) -> Bool {
  match vm.io_state.get("online") {
    Some(value) => json_to_bool_value(value)
    None =>
      match io_object_field(vm, "network", "online") {
        Some(value) => json_to_bool_value(value)
        None => false
      }
  }
}

///|
fn read_username(vm : Vm) -> String {
  match vm.io_state.get("username") {
    Some(value) => json_to_string_value(value)
    None =>
      match io_object_field(vm, "userData", "username") {
        Some(value) => json_to_string_value(value)
        None =>
          match io_object_field(vm, "user", "username") {
            Some(value) => json_to_string_value(value)
            None => ""
          }
      }
  }
}

///|
fn read_userid(vm : Vm) -> Json {
  match vm.io_state.get("userid") {
    Some(value) => value
    None =>
      match io_object_field(vm, "userData", "userid") {
        Some(value) => value
        None =>
          match io_object_field(vm, "userData", "userId") {
            Some(value) => value
            None =>
              match io_object_field(vm, "user", "id") {
                Some(value) => value
                None => json_number(0.0)
              }
          }
      }
  }
}

///|
fn is_ascii_digits_only(raw : String) -> Bool {
  let value = raw.trim().to_string()
  if value.is_empty() {
    return false
  }
  for ch in value.to_array() {
    if ch < '0' || ch > '9' {
      return false
    }
  }
  true
}

///|
fn normalize_translate_language(raw : String) -> String {
  let language = lower_trim(raw)
  if language == "" {
    "en"
  } else {
    language
  }
}

///|
fn translate_pending_key(words : String, language : String) -> String {
  "\{language}\n\{words}"
}

///|
fn translate_cache_lookup(
  vm : Vm,
  words : String,
  language : String,
) -> String? {
  match vm.io_state.get("translate_cache") {
    Some(Object(cache)) =>
      match cache.get(language) {
        Some(Object(bucket)) =>
          match bucket.get(words) {
            Some(value) => Some(json_to_string_value(value))
            None => None
          }
        _ => None
      }
    _ => None
  }
}

///|
fn viewer_language(vm : Vm) -> String {
  match vm.io_state.get("viewer_language") {
    Some(value) => {
      let language = json_to_string_value(value).trim().to_string()
      if language == "" {
        "en"
      } else {
        language
      }
    }
    None =>
      match io_object_field(vm, "translate", "viewer_language") {
        Some(value) => {
          let language = json_to_string_value(value).trim().to_string()
          if language == "" {
            "en"
          } else {
            language
          }
        }
        None => "en"
      }
  }
}

///|
fn try_number_reporter_for_compare(
  vm : Vm,
  target_index : Int,
  block_id : String,
  depth : Int,
) -> Double? {
  if depth > 40 {
    return None
  }
  if target_index < 0 || target_index >= vm.targets.length() {
    return None
  }
  let target = vm.targets[target_index]
  let block = match target.blocks.get(block_id) {
    Some(value) => value
    None => return None
  }
  let numeric = match block.opcode {
    "data_variable" =>
      match field_value(block, "VARIABLE") {
        Some((name, id)) =>
          match id {
            Some(variable_id) =>
              match resolve_variable_ref_by_id(vm, target_index, variable_id) {
                Some((owner_index, resolved_id, resolved_slot)) =>
                  as_number_or_none(
                    read_variable_by_ref(
                      vm, owner_index, resolved_id, resolved_slot,
                    ),
                  )
                None => None
              }
            None =>
              as_number_or_none(
                read_variable(vm, target_index, None, Some(name)),
              )
          }
        None => None
      }
    "argument_reporter_string_number" | "argument_reporter_boolean" => {
      let arg_name = block_input_or_field_string(
        vm, target_index, block, "VALUE", "VALUE", depth,
      )
      if arg_name == "" {
        Some(0.0)
      } else {
        match current_procedure_param(vm, arg_name) {
          Some(value) => as_number_or_none(value)
          None => Some(0.0)
        }
      }
    }
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
    | "control_get_counter" =>
      eval_reporter_number_block_depth(vm, target_index, block_id, depth + 1)
    _ => None
  }
  match numeric {
    Some(number) => if number == number { Some(number) } else { None }
    None => None
  }
}

///|
fn try_number_input_for_compare(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
  input_name : String,
  depth : Int,
) -> Double? {
  match block.const_number_inputs.get(input_name) {
    Some(value) => Some(value)
    None =>
      match block.input_block_ids.get(input_name) {
        Some(block_id) =>
          try_number_reporter_for_compare(vm, target_index, block_id, depth + 1)
        None => None
      }
  }
}

///|
fn try_compare_numeric_inputs(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
  left_input : String,
  right_input : String,
  depth : Int,
) -> (Double, Double)? {
  match
    (
      try_number_input_for_compare(vm, target_index, block, left_input, depth),
      try_number_input_for_compare(vm, target_index, block, right_input, depth),
    ) {
    (Some(left), Some(right)) => Some((left, right))
    _ => None
  }
}

///|
fn eval_reporter_bool_block_depth(
  vm : Vm,
  target_index : Int,
  block_id : String,
  depth : Int,
) -> Bool? {
  if depth > 40 {
    return None
  }
  if target_index < 0 || target_index >= vm.targets.length() {
    return None
  }
  let target = vm.targets[target_index]
  let block = match target.blocks.get(block_id) {
    Some(value) => value
    None => return None
  }
  match block.opcode {
    "operator_lt" =>
      match
        try_compare_numeric_inputs(
          vm, target_index, block, "OPERAND1", "OPERAND2", depth,
        ) {
        Some((left, right)) => Some(left < right)
        None => None
      }
    "operator_gt" =>
      match
        try_compare_numeric_inputs(
          vm, target_index, block, "OPERAND1", "OPERAND2", depth,
        ) {
        Some((left, right)) => Some(left > right)
        None => None
      }
    "operator_equals" =>
      match
        try_compare_numeric_inputs(
          vm, target_index, block, "OPERAND1", "OPERAND2", depth,
        ) {
        Some((left, right)) => Some(left == right)
        None => None
      }
    "operator_and" =>
      Some(
        bool_from_input(vm, target_index, block, "OPERAND1", depth) &&
        bool_from_input(vm, target_index, block, "OPERAND2", depth),
      )
    "operator_or" =>
      Some(
        bool_from_input(vm, target_index, block, "OPERAND1", depth) ||
        bool_from_input(vm, target_index, block, "OPERAND2", depth),
      )
    "operator_not" =>
      Some(!bool_from_input(vm, target_index, block, "OPERAND", depth))
    _ => None
  }
}

///|
fn bool_from_input(
  vm : Vm,
  target_index : Int,
  block : ScratchBlock,
  input_name : String,
  depth : Int,
) -> Bool {
  match block.input_block_ids.get(input_name) {
    Some(block_id) =>
      match get_compiled_bool_reporter_program(vm, target_index, block_id) {
        Some(program) =>
          match eval_bool_reporter_program(vm, target_index, program) {
            Some(value) => value
            None =>
              match
                eval_reporter_bool_block_depth(
                  vm,
                  target_index,
                  block_id,
                  depth + 1,
                ) {
                Some(value) => value
                None =>
                  json_to_bool_value(
                    eval_reporter_block_depth(
                      vm,
                      target_index,
                      block_id,
                      depth + 1,
                    ),
                  )
              }
          }
        None =>
          match
            eval_reporter_bool_block_depth(
              vm,
              target_index,
              block_id,
              depth + 1,
            ) {
            Some(value) => value
            None =>
              json_to_bool_value(
                eval_reporter_block_depth(vm, target_index, block_id, depth + 1),
              )
          }
      }
    None =>
      json_to_bool_value(
        value_from_input(vm, target_index, block, input_name, depth),
      )
  }
}

///|
fn eval_reporter_block_depth(
  vm : Vm,
  target_index : Int,
  block_id : String,
  depth : Int,
) -> Json {
  if depth > 40 {
    return Json::null()
  }

  let target = vm.targets[target_index]
  let block = match target.blocks.get(block_id) {
    Some(value) => value
    None => return Json::null()
  }

  match block.opcode {
    "math_number"
    | "math_integer"
    | "math_whole_number"
    | "math_positive_number"
    | "math_angle" =>
      match field_value(block, "NUM") {
        Some((value, _)) =>
          json_number(
            match parse_double_or_none(value) {
              Some(parsed) => parsed
              None => 0.0
            },
          )
        None => json_number(0.0)
      }
    "text" =>
      match field_value(block, "TEXT") {
        Some((value, _)) => json_string(value)
        None => json_string("")
      }
    "event_broadcast_menu" =>
      match field_value(block, "BROADCAST_OPTION") {
        Some((value, _)) => json_string(value)
        None => json_string("")
      }
    "control_create_clone_of_menu" =>
      match field_value(block, "CLONE_OPTION") {
        Some((value, _)) => json_string(value)
        None => json_string("")
      }
    "sound_sounds_menu" =>
      match field_value(block, "SOUND_MENU") {
        Some((value, _)) => json_string(value)
        None => json_string("")
      }
    "sound_beats_menu" =>
      match field_value(block, "BEATS") {
        Some((value, _)) => json_string(value)
        None => json_string("")
      }
    "sound_effects_menu" =>
      match field_value(block, "EFFECT") {
        Some((value, _)) => json_string(value)
        None => json_string("")
      }
    "sensing_keyoptions" =>
      match field_value(block, "KEY_OPTION") {
        Some((value, _)) => json_string(value)
        None => json_string("")
      }
    "pen_menu_colorParam" =>
      match field_value(block, "colorParam") {
        Some((value, _)) => json_string(value)
        None =>
          match field_value(block, "COLOR_PARAM") {
            Some((value, _)) => json_string(value)
            None => json_string("color")
          }
      }
    "music_getTempo" => json_number(vm.music_tempo)
    "argument_reporter_string_number" | "argument_reporter_boolean" => {
      let arg_name = block_input_or_field_string(
        vm, target_index, block, "VALUE", "VALUE", depth,
      )
      if arg_name == "" {
        json_number(0.0)
      } else {
        match current_procedure_param(vm, arg_name) {
          Some(value) => value
          None => json_number(0.0)
        }
      }
    }
    "operator_add" => {
      let left = number_from_input(vm, target_index, block, "NUM1", depth)
      let right = number_from_input(vm, target_index, block, "NUM2", depth)
      json_number(left + right)
    }
    "operator_subtract" => {
      let left = number_from_input(vm, target_index, block, "NUM1", depth)
      let right = number_from_input(vm, target_index, block, "NUM2", depth)
      json_number(left - right)
    }
    "operator_multiply" => {
      let left = number_from_input(vm, target_index, block, "NUM1", depth)
      let right = number_from_input(vm, target_index, block, "NUM2", depth)
      json_number(left * right)
    }
    "operator_divide" => {
      let left = number_from_input(vm, target_index, block, "NUM1", depth)
      let right = number_from_input(vm, target_index, block, "NUM2", depth)
      if right == 0.0 {
        json_number(0.0)
      } else {
        json_number(left / right)
      }
    }
    "operator_random" => {
      let from = number_from_input(vm, target_index, block, "FROM", depth)
      let to = number_from_input(vm, target_index, block, "TO", depth)
      let low = if from <= to { from } else { to }
      let high = if from <= to { to } else { from }
      let sampled = low + (high - low) * next_random_unit(vm)
      json_number(sampled)
    }
    "operator_lt" =>
      match
        try_compare_numeric_inputs(
          vm, target_index, block, "OPERAND1", "OPERAND2", depth,
        ) {
        Some((left, right)) => json_bool(left < right)
        None => {
          let left = value_from_input(
            vm, target_index, block, "OPERAND1", depth,
          )
          let right = value_from_input(
            vm, target_index, block, "OPERAND2", depth,
          )
          json_bool(scratch_compare(left, right) < 0)
        }
      }
    "operator_gt" =>
      match
        try_compare_numeric_inputs(
          vm, target_index, block, "OPERAND1", "OPERAND2", depth,
        ) {
        Some((left, right)) => json_bool(left > right)
        None => {
          let left = value_from_input(
            vm, target_index, block, "OPERAND1", depth,
          )
          let right = value_from_input(
            vm, target_index, block, "OPERAND2", depth,
          )
          json_bool(scratch_compare(left, right) > 0)
        }
      }
    "operator_equals" =>
      match
        try_compare_numeric_inputs(
          vm, target_index, block, "OPERAND1", "OPERAND2", depth,
        ) {
        Some((left, right)) => json_bool(left == right)
        None => {
          let left = value_from_input(
            vm, target_index, block, "OPERAND1", depth,
          )
          let right = value_from_input(
            vm, target_index, block, "OPERAND2", depth,
          )
          json_bool(scratch_equals(left, right))
        }
      }
    "operator_and" =>
      json_bool(
        bool_from_input(vm, target_index, block, "OPERAND1", depth) &&
        bool_from_input(vm, target_index, block, "OPERAND2", depth),
      )
    "operator_or" =>
      json_bool(
        bool_from_input(vm, target_index, block, "OPERAND1", depth) ||
        bool_from_input(vm, target_index, block, "OPERAND2", depth),
      )
    "operator_not" =>
      json_bool(!bool_from_input(vm, target_index, block, "OPERAND", depth))
    "operator_join" => {
      let left = json_to_string_value(
        value_from_input(vm, target_index, block, "STRING1", depth),
      )
      let right = json_to_string_value(
        value_from_input(vm, target_index, block, "STRING2", depth),
      )
      json_string(left + right)
    }
    "operator_letter_of" => {
      let index = number_from_input(vm, target_index, block, "LETTER", depth).to_int() -
        1
      let text = json_to_string_value(
        value_from_input(vm, target_index, block, "STRING", depth),
      ).to_array()
      if index < 0 || index >= text.length() {
        json_string("")
      } else {
        json_string(String::from_array([text[index]]))
      }
    }
    "operator_length" => {
      let text = json_to_string_value(
        value_from_input(vm, target_index, block, "STRING", depth),
      )
      json_number(Double::from_int(text.char_length()))
    }
    "operator_contains" => {
      let text = json_to_string_value(
        value_from_input(vm, target_index, block, "STRING1", depth),
      ).to_lower()
      let needle = json_to_string_value(
        value_from_input(vm, target_index, block, "STRING2", depth),
      ).to_lower()
      json_bool(text.contains(needle))
    }
    "operator_mod" => {
      let left = number_from_input(vm, target_index, block, "NUM1", depth)
      let right = number_from_input(vm, target_index, block, "NUM2", depth)
      if right == 0.0 {
        json_number(0.0)
      } else {
        json_number(left.mod(right))
      }
    }
    "operator_round" => {
      let value = number_from_input(vm, target_index, block, "NUM", depth)
      json_number(value.round())
    }
    "operator_mathop" => {
      let op = match field_value(block, "OPERATOR") {
        Some((name, _)) => name
        None => ""
      }
      let value = number_from_input(vm, target_index, block, "NUM", depth)
      json_number(mathop(vm, op, value))
    }
    "motion_xposition" => json_number(vm.targets[target_index].x)
    "motion_yposition" => json_number(vm.targets[target_index].y)
    "motion_direction" => json_number(vm.targets[target_index].direction)
    "motion_xscroll" => json_number(0.0)
    "motion_yscroll" => json_number(0.0)
    "looks_size" => json_number(vm.targets[target_index].size)
    "looks_costumenumbername" => {
      let number_name = match field_value(block, "NUMBER_NAME") {
        Some((value, _)) => value
        None => "number"
      }
      looks_number_name_json(vm.targets[target_index], number_name)
    }
    "looks_backdropnumbername" => {
      let number_name = match field_value(block, "NUMBER_NAME") {
        Some((value, _)) => value
        None => "number"
      }
      if vm.stage_index >= 0 && vm.stage_index < vm.targets.length() {
        looks_number_name_json(vm.targets[vm.stage_index], number_name)
      } else {
        json_number(1.0)
      }
    }
    "sound_volume" => json_number(vm.targets[target_index].volume)
    "sensing_answer" => json_string(vm.answer)
    "sensing_timer" =>
      json_number(Double::from_int(vm.now_ms - vm.timer_start_ms) / 1000.0)
    "sensing_mousex" => {
      let (x, _) = read_mouse_xy(vm)
      json_number(x)
    }
    "sensing_mousey" => {
      let (_, y) = read_mouse_xy(vm)
      json_number(y)
    }
    "sensing_mousedown" => json_bool(read_mouse_down(vm))
    "sensing_keypressed" => {
      let raw_option = block_input_or_field_string(
        vm, target_index, block, "KEY_OPTION", "KEY_OPTION", depth,
      )
      let option = if raw_option != "" &&
          target_index >= 0 &&
          target_index < vm.targets.length() {
          match vm.targets[target_index].blocks.get(raw_option) {
            Some(menu_block) =>
              if menu_block.opcode == "sensing_keyoptions" {
                match field_value(menu_block, "KEY_OPTION") {
                  Some((value, _)) =>
                    if value.trim() != "" {
                      value
                    } else {
                      raw_option
                    }
                  None => raw_option
                }
              } else {
                raw_option
              }
            None => raw_option
          }
        } else {
          raw_option
        }
      json_bool(key_is_pressed(vm, option))
    }
    "sensing_touchingobject" => {
      let option = block_input_or_field_string(
        vm, target_index, block, "TOUCHINGOBJECTMENU", "TOUCHINGOBJECTMENU", depth,
      )
      if option == "" {
        json_bool(false)
      } else {
        let target = vm.targets[target_index]
        let touching_edge = lower_trim(option) == "_edge_" &&
          !target.is_stage &&
          touching_stage_edge(target)
        json_bool(
          touching_edge || read_touching_from_io(vm, target.name, option),
        )
      }
    }
    "sensing_touchingcolor" => {
      let color = value_from_input(vm, target_index, block, "COLOR", depth)
      json_bool(
        target_is_touching_color(vm, target_index, render_json_to_rgb(color)),
      )
    }
    "sensing_coloristouchingcolor" => {
      let mask_color = value_from_input(vm, target_index, block, "COLOR", depth)
      let target_color = value_from_input(
        vm, target_index, block, "COLOR2", depth,
      )
      json_bool(
        target_color_is_touching_color(
          vm,
          target_index,
          render_json_to_rgb(target_color),
          render_json_to_rgb(mask_color),
        ),
      )
    }
    "sensing_distanceto" => {
      let target = vm.targets[target_index]
      if target.is_stage {
        json_number(10000.0)
      } else {
        let menu = block_input_or_field_string(
          vm, target_index, block, "DISTANCETOMENU", "DISTANCETOMENU", depth,
        )
        let target_pos = if lower_trim(menu) == "_mouse_" {
          Some(read_mouse_xy(vm))
        } else {
          match resolve_sensing_object_target(vm, target_index, menu) {
            Some(other_index) =>
              if other_index >= 0 &&
                other_index < vm.targets.length() &&
                !vm.targets[other_index].deleted {
                let other = vm.targets[other_index]
                Some((other.x, other.y))
              } else {
                None
              }
            None => None
          }
        }
        match target_pos {
          Some((target_x, target_y)) => {
            let dx = target.x - target_x
            let dy = target.y - target_y
            json_number((dx * dx + dy * dy).sqrt())
          }
          None => json_number(10000.0)
        }
      }
    }
    "sensing_of" => {
      let property_raw = block_input_or_field_string(
        vm, target_index, block, "PROPERTY", "PROPERTY", depth,
      )
      let property_key = lower_trim(property_raw)
      let object_name = block_input_or_field_string(
        vm, target_index, block, "OBJECT", "OBJECT", depth,
      )
      match resolve_sensing_object_target(vm, target_index, object_name) {
        Some(object_index) =>
          if object_index >= 0 &&
            object_index < vm.targets.length() &&
            !vm.targets[object_index].deleted {
            let object_target = vm.targets[object_index]
            match sensing_of_builtin_value(object_target, property_key) {
              Some(value) => value
              None =>
                match object_target.variable_names.get(property_raw) {
                  Some(variable_id) =>
                    object_target.variables.get_or_default(
                      variable_id,
                      json_number(0.0),
                    )
                  None => json_number(0.0)
                }
            }
          } else {
            json_number(0.0)
          }
        None => json_number(0.0)
      }
    }
    "sensing_current" => {
      let menu = block_input_or_field_string(
        vm, target_index, block, "CURRENTMENU", "CURRENTMENU", depth,
      )
      json_number(current_menu_value(vm, menu))
    }
    "sensing_dayssince2000" => json_number(days_since_2000(vm))
    "sensing_loudness" => json_number(read_loudness(vm))
    "sensing_loud" => json_bool(read_loudness(vm) > 10.0)
    "sensing_online" => json_bool(online_status(vm))
    "sensing_username" => json_string(read_username(vm))
    "sensing_userid" => read_userid(vm)
    "translate_getViewerLanguage" => json_string(viewer_language(vm))
    "translate_getTranslate" => {
      let words = json_to_string_value(
        value_from_input(vm, target_index, block, "WORDS", depth),
      )
      if is_ascii_digits_only(words) {
        json_string(words)
      } else {
        let language = normalize_translate_language(
          json_to_string_value(
            value_from_input(vm, target_index, block, "LANGUAGE", depth),
          ),
        )
        let pending_key = translate_pending_key(words, language)
        match translate_cache_lookup(vm, words, language) {
          Some(translated) => {
            vm.pending_translate_requests.remove(pending_key)
            json_string(translated)
          }
          None => {
            if !vm.pending_translate_requests.contains(pending_key) {
              vm.pending_translate_requests[pending_key] = true
              push_effect(vm, HostEffect::TranslateRequest(words, language))
            }
            json_string(words)
          }
        }
      }
    }
    "control_get_counter" => json_number(Double::from_int(vm.control_counter))
    "data_variable" =>
      match field_value(block, "VARIABLE") {
        Some((name, id)) => read_variable(vm, target_index, id, Some(name))
        None => Json::null()
      }
    "data_listcontents" =>
      match field_value(block, "LIST") {
        Some((name, id)) => {
          let list = read_list(vm, target_index, id, Some(name))
          json_string(list.map(json_to_string_value).join(" "))
        }
        None => json_string("")
      }
    "data_itemoflist" =>
      match field_value(block, "LIST") {
        Some((name, id)) => {
          let list = read_list(vm, target_index, id, Some(name))
          let index_value = value_from_input(
            vm, target_index, block, "INDEX", depth,
          )
          match
            normalize_index(index_value, list.length(), next_random_unit(vm)) {
            Some(index) =>
              match list.get(index) {
                Some(value) => value
                None => Json::null()
              }
            None => Json::null()
          }
        }
        None => Json::null()
      }
    "data_itemnumoflist" =>
      match field_value(block, "LIST") {
        Some((name, id)) => {
          let list = read_list(vm, target_index, id, Some(name))
          let item = value_from_input(vm, target_index, block, "ITEM", depth)
          let mut found = 0
          for i, entry in list {
            if found == 0 && scratch_equals(entry, item) {
              found = i + 1
            }
          }
          json_number(Double::from_int(found))
        }
        None => json_number(0.0)
      }
    "data_lengthoflist" =>
      match field_value(block, "LIST") {
        Some((name, id)) => {
          let list = read_list(vm, target_index, id, Some(name))
          json_number(Double::from_int(list.length()))
        }
        None => json_number(0.0)
      }
    "data_listcontainsitem" =>
      match field_value(block, "LIST") {
        Some((name, id)) => {
          let list = read_list(vm, target_index, id, Some(name))
          let item = value_from_input(vm, target_index, block, "ITEM", depth)
          let needle = json_to_string_value(item).to_lower()
          json_bool(
            list.any(fn(entry) {
              json_to_string_value(entry).to_lower() == needle
            }),
          )
        }
        None => json_bool(false)
      }
    _ => Json::null()
  }
}
