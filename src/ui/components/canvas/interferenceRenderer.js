import { wavelengthToCSS } from '../../../core/colorScience'

export function renderInterferenceOnScreen(ctx, components, result, zoom, pan) {
  const screen  = components.find(c => c.type === 'screen')
  const source  = components.find(c => c.type === 'source')
  const profile = result?.waveResults?.youngProfile
  if (!screen || !profile || !source) return

  const wl      = source.params?.wavelength || 550
  const color   = wavelengthToCSS(wl)

  // Position de l'écran en coordonnées canvas
  const sx = screen.x * zoom + pan.x
  const sy = screen.y * zoom + pan.y
  const h  = (screen.params?.height || 80) * 0.8 * zoom
  const w  = 8 * zoom

  // Dessiner le profil d'intensité sur l'écran
  const steps = profile.length

  ctx.save()

  for (let i = 0; i < steps; i++) {
    const pt = profile[i]
    const py = sy - h/2 + (i / steps) * h
    const I  = Math.min(1, Math.max(0, pt.I))

    // Pixel coloré selon λ et intensité
    ctx.fillStyle   = color
    ctx.globalAlpha = I * 0.9
    ctx.fillRect(sx - w/2, py, w, h / steps + 1)
  }

  ctx.restore()
}