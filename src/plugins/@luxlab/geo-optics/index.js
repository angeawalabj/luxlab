import { LuxPlugin } from '../../../core/plugin-api/index.js'
import GeoResultsPanel from './GeoResultsPanel.jsx'

const plugin = new LuxPlugin({
  id:           '@luxlab/geo-optics',
  name:         'Optique Géométrique',
  version:      '1.0.0',
  author:       'LuxLab Team',
  license:      'free',
  description:  'Tracé de rayons, lentilles, miroirs, prismes. Loi de Snell-Descartes.',
  dependencies: [],
})

// ─── Composants ──────────────────────────────────────────────────

plugin.addComponent({
  type:     'source',
  label:    'Source lumineuse',
  icon:     '✦',
  moduleId: '@luxlab/geo-optics',
  category: 'Sources',
  defaultParams: {
    wavelength:   550,
    intensity:    1.0,
    coherence:    'high',
    polarization: 'none',
  },
  paramsDef: [
    {
      key: 'wavelength', label: "Longueur d'onde (nm)",
      type: 'range', min: 380, max: 780, step: 1,
    },
    {
      key: 'intensity', label: 'Intensité (W/m²)',
      type: 'range', min: 0, max: 10, step: 0.1,
    },
    {
      key: 'coherence', label: 'Cohérence',
      type: 'select', options: ['high', 'medium', 'low'],
    },
    {
      key: 'polarization', label: 'Polarisation',
      type: 'select', options: ['none', 'linear', 'circular'],
    },
  ],
  simulate: (params, ctx) => ({
    type:   'ray-source',
    origin: ctx?.position,
    wl:     params.wavelength,
    I:      params.intensity,
  }),
  render: () => ({
    shape: 'rect',
    icon:  '✦',
    color: '#e67e22',
  }),
})

plugin.addComponent({
  type:     'lens',
  label:    'Lentille mince',
  icon:     '◎',
  moduleId: '@luxlab/geo-optics',
  category: 'Éléments optiques',
  defaultParams: {
    focalLength:     50,
    diameter:        40,
    material:        'BK7',
    refractiveIndex: 1.52,
    coating:         'none',
  },
  paramsDef: [
    {
      key: 'focalLength', label: 'Distance focale (mm)',
      type: 'range', min: -500, max: 500, step: 1,
    },
    {
      key: 'diameter', label: 'Diamètre (mm)',
      type: 'range', min: 5, max: 200, step: 1,
    },
    {
      key: 'material', label: 'Matériau',
      type: 'select',
      options: ['BK7', 'Fused Silica', 'Sapphire', 'ZnSe', 'CaF2'],
    },
    {
      key: 'coating', label: 'Traitement AR',
      type: 'select', options: ['none', 'VIS', 'NIR', 'BBAR'],
    },
  ],
  simulate: (params, ctx) => ({
    type:     'thin-lens',
    position: ctx?.position,
    f:        params.focalLength,
    d:        params.diameter,
  }),
  render: () => ({ shape: 'lens', color: '#2980b9' }),
})

plugin.addComponent({
  type:     'mirror',
  label:    'Miroir plan',
  icon:     '⌒',
  moduleId: '@luxlab/geo-optics',
  category: 'Éléments optiques',
  defaultParams: {
    angle:       45,
    reflectance: 0.98,
    coating:     'aluminium',
  },
  paramsDef: [
    {
      key: 'angle', label: 'Angle (°)',
      type: 'range', min: 0, max: 90, step: 0.5,
    },
    {
      key: 'reflectance', label: 'Réflectance',
      type: 'range', min: 0.5, max: 1.0, step: 0.01,
    },
    {
      key: 'coating', label: 'Revêtement',
      type: 'select', options: ['aluminium', 'or', 'argent', 'diélectrique'],
    },
  ],
  simulate: (params, ctx) => ({
    type:     'mirror',
    position: ctx?.position,
    angle:    params.angle,
    R:        params.reflectance,
  }),
  render: () => ({ shape: 'mirror', color: '#e67e22' }),
})

