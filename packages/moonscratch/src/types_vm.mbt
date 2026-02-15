///|
pub(all) struct PrecompiledProject {
  targets : Array[TargetState]
  stage_index : Int
  assets : Map[String, Json]
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
