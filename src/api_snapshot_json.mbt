///|
fn target_snapshot_json(target : TargetState) -> Json {
  let lists_json = {}
  target.lists.each((list_id, items) => lists_json[list_id] = json_array(items))

  json_object({
    "id": json_string(target.id),
    "name": json_string(target.name),
    "isStage": json_bool(target.is_stage),
    "x": json_number(target.x),
    "y": json_number(target.y),
    "direction": json_number(target.direction),
    "size": json_number(target.size),
    "volume": json_number(target.volume),
    "musicInstrument": json_number(
      Double::from_int(target.music_instrument + 1),
    ),
    "textToSpeechVoice": json_string(target.tts_voice),
    "visible": json_bool(target.visible),
    "currentCostume": json_number(Double::from_int(target.current_costume)),
    "variables": json_object(target.variables),
    "lists": json_object(lists_json),
  })
}

///|
fn snapshot_to_json(vm : Vm) -> Json {
  let targets = []
  for target in vm.targets {
    if !target.deleted {
      targets.push(target_snapshot_json(target))
    }
  }
  json_object({
    "runId": json_number(Double::from_int(vm.run_id)),
    "nowMs": json_number(Double::from_int(vm.now_ms)),
    "running": json_bool(vm.running),
    "answer": json_string(vm.answer),
    "musicTempo": json_number(vm.music_tempo),
    "textToSpeechLanguage": json_string(vm.tts_language),
    "activeThreads": json_number(Double::from_int(vm.threads.length())),
    "targets": json_array(targets),
  })
}
