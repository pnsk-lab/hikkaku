///|
priv struct EffectUniforms {
  enable_color : Bool
  enable_fisheye : Bool
  enable_whirl : Bool
  enable_pixelate : Bool
  enable_mosaic : Bool
  enable_brightness : Bool
  enable_ghost : Bool
  u_color : Double
  u_fisheye : Double
  u_whirl : Double
  u_pixelate : Double
  u_mosaic : Double
  u_brightness : Double
  u_ghost : Double
}

///|
fn render_clamp_int(value : Int, min : Int, max : Int) -> Int {
  if value < min {
    min
  } else if value > max {
    max
  } else {
    value
  }
}

///|
fn render_clamp_double(value : Double, min : Double, max : Double) -> Double {
  if value < min {
    min
  } else if value > max {
    max
  } else {
    value
  }
}

///|
fn render_min_double(left : Double, right : Double) -> Double {
  if left < right {
    left
  } else {
    right
  }
}

///|
fn render_max_double(left : Double, right : Double) -> Double {
  if left > right {
    left
  } else {
    right
  }
}

///|
fn render_positive_mod_1(value : Double) -> Double {
  let raw = value.mod(1.0)
  if raw < 0.0 {
    raw + 1.0
  } else {
    raw
  }
}

///|
fn render_rgb_to_hsv01(
  r : Double,
  g : Double,
  b : Double,
) -> (Double, Double, Double) {
  let max = if r >= g && r >= b { r } else if g >= r && g >= b { g } else { b }
  let min = if r <= g && r <= b { r } else if g <= r && g <= b { g } else { b }
  let delta = max - min
  let mut h = 0.0
  if delta != 0.0 {
    if max == r {
      h = ((g - b) / delta).mod(6.0)
    } else if max == g {
      h = (b - r) / delta + 2.0
    } else {
      h = (r - g) / delta + 4.0
    }
    h /= 6.0
    h = render_positive_mod_1(h)
  }
  let s = if max == 0.0 { 0.0 } else { delta / max }
  (h, s, max)
}

///|
fn render_hsv01_to_rgb(
  h : Double,
  s : Double,
  v : Double,
) -> (Double, Double, Double) {
  if s <= 0.0 {
    return (v, v, v)
  }
  let hh = render_positive_mod_1(h) * 6.0
  let i = hh.floor().to_int()
  let f = hh - Double::from_int(i)
  let p = v * (1.0 - s)
  let q = v * (1.0 - s * f)
  let t = v * (1.0 - s * (1.0 - f))
  match i.mod(6) {
    0 => (v, t, p)
    1 => (q, v, p)
    2 => (p, v, t)
    3 => (p, q, v)
    4 => (t, p, v)
    _ => (v, p, q)
  }
}

///|
fn render_hsv100_to_rgb(h : Double, s : Double, v : Double) -> (Int, Int, Int) {
  let (rr, gg, bb) = render_hsv01_to_rgb(
    render_positive_mod_1(h / 100.0),
    render_clamp_double(s / 100.0, 0.0, 1.0),
    render_clamp_double(v / 100.0, 0.0, 1.0),
  )
  (
    render_clamp_int((rr * 255.0).round().to_int(), 0, 255),
    render_clamp_int((gg * 255.0).round().to_int(), 0, 255),
    render_clamp_int((bb * 255.0).round().to_int(), 0, 255),
  )
}

///|
fn render_target_pen_rgba(target : TargetState) -> (Int, Int, Int, Int) {
  let (r, g, b) = render_hsv100_to_rgb(
    target.pen_color,
    target.pen_saturation,
    target.pen_brightness,
  )
  let alpha = render_clamp_int(
    ((100.0 - render_clamp_double(target.pen_transparency, 0.0, 100.0)) *
    255.0 /
    100.0)
    .round()
    .to_int(),
    0,
    255,
  )
  (r, g, b, alpha)
}

