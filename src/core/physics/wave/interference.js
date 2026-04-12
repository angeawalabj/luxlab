const TWO_PI = Math.PI * 2

// Intensité fentes de Young en un point y sur l'écran
export function youngIntensity(y, params) {
  const { wavelength = 550, slitSeparation = 0.5, slitWidth = 0.1, screenDistance = 300 } = params
  const lambda = wavelength * 1e-9
  const d      = slitSeparation * 1e-3
  const a      = slitWidth * 1e-3
  const L      = screenDistance * 1e-3
  const yM     = y * 1e-3

  const sinT   = yM / Math.sqrt(yM * yM + L * L)
  const beta   = (Math.PI * a * sinT) / lambda
  const delta  = (Math.PI * d * sinT) / lambda

  const diffraction  = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2)
  const interference = Math.pow(Math.cos(delta), 2)

  return diffraction * interference
}

// Profil d'intensité complet sur l'écran [-halfH, +halfH] en mm
export function youngProfile(params, halfH = 10, steps = 400) {
  const points = []
  for (let i = 0; i <= steps; i++) {
    const y = -halfH + (i / steps) * halfH * 2
    points.push({ y, I: youngIntensity(y, params) })
  }
  return points
}

// Réseau de diffraction — positions des maxima
export function gratingMaxima(wavelength, spacing, order = 3) {
  const lambda = wavelength * 1e-9
  const d      = spacing * 1e-9
  const maxima = []
  for (let m = -order; m <= order; m++) {
    const sinT = (m * lambda) / d
    if (Math.abs(sinT) <= 1) {
      maxima.push({ order: m, angle: Math.asin(sinT) * 180 / Math.PI })
    }
  }
  return maxima
}

// Interférence Michelson
export function michelsonIntensity(deltaL, wavelength) {
  const lambda = wavelength * 1e-9
  const phi    = (TWO_PI * 2 * deltaL * 1e-3) / lambda
  return Math.pow(Math.cos(phi / 2), 2)
}

// Calcul de la figure de diffraction en 2D (pour affichage canvas)
export function youngPattern2D(params, width, height) {
  const { wavelength = 550, slitSeparation = 0.5, screenDistance = 300 } = params
  const imageData = new Uint8ClampedArray(width * height * 4)
  const halfH = height / 2

  for (let py = 0; py < height; py++) {
    const y   = ((py - halfH) / height) * 20
    const I   = youngIntensity(y, params)
    const hex = wavelengthToRGB(wavelength)
    for (let px = 0; px < width; px++) {
      const idx  = (py * width + px) * 4
      imageData[idx]   = Math.round(hex.r * I)
      imageData[idx+1] = Math.round(hex.g * I)
      imageData[idx+2] = Math.round(hex.b * I)
      imageData[idx+3] = 255
    }
  }
  return imageData
}

export function wavelengthToRGB(wl) {
  let r, g, b
  if      (wl < 440) { r = (440-wl)/60; g = 0;             b = 1 }
  else if (wl < 490) { r = 0;           g = (wl-440)/50;   b = 1 }
  else if (wl < 510) { r = 0;           g = 1;             b = (510-wl)/20 }
  else if (wl < 580) { r = (wl-510)/70; g = 1;             b = 0 }
  else if (wl < 645) { r = 1;           g = (645-wl)/65;   b = 0 }
  else               { r = 1;           g = 0;             b = 0 }
  const gamma = 0.8
  return {
    r: Math.round(255 * Math.pow(r, gamma)),
    g: Math.round(255 * Math.pow(g, gamma)),
    b: Math.round(255 * Math.pow(b, gamma)),
  }
}