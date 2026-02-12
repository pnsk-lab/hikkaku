///|
test "default options" {
  let options = default_vm_options()
  inspect(options.max_clones, content="300")
  inspect(options.turbo, content="false")
}