plugin.addComponent({
  type:     'prism',
  label:    'Prisme',
  icon:     '▽',
  moduleId: '@luxlab/geo-optics',
  category: 'Éléments optiques',
  defaultParams: {
    apexAngle:       60,
    material:        'BK7',
    refractiveIndex: 1.52,
    orientation:     0,
  },
  paramsDef: [
    {
      key: 'apexAngle', label: 'Angle sommet (°)',
      type: 'range', min: 10, max: 90, step: 1,
    },
    {
      key: 'material', label: 'Matériau',
      type: 'select',
      options: ['BK7', 'Fused Silica', 'Sapphire', 'ZnSe', 'CaF2'],
    },
    {
      key: 'orientation', label: 'Orientation (°)',
      type: 'range', min: 0, max: 360, step: 1,
    },
  ],
  simulate: (params, ctx) => ({
    type:     'prism',
    position: ctx?.position,
    A:        params.apexAngle,
    material: params.material,
  }),
  render: () => ({ shape: 'triangle', color: '#8e44ad' }),
})

plugin.addComponent({
  type:     'screen',
  label:    'Écran / Détecteur',
  icon:     '▪',
  moduleId: '@luxlab/geo-optics',
  category: 'Détecteurs',
  defaultParams: {
    height:      80,
    sensitivity: 1.0,
    detectorType: 'screen',
  },
  paramsDef: [
    {
      key: 'height', label: 'Hauteur (mm)',
      type: 'range', min: 10, max: 300, step: 5,
    },
    {
      key: 'sensitivity', label: 'Sensibilité',
      type: 'range', min: 0, max: 1, step: 0.1,
    },
    {
      key: 'detectorType', label: 'Type',
      type: 'select', options: ['screen', 'CCD', 'photodiode', 'eye'],
    },
  ],
  simulate: (params, ctx) => ({
    type:     'screen',
    position: ctx?.position,
  }),
  render: () => ({ shape: 'screen', color: '#16a085' }),
})

plugin.addComponent({
  type:     'blocker',
  label:    'Obstacle opaque',
  icon:     '▬',
  moduleId: '@luxlab/geo-optics',
  category: 'Éléments optiques',
  defaultParams: {
    height: 60,
    width:  5,
  },
  paramsDef: [
    {
      key: 'height', label: 'Hauteur (mm)',
      type: 'range', min: 5, max: 200, step: 5,
    },
  ],
  simulate: (params, ctx) => ({
    type:     'blocker',
    position: ctx?.position,
    height:   params.height,
  }),
  render: () => ({ shape: 'rect', color: '#2c3e50' }),
})

// ─── Moteur physique ──────────────────────────────────────────────
plugin.addEngine({
  id:   '@luxlab/geo-optics/engine',
  name: 'Ray Tracer Géométrique',

  canHandle: (components) =>
    components.some(c =>
      ['source','lens','mirror','prism','screen','blocker'].includes(c.type)
    ),

  // Import direct — pas d'import dynamique dans engine.run
  run: (components, options) => {
    // Le moteur JS pur en fallback pendant le dev
    // Le WASM sera branché ici à l'étape suivante
    return runGeoJS(components, options)
  },

 renderResult: (ctx2d, result) => {
  if (!result?.rays) return
  for (const ray of result.rays) {
    const color     = wavelengthToCSS(ray.wl)
    const intensity = ray.intensity ?? 1.0
    ctx2d.strokeStyle = color
    ctx2d.lineWidth   = 1.3
    ctx2d.globalAlpha = Math.min(0.9, 0.3 + intensity * 0.6)  // ← intensité
    ctx2d.shadowColor = color
    ctx2d.shadowBlur  = 4
    ctx2d.beginPath()
    ray.segments.forEach((pt, i) =>
      i === 0 ? ctx2d.moveTo(pt.x, pt.y) : ctx2d.lineTo(pt.x, pt.y)
    )
    ctx2d.stroke()
  }
  ctx2d.shadowBlur  = 0
  ctx2d.globalAlpha = 1

  const colors = {
    refraction:'#2980b9', reflection:'#e67e22',
    dispersion:'#8e44ad', detection:'#27ae60', blocked:'#e74c3c',
  }
  for (const pt of (result.intersections || [])) {
    ctx2d.beginPath()
    ctx2d.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
    ctx2d.fillStyle = colors[pt.type] || '#7f8c8d'
    ctx2d.fill()
  }
  for (const img of (result.images || [])) {
    ctx2d.beginPath()
    ctx2d.arc(img.x, img.y, 5, 0, Math.PI * 2)
    ctx2d.strokeStyle = img.real ? '#27ae60' : '#f39c12'
    ctx2d.lineWidth   = 1.5
    ctx2d.setLineDash(img.real ? [] : [4, 3])
    ctx2d.stroke()
    ctx2d.setLineDash([])
    ctx2d.fillStyle = '#7f8c8d'
    ctx2d.font      = '9px Courier New'
    ctx2d.fillText(
      `m=${img.magnification.toFixed(2)}`,
      img.x + 8, img.y - 5
    )
  }
},
})
// ─── Panneau résultats ────────────────────────────────────────────

