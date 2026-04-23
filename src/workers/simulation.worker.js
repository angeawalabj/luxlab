import init, {
  run_simulation,
  compute_young,
  compute_grating,
  compute_decay,
  compute_attenuation,
  compute_compton,
  compute_dose,
  wavelength_to_color,
  photon_energy_ev,
  engine_version,
} from '../wasm/luxlab_engine.js'

// ─── État du Worker ───────────────────────────────────────────────

let ready      = false
let currentId  = null

// ─── Initialisation WASM ─────────────────────────────────────────

async function initialize() {
  try {
    await init()
    ready = true
    self.postMessage({ type: 'READY', version: engine_version() })
  } catch (err) {
    self.postMessage({
      type:  'ERROR',
      code:  'WASM_INIT_FAILED',
      error: err.message,
    })
  }
}

// ─── Gestionnaire de messages ─────────────────────────────────────

self.onmessage = async ({ data }) => {
  if (!ready) await initialize()

  switch (data.type) {

case 'RUN': {
  currentId = data.id
  try {
    const t0     = performance.now()
    const output = run_simulation(JSON.stringify({
      components: data.components,
      options:    data.options || {},
    }))
    const result     = JSON.parse(output)
    const durationMs = performance.now() - t0

    if (data.id !== currentId) break

    if (result.error) {
      self.postMessage({ type: 'ERROR', id: data.id, ...result })
    } else {
      // On ajoute durationMs ici côté JS
      self.postMessage({
        type:   'RESULT',
        id:     data.id,
        result: { ...result, durationMs },
      })
    }
  } catch (err) {
    self.postMessage({
      type:  'ERROR',
      id:    data.id,
      code:  'SIMULATION_FAILED',
      error: err.message,
    })
  }
  break
}
    case 'WAVELENGTH_COLOR': {
      try {
        const color = JSON.parse(wavelength_to_color(data.wl))
        self.postMessage({
          type:  'WAVELENGTH_COLOR_RESULT',
          id:    data.id,
          color,
        })
      } catch (err) {
        self.postMessage({ type: 'ERROR', id: data.id, error: err.message })
      }
      break
    }

    case 'PHOTON_ENERGY': {
      const ev = photon_energy_ev(data.wl)
      self.postMessage({ type: 'PHOTON_ENERGY_RESULT', id: data.id, ev })
      break
    }

    case 'PING': {
      self.postMessage({ type: 'PONG', ready, version: engine_version() })
      break
    }

case 'YOUNG': {
  const result = JSON.parse(compute_young(JSON.stringify(data.params)))
  self.postMessage({ type:'YOUNG_RESULT', id:data.id, result })
  break
}

case 'GRATING': {
  const result = JSON.parse(compute_grating(JSON.stringify(data.params)))
  self.postMessage({ type:'GRATING_RESULT', id:data.id, result })
  break
}

case 'DECAY': {
  const result = JSON.parse(compute_decay(JSON.stringify(data.params)))
  self.postMessage({ type:'DECAY_RESULT', id:data.id, result })
  break
}

case 'ATTENUATION': {
  const result = JSON.parse(compute_attenuation(JSON.stringify(data.params)))
  self.postMessage({ type:'ATTENUATION_RESULT', id:data.id, result })
  break
}

case 'COMPTON': {
  const result = JSON.parse(compute_compton(data.energy_kev, data.steps || 180))
  self.postMessage({ type:'COMPTON_RESULT', id:data.id, result })
  break
}

case 'DOSE': {
  const result = JSON.parse(compute_dose(JSON.stringify(data.params)))
  self.postMessage({ type:'DOSE_RESULT', id:data.id, result })
  break
}
    default:
      self.postMessage({
        type:  'ERROR',
        error: `Message type inconnu : ${data.type}`,
        code:  'UNKNOWN_MESSAGE',
      })
  }
}

initialize()