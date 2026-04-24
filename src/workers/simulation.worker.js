import init, {
  run_simulation,
  compute_young,
  compute_grating,
  compute_malus,
  compute_polarization_train,
  compute_michelson,
  compute_decay,
  compute_attenuation,
  compute_compton,
  compute_dose,
  compute_photoelectric,
  compute_schrodinger,
  compute_bell,
  compute_atomic_spectrum,
  compute_solar_spectrum,
  get_fraunhofer_lines,
  identify_element,
  get_atomic_lines,
  wavelength_to_color,
  photon_energy_ev,
  engine_version,
} from '../wasm/luxlab_engine.js'

let ready     = false
let currentId = null

async function initialize() {
  try {
    await init()
    ready = true
    self.postMessage({ type:'READY', version:engine_version() })
  } catch(err) {
    self.postMessage({ type:'ERROR', code:'WASM_INIT_FAILED', error:err.message })
  }
}

self.onmessage = async ({ data }) => {
  if (!ready) await initialize()

  const { type, id } = data
  currentId = id

  const call = (fn, input) => {
    try {
      const raw    = typeof input === 'string' ? input : JSON.stringify(input)
      const result = JSON.parse(fn(raw))
      if (data.id !== currentId) return
      self.postMessage({ type:`${type}_RESULT`, id, result })
    } catch(e) {
      self.postMessage({ type:'ERROR', id, error:e.message })
    }
  }

  const callDirect = (fn, ...args) => {
    try {
      const result = JSON.parse(fn(...args))
      self.postMessage({ type:`${type}_RESULT`, id, result })
    } catch(e) {
      self.postMessage({ type:'ERROR', id, error:e.message })
    }
  }

  switch (type) {
    case 'RUN':                   call(run_simulation,          data.input);                         break
    case 'YOUNG':                 call(compute_young,           data.params);                        break
    case 'GRATING':               call(compute_grating,         data.params);                        break
    case 'MALUS':                 call(compute_malus,           data.params);                        break
    case 'POLARIZATION_TRAIN':    call(compute_polarization_train, data.params);                     break
    case 'MICHELSON':             call(compute_michelson,       data.params);                        break
    case 'DECAY':                 call(compute_decay,           data.params);                        break
    case 'ATTENUATION':           call(compute_attenuation,     data.params);                        break
    case 'COMPTON':               callDirect(compute_compton,   data.energy_kev, data.steps||180);   break
    case 'DOSE':                  call(compute_dose,            data.params);                        break
    case 'PHOTOELECTRIC':         call(compute_photoelectric,   data.params);                        break
    case 'SCHRODINGER':           call(compute_schrodinger,     data.params);                        break
    case 'BELL':                  call(compute_bell,            data.params);                        break
    case 'ATOMIC_SPECTRUM':       call(compute_atomic_spectrum, data.params);                        break
    case 'SOLAR_SPECTRUM':        callDirect(compute_solar_spectrum, data.steps||600);               break
    case 'FRAUNHOFER_LINES':      { const r=JSON.parse(get_fraunhofer_lines()); self.postMessage({type:'FRAUNHOFER_LINES_RESULT',id,result:r}); break }
    case 'IDENTIFY_ELEMENT':      call(identify_element,        data.params);                        break
    case 'ATOMIC_LINES':          { const r=JSON.parse(get_atomic_lines(data.element)); self.postMessage({type:'ATOMIC_LINES_RESULT',id,result:r}); break }
    case 'WAVELENGTH_COLOR':      { const c=JSON.parse(wavelength_to_color(data.wl)); self.postMessage({type:'WAVELENGTH_COLOR_RESULT',id,color:c}); break }
    case 'PING':                  self.postMessage({type:'PONG', ready, version:engine_version()});  break
    default:
      self.postMessage({ type:'ERROR', error:`Type inconnu: ${type}` })
  }
}

initialize()