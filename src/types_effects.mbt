///|
pub enum HostEffect {
  PlaySound(String, String)
  PlayNote(String, Int, Double, Int, Double)
  PlayDrum(String, Int, Double, Double)
  TextToSpeech(String, String, String, String, String)
  TranslateRequest(String, String)
  StopAllSounds
  Say(String, String)
  Think(String, String)
  Ask(String)
  Broadcast(String)
  Log(String, String)
} derive(Show, Eq, ToJson)

///|
pub enum ControlFrameKind {
  Repeat
  Forever
} derive(Show, Eq, ToJson)
