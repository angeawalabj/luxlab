import { LuxPlugin } from '../../../core/plugin-api/index.js'
import WaveResultsPanel from './WaveResultsPanel.jsx'

const plugin = new LuxPlugin({
  id:           '@luxlab/wave-optics',
  name:         'Optique Ondulatoire',
  version:      '1.0.0',
  author:       'LuxLab Team',
  license:      'free',
  description:  'Interférences, diffraction, polarisation.',
  dependencies: ['@luxlab/geo-optics'],
})

// ─── Composants ──────────────────────────────────────────────────

plugin.addComponent({
  type:     'slit2',
  label:    'Fentes de Young',
  icon:     '⫿',
  moduleId: '@luxlab/wave-optics',
  category: 'Interférences',
  defaultParams: {
    separation:     0.5,
    slitWidth:      0.1,
    screenDistance: 300,
  },
  paramsDef: [
    {
      key:'separation', label:'Séparation d (mm)',
      type:'range', min:0.05, max:5, step:0.05,
    },
    {
      key:'slitWidth', label:'Largeur fente a (mm)',
      type:'range', min:0.01, max:1, step:0.01,
    },
    {
      key:'screenDistance', label:'Distance écran D (mm)',
      type:'range', min:50, max:1000, step:10,
    },
  ],
  simulate: (params, ctx) => ({
    type:     'slit2',
    position: ctx?.position,
    d:        params.separation,
    a:        params.slitWidth,
    D:        params.screenDistance,
  }),
  render: () => ({ shape:'slit', color:'#2980b9' }),
})

plugin.addComponent({
  type:     'grating',
  label:    'Réseau de diffraction',
  icon:     '|||',
  moduleId: '@luxlab/wave-optics',
  category: 'Diffraction',
  defaultParams: {
    spacing:    600,
    maxOrder:   3,
  },
  paramsDef: [
    {
      key:'spacing', label:'Pas (t/mm)',
      type:'range', min:100, max:3000, step:50,
    },
    {
      key:'maxOrder', label:'Ordre max affiché',
      type:'range', min:1, max:5, step:1,
    },
  ],
  simulate: (params, ctx) => ({
    type:    'grating',
    position: ctx?.position,
    d:       1e6 / params.spacing,
  }),
  render: () => ({ shape:'grating', color:'#2980b9' }),
})

plugin.addComponent({
  type:     'polarizer',
  label:    'Polariseur',
  icon:     '↕',
  moduleId: '@luxlab/wave-optics',
  category: 'Polarisation',
  defaultParams: {
    angle:         0,
    transmittance: 1.0,
  },
  paramsDef: [
    {
      key:'angle', label:'Angle (°)',
      type:'range', min:0, max:180, step:1,
    },
    {
      key:'transmittance', label:'Transmittance',
      type:'range', min:0, max:1, step:0.01,
    },
  ],
  simulate: (params, ctx) => ({
    type:    'polarizer',
    position: ctx?.position,
    theta:   params.angle,
    T:       params.transmittance,
  }),
  render: () => ({ shape:'rect', color:'#2980b9' }),
})

plugin.addComponent({
  type:     'beamsplitter',
  label:    'Séparateur de faisceau',
  icon:     '⊡',
  moduleId: '@luxlab/wave-optics',
  category: 'Interférences',
  defaultParams: {
    ratio: 0.5,
  },
  paramsDef: [
    {
      key:'ratio', label:'Ratio R/T',
      type:'range', min:0.1, max:0.9, step:0.05,
    },
  ],
  simulate: (params, ctx) => ({
    type:    'beamsplitter',
    position: ctx?.position,
    R:       params.ratio,
    T:       1 - params.ratio,
  }),
  render: () => ({ shape:'rect', color:'#2980b9' }),
})

// ─── Moteur ondulatoire (JS pur en attendant WASM) ────────────────

