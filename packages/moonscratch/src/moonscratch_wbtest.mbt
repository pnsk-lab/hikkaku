///|
test "default options" {
  let options = default_vm_options()
  inspect(options.max_clones, content="300")
  inspect(options.turbo, content="false")
}

///|
test "compile project to generated wat metadata" {
  let minimal_project = "{\"targets\":[{\"isStage\":true,\"name\":\"Stage\",\"variables\":{},\"lists\":{},\"blocks\":{},\"costumes\":[]}]}"
  let wat_result = try? vm_compile_project_to_wat(minimal_project)
  let wat = match wat_result {
    Ok(value) => value
    Err(_) => fail("vm_compile_project_to_wat failed")
  }
  inspect(wat.contains(";; moonscratch_program_v1"), content="true")
  inspect(wat.contains("(export \"ms_abi_version\")"), content="true")
  inspect(wat.contains("(export \"ms_commands_len\")"), content="true")
}
