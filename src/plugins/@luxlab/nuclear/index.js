import { LuxPlugin }  from '../../../core/plugin-api/index.js'
import NuclearPanel   from './NuclearPanel.jsx'

const plugin = new LuxPlugin({
  id:           '@luxlab/nuclear',
  name:         'Physique Nucléaire',
  version:      '1.0.0',
  author:       'LuxLab Team',
  license:      'free',
  description:  'Radioactivité, blindage, dosimétrie, diffusion Compton.',
  dependencies: ['@luxlab/geo-optics'],
})

const ISOTOPES = {
  'Co-60':  { T_half:5.27,  unit:'ans',    energy:1.25,  type:'beta+gamma' },
  'Cs-137': { T_half:30.17, unit:'ans',    energy:0.662, type:'beta+gamma' },
  'I-131':  { T_half:8.02,  unit:'jours',  energy:0.364, type:'beta+gamma' },
  'Ra-226': { T_half:1600,  unit:'ans',    energy:4.87,  type:'alpha'      },
  'Am-241': { T_half:432.2, unit:'ans',    energy:5.486, type:'alpha+gamma'},
  'Tc-99m': { T_half:6.01,  unit:'heures', energy:0.140, type:'gamma'      },
  'F-18':   { T_half:109.8, unit:'min',    energy:0.511, type:'beta+'      },
}

const MATERIALS = {
  'Plomb':     { rho:11.35, mu:{ 0.1:59.7,  0.5:1.636, 1.0:0.776 } },
  'Béton':     { rho:2.3,   mu:{ 0.1:0.400, 0.5:0.150, 1.0:0.110 } },
  'Eau':       { rho:1.0,   mu:{ 0.1:0.167, 0.5:0.096, 1.0:0.071 } },
  'Aluminium': { rho:2.7,   mu:{ 0.1:0.459, 0.5:0.161, 1.0:0.116 } },
  'Tissu':     { rho:1.04,  mu:{ 0.1:0.170, 0.5:0.097, 1.0:0.072 } },
}

plugin.addComponent({
  type:'gamma-source', label:'Source radioactive',
  icon:'☢', moduleId:'@luxlab/nuclear', category:'Sources nucléaires',
  defaultParams: {
    isotope:'Co-60', activity:1e9, distance:1.0,
  },
  paramsDef: [
    { key:'isotope',  label:'Isotope',      type:'select',
      options:Object.keys(ISOTOPES) },
    { key:'activity', label:'Activité (Bq)', type:'range',
      min:1e6, max:1e12, step:1e6 },
    { key:'distance', label:'Distance (m)',  type:'range',
      min:0.1, max:10, step:0.1 },
  ],
  simulate: (p) => ({
    type:'gamma-source', isotope:p.isotope, activity:p.activity,
  }),
  render: () => ({ shape:'rect', icon:'☢', color:'#e74c3c' }),
})

plugin.addComponent({
  type:'shield', label:'Blindage',
  icon:'⬛', moduleId:'@luxlab/nuclear', category:'Protection',
  defaultParams: { material:'Plomb', thickness:5 },
  paramsDef: [
    { key:'material',  label:'Matériau',    type:'select',
      options:Object.keys(MATERIALS) },
    { key:'thickness', label:'Épaisseur (cm)', type:'range',
      min:0.5, max:100, step:0.5 },
  ],
  simulate: (p) => ({
    type:'shield', material:p.material, thickness:p.thickness,
  }),
  render: () => ({ shape:'rect', icon:'⬛', color:'#e74c3c' }),
})

plugin.addComponent({
  type:'dosimeter', label:'Dosimètre',
  icon:'▣', moduleId:'@luxlab/nuclear', category:'Détecteurs',
  defaultParams: { sensitivity:1.0, integrationTime:3600 },
  paramsDef: [
    { key:'sensitivity',     label:'Sensibilité',        type:'range', min:0.1, max:2,   step:0.1 },
    { key:'integrationTime', label:'Durée mesure (s)',   type:'range', min:1,   max:86400,step:60  },
  ],
  simulate: (p) => ({ type:'dosimeter' }),
  render:   ()  => ({ shape:'rect', icon:'▣', color:'#e74c3c' }),
})

