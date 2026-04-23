import { LuxPlugin }    from '../../../core/plugin-api/index.js'
import QuantumPanel     from './QuantumPanel.jsx'

const plugin = new LuxPlugin({
  id:           '@luxlab/quantum',
  name:         'Optique Quantique',
  version:      '1.0.0',
  author:       'LuxLab Team',
  license:      'free',
  description:  'Photon unique, intrication, loi de Malus, effet photoélectrique, Schrödinger 1D.',
  dependencies: ['@luxlab/geo-optics'],
})

// ─── Composants ──────────────────────────────────────────────────

plugin.addComponent({
  type:'photon-source', label:'Source photon unique',
  icon:'ψ', moduleId:'@luxlab/quantum', category:'Sources quantiques',
  defaultParams: {
    wavelength: 700, emissionRate: 1000, purity: 1.0,
  },
  paramsDef: [
    { key:'wavelength',   label:'λ (nm)',         type:'range', min:380, max:780, step:1  },
    { key:'emissionRate', label:'Taux émission/s', type:'range', min:1,   max:1e6, step:100 },
    { key:'purity',       label:'Pureté',          type:'range', min:0,   max:1,   step:0.01 },
  ],
  simulate: (p) => ({ type:'photon-source', wl:p.wavelength, rate:p.emissionRate }),
  render:   ()  => ({ shape:'rect', icon:'ψ', color:'#8e44ad' }),
})

plugin.addComponent({
  type:'entangled-source', label:'Source intriquée',
  icon:'⊗', moduleId:'@luxlab/quantum', category:'Sources quantiques',
  defaultParams: {
    wavelength1:810, wavelength2:810,
    entanglementType:'polarization',
  },
  paramsDef: [
    { key:'wavelength1', label:'λ₁ (nm)', type:'range', min:380, max:780, step:1 },
    { key:'wavelength2', label:'λ₂ (nm)', type:'range', min:380, max:780, step:1 },
    { key:'entanglementType', label:'Type', type:'select',
      options:['polarization','path','time-bin'] },
  ],
  simulate: (p) => ({
    type:'entangled', wl1:p.wavelength1, wl2:p.wavelength2,
  }),
  render: () => ({ shape:'rect', icon:'⊗', color:'#8e44ad' }),
})

plugin.addComponent({
  type:'qdetector', label:'Détecteur quantique',
  icon:'⬡', moduleId:'@luxlab/quantum', category:'Détecteurs',
  defaultParams: {
    efficiency:0.9, darkCountRate:100, deadTime:50,
  },
  paramsDef: [
    { key:'efficiency',    label:'Efficacité',         type:'range', min:0,   max:1,    step:0.01  },
    { key:'darkCountRate', label:'Taux obscurité (/s)', type:'range', min:0,   max:10000,step:10    },
    { key:'deadTime',      label:'Temps mort (ns)',     type:'range', min:1,   max:1000, step:1     },
  ],
  simulate: (p) => ({ type:'qdetector', eta:p.efficiency }),
  render:   ()  => ({ shape:'rect', icon:'⬡', color:'#8e44ad' }),
})

plugin.addComponent({
  type:'qbeamsplitter', label:'Séparateur quantique',
  icon:'⊡', moduleId:'@luxlab/quantum', category:'Éléments quantiques',
  defaultParams: { ratio:0.5 },
  paramsDef: [
    { key:'ratio', label:'Ratio R/T', type:'range', min:0.1, max:0.9, step:0.05 },
  ],
  simulate: (p) => ({ type:'qbeamsplitter', R:p.ratio, T:1-p.ratio }),
  render:   ()  => ({ shape:'rect', icon:'⊡', color:'#8e44ad' }),
})

// ─── Moteur quantique ────────────────────────────────────────────

