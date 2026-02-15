///|
pub(all) struct ControlFrame {
  kind : ControlFrameKind
  mut remaining : Int
  substack : String?
  after : String?
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
  lists : Map[String, Array[Json]]
  list_names : Map[String, String]
  blocks : Map[String, ScratchBlock]
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
  mut pc : String?
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
  return_pc : String?
  control_depth : Int
  params : Map[String, Json]
  proccode : String
  mut warp_mode : Bool
}
