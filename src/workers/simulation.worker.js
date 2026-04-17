import init, {
  run_simulation,
  wavelength_to_color,
  photon_energy_ev,
  engine_version,
} from '/wasm/luxlab_engine.js'

// ─── État du Worker ───────────────────────────────────────────────

let ready       = false
let currentId   = null   // ID du calcul en cours

// ─── Initialisation WASM ─────────────────────────────────────────

async function initialize() {
  try {
    await init('/wasm/luxlab_engine_bg.wasm')
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

    // Lancer une simulation
    case 'RUN': {
      currentId = data.id

      try {
        const t0     = performance.now()
        const input  = JSON.stringify({
          components: data.components,
          options:    data.options || {},
        })
        const output = run_simulation(input)
        const result = JSON.parse(output)
        const ms     = performance.now() - t0

        // Si un nouveau calcul a démarré entre temps → ignorer ce résultat
        if (data.id !== currentId) break

        // Résultat valide
        if (result.error) {
          self.postMessage({ type: 'ERROR', id: data.id, ...result })
        } else {
          self.postMessage({
            type:       'RESULT',
            id:         data.id,
            result,
            durationMs: ms,
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

    // Couleur d'une longueur d'onde
    case 'WAVELENGTH_COLOR': {
      try {
        const color = JSON.parse(wavelength_to_color(data.wl))
        self.postMessage({ type: 'WAVELENGTH_COLOR_RESULT', id: data.id, color })
      } catch (err) {
        self.postMessage({ type: 'ERROR', id: data.id, error: err.message })
      }
      break
    }

    // Énergie d'un photon
    case 'PHOTON_ENERGY': {
      const ev = photon_energy_ev(data.wl)
      self.postMessage({ type: 'PHOTON_ENERGY_RESULT', id: data.id, ev })
      break
    }

    // Ping de vérification
    case 'PING': {
      self.postMessage({ type: 'PONG', ready, version: engine_version() })
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

// Initialiser immédiatement au chargement du Worker
initialize()