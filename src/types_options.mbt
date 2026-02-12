///|
pub(all) struct ProjectBundle {
  project_json : String
  assets : Map[String, Json]
} derive(Show, Eq, ToJson)

///|
pub(all) struct VmOptions {
  mut turbo : Bool
  mut compatibility_30tps : Bool
  mut max_clones : Int
  mut deterministic : Bool
  mut seed : Int
  mut pen_width : Int
  mut pen_height : Int
} derive(Show, Eq, ToJson)

///|
pub fn default_vm_options() -> VmOptions {
  {
    turbo: false,
    compatibility_30tps: false,
    max_clones: 300,
    deterministic: false,
    seed: 0x1234_5678,
    pen_width: 480,
    pen_height: 360,
  }
}