plugin.addPanel({
  id:        '@luxlab/geo-optics/results',
  title:     'Résultats',
  icon:      '◎',
  position:  'right',
  component: GeoResultsPanel,
})

// ─── Templates ───────────────────────────────────────────────────

plugin.addTemplate({
  id:          'telescope-galileo',
  title:       'Télescope de Galilée',
  description: 'Système afocal. G = −f_obj / f_oeil.',
  level:       'intermédiaire',
  tags:        ['télescope', 'afocal', 'lentilles'],
  certified:   true,
  components: [
    { id:'src-1',  type:'source', x:60,  y:220,
      params:{ wavelength:550, intensity:1.0, coherence:'low', polarization:'none' } },
    { id:'obj-1',  type:'lens',   x:220, y:220,
      params:{ focalLength:200, diameter:80, material:'BK7', refractiveIndex:1.52, coating:'VIS' } },
    { id:'eye-1',  type:'lens',   x:420, y:220,
      params:{ focalLength:25,  diameter:20, material:'BK7', refractiveIndex:1.52, coating:'none' } },
    { id:'scr-1',  type:'screen', x:560, y:220,
      params:{ height:60, sensitivity:1.0, detectorType:'eye' } },
  ],
})

plugin.addTemplate({
  id:          'simple-diverging',
  title:       'Lentille divergente',
  description: 'Image virtuelle — relation de conjugaison avec f < 0.',
  level:       'débutant',
  tags:        ['lentille', 'divergente', 'image virtuelle'],
  certified:   true,
  components: [
    { id:'src-1',  type:'source', x:60,  y:220,
      params:{ wavelength:550, intensity:1.0, coherence:'high', polarization:'none' } },
    { id:'div-1',  type:'lens',   x:300, y:220,
      params:{ focalLength:-80, diameter:50, material:'BK7', refractiveIndex:1.52, coating:'none' } },
    { id:'scr-1',  type:'screen', x:500, y:220,
      params:{ height:100, sensitivity:1.0, detectorType:'screen' } },
  ],
})

// ─── Expériences ─────────────────────────────────────────────────

