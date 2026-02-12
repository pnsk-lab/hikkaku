///|
fn effect_to_json(effect : HostEffect) -> Json {
  match effect {
    PlaySound(target, sound) =>
      json_object({
        "type": json_string("play_sound"),
        "target": json_string(target),
        "sound": json_string(sound),
      })
    PlayNote(target, note, beats, instrument, tempo) =>
      json_object({
        "type": json_string("music_play_note"),
        "target": json_string(target),
        "note": json_number(Double::from_int(note)),
        "beats": json_number(beats),
        "instrument": json_number(Double::from_int(instrument)),
        "tempo": json_number(tempo),
      })
    PlayDrum(target, drum, beats, tempo) =>
      json_object({
        "type": json_string("music_play_drum"),
        "target": json_string(target),
        "drum": json_number(Double::from_int(drum)),
        "beats": json_number(beats),
        "tempo": json_number(tempo),
      })
    TextToSpeech(target, words, voice, language, wait_key) =>
      json_object({
        "type": json_string("text_to_speech"),
        "target": json_string(target),
        "words": json_string(words),
        "voice": json_string(voice),
        "language": json_string(language),
        "waitKey": json_string(wait_key),
      })
    TranslateRequest(words, language) =>
      json_object({
        "type": json_string("translate_request"),
        "words": json_string(words),
        "language": json_string(language),
      })
    StopAllSounds => json_object({ "type": json_string("stop_all_sounds") })
    Say(target, message) =>
      json_object({
        "type": json_string("say"),
        "target": json_string(target),
        "message": json_string(message),
      })
    Think(target, message) =>
      json_object({
        "type": json_string("think"),
        "target": json_string(target),
        "message": json_string(message),
      })
    Ask(question) =>
      json_object({
        "type": json_string("ask"),
        "question": json_string(question),
      })
    Broadcast(message) =>
      json_object({
        "type": json_string("broadcast"),
        "message": json_string(message),
      })
    Log(level, message) =>
      json_object({
        "type": json_string("log"),
        "level": json_string(level),
        "message": json_string(message),
      })
  }
}
