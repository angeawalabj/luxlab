import { LuxPlugin }   from '../../../core/plugin-api/index.js'
import SpectroPanel    from './SpectroPanel.jsx'

const plugin = new LuxPlugin({
  id:           '@luxlab/spectroscopy',
  name:         'Spectroscopie',
  version:      '1.0.0',
  author:       'LuxLab Team',
  license:      'free',
  description:  'Spectres atomiques, raies de Fraunhofer, identification d\'éléments.',
  dependencies: ['@luxlab/geo-optics'],
})

export const ATOMIC_SPECTRA = {
  Hydrogène: [
    { wl:656.3, I:1.0,  name:'Hα' },
    { wl:486.1, I:0.56, name:'Hβ' },
    { wl:434.0, I:0.30, name:'Hγ' },
    { wl:410.2, I:0.16, name:'Hδ' },
  ],
  Sodium: [
    { wl:589.0, I:1.0,  name:'D₂' },
    { wl:589.6, I:0.98, name:'D₁' },
    { wl:568.8, I:0.12, name:'Vert' },
  ],
  Mercure: [
    { wl:404.7, I:0.35, name:'Violet' },
    { wl:435.8, I:1.0,  name:'Bleu'   },
    { wl:546.1, I:0.85, name:'Vert'   },
    { wl:578.0, I:0.60, name:'Jaune'  },
  ],
  Hélium: [
    { wl:447.1, I:0.45, name:'Bleu'   },
    { wl:501.6, I:0.55, name:'Vert'   },
    { wl:587.6, I:1.0,  name:'Jaune'  },
    { wl:667.8, I:0.70, name:'Rouge'  },
  ],
  Néon: [
    { wl:585.2, I:0.70, name:'Jaune'      },
    { wl:614.3, I:0.85, name:'Orange-rouge'},
    { wl:640.2, I:1.0,  name:'Rouge'      },
    { wl:692.9, I:0.55, name:'Rouge foncé'},
  ],
  Calcium: [
    { wl:393.4, I:0.80, name:'K - UV' },
    { wl:396.8, I:0.60, name:'H - UV' },
    { wl:422.7, I:1.0,  name:'Violet' },
  ],
}

export const FRAUNHOFER = [
  { wl:393.4, el:'Ca²⁺', name:'K' },
  { wl:396.8, el:'Ca²⁺', name:'H' },
  { wl:430.8, el:'Fe',   name:'G' },
  { wl:486.1, el:'Hβ',   name:'F' },
  { wl:527.0, el:'Fe',   name:'E₂'},
  { wl:589.0, el:'Na',   name:'D₂'},
  { wl:589.6, el:'Na',   name:'D₁'},
  { wl:656.3, el:'Hα',   name:'C' },
  { wl:686.7, el:'O₂',   name:'B' },
]

plugin.addComponent({
  type:'spectrometer', label:'Spectromètre',
  icon:'≋', moduleId:'@luxlab/spectroscopy', category:'Spectroscopie',
  defaultParams: {
    element:'Sodium', mode:'emission', resolution:0.5,
  },
  paramsDef: [
    { key:'element',    label:'Élément',    type:'select',
      options:Object.keys(ATOMIC_SPECTRA) },
    { key:'mode',       label:'Mode',        type:'select',
      options:['emission','absorption','solar'] },
    { key:'resolution', label:'Résolution (nm)', type:'range',
      min:0.1, max:5, step:0.1 },
  ],
  simulate: (p) => ({ type:'spectrometer', element:p.element }),
  render:   ()  => ({ shape:'rect', icon:'≋', color:'#16a085' }),
})

plugin.addComponent({
  type:'spectral-filter', label:'Filtre spectral',
  icon:'⬤', moduleId:'@luxlab/spectroscopy', category:'Spectroscopie',
  defaultParams: {
    centerWL:550, bandwidth:50, transmittance:1.0,
  },
  paramsDef: [
    { key:'centerWL',      label:'λ centrale (nm)',   type:'range', min:380, max:780, step:1   },
    { key:'bandwidth',     label:'Bande passante (nm)',type:'range', min:5,   max:200, step:5   },
    { key:'transmittance', label:'Transmittance',      type:'range', min:0,   max:1,   step:0.05},
  ],
  simulate: (p) => ({
    type:'spectral-filter', centerWL:p.centerWL, bandwidth:p.bandwidth,
  }),
  render: (props) => ({
    shape:'screen',
    color: `hsl(${((props?.params?.centerWL||550)-380)/400*270},70%,45%)`,
  }),
})

