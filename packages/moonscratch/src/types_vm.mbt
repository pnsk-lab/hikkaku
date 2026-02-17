///|
pub(all) struct PrecompiledProject {
  targets : Array[TargetState]
  stage_index : Int
  assets : Map[String, Json]
  mut initial_opaque_backdrops : Map[String, Array[Byte]]
}

///|
pub(all) struct PenVectorStroke {
  x0 : Double
  y0 : Double
  x1 : Double
  y1 : Double
  diameter : Double
  offset : Double
  r : Int
  g : Int
  b : Int
  a : Int
}

///|
pub(all) struct Vm {
  targets : Array[TargetState]
  stage_index : Int
  assets : Map[String, Json]
  options : VmOptions
  pen_width : Int
  pen_height : Int
  mut pen_pixels : Array[Byte]
  mut pen_vectors : Array[PenVectorStroke]
  mut render_revision : Int
  mut render_cache_valid : Bool
  mut render_cache_revision : Int
  mut render_cache_pixels : Array[Byte]
  mut pen_bounds_valid : Bool
  mut pen_min_x : Int
  mut pen_min_y : Int
  mut pen_max_x : Int
  mut pen_max_y : Int
  mut backdrop_cache_valid : Bool
  mut backdrop_cache_pixels : Array[Byte]
  mut backdrop_cache_width : Int
  mut backdrop_cache_height : Int
  mut backdrop_cache_stage_index : Int
  mut backdrop_cache_stage_costume_index : Int
  mut backdrop_cache_effect_color : Double
  mut backdrop_cache_effect_fisheye : Double
  mut backdrop_cache_effect_whirl : Double
  mut backdrop_cache_effect_pixelate : Double
  mut backdrop_cache_effect_mosaic : Double
  mut backdrop_cache_effect_brightness : Double
  mut backdrop_cache_effect_ghost : Double
  mut threads : Array[Thread]
  mut next_thread_id : Int
  mut run_id : Int
  mut now_ms : Int
  mut running : Bool
  mut answer : String
  mut effects : Array[HostEffect]
  mut io_state : Map[String, Json]
  mut io_prev_state : Map[String, Json]
  mut waiting_children : Map[Int, Int]
  mut rng_state : Int
  mut control_counter : Int
  mut hot_op_counts : Map[String, Int]
  mut next_clone_id : Int
  mut hat_predicates : Map[String, Bool]
  mut timer_start_ms : Int
  mut music_tempo : Double
  mut tts_language : String
  mut procedure_frames : Map[Int, Array[ProcedureFrame]]
  mut pending_translate_requests : Map[String, Bool]
  mut redraw_requested : Bool
  mut redraw_requested_while_warp : Bool
  mut current_thread_id : Int?
  mut mathop_sin_cache_valid : Bool
  mut mathop_sin_cache_input : Double
  mut mathop_sin_cache_output : Double
  mut mathop_cos_cache_valid : Bool
  mut mathop_cos_cache_input : Double
  mut mathop_cos_cache_output : Double
  mut aot_commands : Array[AotCommand]
  mut aot_pending : Bool
  mut aot_full_green_flag_starts : Map[Int, Array[Int]]
  mut aot_use_full_exec : Bool
  mut aot_wasm_only : Bool
  mut frame_override : FrameReport?
}

///|
pub(all) struct FrameReport {
  active_threads : Int
  tick_count : Int
  op_count : Int
  emitted_effects : Int
  stop_reason : String
  should_render : Bool
  is_in_warp : Bool
} derive(Show, Eq, ToJson)

///|
pub(all) enum AotCommand {
  SetVariable(Int, String, Json)
  ChangeVariable(Int, String, Double)
  HostOpcode(Int, Int)
  HostTail(Int, Int)
} derive(Show, Eq, ToJson)