plugin.addEngine({
  id:   '@luxlab/nuclear/engine',
  name: 'Moteur Nucléaire',

  canHandle: (components) =>
    components.some(c =>
      ['gamma-source','shield','dosimeter'].includes(c.type)
    ),

  run: (components, options) => {
    const result = {
      rays:[], intersections:[], images:[],
      waveResults:{}, nuclearResults:{},
      durationMs:0,
    }
    const t0 = performance.now()

    const src       = components.find(c => c.type === 'gamma-source')
    const shields   = components.filter(c => c.type === 'shield')
    const dosimeter = components.find(c => c.type === 'dosimeter')

    if (!src) { result.durationMs=performance.now()-t0; return result }

    const iso      = ISOTOPES[src.params?.isotope || 'Co-60']
    const activity = src.params?.activity || 1e9
    const distance = src.params?.distance || 1.0
    const energy   = iso.energy

    // Débit de dose (loi en 1/r²)
    const doseRate_uSvh = (0.0877 * energy * activity) /
      (distance * distance) * 1e6

    // Décroissance
    const decayProfile = computeDecay(1.0, iso.T_half, 200)

    // Atténuation par les blindages
    let I = 1.0
    const attenuationSteps = []
    for (const shield of shields) {
      const mat   = shield.params?.material || 'Plomb'
      const thick = shield.params?.thickness || 5
      const mu    = getMu(mat, energy)
      I *= Math.exp(-mu * thick)
      attenuationSteps.push({
        material:      mat,
        thickness:     thick,
        transmittance: (I * 100).toFixed(2),
        hvl:           (Math.LN2 / mu).toFixed(2),
      })
    }

    // Dose accumulée au dosimètre
    let accDose = null
    if (dosimeter) {
      const dt       = dosimeter.params?.integrationTime || 3600
      const eta      = dosimeter.params?.sensitivity     || 1.0
      accDose = (doseRate_uSvh * I * (dt / 3600) * eta).toFixed(2)
    }

    // Compton
    const comptonProfile = computeCompton(energy * 1000, 180)

    result.nuclearResults = {
      isotope:          src.params?.isotope,
      energy_MeV:       energy,
      doseRate_uSvh:    doseRate_uSvh.toFixed(3),
      totalAttenuation: ((1 - I) * 100).toFixed(2),
      remainingFraction:(I * 100).toFixed(2),
      attenuationSteps,
      accumulatedDose:  accDose,
      decayProfile,
      comptonProfile,
      classification:   classifyDose(doseRate_uSvh * I),
    }

    // Rayons gamma représentatifs
    for (let i = -2; i <= 2; i++) {
      result.rays.push({
        segments:[
          { x:src.x+25, y:src.y+i*15 },
          { x:1200,     y:src.y+i*15 },
        ],
        wl:   src.params?.isotope === 'Tc-99m' ? 620 : 550,
        intensity: I * 0.8,
      })
    }

    result.durationMs = performance.now() - t0
    return result
  },

  renderResult: (ctx2d, result) => {
    if (!result?.rays) return
    for (const ray of result.rays) {
      ctx2d.strokeStyle = '#e74c3c'
      ctx2d.lineWidth   = 1.2
      ctx2d.globalAlpha = ray.intensity || 0.6
      ctx2d.setLineDash([6, 3])
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
  id:'@luxlab/nuclear/results', title:'Nucléaire',
  icon:'☢', position:'right', component:NuclearPanel,
})

plugin.addI18n('fr', {
  'gamma-source.label': 'Source radioactive',
  'shield.label':       'Blindage',
  'dosimeter.label':    'Dosimètre',
})

export default plugin

// ─── Fonctions physiques ──────────────────────────────────────────

function getMu(material, energy_MeV) {
  const mat  = MATERIALS[material]
  if (!mat) return 0.1
  const keys = Object.keys(mat.mu).map(Number).sort((a,b)=>a-b)
  let lo = keys[0], hi = keys[keys.length-1]
  for (let i=0; i<keys.length-1; i++) {
    if (energy_MeV >= keys[i] && energy_MeV <= keys[i+1]) {
      lo=keys[i]; hi=keys[i+1]; break
    }
  }
  const t    = (energy_MeV-lo)/(hi-lo)
  const muLo = mat.mu[lo]*mat.rho
  const muHi = mat.mu[hi]*mat.rho
  return muLo + t*(muHi-muLo)
}

function computeDecay(A0, T_half, steps) {
  return Array.from({length:steps+1},(_,i) => {
    const t = (i/steps)*5*T_half
    return { t, A: A0*Math.exp(-Math.LN2/T_half*t) }
  })
}

function computeCompton(energy_keV, steps) {
  const m0c2 = 511
  return Array.from({length:steps+1},(_,i) => {
    const theta   = i*Math.PI/steps
    const E1      = energy_keV/(1+(energy_keV/m0c2)*(1-Math.cos(theta)))
    const ratio   = E1/energy_keV
    const kn      = 0.5*ratio*ratio*(ratio+1/ratio-Math.pow(Math.sin(theta),2))
    return { angle:i, energy:E1, dSigma:kn }
  })
}

function classifyDose(dose_uSvh) {
  const d = dose_uSvh / 1000
  if (d < 1)    return { level:'Négligeable', color:'#27ae60' }
  if (d < 20)   return { level:'Acceptable',  color:'#2ecc71' }
  if (d < 100)  return { level:'Modéré',      color:'#f39c12' }
  if (d < 1000) return { level:'Élevé',       color:'#e67e22' }
  return              { level:'Critique',     color:'#e74c3c' }
}