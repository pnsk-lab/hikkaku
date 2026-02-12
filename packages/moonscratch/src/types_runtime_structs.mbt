///|
pub(all) struct ControlFrame {
  kind : ControlFrameKind
  mut remaining : Int
  substack : String?
  after : String?
} derive(Show, Eq, ToJson)

///|
pub(all) struct ScratchBlock {
  id : String
  opcode : String
  next : String?
  parent : String?
  inputs : Map[String, Json]
  fields : Map[String, Json]
  mutation : Map[String, Json]
  top_level : Bool
} derive(Show, Eq, ToJson)

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
}

///|
pub(all) struct Thread {
  id : Int
  target_index : Int
  mut pc : String?
  mut wait_until_ms : Int?
  mut wait_for_input : String?
  mut done : Bool
  mut stack : Array[ControlFrame]
  mut loop_counters : Map[String, Int]
  parent_waiter : Int?
}

///|
pub(all) struct ProcedureFrame {
  return_pc : String?
  params : Map[String, Json]
}