plugin.addEngine({
  id:   '@luxlab/quantum/engine',
  name: 'Moteur Optique Quantique',

  canHandle: (components) =>
    components.some(c =>
      ['photon-source','entangled-source','qdetector','qbeamsplitter'].includes(c.type)
    ),

  run: (components, options) => {
    const result = {
      rays:[], intersections:[], images:[],
      waveResults: {}, quantumResults: {},
      durationMs: 0,
    }
    const t0 = performance.now()

    const source = components.find(c =>
      c.type === 'photon-source' || c.type === 'entangled-source'
    )
    if (!source) { result.durationMs = performance.now()-t0; return result }

    const wl        = source.params?.wavelength || 700
    const detectors = components.filter(c => c.type === 'qdetector')
    const bss       = components.filter(c => c.type === 'qbeamsplitter')

    // ── Effet photoélectrique ──────────────────────────────────────
    result.quantumResults.photoelectric = computePhotoelectric(wl)

    // ── Loi de Malus (polariseurs dans le chemin) ──────────────────
    const polarizers = components
      .filter(c => c.type === 'polarizer')
      .sort((a,b) => a.x - b.x)

    if (polarizers.length >= 2) {
      const theta = (polarizers[1].params?.angle - polarizers[0].params?.angle)
        * Math.PI / 180
      result.quantumResults.malusTransmittance =
        Math.pow(Math.cos(theta), 2)
    }

    // ── Schrödinger 1D — particule dans une boîte ─────────────────
    result.quantumResults.schrodinger = computeParticleInBox(wl)

    // ── Corrélation de Bell ────────────────────────────────────────
    if (source.type === 'entangled-source' && detectors.length >= 2) {
      result.quantumResults.bellCorrelation = computeBell()
    }

    // ── Rayons représentatifs ─────────────────────────────────────
    // Quelques rayons pour montrer le chemin optique
    if (source) {
      const numRays = options.numRays || 3
      for (let i = 0; i < numRays; i++) {
        const offset = (i - Math.floor(numRays/2)) * 20
        result.rays.push({
          segments:[
            { x:source.x+25, y:source.y+offset },
            { x:1200,         y:source.y+offset },
          ],
          wl, intensity:0.4,
        })
      }
    }

    result.durationMs = performance.now() - t0
    return result
  },

  renderResult: (ctx2d, result) => {
    if (!result?.rays) return
    for (const ray of result.rays) {
      ctx2d.strokeStyle = '#8e44ad'
      ctx2d.lineWidth   = 1
      ctx2d.globalAlpha = 0.5
      ctx2d.setLineDash([4, 4])
      ctx2d.beginPath()
      ray.segments.forEach((pt, i) =>
        i===0 ? ctx2d.moveTo(pt.x,pt.y) : ctx2d.lineTo(pt.x,pt.y)
      )
      ctx2d.stroke()
      ctx2d.setLineDash([])
    }
    ctx2d.globalAlpha = 1
  },
})

plugin.addPanel({
  id:'@luxlab/quantum/results', title:'Quantique',
  icon:'ψ', position:'right', component:QuantumPanel,
})

plugin.addTemplate({
  id:       'photoelectric-exp',
  title:    'Effet photoélectrique',
  description:'Seuil de travail du sodium et du zinc selon λ.',
  level:    'intermédiaire',
  tags:     ['quantique','photoélectrique','Planck'],
  certified:true,
  components: [
    { id:'src-1', type:'source',   x:80,  y:220,
      params:{ wavelength:400, intensity:1.0, sourceType:'parallel', coherence:'high' } },
    { id:'qd-1',  type:'qdetector',x:400, y:220,
      params:{ efficiency:0.9, darkCountRate:100, deadTime:50 } },
  ],
})

plugin.addI18n('fr', {
  'photon-source.label':    'Source photon unique',
  'entangled-source.label': 'Source intriquée',
  'qdetector.label':        'Détecteur quantique',
})

plugin.addI18n('en', {
  'photon-source.label':    'Single photon source',
  'entangled-source.label': 'Entangled source',
  'qdetector.label':        'Quantum detector',
})

export default plugin

// ─── Fonctions physiques ──────────────────────────────────────────

function computePhotoelectric(wl_nm) {
  const h    = 6.626e-34
  const c    = 3e8
  const eV   = 1.602e-19
  const E_eV = (h * c) / (wl_nm * 1e-9) / eV

  const metals = [
    { name:'Sodium',    phi:2.28 },
    { name:'Potassium', phi:2.30 },
    { name:'Zinc',      phi:4.33 },
    { name:'Cuivre',    phi:4.70 },
    { name:'Platine',   phi:5.65 },
  ]

  return {
    photonEnergy_eV: E_eV.toFixed(3),
    wavelength_nm:   wl_nm,
    threshold_nm:    Math.round(1240 / 2.28),
    metals: metals.map(m => ({
      name:          m.name,
      workFunction:  m.phi,
      emitted:       E_eV > m.phi,
      kineticEnergy: E_eV > m.phi
        ? (E_eV - m.phi).toFixed(3)
        : 0,
    })),
  }
}

function computeParticleInBox(wl_nm, n = 1, L = 100) {
  const points = []
  const steps  = 200
  for (let i = 0; i <= steps; i++) {
    const x   = (i / steps) * L
    const psi = Math.sqrt(2/L) * Math.sin(n * Math.PI * x / L)
    points.push({ x, psi, prob: psi * psi })
  }
  const E_n   = (n * n * Math.PI * Math.PI) / (2 * L * L)
  return { points, level:n, energy:E_n.toFixed(4), L }
}

function computeBell() {
  const angles  = [0, 22.5, 45, 67.5]
  const results = []
  for (const a1 of angles) {
    for (const a2 of angles) {
      const theta  = (a2 - a1) * Math.PI / 180
      const C      = -Math.cos(theta)
      results.push({ a1, a2, correlation:C.toFixed(3) })
    }
  }
  return { correlations:results, violatesBell:true }
}