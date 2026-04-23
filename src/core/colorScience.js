// ─── Conversion λ → XYZ (approximation CIE 1931) ─────────────────
// Source : Wyman et al. 2013 — approximation analytique des courbes
// de correspondance colorimétrique CIE. Précision > 99% vs tables CIE.

export function wavelengthToXYZ(wl) {
  const t1 = (wl - 442.0) * (wl < 442.0 ? 0.0624 : 0.0374)
  const t2 = (wl - 599.8) * (wl < 599.8 ? 0.0264 : 0.0323)
  const t3 = (wl - 501.1) * (wl < 501.1 ? 0.0490 : 0.0382)
  const x  = 0.362 * Math.exp(-0.5 * t1 * t1)
           + 1.056 * Math.exp(-0.5 * t2 * t2)
           - 0.065 * Math.exp(-0.5 * t3 * t3)

  const t4 = (wl - 568.8) * (wl < 568.8 ? 0.0213 : 0.0247)
  const t5 = (wl - 530.9) * (wl < 530.9 ? 0.0613 : 0.0322)
  const y  = 0.821 * Math.exp(-0.5 * t4 * t4)
           + 0.286 * Math.exp(-0.5 * t5 * t5)

  const t6 = (wl - 437.0) * (wl < 437.0 ? 0.0845 : 0.0278)
  const t7 = (wl - 459.0) * (wl < 459.0 ? 0.0385 : 0.0725)
  const z  = 1.217 * Math.exp(-0.5 * t6 * t6)
           + 0.681 * Math.exp(-0.5 * t7 * t7)

  return { x, y, z }
}

// ─── XYZ → RGB linéaire (espace sRGB) ───────────────────────────
// Matrice de conversion CIE standard D65

export function xyzToLinearRGB({ x, y, z }) {
  return {
    r:  3.2406 * x - 1.5372 * y - 0.4986 * z,
    g: -0.9689 * x + 1.8758 * y + 0.0415 * z,
    b:  0.0557 * x - 0.2040 * y + 1.0570 * z,
  }
}

// ─── Normalisation + clamp ────────────────────────────────────────

function normalizeRGB({ r, g, b }) {
  r = Math.max(0, r)
  g = Math.max(0, g)
  b = Math.max(0, b)
  const max = Math.max(r, g, b, 1e-10)
  return { r: r / max, g: g / max, b: b / max }
}

// ─── Correction gamma sRGB ────────────────────────────────────────

function gammaCorrect({ r, g, b }) {
  const gc = (v) => v <= 0.0031308
    ? 12.92 * v
    : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return { r: gc(r), g: gc(g), b: gc(b) }
}

// ─── Pipeline complet λ → CSS color string ───────────────────────
// Retourne une string CSS utilisable directement

export function wavelengthToCSS(wl) {
  if (wl < 380 || wl > 780) return '#888'
  const xyz = wavelengthToXYZ(wl)
  const lin = xyzToLinearRGB(xyz)
  const nor = normalizeRGB(lin)
  const gc  = gammaCorrect(nor)
  const r   = Math.round(gc.r * 255)
  const g   = Math.round(gc.g * 255)
  const b   = Math.round(gc.b * 255)
  return `rgb(${r},${g},${b})`
}

// ─── Version rapide pour l'UI (pas les rayons) ───────────────────
// Approximation légère pour les sliders et indicateurs

export function wavelengthToCSSFast(wl) {
  if (wl < 380) return 'hsl(280,80%,50%)'
  if (wl < 440) return `hsl(${270+(wl-380)*0.5},90%,55%)`
  if (wl < 490) return `hsl(${240+(wl-440)*0.9},90%,55%)`
  if (wl < 510) return `hsl(${175+(wl-490)*3.25},85%,45%)`
  if (wl < 580) return `hsl(${120-(wl-510)*1.7},85%,40%)`
  if (wl < 645) return `hsl(${25-(wl-580)*0.38},90%,45%)`
  return `hsl(0,85%,${Math.max(28,45-(wl-645)*0.12)}%)`
}

