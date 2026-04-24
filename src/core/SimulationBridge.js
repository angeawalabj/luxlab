// ─── SimulationBridge ─────────────────────────────────────────────
// Interface unique entre UI et Web Worker (WASM / calculs lourds)

class SimulationBridge {
  #worker      = null
  #ready       = false
  #pending     = new Map()
  #listeners   = new Set()
  #msgCounter  = 0
  #version     = 'unknown'

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
      console.warn('[Bridge] Worker non disponible — fallback JS actif')
      // Ne pas bloquer l'app si le worker échoue
      this.#emit('error', { error: err.message || 'Worker error' })
    }
  }

  // ─── Core RPC (générique) ───────────────────────────────────────

  #request(type, payload = {}, options = {}) {
    const id = this.#nextId(type.toLowerCase())
    const timeoutMs = options.timeout ?? 10000

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#pending.delete(id)
        reject(new Error(`timeout (${type})`))
      }, timeoutMs)

      this.#pending.set(id, {
        resolve: (d) => {
          clearTimeout(timeout)
          resolve(d.result ?? d)
        },
        reject: (err) => {
          clearTimeout(timeout)
          reject(err)
        },
        timestamp: Date.now(),
        type
      })

      this.#worker.postMessage({ type, id, ...payload })
    })
  }

  // ─── Réception des messages ─────────────────────────────────────

  #handleMessage(data) {
    switch (data.type) {

      case 'READY':
        this.#ready   = true
        this.#version = data.version
        this.#emit('ready', { version: data.version })
        break

      case 'RESULT': {
        const cb = this.#pending.get(data.id)
        if (cb) {
          this.#pending.delete(data.id)
          cb.resolve(data) // ✅ IMPORTANT (cohérent avec #request)
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

  // ─── API haut niveau ────────────────────────────────────────────

  // Ondulatoire
  computeYoung(params)             { return this.#request('YOUNG',   { params }) }
  computeGrating(params)           { return this.#request('GRATING', { params }) }
  computeMalus(params)             { return this.#request('MALUS',   { params }) }
  computePolarizationTrain(params) { return this.#request('POLARIZATION_TRAIN', { params }) }
  computeMichelson(params)         { return this.#request('MICHELSON', { params }) }

  // Nucléaire
  computeDecay(params)             { return this.#request('DECAY',       { params }) }
  computeAttenuation(params)       { return this.#request('ATTENUATION', { params }) }
  computeCompton(energy_kev, steps = 180) {
    return this.#request('COMPTON', { energy_kev, steps })
  }
  computeDose(params)              { return this.#request('DOSE', { params }) }

  // Quantique
  computePhotoelectric(params)     { return this.#request('PHOTOELECTRIC', { params }) }
  computeSchrodinger(params)       { return this.#request('SCHRODINGER',   { params }) }
  computeBell(params)              { return this.#request('BELL',          { params }) }

  // Spectroscopie
  computeAtomicSpectrum(params)    { return this.#request('ATOMIC_SPECTRUM',  { params }) }
  computeSolarSpectrum(steps = 600){ return this.#request('SOLAR_SPECTRUM',   { steps }) }
  getFraunhoferLines()             { return this.#request('FRAUNHOFER_LINES') }
  identifyElement(params)          { return this.#request('IDENTIFY_ELEMENT', { params }) }
  getAtomicLines(element)          { return this.#request('ATOMIC_LINES',     { element }) }
  runFDTD(params) { return this.#request('FDTD', { params }) }
  // ─── Cas spécial : simulation complète ──────────────────────────

  async runSimulation(components, options = {}) {
    this.cancelByPrefix('sim')
    return this.#request('RUN', { components, options })
  }

  async getWavelengthColor(wl) {
    return this.#request('WAVELENGTH_COLOR', { wl })
  }

  // ─── Utilitaires ────────────────────────────────────────────────

  cancelByPrefix(prefix) {
    this.#pending.forEach((cb, id) => {
      if (id.startsWith(prefix)) {
        cb.reject(new Error('cancelled'))
        this.#pending.delete(id)
      }
    })
  }

  ping() {
    this.#worker.postMessage({ type: 'PING' })
  }

  get isReady() { return this.#ready }

  // ─── Events ─────────────────────────────────────────────────────

  on(event, fn) {
    const listener = { event, fn }
    this.#listeners.add(listener)

    if (event === 'ready' && this.#ready) {
      fn({ version: this.#version })
    }

    return () => this.#listeners.delete(listener)
  }

  #emit(event, data) {
    this.#listeners.forEach(l => {
      if (l.event === event || l.event === '*') {
        l.fn(data)
      }
    })
  }

  // ─── Utils internes ─────────────────────────────────────────────

  #nextId(prefix) {
    return `${prefix}-${++this.#msgCounter}-${Date.now()}`
  }
}

// ─── Singleton ───────────────────────────────────────────────────

export const bridge = new SimulationBridge()