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

  let vm_result = try? @moonscratch.vm_new_from_json(minimal_project)
  match vm_result {
    Ok(vm) => {
      @moonscratch.vm_start(vm)
      let report = @moonscratch.vm_step(vm, 16)
      println("step report: \{report}")
    }
    Err(_) => println("failed to initialize vm")
  }
}
