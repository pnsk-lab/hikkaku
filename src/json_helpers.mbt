///|
fn[T] invalid_project(message : String) -> T raise VmError {
  raise VmError::InvalidProject(message)
}

///|
fn parse_json_or_fail(raw : String) -> Json raise VmError {
  let parsed = try? @json.parse(raw)
  match parsed {
    Ok(json) => json
    Err(err) => invalid_project("failed to parse json: \{err}")
  }
}

///|
fn expect_object(
  json : Json,
  context : String,
) -> Map[String, Json] raise VmError {
  match json {
    Object(map) => map
    _ => invalid_project("\{context} must be a JSON object")
  }
}

///|
fn expect_array(json : Json, context : String) -> Array[Json] raise VmError {
  match json {
    Array(values) => values
    _ => invalid_project("\{context} must be a JSON array")
  }
}

///|
fn object_get(obj : Map[String, Json], key : String) -> Json? {
  obj.get(key)
}

///|
fn object_get_or(
  obj : Map[String, Json],
  key : String,
  fallback : Json,
) -> Json {
  obj.get_or_default(key, fallback)
}

///|
fn object_get_string_or(
  obj : Map[String, Json],
  key : String,
  fallback : String,
) -> String {
  match obj.get(key) {
    Some(String(s)) => s
    _ => fallback
  }
}

///|
fn object_get_bool_or(
  obj : Map[String, Json],
  key : String,
  fallback : Bool,
) -> Bool {
  match obj.get(key) {
    Some(True) => true
    Some(False) => false
    _ => fallback
  }
}

///|
fn object_get_number_or(
  obj : Map[String, Json],
  key : String,
  fallback : Double,
) -> Double {
  match obj.get(key) {
    Some(Number(n, ..)) => n
    _ => fallback
  }
}

///|
fn object_get_object_or_empty(
  obj : Map[String, Json],
  key : String,
) -> Map[String, Json] {
  match obj.get(key) {
    Some(Object(map)) => map
    _ => {}
  }
}

///|
fn json_to_string_value(json : Json) -> String {
  match json {
    String(s) => s
    Number(n, ..) => n.to_string()
    True => "true"
    False => "false"
    Null => ""
    _ => json.stringify()
  }
}

///|
fn parse_double_or_none(s : String) -> Double? {
  let trimmed = s.trim().to_string()
  if trimmed.is_empty() {
    None
  } else {
    let parsed = try? @strconv.parse_double(trimmed)
    match parsed {
      Ok(value) => Some(value)
      Err(_) => None
    }
  }
}

///|
fn json_to_number_value(json : Json) -> Double {
  match json {
    Number(n, ..) => n
    String(s) =>
      match parse_double_or_none(s) {
        Some(value) => value
        None => 0.0
      }
    True => 1.0
    False => 0.0
    Null => 0.0
    _ => 0.0
  }
}

///|
fn json_to_bool_value(json : Json) -> Bool {
  match json {
    True => true
    False => false
    Number(n, ..) => n != 0.0
    String(s) => {
      let lowered = s.trim().to_lower()
      lowered != "" && lowered != "0" && lowered != "false"
    }
    Null => false
    _ => true
  }
}

///|
fn json_number(value : Double) -> Json {
  Json::number(value)
}

///|
fn json_string(value : String) -> Json {
  Json::string(value)
}

///|
fn json_bool(value : Bool) -> Json {
  Json::boolean(value)
}

///|
fn json_array(values : Array[Json]) -> Json {
  Json::array(values)
}

///|
fn json_object(values : Map[String, Json]) -> Json {
  Json::object(values)
}