plugin.addExperience({
  id:               'exp-conjugate',
  title:            "Relation conjuguée d'une lentille",
  description:      "Vérifier la relation 1/OA' − 1/OA = 1/f' expérimentalement.",
  estimatedDuration:'60min',
  objectives: [
    "Vérifier la relation de conjugaison",
    "Mesurer la distance focale d'une lentille",
    "Tracer le graphe 1/OA' = f(1/OA)",
  ],
  theory: "La relation de conjugaison d'une lentille mince est : 1/OA' − 1/OA = 1/f'.\n" +
          "O est le centre optique, A l'objet, A' l'image.",
  initialState: { components: [], settings: {} },
  steps: [
    {
      id: 1,
      title: 'Placer une source lumineuse',
      instruction: 'Place une source lumineuse sur le canvas.',
      hint: "Glisse 'Source lumineuse' depuis la sidebar",
      validate: { type: 'component-exists', componentType: 'source' },
      onSuccess: 'Source placée.',
      onError:   'Ajoute une source lumineuse depuis la sidebar.',
    },
    {
      id: 2,
      title: 'Ajouter une lentille convergente',
      instruction: 'Ajoute une lentille avec f > 0 (convergente).',
      hint: "Glisse 'Lentille mince' — vérifie que f > 0 dans le panneau propriétés",
      validate: {
        type: 'param-range',
        componentType: 'lens',
        param: 'focalLength',
        min: 1, max: 500,
      },
      onSuccess: 'Lentille convergente placée.',
      onError:   'La lentille doit avoir une distance focale f > 0.',
    },
    {
      id: 3,
      title: 'Placer un écran et simuler',
      instruction: "Place un écran à droite de la lentille et lance la simulation.",
      hint: "Clique sur ▶ Simuler après avoir placé l'écran",
      validate: {
        type: 'all',
        conditions: [
          { type: 'component-exists', componentType: 'screen' },
          { type: 'simulation-running' },
        ],
      },
      onSuccess: "Montage complet. Observe les images conjuguées dans le panneau résultats.",
      onError:   "Il manque l'écran ou la simulation n'est pas lancée.",
    },
  ],
  finalAssessment: {
    question: "Pour f = 50 mm et OA = −200 mm, calcule OA' en mm.",
    type:      'numeric',
    answer:    66.7,
    tolerance: 2.0,
    unit:      'mm',
    hint:      "Utilise 1/OA' = 1/f' + 1/OA",
  },
})

// ─── i18n ─────────────────────────────────────────────────────────

plugin.addI18n('fr', {
  'source.label':          'Source lumineuse',
  'lens.label':            'Lentille mince',
  'mirror.label':          'Miroir plan',
  'prism.label':           'Prisme',
  'screen.label':          'Écran / Détecteur',
  'blocker.label':         'Obstacle opaque',
  'wavelength.label':      "Longueur d'onde (nm)",
  'focalLength.label':     'Distance focale (mm)',
  'refractiveIndex.label': 'Indice de réfraction',
})

plugin.addI18n('en', {
  'source.label':          'Light source',
  'lens.label':            'Thin lens',
  'mirror.label':          'Flat mirror',
  'prism.label':           'Prism',
  'screen.label':          'Screen / Detector',
  'blocker.label':         'Opaque blocker',
  'wavelength.label':      'Wavelength (nm)',
  'focalLength.label':     'Focal length (mm)',
  'refractiveIndex.label': 'Refractive index',
})

plugin.addI18n('ar', {
  'source.label':      'مصدر ضوئي',
  'lens.label':        'عدسة رقيقة',
  'wavelength.label':  'الطول الموجي (نانومتر)',
  'focalLength.label': 'البعد البؤري (مم)',
})

// ─── Settings ────────────────────────────────────────────────────

plugin.addSettings([
  {
    key:     'showConjugateImages',
    label:   'Afficher les images conjuguées',
    type:    'boolean',
    default: true,
  },
  {
    key:     'showIntersectionPoints',
    label:   "Afficher les points d'intersection",
    type:    'boolean',
    default: true,
  },
])

plugin.onLoad(() => {
  console.log('[geo-optics] Plugin chargé')
})
// ─── Moteur JS pur (fallback avant WASM) ─────────────────────────

