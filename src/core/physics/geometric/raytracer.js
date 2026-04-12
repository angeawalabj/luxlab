export function traceRays(components) {
  const results = { rays: [], intersections: [], images: [] }

  const source = components.find(c => c.type === 'source')
  if (!source) return results

  const wl = source.params?.wavelength || 550
  const sorted = [...components].sort((a, b) => a.x - b.x)

  const lenses  = sorted.filter(c => c.type === 'lens')
  const mirrors = sorted.filter(c => c.type === 'mirror')
  const screens = sorted.filter(c => c.type === 'screen')
  const prisms  = sorted.filter(c => c.type === 'prism')

  const numRays = 7
  const spread  = 60

  for (let i = 0; i < numRays; i++) {
    const h = (i - Math.floor(numRays / 2)) * (spread / (numRays - 1))
    const ray = { x: source.x + 20, y: source.y + h, angle: 0, wl, alive: true }
    const segments = [{ x: ray.x, y: ray.y }]

    const obstacles = [...lenses, ...prisms, ...mirrors, ...screens]
      .sort((a, b) => a.x - b.x)
      .filter(c => c.x > ray.x)

    for (const obs of obstacles) {
      if (!ray.alive) break

      const dx  = obs.x - ray.x
      const ny  = ray.y + dx * Math.tan(ray.angle)
      ray.x = obs.x
      ray.y = ny
      segments.push({ x: ray.x, y: ray.y })

      if (obs.type === 'lens') {
        const f  = obs.params?.focalLength || 50
        const h  = ray.y - obs.y
        ray.angle = ray.angle - h / f
        results.intersections.push({ x: ray.x, y: ray.y, type: 'refraction' })
      }

      if (obs.type === 'prism') {
        const n  = obs.params?.refractiveIndex || 1.52
        const A  = (obs.params?.apexAngle || 60) * Math.PI / 180
        const wlRef = 550
        const dn = 0.008 * (wlRef - wl) / 100
        const deviation = (n + dn - 1) * A
        ray.angle += deviation
        results.intersections.push({ x: ray.x, y: ray.y, type: 'dispersion' })
      }

      if (obs.type === 'mirror') {
        ray.angle = -ray.angle
        results.intersections.push({ x: ray.x, y: ray.y, type: 'reflection' })
      }

      if (obs.type === 'screen') {
        ray.alive = false
        results.intersections.push({ x: ray.x, y: ray.y, type: 'detection' })
      }
    }

    if (ray.alive) {
      const xEnd = 1400
      segments.push({ x: xEnd, y: ray.y + (xEnd - ray.x) * Math.tan(ray.angle) })
    }

    results.rays.push({ segments, wl, alive: ray.alive })
  }

  // Calcul de l'image conjuguée (lentilles)
  if (lenses.length > 0 && source) {
    let xObj = source.x
    let yObj = source.y
    for (const lens of lenses) {
      const f  = lens.params?.focalLength || 50
      const d  = lens.x - xObj
      if (d === 0) continue
      const di = (d * f) / (d - f)
      const xImg = lens.x + di
      const m  = -di / d
      const yImg = lens.y + m * (yObj - lens.y)
      results.images.push({ x: xImg, y: yImg, magnification: m, real: di > 0 })
      xObj = xImg
      yObj = yImg
    }
  }

  return results
}

export function wavelengthToHex(wl) {
  if (wl < 380) return '#9400d3'
  if (wl < 440) return `hsl(${270 + (wl-380)*0.5},100%,55%)`
  if (wl < 490) return `hsl(${240 + (wl-440)*0.9},100%,55%)`
  if (wl < 510) return `hsl(${175 + (wl-490)*3.25},100%,45%)`
  if (wl < 580) return `hsl(${120 - (wl-510)*1.7},100%,45%)`
  if (wl < 645) return `hsl(${25 - (wl-580)*0.38},100%,50%)`
  return `hsl(0,100%,${Math.max(28,50-(wl-645)*0.17)}%)`
}