///|
fn render_blend_rgba(
  dst : (Int, Int, Int, Int),
  src : (Int, Int, Int, Int),
) -> (Int, Int, Int, Int) {
  let (dr, dg, db, da) = dst
  let (sr, sg, sb, sa) = src
  if sa <= 0 {
    return dst
  }
  if da <= 0 {
    return src
  }
  let src_a = Double::from_int(sa) / 255.0
  let dst_a = Double::from_int(da) / 255.0
  let out_a = src_a + dst_a * (1.0 - src_a)
  if out_a <= 0.0 {
    return (0, 0, 0, 0)
  }
  let out_r = (
      Double::from_int(sr) * src_a +
      Double::from_int(dr) * dst_a * (1.0 - src_a)
    ) /
    out_a
  let out_g = (
      Double::from_int(sg) * src_a +
      Double::from_int(dg) * dst_a * (1.0 - src_a)
    ) /
    out_a
  let out_b = (
      Double::from_int(sb) * src_a +
      Double::from_int(db) * dst_a * (1.0 - src_a)
    ) /
    out_a
  (
    render_clamp_int(out_r.round().to_int(), 0, 255),
    render_clamp_int(out_g.round().to_int(), 0, 255),
    render_clamp_int(out_b.round().to_int(), 0, 255),
    render_clamp_int((out_a * 255.0).round().to_int(), 0, 255),
  )
}

///|
fn vm_clear_pen_pixels(vm : Vm) -> Unit {
  for i in 0..<vm.pen_pixels.length() {
    vm.pen_pixels[i] = b'\x00'
  }
}

///|
fn render_stage_to_pixel(vm : Vm, x : Double, y : Double) -> (Int, Int) {
  let px = ((x + 240.0) / 480.0 * Double::from_int(vm.pen_width))
    .floor()
    .to_int()
  let py = ((180.0 - y) / 360.0 * Double::from_int(vm.pen_height))
    .floor()
    .to_int()
  (px, py)
}

///|
fn render_pixel_to_stage(vm : Vm, px : Int, py : Int) -> (Double, Double) {
  let x = (Double::from_int(px) + 0.5) / Double::from_int(vm.pen_width) * 480.0 -
    240.0
  let y = 180.0 -
    (Double::from_int(py) + 0.5) / Double::from_int(vm.pen_height) * 360.0
  (x, y)
}

///|
fn render_pen_pixel_base(vm : Vm, px : Int, py : Int) -> Int? {
  if px < 0 || py < 0 || px >= vm.pen_width || py >= vm.pen_height {
    return None
  }
  let base = (py * vm.pen_width + px) * 4
  if base + 3 >= vm.pen_pixels.length() {
    None
  } else {
    Some(base)
  }
}

///|
fn render_read_pen_pixel(vm : Vm, px : Int, py : Int) -> (Int, Int, Int, Int)? {
  match render_pen_pixel_base(vm, px, py) {
    Some(base) =>
      Some(
        (
          vm.pen_pixels[base].to_int(),
          vm.pen_pixels[base + 1].to_int(),
          vm.pen_pixels[base + 2].to_int(),
          vm.pen_pixels[base + 3].to_int(),
        ),
      )
    None => None
  }
}

///|
fn render_write_pen_pixel(
  vm : Vm,
  px : Int,
  py : Int,
  rgba : (Int, Int, Int, Int),
) -> Unit {
  match render_pen_pixel_base(vm, px, py) {
    Some(base) => {
      let (r, g, b, a) = rgba
      vm.pen_pixels[base] = render_clamp_int(r, 0, 255).to_byte()
      vm.pen_pixels[base + 1] = render_clamp_int(g, 0, 255).to_byte()
      vm.pen_pixels[base + 2] = render_clamp_int(b, 0, 255).to_byte()
      vm.pen_pixels[base + 3] = render_clamp_int(a, 0, 255).to_byte()
    }
    None => ()
  }
}

///|
fn render_blend_pen_pixel(
  vm : Vm,
  px : Int,
  py : Int,
  src : (Int, Int, Int, Int),
) -> Unit {
  match render_read_pen_pixel(vm, px, py) {
    Some(dst) => render_write_pen_pixel(vm, px, py, render_blend_rgba(dst, src))
    None => ()
  }
}

///|
fn render_pen_brush_radius(vm : Vm, target : TargetState) -> Int {
  let sx = Double::from_int(vm.pen_width) / 480.0
  let sy = Double::from_int(vm.pen_height) / 360.0
  let scale = if sx < sy { sx } else { sy }
  let diameter = render_clamp_double(
    target.pen_size * scale,
    1.0,
    1200.0 * scale,
  )
  render_clamp_int((diameter / 2.0).floor().to_int(), 0, 6000)
}

