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
fn render_double_is_close(value : Double, expected : Double) -> Bool {
  (value - expected).abs() <= 0.000000001
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
fn render_reset_pen_bounds(vm : Vm) -> Unit {
  vm.pen_bounds_valid = false
  vm.pen_min_x = 0
  vm.pen_min_y = 0
  vm.pen_max_x = 0
  vm.pen_max_y = 0
}

///|
fn render_mark_pen_bounds(
  vm : Vm,
  min_x : Int,
  max_x : Int,
  min_y : Int,
  max_y : Int,
) -> Unit {
  let width = vm.pen_width
  let height = vm.pen_height
  if width <= 0 || height <= 0 {
    return
  }
  if max_x < 0 || max_y < 0 || min_x >= width || min_y >= height {
    return
  }
  let clamped_min_x = render_clamp_int(min_x, 0, width - 1)
  let clamped_max_x = render_clamp_int(max_x, 0, width - 1)
  let clamped_min_y = render_clamp_int(min_y, 0, height - 1)
  let clamped_max_y = render_clamp_int(max_y, 0, height - 1)
  if clamped_min_x > clamped_max_x || clamped_min_y > clamped_max_y {
    return
  }
  if vm.pen_bounds_valid {
    if clamped_min_x < vm.pen_min_x {
      vm.pen_min_x = clamped_min_x
    }
    if clamped_max_x > vm.pen_max_x {
      vm.pen_max_x = clamped_max_x
    }
    if clamped_min_y < vm.pen_min_y {
      vm.pen_min_y = clamped_min_y
    }
    if clamped_max_y > vm.pen_max_y {
      vm.pen_max_y = clamped_max_y
    }
  } else {
    vm.pen_bounds_valid = true
    vm.pen_min_x = clamped_min_x
    vm.pen_max_x = clamped_max_x
    vm.pen_min_y = clamped_min_y
    vm.pen_max_y = clamped_max_y
  }
}

///|
fn render_mark_pen_pixel_base(vm : Vm, base : Int) -> Unit {
  let width = vm.pen_width
  if width <= 0 || base < 0 {
    return
  }
  let pixel_index = base / 4
  let py = pixel_index / width
  let px = pixel_index - py * width
  render_mark_pen_bounds(vm, px, px, py, py)
}

///|
fn vm_clear_pen_pixels(vm : Vm) -> Unit {
  vm.pen_pixels.clear()
  vm.pen_vectors.clear()
  render_reset_pen_bounds(vm)
  vm.render_revision += 1
  vm.render_cache_valid = false
}

///|
fn ensure_pen_pixels(vm : Vm) -> Unit {
  let required = vm.pen_width * vm.pen_height * 4
  if required <= 0 {
    vm.pen_pixels.clear()
    render_reset_pen_bounds(vm)
    return
  }
  if vm.pen_pixels.length() == required {
    return
  }
  vm.pen_pixels.clear()
  render_reset_pen_bounds(vm)
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
    render_mark_pen_pixel_base(vm, base)
    return
  }
  let da = vm.pen_pixels[base + 3].to_int()
  if da <= 0 {
    vm.pen_pixels[base] = sr.to_byte()
    vm.pen_pixels[base + 1] = sg.to_byte()
    vm.pen_pixels[base + 2] = sb.to_byte()
    vm.pen_pixels[base + 3] = sa.to_byte()
    render_mark_pen_pixel_base(vm, base)
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
  if blended.3 > 0 {
    render_mark_pen_pixel_base(vm, base)
  }
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
    render_mark_pen_bounds(vm, px, px, py, py)
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
    render_mark_pen_bounds(vm, px, px, start_py, end_py)
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
    render_mark_pen_bounds(vm, start_px, end_px, py, py)
    return true
  }
  false
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
fn render_pen_strokes_are_collinear(
  first : PenVectorStroke,
  second : PenVectorStroke,
) -> Bool {
  let first_dx = first.x1 - first.x0
  let first_dy = first.y1 - first.y0
  let second_dx = second.x1 - second.x0
  let second_dy = second.y1 - second.y0
  if (first_dx == 0.0 && first_dy == 0.0) ||
    (second_dx == 0.0 && second_dy == 0.0) {
    return true
  }
  let cross = first_dx * second_dy - first_dy * second_dx
  if cross.abs() > 0.0000001 {
    return false
  }
  let dot = first_dx * second_dx + first_dy * second_dy
  dot > 0.0
}

///|
fn render_queue_pen_stroke(vm : Vm, stroke : PenVectorStroke) -> Unit {
  let count = vm.pen_vectors.length()
  if count > 0 {
    let last_index = count - 1
    let last = vm.pen_vectors[last_index]
    if last.x1 == stroke.x0 &&
      last.y1 == stroke.y0 &&
      last.diameter == stroke.diameter &&
      last.offset == stroke.offset &&
      last.r == stroke.r &&
      last.g == stroke.g &&
      last.b == stroke.b &&
      last.a == stroke.a &&
      render_pen_strokes_are_collinear(last, stroke) {
      vm.pen_vectors[last_index] = {
        x0: last.x0,
        y0: last.y0,
        x1: stroke.x1,
        y1: stroke.y1,
        diameter: last.diameter,
        offset: last.offset,
        r: last.r,
        g: last.g,
        b: last.b,
        a: last.a,
      }
      vm.redraw_requested = true
      return
    }
  }
  vm.pen_vectors.push(stroke)
  vm.redraw_requested = true
}

///|
fn render_rasterize_pen_stroke(vm : Vm, stroke : PenVectorStroke) -> Unit {
  if stroke.a <= 0 {
    return
  }
  let (x0, y0) = render_stage_to_pixel_double(vm, stroke.x0, stroke.y0)
  let (x1, y1) = render_stage_to_pixel_double(vm, stroke.x1, stroke.y1)
  if stroke.diameter <= 1.0 &&
    stroke.a >= 255 &&
    (stroke.x0 == stroke.x1 || stroke.y0 == stroke.y1) &&
    stroke.x0.floor() == stroke.x0 &&
    stroke.y0.floor() == stroke.y0 &&
    stroke.x1.floor() == stroke.x1 &&
    stroke.y1.floor() == stroke.y1 {
    if render_draw_thin_opaque_pen_axis(
        vm,
        x0 + stroke.offset,
        y0 + stroke.offset,
        x1 + stroke.offset,
        y1 + stroke.offset,
        (stroke.r, stroke.g, stroke.b),
      ) {
      return
    }
    render_draw_thin_opaque_pen_line(
      vm,
      x0 + stroke.offset,
      y0 + stroke.offset,
      x1 + stroke.offset,
      y1 + stroke.offset,
      (stroke.r, stroke.g, stroke.b),
    )
    return
  }
  render_draw_pen_capsule(
    vm,
    x0 + stroke.offset,
    y0 + stroke.offset,
    x1 + stroke.offset,
    y1 + stroke.offset,
    stroke.diameter,
    (stroke.r, stroke.g, stroke.b, stroke.a),
  )
}

///|
fn render_flush_pen_vectors(vm : Vm) -> Unit {
  if vm.pen_vectors.is_empty() {
    return
  }
  ensure_pen_pixels(vm)
  for stroke in vm.pen_vectors {
    render_rasterize_pen_stroke(vm, stroke)
  }
  vm.pen_vectors.clear()
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
  let width = vm.pen_width
  let height = vm.pen_height
  if a <= 0 || diameter <= 0.0 || width <= 0 || height <= 0 {
    return
  }
  ensure_pen_pixels(vm)
  let fade_radius = (diameter + 1.0) / 2.0
  let min_x_raw = (render_min_double(x0, x1) - fade_radius).floor().to_int()
  let max_x_raw = (render_max_double(x0, x1) + fade_radius).ceil().to_int()
  let min_y_raw = (render_min_double(y0, y1) - fade_radius).floor().to_int()
  let max_y_raw = (render_max_double(y0, y1) + fade_radius).ceil().to_int()
  if max_x_raw < 0 || max_y_raw < 0 || min_x_raw >= width || min_y_raw >= height {
    return
  }
  let min_x = render_clamp_int(min_x_raw, 0, width - 1)
  let max_x = render_clamp_int(max_x_raw, 0, width - 1)
  let min_y = render_clamp_int(min_y_raw, 0, height - 1)
  let max_y = render_clamp_int(max_y_raw, 0, height - 1)
  render_mark_pen_bounds(vm, min_x, max_x, min_y, max_y)
  let seg_dx = x1 - x0
  let seg_dy = y1 - y0
  let seg_len_sq = seg_dx * seg_dx + seg_dy * seg_dy
  let fade_radius_sq = fade_radius * fade_radius
  let solid_radius = render_max_double(fade_radius - 1.0, 0.0)
  let solid_radius_sq = solid_radius * solid_radius
  for py in min_y..<=max_y {
    let sample_y = Double::from_int(py) + 0.5
    let row_base = py * width * 4
    for px in min_x..<=max_x {
      let sample_x = Double::from_int(px) + 0.5
      let mut t = 0.0
      if seg_len_sq > 0.0 {
        t = ((sample_x - x0) * seg_dx + (sample_y - y0) * seg_dy) / seg_len_sq
        if t < 0.0 {
          t = 0.0
        } else if t > 1.0 {
          t = 1.0
        }
      }
      let nearest_x = x0 + seg_dx * t
      let nearest_y = y0 + seg_dy * t
      let dist_x = sample_x - nearest_x
      let dist_y = sample_y - nearest_y
      let dist_sq = dist_x * dist_x + dist_y * dist_y
      if dist_sq >= fade_radius_sq {
        continue
      }
      let coverage = if dist_sq <= solid_radius_sq {
        1.0
      } else {
        let distance = dist_sq.sqrt()
        render_clamp_double(fade_radius - distance, 0.0, 1.0)
      }
      if coverage > 0.0 {
        let alpha = render_clamp_int(
          (Double::from_int(a) * coverage).round().to_int(),
          0,
          255,
        )
        if alpha > 0 {
          let base = row_base + px * 4
          render_blend_pen_pixel_base(vm, base, (r, g, b, alpha))
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
  let stroke : PenVectorStroke = {
    x0: old_x,
    y0: old_y,
    x1: new_x,
    y1: new_y,
    diameter,
    offset,
    r: color.0,
    g: color.1,
    b: color.2,
    a: color.3,
  }
  render_queue_pen_stroke(vm, stroke)
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
  let diameter = render_pen_line_diameter(vm, target)
  let offset = render_pen_line_offset(target)
  let stroke : PenVectorStroke = {
    x0: target.x,
    y0: target.y,
    x1: target.x,
    y1: target.y,
    diameter,
    offset,
    r,
    g,
    b,
    a,
  }
  render_queue_pen_stroke(vm, stroke)
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
fn render_no_effect_uniforms() -> EffectUniforms {
  {
    enable_color: false,
    enable_fisheye: false,
    enable_whirl: false,
    enable_pixelate: false,
    enable_mosaic: false,
    enable_brightness: false,
    enable_ghost: false,
    u_color: 0.0,
    u_fisheye: 0.0,
    u_whirl: 0.0,
    u_pixelate: 0.0,
    u_mosaic: 0.0,
    u_brightness: 0.0,
    u_ghost: 0.0,
  }
}

///|
fn render_sample_stage_backdrop_prepared(
  costume : CostumeImage?,
  uniforms : EffectUniforms,
  apply_point_effects : Bool,
  apply_color_effects : Bool,
  stage_x : Double,
  stage_y : Double,
) -> (Int, Int, Int, Int) {
  let mut out = (255, 255, 255, 255)
  match costume {
    Some(costume) => {
      let mut u = (stage_x + 240.0) / 480.0
      let mut v = (180.0 - stage_y) / 360.0
      if apply_point_effects {
        let transformed = render_apply_point_effects(
          u,
          v,
          costume.width,
          costume.height,
          uniforms,
        )
        u = transformed.0
        v = transformed.1
      }
      match render_sample_costume_rgba_uv(costume, u, v) {
        Some(raw) => {
          let src = if apply_color_effects {
            render_apply_color_effects(raw, uniforms, true)
          } else {
            raw
          }
          if src.3 <= 0 {
            ()
          } else if src.3 >= 255 {
            out = (src.0, src.1, src.2, 255)
          } else {
            out = render_blend_rgba(out, src)
          }
        }
        None => ()
      }
    }
    None => ()
  }
  out
}

///|
fn render_sample_stage_backdrop_at(
  vm : Vm,
  stage_x : Double,
  stage_y : Double,
) -> (Int, Int, Int, Int) {
  if vm.stage_index < 0 || vm.stage_index >= vm.targets.length() {
    return (255, 255, 255, 255)
  }
  let stage = vm.targets[vm.stage_index]
  let uniforms = render_effect_uniforms(stage)
  render_sample_stage_backdrop_prepared(
    render_current_costume(stage),
    uniforms,
    uniforms.enable_mosaic ||
    uniforms.enable_pixelate ||
    uniforms.enable_whirl ||
    uniforms.enable_fisheye,
    uniforms.enable_color || uniforms.enable_brightness || uniforms.enable_ghost,
    stage_x,
    stage_y,
  )
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

  render_flush_pen_vectors(vm)
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
fn render_collect_visible_sprite_indices(
  vm : Vm,
  excluded_target_index : Int,
) -> Array[Int] {
  let out = Array::new(capacity=vm.targets.length())
  for i, target in vm.targets {
    if i == vm.stage_index || i == excluded_target_index {
      continue
    }
    if target.deleted || target.is_stage || !target.visible {
      continue
    }
    if target.size <= 0.0 {
      continue
    }
    let costume = match render_current_costume(target) {
      Some(costume) => costume
      None => continue
    }
    if costume.width <= 0 ||
      costume.height <= 0 ||
      costume.bitmap_resolution <= 0 ||
      costume.pixels.length() < costume.width * costume.height * 4 {
      continue
    }
    out.push(i)
  }
  out
}

///|
fn render_blend_channel_over_opaque_white(src : Int, src_alpha : Int) -> Byte {
  if src_alpha <= 0 {
    b'\xff'
  } else if src_alpha >= 255 {
    src.to_byte()
  } else {
    ((src * src_alpha + 255 * (255 - src_alpha) + 127) / 255).to_byte()
  }
}

///|
fn render_build_opaque_white_pixels(width : Int, height : Int) -> Array[Byte] {
  if width <= 0 || height <= 0 {
    return []
  }
  Array::make(width * height * 4, b'\xff')
}

///|
fn render_build_opaque_stage_pixels(
  costume : CostumeImage,
  width : Int,
  height : Int,
) -> Array[Byte] {
  if width <= 0 || height <= 0 {
    return []
  }
  if costume.width <= 0 || costume.height <= 0 {
    return render_build_opaque_white_pixels(width, height)
  }
  let src_width = costume.width
  let src_height = costume.height
  if costume.pixels.length() < src_width * src_height * 4 {
    return render_build_opaque_white_pixels(width, height)
  }
  let pixels = Array::new(capacity=width * height * 4)
  let src_x_step = Double::from_int(src_width) / Double::from_int(width)
  let src_y_step = Double::from_int(src_height) / Double::from_int(height)
  let mut src_y = src_y_step * 0.5
  for _ in 0..<height {
    let ty = render_clamp_int(src_y.floor().to_int(), 0, src_height - 1)
    let src_row_base = ty * src_width * 4
    let mut src_x = src_x_step * 0.5
    for _ in 0..<width {
      let tx = render_clamp_int(src_x.floor().to_int(), 0, src_width - 1)
      let base = src_row_base + tx * 4
      let src_alpha = costume.pixels[base + 3].to_int()
      pixels.push(
        render_blend_channel_over_opaque_white(
          costume.pixels[base].to_int(),
          src_alpha,
        ),
      )
      pixels.push(
        render_blend_channel_over_opaque_white(
          costume.pixels[base + 1].to_int(),
          src_alpha,
        ),
      )
      pixels.push(
        render_blend_channel_over_opaque_white(
          costume.pixels[base + 2].to_int(),
          src_alpha,
        ),
      )
      pixels.push(b'\xff')
      src_x += src_x_step
    }
    src_y += src_y_step
  }
  pixels
}

///|
fn render_blend_pen_over_opaque_pixels(vm : Vm, pixels : Array[Byte]) -> Unit {
  if !vm.pen_bounds_valid {
    return
  }
  let width = vm.pen_width
  let height = vm.pen_height
  if width <= 0 || height <= 0 {
    return
  }
  let start_x = render_clamp_int(vm.pen_min_x, 0, width - 1)
  let end_x = render_clamp_int(vm.pen_max_x, 0, width - 1)
  let start_y = render_clamp_int(vm.pen_min_y, 0, height - 1)
  let end_y = render_clamp_int(vm.pen_max_y, 0, height - 1)
  if start_x > end_x || start_y > end_y {
    return
  }
  let pen_len = vm.pen_pixels.length()
  let pixels_len = pixels.length()
  for py in start_y..<=end_y {
    let mut base = (py * width + start_x) * 4
    for _ in start_x..<=end_x {
      if base + 3 >= pen_len || base + 3 >= pixels_len {
        break
      }
      let pen_alpha = vm.pen_pixels[base + 3].to_int()
      if pen_alpha > 0 {
        if pen_alpha >= 255 {
          pixels[base] = vm.pen_pixels[base]
          pixels[base + 1] = vm.pen_pixels[base + 1]
          pixels[base + 2] = vm.pen_pixels[base + 2]
          pixels[base + 3] = b'\xff'
        } else {
          let keep = 255 - pen_alpha
          pixels[base] = ((
            vm.pen_pixels[base].to_int() * pen_alpha +
            pixels[base].to_int() * keep +
            127
          ) /
          255).to_byte()
          pixels[base + 1] = ((
            vm.pen_pixels[base + 1].to_int() * pen_alpha +
            pixels[base + 1].to_int() * keep +
            127
          ) /
          255).to_byte()
          pixels[base + 2] = ((
            vm.pen_pixels[base + 2].to_int() * pen_alpha +
            pixels[base + 2].to_int() * keep +
            127
          ) /
          255).to_byte()
          pixels[base + 3] = b'\xff'
        }
      }
      base += 4
    }
  }
}

///|
fn render_blend_pixel_over_opaque_base(
  pixels : Array[Byte],
  base : Int,
  src : (Int, Int, Int, Int),
) -> Unit {
  let (sr, sg, sb, sa) = src
  if sa <= 0 {
    return
  }
  if sa >= 255 {
    pixels[base] = sr.to_byte()
    pixels[base + 1] = sg.to_byte()
    pixels[base + 2] = sb.to_byte()
    pixels[base + 3] = b'\xff'
    return
  }
  let keep = 255 - sa
  pixels[base] = ((sr * sa + pixels[base].to_int() * keep + 127) / 255).to_byte()
  pixels[base + 1] = ((sg * sa + pixels[base + 1].to_int() * keep + 127) / 255).to_byte()
  pixels[base + 2] = ((sb * sa + pixels[base + 2].to_int() * keep + 127) / 255).to_byte()
  pixels[base + 3] = b'\xff'
}

///|
fn render_blend_pixel_base(
  pixels : Array[Byte],
  base : Int,
  src : (Int, Int, Int, Int),
) -> Unit {
  let (sr, sg, sb, sa) = src
  if sa <= 0 {
    return
  }
  if sa >= 255 {
    pixels[base] = sr.to_byte()
    pixels[base + 1] = sg.to_byte()
    pixels[base + 2] = sb.to_byte()
    pixels[base + 3] = b'\xff'
    return
  }
  let da = pixels[base + 3].to_int()
  if da <= 0 {
    pixels[base] = sr.to_byte()
    pixels[base + 1] = sg.to_byte()
    pixels[base + 2] = sb.to_byte()
    pixels[base + 3] = sa.to_byte()
    return
  }
  if da >= 255 {
    let keep = 255 - sa
    pixels[base] = ((sr * sa + pixels[base].to_int() * keep + 127) / 255).to_byte()
    pixels[base + 1] = ((sg * sa + pixels[base + 1].to_int() * keep + 127) / 255).to_byte()
    pixels[base + 2] = ((sb * sa + pixels[base + 2].to_int() * keep + 127) / 255).to_byte()
    pixels[base + 3] = b'\xff'
    return
  }
  let blended = render_blend_rgba(
    (
      pixels[base].to_int(),
      pixels[base + 1].to_int(),
      pixels[base + 2].to_int(),
      da,
    ),
    src,
  )
  pixels[base] = blended.0.to_byte()
  pixels[base + 1] = blended.1.to_byte()
  pixels[base + 2] = blended.2.to_byte()
  pixels[base + 3] = blended.3.to_byte()
}

///|
fn render_blend_sprite_over_pixels(
  vm : Vm,
  target_index : Int,
  pixels : Array[Byte],
  width : Int,
  height : Int,
  dst_opaque : Bool,
) -> Unit {
  if target_index < 0 || target_index >= vm.targets.length() {
    return
  }
  if width <= 0 || height <= 0 {
    return
  }
  let target = vm.targets[target_index]
  if target.deleted || target.is_stage || !target.visible {
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
  if pixels.length() < width * height * 4 {
    return
  }

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

  let width_double = Double::from_int(width)
  let height_double = Double::from_int(height)
  let stage_x_step = 480.0 / width_double
  let stage_y_step = -360.0 / height_double
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
  let mut end_px = width - 1
  let mut start_py = 0
  let mut end_py = height - 1
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
      ((min_stage_x + 240.0) / 480.0 * width_double - 1.0).floor().to_int(),
      0,
      width - 1,
    )
    end_px = render_clamp_int(
      ((max_stage_x + 240.0) / 480.0 * width_double + 1.0).ceil().to_int(),
      0,
      width - 1,
    )
    start_py = render_clamp_int(
      ((180.0 - max_stage_y) / 360.0 * height_double - 1.0).floor().to_int(),
      0,
      height - 1,
    )
    end_py = render_clamp_int(
      ((180.0 - min_stage_y) / 360.0 * height_double + 1.0).ceil().to_int(),
      0,
      height - 1,
    )
    if start_px > end_px || start_py > end_py {
      return
    }
  }

  let start_px_double = Double::from_int(start_px)
  if !has_point_effects && !has_color_effects {
    if render_double_is_close(tex_x_step_py, 0.0) &&
      render_double_is_close(tex_y_step_px, 0.0) {
      let step_x_rounded = tex_x_step_px.round().to_int()
      let step_y_rounded = tex_y_step_py.round().to_int()
      let step_x = if step_x_rounded != 0 &&
        render_double_is_close(tex_x_step_px, Double::from_int(step_x_rounded)) {
        step_x_rounded
      } else {
        0
      }
      let step_y = if step_y_rounded != 0 &&
        render_double_is_close(tex_y_step_py, Double::from_int(step_y_rounded)) {
        step_y_rounded
      } else {
        0
      }
      if step_x != 0 && step_y != 0 {
        let tx_start = (tex_x_base + tex_x_step_px * Double::from_int(start_px))
          .floor()
          .to_int()
        let mut ty = (tex_y_base + tex_y_step_py * Double::from_int(start_py))
          .floor()
          .to_int()
        for py in start_py..<=end_py {
          if ty >= 0 && ty < costume.height {
            let mut tx = tx_start
            let mut base = (py * width + start_px) * 4
            for _ in start_px..<=end_px {
              if tx >= 0 && tx < costume.width {
                let sample_base = (ty * costume.width + tx) * 4
                let sa = costume.pixels[sample_base + 3].to_int()
                if sa >= 255 {
                  pixels[base] = costume.pixels[sample_base]
                  pixels[base + 1] = costume.pixels[sample_base + 1]
                  pixels[base + 2] = costume.pixels[sample_base + 2]
                  pixels[base + 3] = b'\xff'
                } else if sa > 0 {
                  if dst_opaque {
                    let keep = 255 - sa
                    pixels[base] = ((
                      costume.pixels[sample_base].to_int() * sa +
                      pixels[base].to_int() * keep +
                      127
                    ) /
                    255).to_byte()
                    pixels[base + 1] = ((
                      costume.pixels[sample_base + 1].to_int() * sa +
                      pixels[base + 1].to_int() * keep +
                      127
                    ) /
                    255).to_byte()
                    pixels[base + 2] = ((
                      costume.pixels[sample_base + 2].to_int() * sa +
                      pixels[base + 2].to_int() * keep +
                      127
                    ) /
                    255).to_byte()
                    pixels[base + 3] = b'\xff'
                  } else {
                    let da = pixels[base + 3].to_int()
                    if da <= 0 {
                      pixels[base] = costume.pixels[sample_base]
                      pixels[base + 1] = costume.pixels[sample_base + 1]
                      pixels[base + 2] = costume.pixels[sample_base + 2]
                      pixels[base + 3] = sa.to_byte()
                    } else if da >= 255 {
                      let keep = 255 - sa
                      pixels[base] = ((
                        costume.pixels[sample_base].to_int() * sa +
                        pixels[base].to_int() * keep +
                        127
                      ) /
                      255).to_byte()
                      pixels[base + 1] = ((
                        costume.pixels[sample_base + 1].to_int() * sa +
                        pixels[base + 1].to_int() * keep +
                        127
                      ) /
                      255).to_byte()
                      pixels[base + 2] = ((
                        costume.pixels[sample_base + 2].to_int() * sa +
                        pixels[base + 2].to_int() * keep +
                        127
                      ) /
                      255).to_byte()
                      pixels[base + 3] = b'\xff'
                    } else {
                      let blended = render_blend_rgba(
                        (
                          pixels[base].to_int(),
                          pixels[base + 1].to_int(),
                          pixels[base + 2].to_int(),
                          da,
                        ),
                        (
                          costume.pixels[sample_base].to_int(),
                          costume.pixels[sample_base + 1].to_int(),
                          costume.pixels[sample_base + 2].to_int(),
                          sa,
                        ),
                      )
                      pixels[base] = blended.0.to_byte()
                      pixels[base + 1] = blended.1.to_byte()
                      pixels[base + 2] = blended.2.to_byte()
                      pixels[base + 3] = blended.3.to_byte()
                    }
                  }
                }
              }
              tx += step_x
              base += 4
            }
          }
          ty += step_y
        }
        return
      }
    }

    for py in start_py..<=end_py {
      let py_double = Double::from_int(py)
      let mut tex_x = tex_x_base +
        tex_x_step_py * py_double +
        tex_x_step_px * start_px_double
      let mut tex_y = tex_y_base +
        tex_y_step_py * py_double +
        tex_y_step_px * start_px_double
      let mut base = (py * width + start_px) * 4
      for _ in start_px..<=end_px {
        if tex_x >= 0.0 &&
          tex_y >= 0.0 &&
          tex_x < costume_width_double &&
          tex_y < costume_height_double {
          let tx = tex_x.floor().to_int()
          let ty = tex_y.floor().to_int()
          let sample_base = (ty * costume.width + tx) * 4
          let sa = costume.pixels[sample_base + 3].to_int()
          if sa >= 255 {
            pixels[base] = costume.pixels[sample_base]
            pixels[base + 1] = costume.pixels[sample_base + 1]
            pixels[base + 2] = costume.pixels[sample_base + 2]
            pixels[base + 3] = b'\xff'
          } else if sa > 0 {
            if dst_opaque {
              let keep = 255 - sa
              pixels[base] = ((
                costume.pixels[sample_base].to_int() * sa +
                pixels[base].to_int() * keep +
                127
              ) /
              255).to_byte()
              pixels[base + 1] = ((
                costume.pixels[sample_base + 1].to_int() * sa +
                pixels[base + 1].to_int() * keep +
                127
              ) /
              255).to_byte()
              pixels[base + 2] = ((
                costume.pixels[sample_base + 2].to_int() * sa +
                pixels[base + 2].to_int() * keep +
                127
              ) /
              255).to_byte()
              pixels[base + 3] = b'\xff'
            } else {
              let da = pixels[base + 3].to_int()
              if da <= 0 {
                pixels[base] = costume.pixels[sample_base]
                pixels[base + 1] = costume.pixels[sample_base + 1]
                pixels[base + 2] = costume.pixels[sample_base + 2]
                pixels[base + 3] = sa.to_byte()
              } else if da >= 255 {
                let keep = 255 - sa
                pixels[base] = ((
                  costume.pixels[sample_base].to_int() * sa +
                  pixels[base].to_int() * keep +
                  127
                ) /
                255).to_byte()
                pixels[base + 1] = ((
                  costume.pixels[sample_base + 1].to_int() * sa +
                  pixels[base + 1].to_int() * keep +
                  127
                ) /
                255).to_byte()
                pixels[base + 2] = ((
                  costume.pixels[sample_base + 2].to_int() * sa +
                  pixels[base + 2].to_int() * keep +
                  127
                ) /
                255).to_byte()
                pixels[base + 3] = b'\xff'
              } else {
                let blended = render_blend_rgba(
                  (
                    pixels[base].to_int(),
                    pixels[base + 1].to_int(),
                    pixels[base + 2].to_int(),
                    da,
                  ),
                  (
                    costume.pixels[sample_base].to_int(),
                    costume.pixels[sample_base + 1].to_int(),
                    costume.pixels[sample_base + 2].to_int(),
                    sa,
                  ),
                )
                pixels[base] = blended.0.to_byte()
                pixels[base + 1] = blended.1.to_byte()
                pixels[base + 2] = blended.2.to_byte()
                pixels[base + 3] = blended.3.to_byte()
              }
            }
          }
        }
        tex_x += tex_x_step_px
        tex_y += tex_y_step_px
        base += 4
      }
    }
    return
  }

  for py in start_py..<=end_py {
    let py_double = Double::from_int(py)
    let mut tex_x = tex_x_base +
      tex_x_step_py * py_double +
      tex_x_step_px * start_px_double
    let mut tex_y = tex_y_base +
      tex_y_step_py * py_double +
      tex_y_step_px * start_px_double
    let mut base = (py * width + start_px) * 4
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
            if dst_opaque {
              render_blend_pixel_over_opaque_base(pixels, base, src)
            } else {
              render_blend_pixel_base(pixels, base, src)
            }
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
        if dst_opaque {
          render_blend_pixel_over_opaque_base(pixels, base, src)
        } else {
          render_blend_pixel_base(pixels, base, src)
        }
      }
      tex_x += tex_x_step_px
      tex_y += tex_y_step_px
      base += 4
    }
  }
}

///|
fn render_stage_costume_index_for_cache(stage : TargetState) -> Int {
  if stage.costumes.is_empty() {
    -1
  } else {
    render_wrap_index(stage.current_costume, stage.costumes.length())
  }
}

///|
fn render_backdrop_cache_matches(
  vm : Vm,
  width : Int,
  height : Int,
  stage_index : Int,
  stage_costume_index : Int,
  stage : TargetState?,
) -> Bool {
  if !vm.backdrop_cache_valid ||
    vm.backdrop_cache_width != width ||
    vm.backdrop_cache_height != height ||
    vm.backdrop_cache_stage_index != stage_index ||
    vm.backdrop_cache_stage_costume_index != stage_costume_index {
    return false
  }
  match stage {
    Some(stage) =>
      vm.backdrop_cache_effect_color == stage.looks_effect_color &&
      vm.backdrop_cache_effect_fisheye == stage.looks_effect_fisheye &&
      vm.backdrop_cache_effect_whirl == stage.looks_effect_whirl &&
      vm.backdrop_cache_effect_pixelate == stage.looks_effect_pixelate &&
      vm.backdrop_cache_effect_mosaic == stage.looks_effect_mosaic &&
      vm.backdrop_cache_effect_brightness == stage.looks_effect_brightness &&
      vm.backdrop_cache_effect_ghost == stage.looks_effect_ghost
    None =>
      vm.backdrop_cache_effect_color == 0.0 &&
      vm.backdrop_cache_effect_fisheye == 0.0 &&
      vm.backdrop_cache_effect_whirl == 0.0 &&
      vm.backdrop_cache_effect_pixelate == 0.0 &&
      vm.backdrop_cache_effect_mosaic == 0.0 &&
      vm.backdrop_cache_effect_brightness == 0.0 &&
      vm.backdrop_cache_effect_ghost == 0.0
  }
}

///|
fn render_update_backdrop_cache(
  vm : Vm,
  width : Int,
  height : Int,
  stage_index : Int,
  stage_costume_index : Int,
  stage : TargetState?,
  stage_costume : CostumeImage?,
) -> Unit {
  vm.backdrop_cache_pixels = match stage_costume {
    Some(costume) => render_build_opaque_stage_pixels(costume, width, height)
    None => render_build_opaque_white_pixels(width, height)
  }
  vm.backdrop_cache_valid = true
  vm.backdrop_cache_width = width
  vm.backdrop_cache_height = height
  vm.backdrop_cache_stage_index = stage_index
  vm.backdrop_cache_stage_costume_index = stage_costume_index
  match stage {
    Some(stage) => {
      vm.backdrop_cache_effect_color = stage.looks_effect_color
      vm.backdrop_cache_effect_fisheye = stage.looks_effect_fisheye
      vm.backdrop_cache_effect_whirl = stage.looks_effect_whirl
      vm.backdrop_cache_effect_pixelate = stage.looks_effect_pixelate
      vm.backdrop_cache_effect_mosaic = stage.looks_effect_mosaic
      vm.backdrop_cache_effect_brightness = stage.looks_effect_brightness
      vm.backdrop_cache_effect_ghost = stage.looks_effect_ghost
    }
    None => {
      vm.backdrop_cache_effect_color = 0.0
      vm.backdrop_cache_effect_fisheye = 0.0
      vm.backdrop_cache_effect_whirl = 0.0
      vm.backdrop_cache_effect_pixelate = 0.0
      vm.backdrop_cache_effect_mosaic = 0.0
      vm.backdrop_cache_effect_brightness = 0.0
      vm.backdrop_cache_effect_ghost = 0.0
    }
  }
}

///|
fn render_ensure_opaque_stage_backdrop_cache(
  vm : Vm,
  width : Int,
  height : Int,
  stage : TargetState?,
  stage_costume : CostumeImage?,
) -> Unit {
  let stage_index = match stage {
    Some(_) => vm.stage_index
    None => -1
  }
  let stage_costume_index = match stage {
    Some(stage) => render_stage_costume_index_for_cache(stage)
    None => -1
  }
  if !render_backdrop_cache_matches(
      vm, width, height, stage_index, stage_costume_index, stage,
    ) {
    render_update_backdrop_cache(
      vm, width, height, stage_index, stage_costume_index, stage, stage_costume,
    )
  }
}

///|
fn render_scene_to_frame(vm : Vm) -> RenderFrame {
  let width = vm.pen_width
  let height = vm.pen_height
  let pixels = []
  if width <= 0 || height <= 0 {
    vm.render_cache_valid = false
    return RenderFrame::{ width, height, pixels }
  }
  if vm.render_cache_valid &&
    vm.render_cache_revision == vm.render_revision &&
    vm.pen_vectors.is_empty() &&
    vm.render_cache_pixels.length() == width * height * 4 {
    return RenderFrame::{ width, height, pixels: vm.render_cache_pixels }
  }
  render_flush_pen_vectors(vm)
  let visible_sprite_indices = render_collect_visible_sprite_indices(vm, -1)
  let stage = if vm.stage_index >= 0 && vm.stage_index < vm.targets.length() {
    Some(vm.targets[vm.stage_index])
  } else {
    None
  }
  let stage_uniforms = match stage {
    Some(stage) => render_effect_uniforms(stage)
    None => render_no_effect_uniforms()
  }
  let stage_has_point_effects = stage_uniforms.enable_mosaic ||
    stage_uniforms.enable_pixelate ||
    stage_uniforms.enable_whirl ||
    stage_uniforms.enable_fisheye
  let stage_has_color_effects = stage_uniforms.enable_color ||
    stage_uniforms.enable_brightness ||
    stage_uniforms.enable_ghost
  let stage_costume = match stage {
    Some(stage) => render_current_costume(stage)
    None => None
  }
  if visible_sprite_indices.is_empty() &&
    !stage_has_point_effects &&
    !stage_has_color_effects {
    render_ensure_opaque_stage_backdrop_cache(
      vm, width, height, stage, stage_costume,
    )
    let pixels = if vm.pen_bounds_valid {
      let pixels = vm.backdrop_cache_pixels.copy()
      render_blend_pen_over_opaque_pixels(vm, pixels)
      pixels
    } else {
      vm.backdrop_cache_pixels
    }
    vm.render_cache_pixels = pixels
    vm.render_cache_valid = true
    vm.render_cache_revision = vm.render_revision
    return RenderFrame::{ width, height, pixels }
  }

  let stage_is_plain_white = match stage_costume {
    None => true
    Some(costume) =>
      costume.width <= 0 ||
      costume.height <= 0 ||
      costume.pixels.length() < costume.width * costume.height * 4
  }
  let pixels = if !stage_has_point_effects &&
    !stage_has_color_effects &&
    stage_is_plain_white {
    let pixels = render_build_opaque_white_pixels(width, height)
    if vm.pen_bounds_valid {
      render_blend_pen_over_opaque_pixels(vm, pixels)
    }
    pixels
  } else {
    let pixels = Array::new(capacity=width * height * 4)
    let width_double = Double::from_int(width)
    let height_double = Double::from_int(height)
    let stage_x_step = 480.0 / width_double
    let stage_y_step = 360.0 / height_double
    let stage_x_start = stage_x_step * 0.5 - 240.0
    let mut stage_y = 180.0 - stage_y_step * 0.5
    let pen_len = vm.pen_pixels.length()
    for py in 0..<height {
      let mut stage_x = stage_x_start
      let mut pen_base = py * width * 4
      for _ in 0..<width {
        let mut color = render_sample_stage_backdrop_prepared(
          stage_costume, stage_uniforms, stage_has_point_effects, stage_has_color_effects,
          stage_x, stage_y,
        )
        if pen_base + 3 < pen_len {
          let pen_alpha = vm.pen_pixels[pen_base + 3].to_int()
          if pen_alpha > 0 {
            if pen_alpha >= 255 {
              color = (
                vm.pen_pixels[pen_base].to_int(),
                vm.pen_pixels[pen_base + 1].to_int(),
                vm.pen_pixels[pen_base + 2].to_int(),
                255,
              )
            } else {
              color = render_blend_rgba(
                color,
                (
                  vm.pen_pixels[pen_base].to_int(),
                  vm.pen_pixels[pen_base + 1].to_int(),
                  vm.pen_pixels[pen_base + 2].to_int(),
                  pen_alpha,
                ),
              )
            }
          }
        }
        pixels.push(color.0.to_byte())
        pixels.push(color.1.to_byte())
        pixels.push(color.2.to_byte())
        pixels.push(color.3.to_byte())
        stage_x += stage_x_step
        pen_base += 4
      }
      stage_y -= stage_y_step
    }
    pixels
  }
  for sprite_index in visible_sprite_indices {
    render_blend_sprite_over_pixels(
      vm,
      sprite_index,
      pixels,
      width,
      height,
      !stage_has_point_effects && !stage_has_color_effects,
    )
  }
  vm.render_cache_pixels = pixels
  vm.render_cache_valid = true
  vm.render_cache_revision = vm.render_revision
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
  render_flush_pen_vectors(vm)
  let width = vm.pen_width
  let height = vm.pen_height
  if width <= 0 || height <= 0 {
    return false
  }
  let visible_sprite_indices = render_collect_visible_sprite_indices(
    vm, target_index,
  )
  let width_double = Double::from_int(width)
  let height_double = Double::from_int(height)
  let stage_x_step = 480.0 / width_double
  let stage_y_step = 360.0 / height_double
  let stage_x_start = stage_x_step * 0.5 - 240.0
  let mut stage_y = 180.0 - stage_y_step * 0.5
  let pen_len = vm.pen_pixels.length()
  for py in 0..<height {
    let mut stage_x = stage_x_start
    let mut pen_base = py * width * 4
    for _ in 0..<width {
      match
        render_sample_sprite_at(
          vm, target_index, stage_x, stage_y, false, false,
        ) {
        Some(mask_color) =>
          if mask_color.3 > 0 {
            let mut sampled = render_sample_stage_backdrop_at(
              vm, stage_x, stage_y,
            )
            if pen_base + 3 < pen_len {
              let pen_alpha = vm.pen_pixels[pen_base + 3].to_int()
              if pen_alpha > 0 {
                sampled = render_blend_rgba(
                  sampled,
                  (
                    vm.pen_pixels[pen_base].to_int(),
                    vm.pen_pixels[pen_base + 1].to_int(),
                    vm.pen_pixels[pen_base + 2].to_int(),
                    pen_alpha,
                  ),
                )
              }
            }
            for sprite_index in visible_sprite_indices {
              match
                render_sample_sprite_at(
                  vm, sprite_index, stage_x, stage_y, true, true,
                ) {
                Some(sprite_color) =>
                  sampled = render_blend_rgba(sampled, sprite_color)
                None => ()
              }
            }
            if render_color_matches(
                (sampled.0, sampled.1, sampled.2),
                color_rgb,
              ) {
              return true
            }
          }
        None => ()
      }
      stage_x += stage_x_step
      pen_base += 4
    }
    stage_y -= stage_y_step
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
  render_flush_pen_vectors(vm)
  let width = vm.pen_width
  let height = vm.pen_height
  if width <= 0 || height <= 0 {
    return false
  }
  let visible_sprite_indices = render_collect_visible_sprite_indices(
    vm, target_index,
  )
  let width_double = Double::from_int(width)
  let height_double = Double::from_int(height)
  let stage_x_step = 480.0 / width_double
  let stage_y_step = 360.0 / height_double
  let stage_x_start = stage_x_step * 0.5 - 240.0
  let mut stage_y = 180.0 - stage_y_step * 0.5
  let pen_len = vm.pen_pixels.length()
  for py in 0..<height {
    let mut stage_x = stage_x_start
    let mut pen_base = py * width * 4
    for _ in 0..<width {
      match
        render_sample_sprite_at(
          vm, target_index, stage_x, stage_y, false, false,
        ) {
        Some(mask_color) =>
          if render_mask_matches(mask_color, mask_rgb) {
            let mut sampled = render_sample_stage_backdrop_at(
              vm, stage_x, stage_y,
            )
            if pen_base + 3 < pen_len {
              let pen_alpha = vm.pen_pixels[pen_base + 3].to_int()
              if pen_alpha > 0 {
                sampled = render_blend_rgba(
                  sampled,
                  (
                    vm.pen_pixels[pen_base].to_int(),
                    vm.pen_pixels[pen_base + 1].to_int(),
                    vm.pen_pixels[pen_base + 2].to_int(),
                    pen_alpha,
                  ),
                )
              }
            }
            for sprite_index in visible_sprite_indices {
              match
                render_sample_sprite_at(
                  vm, sprite_index, stage_x, stage_y, true, true,
                ) {
                Some(sprite_color) =>
                  sampled = render_blend_rgba(sampled, sprite_color)
                None => ()
              }
            }
            if render_color_matches(
                (sampled.0, sampled.1, sampled.2),
                target_rgb,
              ) {
              return true
            }
          }
        None => ()
      }
      stage_x += stage_x_step
      pen_base += 4
    }
    stage_y -= stage_y_step
  }
  false
}
