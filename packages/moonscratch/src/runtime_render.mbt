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
  vm.pen_pixels.clear()
}

///|
fn ensure_pen_pixels(vm : Vm) -> Unit {
  let required = vm.pen_width * vm.pen_height * 4
  if required <= 0 {
    vm.pen_pixels.clear()
    return
  }
  if vm.pen_pixels.length() == required {
    return
  }
  vm.pen_pixels.clear()
  for _ in 0..<required {
    vm.pen_pixels.push(b'\x00')
  }
}

///|
fn render_stage_to_pixel_double(
  vm : Vm,
  x : Double,
  y : Double,
) -> (Double, Double) {
  (
    (x + 240.0) / 480.0 * Double::from_int(vm.pen_width),
    (180.0 - y) / 360.0 * Double::from_int(vm.pen_height),
  )
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
fn render_blend_pen_pixel_base(
  vm : Vm,
  base : Int,
  src : (Int, Int, Int, Int),
) -> Unit {
  let (sr, sg, sb, sa) = src
  if sa <= 0 {
    return
  }
  if sa >= 255 {
    vm.pen_pixels[base] = sr.to_byte()
    vm.pen_pixels[base + 1] = sg.to_byte()
    vm.pen_pixels[base + 2] = sb.to_byte()
    vm.pen_pixels[base + 3] = sa.to_byte()
    return
  }
  let da = vm.pen_pixels[base + 3].to_int()
  if da <= 0 {
    vm.pen_pixels[base] = sr.to_byte()
    vm.pen_pixels[base + 1] = sg.to_byte()
    vm.pen_pixels[base + 2] = sb.to_byte()
    vm.pen_pixels[base + 3] = sa.to_byte()
    return
  }
  let blended = render_blend_rgba(
    (
      vm.pen_pixels[base].to_int(),
      vm.pen_pixels[base + 1].to_int(),
      vm.pen_pixels[base + 2].to_int(),
      da,
    ),
    src,
  )
  vm.pen_pixels[base] = blended.0.to_byte()
  vm.pen_pixels[base + 1] = blended.1.to_byte()
  vm.pen_pixels[base + 2] = blended.2.to_byte()
  vm.pen_pixels[base + 3] = blended.3.to_byte()
}

///|
fn render_draw_thin_opaque_pen_line(
  vm : Vm,
  x0 : Double,
  y0 : Double,
  x1 : Double,
  y1 : Double,
  rgb : (Int, Int, Int),
) -> Unit {
  let width = vm.pen_width
  let height = vm.pen_height
  if width <= 0 || height <= 0 {
    return
  }
  ensure_pen_pixels(vm)
  let (r, g, b) = rgb
  let dx = x1 - x0
  let dy = y1 - y0
  let steps = render_max_double(dx.abs(), dy.abs()).ceil().to_int()
  let draw = fn(px : Int, py : Int) {
    if px < 0 || py < 0 || px >= width || py >= height {
      return
    }
    let base = (py * width + px) * 4
    vm.pen_pixels[base] = r.to_byte()
    vm.pen_pixels[base + 1] = g.to_byte()
    vm.pen_pixels[base + 2] = b.to_byte()
    vm.pen_pixels[base + 3] = b'\xff'
  }
  if steps <= 0 {
    draw(x0.floor().to_int(), y0.floor().to_int())
    return
  }
  let step_x = dx / Double::from_int(steps)
  let step_y = dy / Double::from_int(steps)
  let mut cx = x0
  let mut cy = y0
  for _ in 0..<=steps {
    draw(cx.floor().to_int(), cy.floor().to_int())
    cx += step_x
    cy += step_y
  }
}

///|
fn render_draw_thin_opaque_pen_axis(
  vm : Vm,
  x0 : Double,
  y0 : Double,
  x1 : Double,
  y1 : Double,
  rgb : (Int, Int, Int),
) -> Bool {
  let width = vm.pen_width
  let height = vm.pen_height
  if width <= 0 || height <= 0 {
    return true
  }
  let (r, g, b) = rgb
  if x0 == x1 {
    let px = x0.floor().to_int()
    if px < 0 || px >= width {
      return true
    }
    let min_py = render_min_double(y0, y1).floor().to_int()
    let max_py = render_max_double(y0, y1).floor().to_int()
    if max_py < 0 || min_py >= height {
      return true
    }
    let start_py = render_clamp_int(min_py, 0, height - 1)
    let end_py = render_clamp_int(max_py, 0, height - 1)
    for py in start_py..<=end_py {
      let base = (py * width + px) * 4
      vm.pen_pixels[base] = r.to_byte()
      vm.pen_pixels[base + 1] = g.to_byte()
      vm.pen_pixels[base + 2] = b.to_byte()
      vm.pen_pixels[base + 3] = b'\xff'
    }
    return true
  }
  if y0 == y1 {
    let py = y0.floor().to_int()
    if py < 0 || py >= height {
      return true
    }
    let min_px = render_min_double(x0, x1).floor().to_int()
    let max_px = render_max_double(x0, x1).floor().to_int()
    if max_px < 0 || min_px >= width {
      return true
    }
    let start_px = render_clamp_int(min_px, 0, width - 1)
    let end_px = render_clamp_int(max_px, 0, width - 1)
    let row_base = py * width * 4
    for px in start_px..<=end_px {
      let base = row_base + px * 4
      vm.pen_pixels[base] = r.to_byte()
      vm.pen_pixels[base + 1] = g.to_byte()
      vm.pen_pixels[base + 2] = b.to_byte()
      vm.pen_pixels[base + 3] = b'\xff'
    }
    return true
  }
  false
}

///|
fn render_blend_pen_pixel(
  vm : Vm,
  px : Int,
  py : Int,
  src : (Int, Int, Int, Int),
) -> Unit {
  ensure_pen_pixels(vm)
  match render_pen_pixel_base(vm, px, py) {
    Some(base) => render_blend_pen_pixel_base(vm, base, src)
    None => ()
  }
}

///|
fn render_pen_line_diameter(vm : Vm, target : TargetState) -> Double {
  let sx = Double::from_int(vm.pen_width) / 480.0
  let sy = Double::from_int(vm.pen_height) / 360.0
  let scale = if sx < sy { sx } else { sy }
  render_clamp_double(target.pen_size * scale, 1.0, 1200.0 * scale)
}

///|
fn render_pen_line_offset(target : TargetState) -> Double {
  if target.pen_size == 1.0 || target.pen_size == 3.0 {
    0.5
  } else {
    0.0
  }
}

///|
fn render_draw_pen_capsule(
  vm : Vm,
  x0 : Double,
  y0 : Double,
  x1 : Double,
  y1 : Double,
  diameter : Double,
  color : (Int, Int, Int, Int),
) -> Unit {
  let (r, g, b, a) = color
  if a <= 0 || diameter <= 0.0 {
    return
  }
  let fade_radius = (diameter + 1.0) / 2.0
  let min_x = (render_min_double(x0, x1) - fade_radius).floor().to_int()
  let max_x = (render_max_double(x0, x1) + fade_radius).ceil().to_int()
  let min_y = (render_min_double(y0, y1) - fade_radius).floor().to_int()
  let max_y = (render_max_double(y0, y1) + fade_radius).ceil().to_int()
  let seg_dx = x1 - x0
  let seg_dy = y1 - y0
  let seg_len_sq = seg_dx * seg_dx + seg_dy * seg_dy
  for py in min_y..<=max_y {
    let sample_y = Double::from_int(py) + 0.5
    for px in min_x..<=max_x {
      let sample_x = Double::from_int(px) + 0.5
      let mut t = 0.0
      if seg_len_sq > 0.0 {
        t = ((sample_x - x0) * seg_dx + (sample_y - y0) * seg_dy) / seg_len_sq
        t = render_clamp_double(t, 0.0, 1.0)
      }
      let nearest_x = x0 + seg_dx * t
      let nearest_y = y0 + seg_dy * t
      let dist_x = sample_x - nearest_x
      let dist_y = sample_y - nearest_y
      let distance = (dist_x * dist_x + dist_y * dist_y).sqrt()
      let coverage = render_clamp_double(fade_radius - distance, 0.0, 1.0)
      if coverage > 0.0 {
        let alpha = render_clamp_int(
          (Double::from_int(a) * coverage).round().to_int(),
          0,
          255,
        )
        if alpha > 0 {
          render_blend_pen_pixel(vm, px, py, (r, g, b, alpha))
        }
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
  let diameter = render_pen_line_diameter(vm, target)
  let offset = render_pen_line_offset(target)
  let (x0, y0) = render_stage_to_pixel_double(vm, old_x, old_y)
  let (x1, y1) = render_stage_to_pixel_double(vm, new_x, new_y)
  if diameter <= 1.0 &&
    a >= 255 &&
    (old_x == new_x || old_y == new_y) &&
    old_x.floor() == old_x &&
    old_y.floor() == old_y &&
    new_x.floor() == new_x &&
    new_y.floor() == new_y {
    if render_draw_thin_opaque_pen_axis(
        vm,
        x0 + offset,
        y0 + offset,
        x1 + offset,
        y1 + offset,
        (r, g, b),
      ) {
      return
    }
    render_draw_thin_opaque_pen_line(
      vm,
      x0 + offset,
      y0 + offset,
      x1 + offset,
      y1 + offset,
      (r, g, b),
    )
    return
  }
  render_draw_pen_capsule(
    vm,
    x0 + offset,
    y0 + offset,
    x1 + offset,
    y1 + offset,
    diameter,
    color,
  )
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
  vm.redraw_requested = true
  let diameter = render_pen_line_diameter(vm, target)
  let offset = render_pen_line_offset(target)
  let (x, y) = render_stage_to_pixel_double(vm, target.x, target.y)
  if diameter <= 1.0 &&
    a >= 255 &&
    target.x.floor() == target.x &&
    target.y.floor() == target.y {
    render_draw_thin_opaque_pen_line(
      vm,
      x + offset,
      y + offset,
      x + offset,
      y + offset,
      (r, g, b),
    )
    return
  }
  render_draw_pen_capsule(
    vm,
    x + offset,
    y + offset,
    x + offset,
    y + offset,
    diameter,
    (r, g, b, a),
  )
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
  if old_x != new_x || old_y != new_y {
    vm.redraw_requested = true
  }
  let target = vm.targets[target_index]
  if target.pen_down && !target.deleted && !target.is_stage {
    render_draw_pen_line(vm, target_index, old_x, old_y, new_x, new_y)
    vm.redraw_requested = true
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
fn render_stamp_sprite_to_pen(vm : Vm, target_index : Int) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  let target = vm.targets[target_index]
  if target.deleted || target.is_stage {
    return
  }
  let scale = target.size / 100.0
  if scale <= 0.0 {
    return
  }
  let costume = match render_current_costume(target) {
    Some(value) => value
    None => return
  }
  if costume.width <= 0 || costume.height <= 0 || costume.bitmap_resolution <= 0 {
    return
  }

  let pen_width = vm.pen_width
  let pen_height = vm.pen_height
  if pen_width <= 0 || pen_height <= 0 {
    return
  }

  ensure_pen_pixels(vm)

  let uniforms = render_effect_uniforms(target)
  let has_point_effects = uniforms.enable_mosaic ||
    uniforms.enable_pixelate ||
    uniforms.enable_whirl ||
    uniforms.enable_fisheye
  let has_color_effects = uniforms.enable_color ||
    uniforms.enable_brightness ||
    uniforms.enable_ghost

  let radians = (90.0 - target.direction) * @math.PI / 180.0
  let cos_radians = @math.cos(radians)
  let sin_radians = @math.sin(radians)
  let inv_scale = 1.0 / scale

  let pen_width_double = Double::from_int(pen_width)
  let pen_height_double = Double::from_int(pen_height)
  let stage_x_step = 480.0 / pen_width_double
  let stage_y_step = -360.0 / pen_height_double
  let stage_x_base = stage_x_step * 0.5 - 240.0 - target.x
  let stage_y_base = 180.0 + stage_y_step * 0.5 - target.y

  let local_x_step_px = stage_x_step * cos_radians * inv_scale
  let local_x_step_py = stage_y_step * sin_radians * inv_scale
  let local_x_base = (stage_x_base * cos_radians + stage_y_base * sin_radians) *
    inv_scale

  let local_y_step_px = -stage_x_step * sin_radians * inv_scale
  let local_y_step_py = stage_y_step * cos_radians * inv_scale
  let local_y_base = (-stage_x_base * sin_radians + stage_y_base * cos_radians) *
    inv_scale

  let bitmap_resolution = Double::from_int(costume.bitmap_resolution)
  let tex_x_step_px = local_x_step_px * bitmap_resolution
  let tex_x_step_py = local_x_step_py * bitmap_resolution
  let tex_x_base = local_x_base * bitmap_resolution + costume.rotation_center_x

  let tex_y_step_px = -local_y_step_px * bitmap_resolution
  let tex_y_step_py = -local_y_step_py * bitmap_resolution
  let tex_y_base = costume.rotation_center_y - local_y_base * bitmap_resolution

  let costume_width_double = Double::from_int(costume.width)
  let costume_height_double = Double::from_int(costume.height)
  let mut start_px = 0
  let mut end_px = pen_width - 1
  let mut start_py = 0
  let mut end_py = pen_height - 1
  if !has_point_effects {
    let local_x0 = -costume.rotation_center_x / bitmap_resolution
    let local_x1 = (Double::from_int(costume.width) - costume.rotation_center_x) /
      bitmap_resolution
    let local_y0 = costume.rotation_center_y / bitmap_resolution
    let local_y1 = (
        costume.rotation_center_y - Double::from_int(costume.height)
      ) /
      bitmap_resolution

    let corner0_x = target.x +
      scale * (local_x0 * cos_radians - local_y0 * sin_radians)
    let corner0_y = target.y +
      scale * (local_x0 * sin_radians + local_y0 * cos_radians)
    let corner1_x = target.x +
      scale * (local_x1 * cos_radians - local_y0 * sin_radians)
    let corner1_y = target.y +
      scale * (local_x1 * sin_radians + local_y0 * cos_radians)
    let corner2_x = target.x +
      scale * (local_x0 * cos_radians - local_y1 * sin_radians)
    let corner2_y = target.y +
      scale * (local_x0 * sin_radians + local_y1 * cos_radians)
    let corner3_x = target.x +
      scale * (local_x1 * cos_radians - local_y1 * sin_radians)
    let corner3_y = target.y +
      scale * (local_x1 * sin_radians + local_y1 * cos_radians)

    let mut min_stage_x = corner0_x
    let mut max_stage_x = corner0_x
    let mut min_stage_y = corner0_y
    let mut max_stage_y = corner0_y

    if corner1_x < min_stage_x {
      min_stage_x = corner1_x
    } else if corner1_x > max_stage_x {
      max_stage_x = corner1_x
    }
    if corner2_x < min_stage_x {
      min_stage_x = corner2_x
    } else if corner2_x > max_stage_x {
      max_stage_x = corner2_x
    }
    if corner3_x < min_stage_x {
      min_stage_x = corner3_x
    } else if corner3_x > max_stage_x {
      max_stage_x = corner3_x
    }
    if corner1_y < min_stage_y {
      min_stage_y = corner1_y
    } else if corner1_y > max_stage_y {
      max_stage_y = corner1_y
    }
    if corner2_y < min_stage_y {
      min_stage_y = corner2_y
    } else if corner2_y > max_stage_y {
      max_stage_y = corner2_y
    }
    if corner3_y < min_stage_y {
      min_stage_y = corner3_y
    } else if corner3_y > max_stage_y {
      max_stage_y = corner3_y
    }

    start_px = render_clamp_int(
      ((min_stage_x + 240.0) / 480.0 * pen_width_double - 1.0).floor().to_int(),
      0,
      pen_width - 1,
    )
    end_px = render_clamp_int(
      ((max_stage_x + 240.0) / 480.0 * pen_width_double + 1.0).ceil().to_int(),
      0,
      pen_width - 1,
    )
    start_py = render_clamp_int(
      ((180.0 - max_stage_y) / 360.0 * pen_height_double - 1.0).floor().to_int(),
      0,
      pen_height - 1,
    )
    end_py = render_clamp_int(
      ((180.0 - min_stage_y) / 360.0 * pen_height_double + 1.0).ceil().to_int(),
      0,
      pen_height - 1,
    )
    if start_px > end_px || start_py > end_py {
      return
    }
  }

  let start_px_double = Double::from_int(start_px)
  for py in start_py..<=end_py {
    let py_double = Double::from_int(py)
    let mut tex_x = tex_x_base +
      tex_x_step_py * py_double +
      tex_x_step_px * start_px_double
    let mut tex_y = tex_y_base +
      tex_y_step_py * py_double +
      tex_y_step_px * start_px_double
    let mut pen_base = (py * pen_width + start_px) * 4
    for _ in start_px..<=end_px {
      if has_point_effects {
        let mut u = tex_x / costume_width_double
        let mut v = tex_y / costume_height_double
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
            let src = if has_color_effects {
              render_apply_color_effects(raw, uniforms, true)
            } else {
              raw
            }
            render_blend_pen_pixel_base(vm, pen_base, src)
          }
          None => ()
        }
      } else if tex_x >= 0.0 &&
        tex_y >= 0.0 &&
        tex_x < costume_width_double &&
        tex_y < costume_height_double {
        let tx = tex_x.floor().to_int()
        let ty = tex_y.floor().to_int()
        let sample_base = (ty * costume.width + tx) * 4
        let raw = (
          costume.pixels[sample_base].to_int(),
          costume.pixels[sample_base + 1].to_int(),
          costume.pixels[sample_base + 2].to_int(),
          costume.pixels[sample_base + 3].to_int(),
        )
        let src = if has_color_effects {
          render_apply_color_effects(raw, uniforms, true)
        } else {
          raw
        }
        render_blend_pen_pixel_base(vm, pen_base, src)
      }
      tex_x += tex_x_step_px
      tex_y += tex_y_step_px
      pen_base += 4
    }
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
fn render_scene_to_frame(vm : Vm) -> RenderFrame {
  let width = vm.pen_width
  let height = vm.pen_height
  let pixels = []
  if width <= 0 || height <= 0 {
    return RenderFrame::{ width, height, pixels }
  }
  for py in 0..<height {
    for px in 0..<width {
      let color = render_sample_scene_without_target(vm, -1, px, py)
      pixels.push(color.0.to_byte())
      pixels.push(color.1.to_byte())
      pixels.push(color.2.to_byte())
      pixels.push(color.3.to_byte())
    }
  }
  RenderFrame::{ width, height, pixels }
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
