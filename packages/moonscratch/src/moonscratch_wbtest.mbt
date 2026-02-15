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

///|
test "compile project to generated wasm bytes" {
  let minimal_project = "{\"targets\":[{\"isStage\":true,\"name\":\"Stage\",\"variables\":{},\"lists\":{},\"blocks\":{},\"costumes\":[]}]}"
  let wasm_result = try? vm_compile_project_to_wasm(minimal_project)
  let wasm_base64 = match wasm_result {
    Ok(value) => value
    Err(_) => fail("vm_compile_project_to_wasm failed")
  }
  let decoded = @base64.decode(wasm_base64.view()) catch {
    _ => fail("vm_compile_project_to_wasm returned invalid base64")
  }
  let bytes = decoded.to_array()
  if bytes.length() < 4 {
    fail("wasm bytes are too short")
  }
  inspect(bytes[0] == (0x00).to_byte(), content="true")
  inspect(bytes[1] == (0x61).to_byte(), content="true")
  inspect(bytes[2] == (0x73).to_byte(), content="true")
  inspect(bytes[3] == (0x6d).to_byte(), content="true")
}