plugin.addEngine({
  id:   '@luxlab/spectroscopy/engine',
  name: 'Moteur Spectroscopique',

  canHandle: (components) =>
    components.some(c => ['spectrometer','spectral-filter'].includes(c.type)),

  run: (components, options) => {
    const result = {
      rays:[], intersections:[], images:[],
      waveResults:{}, spectroResults:{},
      durationMs:0,
    }
    const t0 = performance.now()

    const spec   = components.find(c => c.type === 'spectrometer')
    const source = components.find(c => c.type === 'source')

    if (spec) {
      const element = spec.params?.element || 'Sodium'
      const mode    = spec.params?.mode    || 'emission'
      const lines   = ATOMIC_SPECTRA[element] || []
      const profile = computeSpectrum(lines)
      const solar   = mode === 'solar' ? computeSolar() : null

      // Identification si source présente
      let identification = null
      if (source) {
        const wl = source.params?.wavelength || 550
        identification = identifyByWavelength(wl)
      }

      result.spectroResults = {
        element, mode, lines, profile, solar, identification,
        fraunhofer: mode === 'solar' ? FRAUNHOFER : null,
      }
    }

    result.durationMs = performance.now() - t0
    return result
  },

  renderResult: (ctx2d) => {},
})

plugin.addPanel({
  id:'@luxlab/spectroscopy/results', title:'Spectroscopie',
  icon:'≋', position:'right', component:SpectroPanel,
})

plugin.addTemplate({
  id:       'sodium-spectrum',
  title:    'Spectre du Sodium',
  description:'Doublet D du sodium. λ = 589.0 / 589.6 nm.',
  level:    'intermédiaire',
  tags:     ['spectroscopie','sodium','raies'],
  certified:true,
  components:[
    { id:'src-1',  type:'source',     x:80,  y:220,
      params:{ wavelength:589, sourceType:'spectral_lamp',
        lampElement:'sodium', intensity:1.0 } },
    { id:'spc-1',  type:'spectrometer',x:380, y:220,
      params:{ element:'Sodium', mode:'emission', resolution:0.5 } },
  ],
})

plugin.addI18n('fr', {
  'spectrometer.label': 'Spectromètre',
  'spectral-filter.label':'Filtre spectral',
})

export default plugin

// ─── Fonctions ────────────────────────────────────────────────────

function gaussLine(wl_c, I, wl, sigma=1.5) {
  return I * Math.exp(-Math.pow(wl-wl_c, 2) / (2*sigma*sigma))
}

function computeSpectrum(lines, steps=600) {
  return Array.from({length:steps+1}, (_,i) => {
    const wl = 380 + (i/steps)*400
    const I  = lines.reduce((s,l) => s+gaussLine(l.wl,l.I,wl), 0)
    return { wl, I:Math.min(I,1) }
  })
}

function computeSolar(steps=600) {
  return Array.from({length:steps+1}, (_,i) => {
    const wl   = 380 + (i/steps)*400
    const x    = wl/580
    let   I    = Math.pow(x,-5)/(Math.exp(2.898e6/(5778*wl))-1)
    I = Math.min(I/2e-4, 1)
    for (const line of FRAUNHOFER) {
      const depth = gaussLine(line.wl, 0.4, wl, 1.2)
      I = Math.max(0, I-depth)
    }
    return { wl, I }
  })
}

function identifyByWavelength(wl, tol=5) {
  const matches = []
  for (const [element, lines] of Object.entries(ATOMIC_SPECTRA)) {
    const score = lines.reduce((s,l) =>
      Math.abs(l.wl-wl) < tol ? s+l.I : s, 0)
    if (score > 0) matches.push({ element, score:score.toFixed(2) })
  }
  return matches.sort((a,b)=>b.score-a.score).slice(0,3)
}