plugin.addEngine({
  id:   '@luxlab/wave-optics/engine',
  name: 'Moteur Ondulatoire',

  canHandle: (components) =>
    components.some(c => ['slit2','grating','polarizer','beamsplitter'].includes(c.type)),

  run: (components, options) => {
    const source   = components.find(c => c.type === 'source')
    const slit     = components.find(c => c.type === 'slit2')
    const grating  = components.find(c => c.type === 'grating')
    const result   = { rays:[], intersections:[], images:[], waveResults:{} }

    if (!source) return result

    const wl = source.params?.wavelength || 550

    // Profil Young
    if (slit) {
      result.waveResults.youngProfile = computeYoung({
        wl,
        d:  slit.params?.separation     || 0.5,
        a:  slit.params?.slitWidth      || 0.1,
        D:  slit.params?.screenDistance || 300,
      })
      result.waveResults.interfrange =
        (wl * 1e-6 * (slit.params?.screenDistance || 300)) /
        (slit.params?.separation || 0.5)
    }

    // Maxima réseau
    if (grating) {
      result.waveResults.gratingMaxima = computeGratingMaxima(
        wl,
        1e6 / (grating.params?.spacing || 600),
        grating.params?.maxOrder || 3
      )
    }

    // Loi de Malus (polariseurs)
    const polarizers = components.filter(c => c.type === 'polarizer')
    if (polarizers.length >= 2) {
      const theta = (polarizers[1].params?.angle - polarizers[0].params?.angle) * Math.PI / 180
      result.waveResults.malusTransmittance = Math.pow(Math.cos(theta), 2)
    }

    return result
  },

  renderResult: (ctx2d, result) => {
    // Le rendu des résultats ondulatoires est dans WaveResultsPanel
    // Ici on pourrait ajouter un rendu overlay sur le canvas
  },
})

// ─── Panneau résultats ────────────────────────────────────────────

plugin.addPanel({
  id:        '@luxlab/wave-optics/results',
  title:     'Ondulatoire',
  icon:      '≈',
  position:  'right',
  component: WaveResultsPanel,
})

// ─── Templates ───────────────────────────────────────────────────

plugin.addTemplate({
  id:          'young-fringes',
  title:       'Fentes de Young',
  description: 'Franges d\'interférence. λ = 632 nm, d = 0.5 mm.',
  level:       'débutant',
  tags:        ['interférences', 'Young', 'franges'],
  certified:   true,
  components: [
    { id:'src-1',  type:'source', x:80,  y:220,
      params:{ wavelength:632, intensity:1.0, coherence:'high', polarization:'none' } },
    { id:'slit-1', type:'slit2',  x:280, y:220,
      params:{ separation:0.5, slitWidth:0.1, screenDistance:300 } },
    { id:'scr-1',  type:'screen', x:540, y:220,
      params:{ height:160, sensitivity:1.0, detectorType:'screen' } },
  ],
})

plugin.addTemplate({
  id:          'grating-spectrum',
  title:       'Réseau de diffraction',
  description: 'Diffraction d\'une source monochromatique. 600 t/mm.',
  level:       'intermédiaire',
  tags:        ['diffraction', 'réseau', 'spectre'],
  certified:   true,
  components: [
    { id:'src-1',  type:'source',  x:80,  y:220,
      params:{ wavelength:550, intensity:1.0, coherence:'high', polarization:'none' } },
    { id:'grat-1', type:'grating', x:300, y:220,
      params:{ spacing:600, maxOrder:3 } },
    { id:'scr-1',  type:'screen',  x:540, y:220,
      params:{ height:200, sensitivity:1.0, detectorType:'screen' } },
  ],
})

// ─── Expériences ─────────────────────────────────────────────────

