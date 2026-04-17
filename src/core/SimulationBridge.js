// ─── Bridge Worker ────────────────────────────────────────────────
// Interface unique entre l'UI et le Web Worker WASM.
// Gère : initialisation, file de messages, callbacks, annulation.

class SimulationBridge {
  #worker      = null
  #ready       = false
  #pending     = new Map()   // id → { resolve, reject, timestamp }
  #listeners   = new Set()   // pour les mises à jour de statut
  #msgCounter  = 0

  constructor() {
    this.#initWorker()
  }

  // ─── Initialisation ─────────────────────────────────────────────

  #initWorker() {
    this.#worker = new Worker(
      new URL('../workers/simulation.worker.js', import.meta.url),
      { type: 'module' }
    )

    this.#worker.onmessage = ({ data }) => this.#handleMessage(data)

    this.#worker.onerror = (err) => {
      console.error('[Bridge] Worker error:', err)
      this.#emit('error', { error: err.message })
    }
  }

  // ─── Réception des messages ──────────────────────────────────────

  #handleMessage(data) {
    switch (data.type) {

      case 'READY':
        this.#ready = true
        this.#emit('ready', { version: data.version })
        break

      case 'RESULT': {
        const cb = this.#pending.get(data.id)
        if (cb) {
          this.#pending.delete(data.id)
          cb.resolve(data.result)
        }
        this.#emit('result', data)
        break
      }

      case 'ERROR': {
        const cb = this.#pending.get(data.id)
        if (cb) {
          this.#pending.delete(data.id)
          cb.reject(new Error(data.error))
        }
        this.#emit('error', data)
        break
      }

      case 'PONG':
        this.#emit('pong', data)
        break

      default:
        this.#emit(data.type.toLowerCase(), data)
    }
  }

  // ─── API publique ────────────────────────────────────────────────

  /**
   * Lance une simulation.
   * Annule automatiquement le calcul précédent en attente.
   * @param {Object[]} components
   * @param {Object}   options
   * @returns {Promise<Object>} résultats de simulation
   */
  async runSimulation(components, options = {}) {
    const id = this.#nextId('sim')

    // Annuler tous les calculs en attente
    this.#pending.forEach((cb, pendingId) => {
      if (pendingId.startsWith('sim')) {
        cb.reject(new Error('cancelled'))
        this.#pending.delete(pendingId)
      }
    })

    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject, timestamp: Date.now() })
      this.#worker.postMessage({ type: 'RUN', id, components, options })
    })
  }

  /**
   * Récupère la couleur RGB d'une longueur d'onde.
   * @param {number} wl — longueur d'onde en nm
   * @returns {Promise<{r,g,b}>}
   */
  async getWavelengthColor(wl) {
    const id = this.#nextId('wlc')
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve: (d) => resolve(d.color), reject })
      this.#worker.postMessage({ type: 'WAVELENGTH_COLOR', id, wl })
    })
  }

  /**
   * Vérifie que le Worker est prêt.
   */
  ping() {
    this.#worker.postMessage({ type: 'PING' })
  }

  get isReady() { return this.#ready }

  // ─── Observers ───────────────────────────────────────────────────

  on(event, fn) {
    this.#listeners.add({ event, fn })
    return () => this.#listeners.forEach(l => {
      if (l.fn === fn) this.#listeners.delete(l)
    })
  }

  #emit(event, data) {
    this.#listeners.forEach(l => {
      if (l.event === event || l.event === '*') l.fn(data)
    })
  }

  // ─── Utils ───────────────────────────────────────────────────────

  #nextId(prefix) {
    return `${prefix}-${++this.#msgCounter}-${Date.now()}`
  }
}

// Singleton — une seule instance dans toute l'app
export const bridge = new SimulationBridge()