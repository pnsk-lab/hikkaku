///|
fn main {
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

  let vm_result = try? ({
    let precompiled = @moonscratch.vm_compile_from_json(minimal_project)
    @moonscratch.vm_new_from_compiled(precompiled)
  })
  match vm_result {
    Ok(vm) => {
      @moonscratch.vm_start(vm)
      @moonscratch.vm_set_time(vm, 16)
      let report = @moonscratch.vm_step_frame(vm)
      println("step report: \{report}")
    }
    Err(_) => println("failed to initialize vm")
  }
}