plugin.addExperience({
  id:               'exp-young-measure',
  title:            'Mesure de λ par les fentes de Young',
  description:      'Déterminer la longueur d\'onde d\'un laser par la mesure de l\'interfrange.',
  estimatedDuration:'90min',
  objectives: [
    'Observer les franges d\'interférence',
    'Mesurer l\'interfrange i',
    'Calculer λ = i·d/D',
    'Étudier l\'influence de d sur i',
  ],
  theory:
    "Deux fentes séparées de d, éclairées par une source cohérente de longueur d'onde λ, " +
    "produisent sur un écran à distance D des franges d'interfrange i = λD/d.",
  initialState: { components:[], settings:{} },
  steps: [
    {
      id:1, title:'Source laser',
      instruction:'Place une source laser rouge (λ entre 620 et 650 nm).',
      hint:"Glisse 'Source lumineuse' → règle λ entre 620 et 650 nm",
      validate:{ type:'param-range', componentType:'source',
        param:'wavelength', min:620, max:650 },
      onSuccess:'Source laser rouge configurée.',
      onError:'La longueur d\'onde doit être entre 620 et 650 nm.',
    },
    {
      id:2, title:'Fentes de Young',
      instruction:'Ajoute les fentes de Young avec d ≈ 0.5 mm.',
      hint:"Glisse 'Fentes de Young' → règle la séparation à 0.5 mm",
      validate:{ type:'param-range', componentType:'slit2',
        param:'separation', min:0.3, max:0.8 },
      onSuccess:'Fentes correctement paramétrées.',
      onError:'La séparation d doit être entre 0.3 et 0.8 mm.',
    },
    {
      id:3, title:'Écran détecteur',
      instruction:'Place un écran et lance la simulation.',
      hint:"Glisse 'Écran / Détecteur' puis clique ▶ Simuler",
      validate:{
        type:'all',
        conditions:[
          { type:'component-exists', componentType:'screen' },
          { type:'simulation-running' },
        ],
      },
      onSuccess:'Montage complet. Observe le profil dans le panneau résultats.',
      onError:"Il manque l'écran ou la simulation n'est pas lancée.",
    },
    {
      id:4, title:'Modifier λ',
      instruction:'Change λ à 450 nm (bleu). Observe l\'évolution des franges.',
      hint:'Sélectionne la source → slider λ dans le panneau propriétés',
      validate:{ type:'param-range', componentType:'source',
        param:'wavelength', min:430, max:470 },
      onSuccess:'Les franges se resserrent avec λ plus court. Normal !',
      onError:'Règle λ de la source entre 430 et 470 nm.',
    },
  ],
  finalAssessment:{
    question:'Pour i = 1.2 mm, D = 300 mm, d = 0.5 mm, calcule λ en nm.',
    type:'numeric', answer:2000, tolerance:100, unit:'nm',
    hint:'λ = i·d/D = 1.2 × 0.5 / 300 mm = 0.002 mm = 2000 nm',
  },
})

plugin.addI18n('fr', {
  'slit2.label':       'Fentes de Young',
  'grating.label':     'Réseau de diffraction',
  'polarizer.label':   'Polariseur',
  'separation.label':  'Séparation d (mm)',
  'screenDistance.label': 'Distance écran D (mm)',
})

plugin.addI18n('en', {
  'slit2.label':       'Double slit',
  'grating.label':     'Diffraction grating',
  'polarizer.label':   'Polarizer',
  'separation.label':  'Slit separation d (mm)',
  'screenDistance.label': 'Screen distance D (mm)',
})

export default plugin

// ─── Fonctions physiques ──────────────────────────────────────────

function computeYoung({ wl, d, a, D, steps = 400 }) {
  const lambda = wl  * 1e-6  // nm → mm
  const points = []
  const halfH  = 10           // mm

  for (let i = 0; i <= steps; i++) {
    const y    = -halfH + (i / steps) * halfH * 2
    const sinT = y / Math.sqrt(y*y + D*D)
    const beta  = Math.PI * a * sinT / lambda
    const delta = Math.PI * d * sinT / lambda
    const diff  = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2)
    const inter = Math.pow(Math.cos(delta), 2)
    points.push({ y, I: diff * inter })
  }
  return points
}

function computeGratingMaxima(wl_nm, d_nm, maxOrder) {
  const lambda = wl_nm
  const maxima = []
  for (let m = -maxOrder; m <= maxOrder; m++) {
    const sinT = m * lambda / d_nm
    if (Math.abs(sinT) <= 1) {
      maxima.push({
        order: m,
        angle: Math.asin(sinT) * 180 / Math.PI,
      })
    }
  }
  return maxima
}