///|
fn render_draw_pen_circle(
  vm : Vm,
  cx : Int,
  cy : Int,
  radius : Int,
  color : (Int, Int, Int, Int),
) -> Unit {
  let rr = radius * radius
  for y in (cy - radius)..<=(cy + radius) {
    for x in (cx - radius)..<=(cx + radius) {
      let dx = x - cx
      let dy = y - cy
      if dx * dx + dy * dy <= rr {
        render_blend_pen_pixel(vm, x, y, color)
      }
    }
  }
}

///|
fn render_draw_pen_line(
  vm : Vm,
  target_index : Int,
  old_x : Double,
  old_y : Double,
  new_x : Double,
  new_y : Double,
) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  let target = vm.targets[target_index]
  if target.is_stage || target.deleted {
    return
  }
  let (r, g, b, a) = render_target_pen_rgba(target)
  if a <= 0 {
    return
  }
  let color = (r, g, b, a)
  let radius = render_pen_brush_radius(vm, target)
  let (x0, y0) = render_stage_to_pixel(vm, old_x, old_y)
  let (x1, y1) = render_stage_to_pixel(vm, new_x, new_y)
  let dx = x1 - x0
  let dy = y1 - y0
  let steps = if dx.abs() > dy.abs() { dx.abs() } else { dy.abs() }
  if steps <= 0 {
    render_draw_pen_circle(vm, x0, y0, radius, color)
    return
  }
  for i in 0..<=steps {
    let t = Double::from_int(i) / Double::from_int(steps)
    let x = (Double::from_int(x0) + Double::from_int(dx) * t).round().to_int()
    let y = (Double::from_int(y0) + Double::from_int(dy) * t).round().to_int()
    render_draw_pen_circle(vm, x, y, radius, color)
  }
}

///|
fn render_draw_pen_point(vm : Vm, target_index : Int) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  let target = vm.targets[target_index]
  if target.is_stage || target.deleted {
    return
  }
  let (r, g, b, a) = render_target_pen_rgba(target)
  if a <= 0 {
    return
  }
  let radius = render_pen_brush_radius(vm, target)
  let (x, y) = render_stage_to_pixel(vm, target.x, target.y)
  render_draw_pen_circle(vm, x, y, radius, (r, g, b, a))
}

///|
fn move_target_with_pen(
  vm : Vm,
  target_index : Int,
  new_x : Double,
  new_y : Double,
) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  let old_x = vm.targets[target_index].x
  let old_y = vm.targets[target_index].y
  vm.targets[target_index].x = new_x
  vm.targets[target_index].y = new_y
  let target = vm.targets[target_index]
  if target.pen_down && !target.deleted && !target.is_stage {
    render_draw_pen_line(vm, target_index, old_x, old_y, new_x, new_y)
  }
}

///|
fn render_wrap_index(index : Int, count : Int) -> Int {
  if count <= 0 {
    0
  } else {
    let wrapped = index.mod(count)
    if wrapped < 0 {
      wrapped + count
    } else {
      wrapped
    }
  }
}

///|
fn render_current_costume(target : TargetState) -> CostumeImage? {
  if target.costumes.is_empty() {
    None
  } else {
    Some(
      target.costumes[render_wrap_index(
        target.current_costume,
        target.costumes.length(),
      )],
    )
  }
}

