///|
fn parse_options_json(options_json : String?) -> VmOptions raise VmError {
  let options = default_vm_options()
  match options_json {
    Some(raw) => {
      if raw.trim().is_empty() {
        return options
      }
      let parsed = parse_json_or_fail(raw)
      let obj = expect_object(parsed, "options")
      options.turbo = object_get_bool_or(obj, "turbo", options.turbo)
      options.compatibility_30tps = object_get_bool_or(
        obj,
        "compatibility_30tps",
        options.compatibility_30tps,
      )
      options.max_clones = object_get_number_or(
        obj,
        "max_clones",
        Double::from_int(options.max_clones),
      ).to_int()
      options.deterministic = object_get_bool_or(
        obj,
        "deterministic",
        options.deterministic,
      )
      options.seed = object_get_number_or(
        obj,
        "seed",
        Double::from_int(options.seed),
      ).to_int()
      options.pen_width = object_get_number_or(
        obj,
        "pen_width",
        Double::from_int(options.pen_width),
      ).to_int()
      options.pen_height = object_get_number_or(
        obj,
        "pen_height",
        Double::from_int(options.pen_height),
      ).to_int()
      if options.pen_width <= 0 {
        options.pen_width = 480
      }
      if options.pen_height <= 0 {
        options.pen_height = 360
      }
      options
    }
    None => options
  }
}