// ─── Tone mapping Reinhard ────────────────────────────────────────

export function toneMapReinhard(v) {
  return v / (1 + v)
}

// ─── HDR buffer pour rendu physique ──────────────────────────────

export class HDRBuffer {
  constructor(width, height) {
    this.width  = width
    this.height = height
    this.data   = new Float32Array(width * height * 3)
  }

  addRay(x, y, wl, intensity) {
    const xi = Math.round(x)
    const yi = Math.round(y)
    if (xi < 0 || xi >= this.width || yi < 0 || yi >= this.height) return

    const xyz = wavelengthToXYZ(wl)
    const lin = xyzToLinearRGB(xyz)
    const idx = (yi * this.width + xi) * 3

    this.data[idx]     += Math.max(0, lin.r) * intensity
    this.data[idx + 1] += Math.max(0, lin.g) * intensity
    this.data[idx + 2] += Math.max(0, lin.b) * intensity
  }

  // Bloom : blur gaussien sur les zones lumineuses
  applyBloom(strength = 0.6, radius = 8, threshold = 0.8) {
    const bright = new Float32Array(this.data.length)
    const W = this.width, H = this.height

    // Bright-pass
    for (let i = 0; i < this.data.length; i += 3) {
      const lum = 0.2126*this.data[i] + 0.7152*this.data[i+1] + 0.0722*this.data[i+2]
      if (lum > threshold) {
        bright[i]   = this.data[i]
        bright[i+1] = this.data[i+1]
        bright[i+2] = this.data[i+2]
      }
    }

    // Blur horizontal + vertical (séparable → rapide)
    const blurred = this._separableBlur(bright, W, H, radius)

    // Additionner le bloom
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] += blurred[i] * strength
    }
  }

  _separableBlur(src, W, H, r) {
    const tmp = new Float32Array(src.length)
    const out = new Float32Array(src.length)
    // Horizontal
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let rv = 0, gv = 0, bv = 0, n = 0
        for (let dx = -r; dx <= r; dx++) {
          const nx = Math.min(Math.max(x + dx, 0), W - 1)
          const i  = (y * W + nx) * 3
          const w  = Math.exp(-dx*dx / (2*r*r/4))
          rv += src[i]   * w
          gv += src[i+1] * w
          bv += src[i+2] * w
          n  += w
        }
        const i = (y * W + x) * 3
        tmp[i]=rv/n; tmp[i+1]=gv/n; tmp[i+2]=bv/n
      }
    }
    // Vertical
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let rv = 0, gv = 0, bv = 0, n = 0
        for (let dy = -r; dy <= r; dy++) {
          const ny = Math.min(Math.max(y + dy, 0), H - 1)
          const i  = (ny * W + x) * 3
          const w  = Math.exp(-dy*dy / (2*r*r/4))
          rv += tmp[i]   * w
          gv += tmp[i+1] * w
          bv += tmp[i+2] * w
          n  += w
        }
        const i = (y * W + x) * 3
        out[i]=rv/n; out[i+1]=gv/n; out[i+2]=bv/n
      }
    }
    return out
  }

  // Rendre sur un canvas 2D
  renderToCanvas(ctx) {
    const W   = this.width
    const H   = this.height
    const img = ctx.createImageData(W, H)

    for (let i = 0; i < this.data.length; i += 3) {
      // Tone mapping Reinhard
      let r = toneMapReinhard(this.data[i])
      let g = toneMapReinhard(this.data[i+1])
      let b = toneMapReinhard(this.data[i+2])

      // Gamma sRGB
      const gc = (v) => v <= 0.0031308
        ? 12.92 * v
        : 1.055 * Math.pow(Math.max(0, v), 1/2.4) - 0.055

      const pi = (i / 3) * 4
      img.data[pi]   = Math.round(gc(r) * 255)
      img.data[pi+1] = Math.round(gc(g) * 255)
      img.data[pi+2] = Math.round(gc(b) * 255)
      img.data[pi+3] = 255
    }

    ctx.putImageData(img, 0, 0)
  }

  clear() {
    this.data.fill(0)
  }
}