///|
fn render_effect_uniforms(target : TargetState) -> EffectUniforms {
  let u_color = (target.looks_effect_color / 200.0).mod(1.0)
  let u_fisheye = render_max_double(
    0.0,
    (target.looks_effect_fisheye + 100.0) / 100.0,
  )
  let u_whirl = -target.looks_effect_whirl * @math.PI / 180.0
  let u_pixelate = target.looks_effect_pixelate.abs() / 10.0
  let mosaic_raw = ((target.looks_effect_mosaic.abs() + 10.0) / 10.0)
    .round()
    .to_int()
  let u_mosaic = Double::from_int(render_clamp_int(mosaic_raw, 1, 512))
  let u_brightness = render_clamp_double(
      target.looks_effect_brightness,
      -100.0,
      100.0,
    ) /
    100.0
  let u_ghost = 1.0 -
    render_clamp_double(target.looks_effect_ghost, 0.0, 100.0) / 100.0
  {
    enable_color: target.looks_effect_color != 0.0,
    enable_fisheye: target.looks_effect_fisheye != 0.0,
    enable_whirl: target.looks_effect_whirl != 0.0,
    enable_pixelate: target.looks_effect_pixelate != 0.0,
    enable_mosaic: target.looks_effect_mosaic != 0.0,
    enable_brightness: target.looks_effect_brightness != 0.0,
    enable_ghost: target.looks_effect_ghost != 0.0,
    u_color,
    u_fisheye,
    u_whirl,
    u_pixelate,
    u_mosaic,
    u_brightness,
    u_ghost,
  }
}

///|
fn render_apply_point_effects(
  u : Double,
  v : Double,
  width : Int,
  height : Int,
  uniforms : EffectUniforms,
) -> (Double, Double) {
  let mut x = u
  let mut y = v
  if uniforms.enable_mosaic {
    x = render_positive_mod_1(uniforms.u_mosaic * x)
    y = render_positive_mod_1(uniforms.u_mosaic * y)
  }
  if uniforms.enable_pixelate && uniforms.u_pixelate > 0.0 {
    let texel_x = Double::from_int(width) / uniforms.u_pixelate
    let texel_y = Double::from_int(height) / uniforms.u_pixelate
    if texel_x > 0.0 && texel_y > 0.0 {
      x = ((x * texel_x).floor() + 0.5) / texel_x
      y = ((y * texel_y).floor() + 0.5) / texel_y
    }
  }
  if uniforms.enable_whirl {
    let offset_x = x - 0.5
    let offset_y = y - 0.5
    let offset_magnitude = (offset_x * offset_x + offset_y * offset_y).sqrt()
    let whirl_factor = render_max_double(1.0 - offset_magnitude / 0.5, 0.0)
    let whirl_actual = uniforms.u_whirl * whirl_factor * whirl_factor
    let sin_whirl = @math.sin(whirl_actual)
    let cos_whirl = @math.cos(whirl_actual)
    x = cos_whirl * offset_x + sin_whirl * offset_y + 0.5
    y = -sin_whirl * offset_x + cos_whirl * offset_y + 0.5
  }
  if uniforms.enable_fisheye {
    let vec_x = (x - 0.5) / 0.5
    let vec_y = (y - 0.5) / 0.5
    let vec_length = (vec_x * vec_x + vec_y * vec_y).sqrt()
    if vec_length > 0.0 {
      let r = @math.pow(render_min_double(vec_length, 1.0), uniforms.u_fisheye) *
        render_max_double(1.0, vec_length)
      let unit_x = vec_x / vec_length
      let unit_y = vec_y / vec_length
      x = 0.5 + r * unit_x * 0.5
      y = 0.5 + r * unit_y * 0.5
    }
  }
  (x, y)
}

///|
fn render_apply_color_effects(
  rgba : (Int, Int, Int, Int),
  uniforms : EffectUniforms,
  include_ghost : Bool,
) -> (Int, Int, Int, Int) {
  let (raw_r, raw_g, raw_b, raw_a) = rgba
  if raw_a <= 0 {
    return (0, 0, 0, 0)
  }

  let mut r = Double::from_int(raw_r)
  let mut g = Double::from_int(raw_g)
  let mut b = Double::from_int(raw_b)
  let mut a = Double::from_int(raw_a)
  let alpha = a / 255.0

  if (uniforms.enable_color || uniforms.enable_brightness) && alpha > 0.0 {
    r /= alpha
    g /= alpha
    b /= alpha

    if uniforms.enable_color {
      let (h0, s0, v0) = render_rgb_to_hsv01(r / 255.0, g / 255.0, b / 255.0)
      let mut h = h0
      let mut s = s0
      let mut v = v0
      let min_v = 0.11 / 2.0
      let min_s = 0.09
      if v < min_v {
        h = 0.0
        s = 1.0
        v = min_v
      } else if s < min_s {
        h = 0.0
        s = min_s
      }
      h = render_positive_mod_1(uniforms.u_color + h + 1.0)
      let (rr, gg, bb) = render_hsv01_to_rgb(h, s, v)
      r = rr * 255.0
      g = gg * 255.0
      b = bb * 255.0
    }

    if uniforms.enable_brightness {
      let shift = uniforms.u_brightness * 255.0
      r += shift
      g += shift
      b += shift
    }

    r *= alpha
    g *= alpha
    b *= alpha
  }

  if include_ghost && uniforms.enable_ghost {
    r *= uniforms.u_ghost
    g *= uniforms.u_ghost
    b *= uniforms.u_ghost
    a *= uniforms.u_ghost
  }

  (
    render_clamp_int(r.round().to_int(), 0, 255),
    render_clamp_int(g.round().to_int(), 0, 255),
    render_clamp_int(b.round().to_int(), 0, 255),
    render_clamp_int(a.round().to_int(), 0, 255),
  )
}