function runGeoJS(components, options = {}) {
  const result  = { rays:[], intersections:[], images:[], durationMs:0 }
  const t0      = performance.now()
  const source  = components.find(c => c.type === 'source')
  if (!source) return result

  const wl        = source.params?.wavelength  || 550
  const intensity = source.params?.intensity   || 1.0
  const coherence = source.params?.coherence   || 'high'

  // La cohérence affecte le nombre de rayons et leur divergence
  const coherenceSpread = { high:0, medium:8, low:20 }
  const extraSpread     = coherenceSpread[coherence] || 0

  const numRays   = options.numRays  || 7
  const maxX      = options.rayLength || 1200
  const spread    = 60 + extraSpread

  const obstacles = components
    .filter(c =>
      ['lens','mirror','prism','screen','blocker'].includes(c.type)
    )
    .sort((a, b) => a.x - b.x)
    .filter(c => c.x > source.x)

  for (let i = 0; i < numRays; i++) {
    const offset = numRays > 1
      ? (i - Math.floor(numRays / 2)) * (spread / (numRays - 1))
      : 0

    // La cohérence basse ajoute une légère déviation aléatoire (déterministe)
    const angleNoise = extraSpread > 0
      ? ((i * 7919) % 100 - 50) / 1000 * (extraSpread / 10)
      : 0

    let x     = source.x + 25
    let y     = source.y + offset
    let angle = angleNoise
    let alive = true
    const segments = [{ x, y }]

    for (const obs of obstacles) {
      if (!alive || obs.x <= x) continue
      const dx = obs.x - x
      y = y + dx * Math.tan(angle)
      x = obs.x
      segments.push({ x, y })

      if (obs.type === 'lens') {
        const f = obs.params?.focalLength || 50
        if (Math.abs(f) > 1e-10) angle -= (y - obs.y) / f
        result.intersections.push({ x, y, type:'refraction' })
      }
      if (obs.type === 'mirror') {
        const a = (obs.params?.angle || 45) * Math.PI / 180
        angle = -angle + 2 * a
        result.intersections.push({ x, y, type:'reflection' })
      }
      if (obs.type === 'prism') {
        const mat  = obs.params?.material || 'BK7'
        const apex = (obs.params?.apexAngle || 60) * Math.PI / 180
        const n    = refractiveIndex(mat, wl)
        const dn   = 0.008 * (550 - wl) / 100
        angle += (n + dn - 1) * apex
        result.intersections.push({ x, y, type:'dispersion' })
      }
      if (obs.type === 'screen') {
        alive = false
        result.intersections.push({ x, y, type:'detection' })
      }
      if (obs.type === 'blocker') {
        const h = obs.params?.height || 60
        if (Math.abs(y - obs.y) < h / 2) {
          alive = false
          result.intersections.push({ x, y, type:'blocked' })
        }
      }
    }

    if (alive) {
      segments.push({
        x: maxX,
        y: y + (maxX - x) * Math.tan(angle),
      })
    }

    // L'intensité affecte l'opacité des rayons
    result.rays.push({ segments, wl, intensity })
  }

  // Images conjuguées
  const lenses = obstacles.filter(c => c.type === 'lens')
  if (lenses.length > 0) {
    let xObj = source.x, yObj = source.y
    for (const lens of lenses) {
      const f = lens.params?.focalLength || 50
      const d = lens.x - xObj
      if (Math.abs(d) < 1e-10 || Math.abs(d - f) < 1e-10) continue
      const di = (d * f) / (d - f)
      const m  = -di / d
      result.images.push({
        x:             lens.x + di,
        y:             lens.y + m * (yObj - lens.y),
        magnification: m,
        real:          di > 0,
        fromLens:      lens.id,
      })
      xObj = lens.x + di
      yObj = lens.y + m * (yObj - lens.y)
    }
  }

  result.durationMs = performance.now() - t0
  return result
}

// Indice de réfraction Cauchy
function refractiveIndex(material, wl_nm) {
  const wl = wl_nm / 1000
  const params = {
    'BK7':          [1.5168, 0.00420],
    'Fused Silica': [1.4580, 0.00354],
    'Sapphire':     [1.7550, 0.01080],
    'ZnSe':         [2.4360, 0.09000],
    'CaF2':         [1.4260, 0.00270],
  }
  const [a, b] = params[material] || [1.5, 0.004]
  return a + b / (wl * wl)
}
export default plugin

// ─── Utilitaire couleur ───────────────────────────────────────────

function wavelengthToCSS(wl) {
  if (wl < 380) return 'hsl(280,80%,50%)'
  if (wl < 440) return `hsl(${270 + (wl-380)*0.5},90%,55%)`
  if (wl < 490) return `hsl(${240 + (wl-440)*0.9},90%,55%)`
  if (wl < 510) return `hsl(${175 + (wl-490)*3.25},85%,45%)`
  if (wl < 580) return `hsl(${120 - (wl-510)*1.7},85%,40%)`
  if (wl < 645) return `hsl(${25  - (wl-580)*0.38},90%,45%)`
  return `hsl(0,85%,${Math.max(28, 45-(wl-645)*0.12)}%)`
}