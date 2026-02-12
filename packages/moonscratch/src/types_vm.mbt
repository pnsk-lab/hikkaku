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
  mut waiting_children : Map[Int, Int]
  mut rng_state : Int
  mut control_counter : Int
  mut next_clone_id : Int
  mut hat_predicates : Map[String, Bool]
  mut timer_start_ms : Int
  mut music_tempo : Double
  mut tts_language : String
  mut procedure_frames : Map[Int, Array[ProcedureFrame]]
  mut pending_translate_requests : Map[String, Bool]
  mut current_thread_id : Int?
}

///|
pub(all) struct StepReport {
  now_ms : Int
  active_threads : Int
  stepped_threads : Int
  emitted_effects : Int
} derive(Show, Eq, ToJson)