///|
fn render_sample_costume_rgba_uv(
  costume : CostumeImage,
  u : Double,
  v : Double,
) -> (Int, Int, Int, Int)? {
  if costume.width <= 0 || costume.height <= 0 || costume.pixels.length() < 4 {
    return None
  }
  if u < 0.0 || u >= 1.0 || v < 0.0 || v >= 1.0 {
    return None
  }
  let px = (u * Double::from_int(costume.width)).floor().to_int()
  let py = (v * Double::from_int(costume.height)).floor().to_int()
  if px < 0 || py < 0 || px >= costume.width || py >= costume.height {
    return None
  }
  let base = (py * costume.width + px) * 4
  if base + 3 >= costume.pixels.length() {
    return None
  }
  Some(
    (
      costume.pixels[base].to_int(),
      costume.pixels[base + 1].to_int(),
      costume.pixels[base + 2].to_int(),
      costume.pixels[base + 3].to_int(),
    ),
  )
}

///|
fn render_sample_stage_backdrop_at(
  vm : Vm,
  stage_x : Double,
  stage_y : Double,
) -> (Int, Int, Int, Int) {
  let mut out = (255, 255, 255, 255)
  if vm.stage_index < 0 || vm.stage_index >= vm.targets.length() {
    return out
  }
  let stage = vm.targets[vm.stage_index]
  let uniforms = render_effect_uniforms(stage)
  let u = (stage_x + 240.0) / 480.0
  let v = (180.0 - stage_y) / 360.0
  match render_current_costume(stage) {
    Some(costume) => {
      let (uu, vv) = render_apply_point_effects(
        u,
        v,
        costume.width,
        costume.height,
        uniforms,
      )
      match render_sample_costume_rgba_uv(costume, uu, vv) {
        Some(raw) =>
          out = render_blend_rgba(
            out,
            render_apply_color_effects(raw, uniforms, true),
          )
        None => ()
      }
    }
    None => ()
  }
  out
}

///|
fn render_sample_sprite_at(
  vm : Vm,
  target_index : Int,
  stage_x : Double,
  stage_y : Double,
  include_ghost : Bool,
  respect_visibility : Bool,
) -> (Int, Int, Int, Int)? {
  if target_index < 0 || target_index >= vm.targets.length() {
    return None
  }
  let target = vm.targets[target_index]
  if target.deleted || target.is_stage {
    return None
  }
  if respect_visibility && !target.visible {
    return None
  }
  let scale = target.size / 100.0
  if scale <= 0.0 {
    return None
  }
  let costume = match render_current_costume(target) {
    Some(value) => value
    None => return None
  }
  if costume.width <= 0 || costume.height <= 0 || costume.bitmap_resolution <= 0 {
    return None
  }

  let radians = (90.0 - target.direction) * @math.PI / 180.0
  let dx = stage_x - target.x
  let dy = stage_y - target.y
  let local_x = (dx * @math.cos(radians) + dy * @math.sin(radians)) / scale
  let local_y = (-dx * @math.sin(radians) + dy * @math.cos(radians)) / scale
  let bitmap_resolution = Double::from_int(costume.bitmap_resolution)
  let px = local_x * bitmap_resolution + costume.rotation_center_x
  let py = costume.rotation_center_y - local_y * bitmap_resolution
  let mut u = px / Double::from_int(costume.width)
  let mut v = py / Double::from_int(costume.height)
  let uniforms = render_effect_uniforms(target)
  let transformed = render_apply_point_effects(
    u,
    v,
    costume.width,
    costume.height,
    uniforms,
  )
  u = transformed.0
  v = transformed.1

  match render_sample_costume_rgba_uv(costume, u, v) {
    Some(raw) => {
      let transformed_color = render_apply_color_effects(
        raw, uniforms, include_ghost,
      )
      if transformed_color.3 > 0 {
        Some(transformed_color)
      } else {
        None
      }
    }
    None => None
  }
}

