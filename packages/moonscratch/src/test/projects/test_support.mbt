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
  ignore(try? @moonscratch.vm_new_from_json(minimal_project))
}
