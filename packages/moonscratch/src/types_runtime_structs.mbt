///|
pub(all) struct ControlFrame {
  kind : ControlFrameKind
  mut remaining : Int
  substack : Int?
  after : Int?
} derive(Show, Eq, ToJson)

///|
pub(all) enum OpcodeTag {
  Unknown
  MotionChangeXBy
  MotionChangeYBy
  MotionSetY
  PenPenDown
  PenPenUp
  ControlRepeat
  ControlRepeatUntil
  ControlIf
  DataSetVariableTo
  DataChangeVariableBy
} derive(Show, Eq, ToJson)

///|
pub(all) struct ScratchBlock {
  id : String
  opcode : String
  opcode_tag : OpcodeTag
  next : String?
  parent : String?
  inputs : Map[String, Json]
  const_number_inputs : Map[String, Double]
  input_block_ids : Map[String, String]
  fields : Map[String, Json]
  mutation : Map[String, Json]
  top_level : Bool
} derive(Show, Eq, ToJson)

///|
pub(all) struct BlockFieldRef {
  name : String
  id : String?
} derive(Show, Eq, ToJson)

///|
pub(all) struct BlockFastMeta {
  next_pc : Int?
  substack_pc : Int?
  substack2_pc : Int?
  variable : BlockFieldRef?
  list : BlockFieldRef?
} derive(Show, Eq, ToJson)

///|
pub(all) enum NumericReporterOp {
  PushConst(Double)
  LoadVariable(String, String)
  LoadVariableByRef(Int, String, Int?)
  Add
  Subtract
  Multiply
  Divide
  Mod
  Round
  MathOp(String)
  LoadXPosition
  LoadYPosition
  LoadDirection
  LoadSize
  LoadVolume
  LoadTempo
  LoadTimer
  LoadMouseX
  LoadMouseY
  LoadControlCounter
} derive(Show, Eq)

///|
pub(all) struct NumericReporterProgram {
  ops : Array[NumericReporterOp]
} derive(Show, Eq)

///|
pub(all) struct CompareNumericGuard {
  owner_kind : Int
  variable_id : String
  slot : Int?
} derive(Show, Eq)

///|
pub(all) enum BoolReporterOp {
  CompareLt(Int, Int, Bool, CompareNumericGuard?, CompareNumericGuard?)
  CompareGt(Int, Int, Bool, CompareNumericGuard?, CompareNumericGuard?)
  CompareEq(Int, Int, Bool, CompareNumericGuard?, CompareNumericGuard?)
  And
  Or
  Not
} derive(Show, Eq)

///|
pub(all) struct BoolReporterProgram {
  numeric_programs : Array[NumericReporterProgram]
  ops : Array[BoolReporterOp]
} derive(Show, Eq)

///|
pub(all) struct ProcedureSpec {
  start_block : String
  param_names : Array[String]
  param_ids : Array[String]
  param_defaults : Array[Json]
  warp_mode : Bool
} derive(Show, Eq)

///|
pub(all) enum PredicateHatKind {
  WhenGreaterThan
  WhenTouchingObject
}

///|
pub(all) struct KeyPressedHatStart {
  key_option : String
  start_block : String
}

///|
pub(all) struct BroadcastHatStart {
  message : String
  start_block : String
}

///|
pub(all) struct BackdropHatStart {
  backdrop_name : String
  start_block : String
}

///|
pub(all) struct PredicateHatStart {
  kind : PredicateHatKind
  hat_id : String
  menu : String
  start_block : String
}

///|
pub(all) struct CostumeImage {
  name : String
  asset_id : String
  bitmap_resolution : Int
  rotation_center_x : Double
  rotation_center_y : Double
  width : Int
  height : Int
  pixels : Array[Byte]
}

///|
pub(all) struct TargetState {
  id : String
  name : String
  is_stage : Bool
  is_original : Bool
  mut deleted : Bool
  mut x : Double
  mut y : Double
  mut direction : Double
  mut size : Double
  mut volume : Double
  mut music_instrument : Int
  mut tts_voice : String
  mut visible : Bool
  mut current_costume : Int
  costume_names : Array[String]
  costumes : Array[CostumeImage]
  mut pen_down : Bool
  mut pen_color : Double
  mut pen_saturation : Double
  mut pen_brightness : Double
  mut pen_transparency : Double
  mut pen_size : Double
  mut pen_legacy_shade : Double
  mut looks_effect_color : Double
  mut looks_effect_fisheye : Double
  mut looks_effect_whirl : Double
  mut looks_effect_pixelate : Double
  mut looks_effect_mosaic : Double
  mut looks_effect_brightness : Double
  mut looks_effect_ghost : Double
  variables : Map[String, Json]
  variable_names : Map[String, String]
  variable_slot_by_id : Map[String, Int]
  variable_slot_by_name : Map[String, Int]
  variable_id_by_slot : Array[String]
  mut variable_values : Array[Json]
  mut variable_numeric_flags : Array[Bool]
  lists : Map[String, Array[Json]]
  list_names : Map[String, String]
  list_slot_by_id : Map[String, Int]
  list_slot_by_name : Map[String, Int]
  list_id_by_slot : Array[String]
  mut list_values : Array[Array[Json]]
  blocks : Map[String, ScratchBlock]
  const_number_block_values : Map[String, Double]
  procedures : Map[String, ProcedureSpec]
  block_pc_by_id : Map[String, Int]
  blocks_by_pc : Array[ScratchBlock]
  block_fast_meta_by_pc : Array[BlockFastMeta]
  mut numeric_program_cache : Map[String, NumericReporterProgram]
  mut numeric_program_compile_failed : Map[String, Bool]
  mut bool_program_cache : Map[String, BoolReporterProgram]
  mut bool_program_compile_failed : Map[String, Bool]
  top_level_hats : Array[String]
  green_flag_starts : Array[String]
  stage_clicked_starts : Array[String]
  sprite_clicked_starts : Array[String]
  clone_start_starts : Array[String]
  key_pressed_hats : Array[KeyPressedHatStart]
  broadcast_hats : Array[BroadcastHatStart]
  backdrop_hats : Array[BackdropHatStart]
  predicate_hats : Array[PredicateHatStart]
}

///|
pub(all) struct RenderFrame {
  width : Int
  height : Int
  pixels : Array[Byte]
}

///|
pub(all) struct Thread {
  id : Int
  target_index : Int
  mut pc : Int?
  mut wait_until_ms : Int?
  mut wait_for_input : String?
  mut done : Bool
  mut warp_mode : Bool
  mut warp_started_ms : Int
  mut stack : Array[ControlFrame]
  mut loop_counters : Map[String, Int]
  parent_waiter : Int?
}

///|
pub(all) struct ProcedureFrame {
  return_pc : Int?
  control_depth : Int
  params : Map[String, Json]
  proccode : String
  mut warp_mode : Bool
}