///|
fn render_sample_scene_without_target(
  vm : Vm,
  excluded_target_index : Int,
  px : Int,
  py : Int,
) -> (Int, Int, Int, Int) {
  let (stage_x, stage_y) = render_pixel_to_stage(vm, px, py)
  let mut out = render_sample_stage_backdrop_at(vm, stage_x, stage_y)
  match render_read_pen_pixel(vm, px, py) {
    Some(pen_rgba) => out = render_blend_rgba(out, pen_rgba)
    None => ()
  }
  for i, target in vm.targets {
    if i == vm.stage_index || i == excluded_target_index {
      continue
    }
    if target.deleted || target.is_stage || !target.visible {
      continue
    }
    match render_sample_sprite_at(vm, i, stage_x, stage_y, true, true) {
      Some(color) => out = render_blend_rgba(out, color)
      None => ()
    }
  }
  out
}

///|
fn render_rgba_eq(
  left : (Int, Int, Int, Int),
  right : (Int, Int, Int, Int),
) -> Bool {
  left.0 == right.0 &&
  left.1 == right.1 &&
  left.2 == right.2 &&
  left.3 == right.3
}

///|
fn render_svg_append_rect(
  svg : StringBuilder,
  x : Int,
  y : Int,
  width : Int,
  rgba : (Int, Int, Int, Int),
) -> Unit {
  let (r, g, b, a) = rgba
  if width <= 0 || a <= 0 {
    return
  }
  svg.write_string("<rect x=\"")
  svg.write_object(x)
  svg.write_string("\" y=\"")
  svg.write_object(y)
  svg.write_string("\" width=\"")
  svg.write_object(width)
  svg.write_string("\" height=\"1\" fill=\"rgb(")
  svg.write_object(r)
  svg.write_string(",")
  svg.write_object(g)
  svg.write_string(",")
  svg.write_object(b)
  svg.write_string(")\"")
  if a < 255 {
    svg.write_string(" fill-opacity=\"")
    svg.write_object(Double::from_int(a) / 255.0)
    svg.write_string("\"")
  }
  svg.write_string("/>")
}

