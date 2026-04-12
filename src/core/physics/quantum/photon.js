// Probabilité de transmission d'un polariseur (loi de Malus)
export function malusLaw(I0, angle1, angle2) {
  const theta = ((angle2 - angle1) * Math.PI) / 180
  return I0 * Math.pow(Math.cos(theta), 2)
}

// Fonction d'onde d'un photon dans une boîte 1D
export function particleInBox(n, x, L) {
  return Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L)
}

// Distribution de probabilité pour n niveaux
export function probabilityDistribution(n, L, steps = 200) {
  const points = []
  for (let i = 0; i <= steps; i++) {
    const x   = (i / steps) * L
    const psi = particleInBox(n, x, L)
    points.push({ x, psi, prob: psi * psi })
  }
  return points
}

// Effet photoélectrique
export function photoelectricEffect(wavelength, workFunction) {
  const h     = 6.626e-34
  const c     = 3e8
  const eV    = 1.602e-19
  const E     = (h * c) / (wavelength * 1e-9)
  const phi   = workFunction * eV
  const Ekin  = E - phi
  return {
    photonEnergy: (E / eV).toFixed(3),
    kineticEnergy: Ekin > 0 ? (Ekin / eV).toFixed(3) : 0,
    emitted: Ekin > 0,
    thresholdWL: Math.round((h * c) / phi * 1e9),
  }
}

// Intrication — corrélation de Bell simplifiée
export function bellCorrelation(angle1, angle2) {
  const theta = ((angle2 - angle1) * Math.PI) / 180
  return -Math.cos(theta)
}