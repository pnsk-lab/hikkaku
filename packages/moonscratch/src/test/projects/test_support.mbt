///|
fn _test_dependency_probe() -> Unit {
  let minimal_project =
    #|{
    #|  "targets": [
    #|    {
    #|      "isStage": true,
    #|      "name": "Stage",
    #|      "variables": {},
    #|      "lists": {},
    #|      "blocks": {}
    #|    }
    #|  ]
    #|}
  ignore(try? @json.parse("null"))
  ignore(try? vm_new_precompiled_from_json(minimal_project))
}

///|
fn vm_new_precompiled_from_json(
  project_json : String,
  assets_json? : String,
  options_json? : String,
) -> @moonscratch.Vm raise @moonscratch.VmError {
  let precompiled = match assets_json {
    Some(assets_json) =>
      @moonscratch.vm_compile_from_json(project_json, assets_json~)
    None => @moonscratch.vm_compile_from_json(project_json)
  }
  match options_json {
    Some(options_json) =>
      @moonscratch.vm_new_from_compiled(precompiled, options_json~)
    None => @moonscratch.vm_new_from_compiled(precompiled)
  }
}