///|
fn render_scene_to_svg(vm : Vm) -> String {
  let svg = StringBuilder::new()
  svg.write_string("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"")
  svg.write_object(vm.pen_width)
  svg.write_string("\" height=\"")
  svg.write_object(vm.pen_height)
  svg.write_string("\" viewBox=\"0 0 ")
  svg.write_object(vm.pen_width)
  svg.write_string(" ")
  svg.write_object(vm.pen_height)
  svg.write_string("\" shape-rendering=\"crispEdges\">")

  for py in 0..<vm.pen_height {
    let mut px = 0
    while px < vm.pen_width {
      let color = render_sample_scene_without_target(vm, -1, px, py)
      let mut run_width = 1
      while px + run_width < vm.pen_width {
        let next = render_sample_scene_without_target(
          vm,
          -1,
          px + run_width,
          py,
        )
        if !render_rgba_eq(color, next) {
          break
        }
        run_width += 1
      }
      render_svg_append_rect(svg, px, py, run_width, color)
      px += run_width
    }
  }

  svg.write_string("</svg>")
  svg.to_string()
}

///|
fn render_mask_matches(
  sampled : (Int, Int, Int, Int),
  mask_rgb : (Int, Int, Int),
) -> Bool {
  let (sr, sg, sb, sa) = sampled
  let (mr, mg, mb) = mask_rgb
  sa > 0 && sr / 4 == mr / 4 && sg / 4 == mg / 4 && sb / 4 == mb / 4
}

///|
fn render_color_matches(
  sampled_rgb : (Int, Int, Int),
  target_rgb : (Int, Int, Int),
) -> Bool {
  let (sr, sg, sb) = sampled_rgb
  let (tr, tg, tb) = target_rgb
  sr / 8 == tr / 8 && sg / 8 == tg / 8 && sb / 16 == tb / 16
}

///|
fn render_hex_digit_value(ch : Char) -> Int? {
  if ch >= '0' && ch <= '9' {
    Some(ch.to_int() - '0'.to_int())
  } else if ch >= 'a' && ch <= 'f' {
    Some(ch.to_int() - 'a'.to_int() + 10)
  } else if ch >= 'A' && ch <= 'F' {
    Some(ch.to_int() - 'A'.to_int() + 10)
  } else {
    None
  }
}

///|
fn render_parse_hex_color(raw : String) -> (Int, Int, Int)? {
  let chars = raw.trim().to_array()
  if chars.length() < 7 || chars[0] != '#' {
    return None
  }
  let parse_byte = fn(at : Int) {
    if at + 1 >= chars.length() {
      return None
    }
    match
      (render_hex_digit_value(chars[at]), render_hex_digit_value(chars[at + 1])) {
      (Some(hi), Some(lo)) => Some(hi * 16 + lo)
      _ => None
    }
  }
  match (parse_byte(1), parse_byte(3), parse_byte(5)) {
    (Some(r), Some(g), Some(b)) => Some((r, g, b))
    _ => None
  }
}

///|
fn render_json_to_rgb(value : Json) -> (Int, Int, Int) {
  match value {
    String(raw) =>
      match render_parse_hex_color(raw) {
        Some(rgb) => rgb
        None => (0, 0, 0)
      }
    Number(n, ..) => {
      let raw = n.floor().to_int()
      let clamped = if raw < 0 { 0 } else { raw }
      let r = (clamped / 65536).mod(256)
      let g = (clamped / 256).mod(256)
      let b = clamped.mod(256)
      (
        render_clamp_int(r, 0, 255),
        render_clamp_int(g, 0, 255),
        render_clamp_int(b, 0, 255),
      )
    }
    _ => (0, 0, 0)
  }
}

///|
fn target_is_touching_color(
  vm : Vm,
  target_index : Int,
  color_rgb : (Int, Int, Int),
) -> Bool {
  if target_index < 0 || target_index >= vm.targets.length() {
    return false
  }
  let target = vm.targets[target_index]
  if target.deleted || target.is_stage {
    return false
  }
  for py in 0..<vm.pen_height {
    for px in 0..<vm.pen_width {
      let (stage_x, stage_y) = render_pixel_to_stage(vm, px, py)
      match
        render_sample_sprite_at(
          vm, target_index, stage_x, stage_y, false, false,
        ) {
        Some(mask_color) =>
          if mask_color.3 > 0 {
            let sampled = render_sample_scene_without_target(
              vm, target_index, px, py,
            )
            if render_color_matches(
                (sampled.0, sampled.1, sampled.2),
                color_rgb,
              ) {
              return true
            }
          }
        None => ()
      }
    }
  }
  false
}

///|
fn target_color_is_touching_color(
  vm : Vm,
  target_index : Int,
  target_rgb : (Int, Int, Int),
  mask_rgb : (Int, Int, Int),
) -> Bool {
  if target_index < 0 || target_index >= vm.targets.length() {
    return false
  }
  let target = vm.targets[target_index]
  if target.deleted || target.is_stage {
    return false
  }
  for py in 0..<vm.pen_height {
    for px in 0..<vm.pen_width {
      let (stage_x, stage_y) = render_pixel_to_stage(vm, px, py)
      match
        render_sample_sprite_at(
          vm, target_index, stage_x, stage_y, false, false,
        ) {
        Some(mask_color) =>
          if render_mask_matches(mask_color, mask_rgb) {
            let sampled = render_sample_scene_without_target(
              vm, target_index, px, py,
            )
            if render_color_matches(
                (sampled.0, sampled.1, sampled.2),
                target_rgb,
              ) {
              return true
            }
          }
        None => ()
      }
    }
  }
  false
}
