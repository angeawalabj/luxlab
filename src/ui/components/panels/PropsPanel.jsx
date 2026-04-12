import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { useSimStore } from '../../../store/useSimStore'
import { youngProfile, gratingMaxima, wavelengthToRGB } from '../../../core/physics/wave/interference'
import { photoelectricEffect, probabilityDistribution } from '../../../core/physics/quantum/photon'

function wavelengthToHex(wl) {
  const { r, g, b } = wavelengthToRGB(wl)
  return `rgb(${r},${g},${b})`
}

export default function PropsPanel() {
  const [tab, setTab] = useState('props')
  const { selectedComponentId } = useAppStore()
  const { components, updateParam, removeComponent, results } = useSimStore()
  const comp = components.find(c => c.id === selectedComponentId)

  return (
    <div style={{
      width: 230, background: 'var(--lb-panel)',
      borderLeft: '1px solid var(--lb-border)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--lb-border)', flexShrink: 0,
      }}>
        {['props','résultats','notes'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '7px 4px',
            background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab===t ? 'var(--lb-accent)' : 'transparent'}`,
            color: tab===t ? 'var(--lb-accent)' : 'var(--lb-muted)',
            cursor: 'pointer', fontSize: 10, fontFamily: 'inherit',
            textTransform: 'capitalize', letterSpacing: '.5px',
          }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'props'     && <PropsTab comp={comp} updateParam={updateParam} removeComponent={removeComponent} />}
        {tab === 'résultats' && <ResultsTab components={components} results={results} />}
        {tab === 'notes'     && <NotesTab />}
      </div>
    </div>
  )
}

// ─── ONGLET PROPRIÉTÉS ───────────────────────────────────────────────────────

function PropsTab({ comp, updateParam, removeComponent }) {
  if (!comp) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: 200,
      color: 'var(--lb-muted)', fontSize: 11, textAlign: 'center', padding: 20,
    }}>
      <div style={{ fontSize: 28, opacity: .2, marginBottom: 10 }}>⚙</div>
      Sélectionne un composant
    </div>
  )

  return (
    <div>
      {/* En-tête composant */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid var(--lb-border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--lb-text)' }}>
          {comp.label}
        </div>
        <span style={{
          fontSize: 9, padding: '2px 6px', borderRadius: 3,
          background: '#1e2d45', color: 'var(--lb-muted)',
        }}>
          {comp.module?.toUpperCase()}
        </span>
      </div>

      {/* Paramètres */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
        <SectionTitle>PARAMÈTRES</SectionTitle>
        {Object.entries(comp.params || {}).map(([key, val]) => (
          <ParamControl
            key={key}
            paramKey={key}
            value={val}
            onChange={v => updateParam(comp.id, key, v)}
          />
        ))}
      </div>

      {/* Position */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
        <SectionTitle>POSITION</SectionTitle>
        <Row k="X">{Math.round(comp.x)} px</Row>
        <Row k="Y">{Math.round(comp.y)} px</Row>
        <Row k="ID"><code style={{ fontSize: 9 }}>{comp.id}</code></Row>
      </div>

      {/* Infos physiques contextuelles */}
      {comp.type === 'source' && comp.params?.wavelength && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
          <SectionTitle>PHYSIQUE</SectionTitle>
          <div style={{
            height: 10, borderRadius: 4, marginBottom: 8,
            background: 'linear-gradient(to right,#8b5cf6,#3b82f6,#06b6d4,#22c55e,#f59e0b,#ef4444)',
          }}/>
          <Row k="Couleur">
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
              background: wavelengthToHex(comp.params.wavelength),
              marginRight: 5, verticalAlign: 'middle',
            }}/>
            {getColorName(comp.params.wavelength)}
          </Row>
          <Row k="Énergie photon">
            {(1240 / comp.params.wavelength).toFixed(2)} eV
          </Row>
          <Row k="Fréquence">
            {((3e8 / (comp.params.wavelength * 1e-9)) / 1e14).toFixed(2)} × 10¹⁴ Hz
          </Row>
        </div>
      )}

      {comp.type === 'lens' && comp.params?.focalLength && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
          <SectionTitle>VERGENCE</SectionTitle>
          <Row k="Vergence">{(1000 / comp.params.focalLength).toFixed(2)} δ</Row>
          <Row k="Type">{comp.params.focalLength > 0 ? 'Convergente' : 'Divergente'}</Row>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '10px 12px', display: 'flex', gap: 6 }}>
        <button style={{
          flex: 1, padding: 6, fontSize: 10, fontFamily: 'inherit',
          background: 'transparent', border: '1px solid var(--lb-border)',
          color: 'var(--lb-muted)', borderRadius: 4, cursor: 'pointer',
        }}>⊕ Dupliquer</button>
        <button onClick={() => removeComponent(comp.id)} style={{
          flex: 1, padding: 6, fontSize: 10, fontFamily: 'inherit',
          background: 'transparent', border: '1px solid #3d1515',
          color: '#ef4444', borderRadius: 4, cursor: 'pointer',
        }}>✕ Supprimer</button>
      </div>
    </div>
  )
}

// ─── ONGLET RÉSULTATS ────────────────────────────────────────────────────────

function ResultsTab({ components, results }) {
  const source  = components.find(c => c.type === 'source')
  const slit    = components.find(c => c.type === 'slit2')
  const grating = components.find(c => c.type === 'grating')
  const lenses  = components.filter(c => c.type === 'lens')

  return (
    <div>
      {/* Résultats tracé de rayons */}
      {results?.images?.length > 0 && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
          <SectionTitle>IMAGES CONJUGUÉES</SectionTitle>
          {results.images.map((img, i) => (
            <div key={i} style={{
              background: '#0a1628', borderRadius: 4,
              border: `1px solid ${img.real ? '#10b98144' : '#f59e0b44'}`,
              padding: '6px 8px', marginBottom: 6, fontSize: 10,
            }}>
              <div style={{ color: img.real ? '#10b981' : '#f59e0b', fontWeight: 600, marginBottom: 3 }}>
                {img.real ? '● Image réelle' : '○ Image virtuelle'}
              </div>
              <Row k="Grandissement">{img.magnification.toFixed(3)}</Row>
              <Row k="Position X">{Math.round(img.x)} px</Row>
            </div>
          ))}
        </div>
      )}

      {/* Graphe Young */}
      {source && slit && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
          <SectionTitle>INTERFÉRENCES — YOUNG</SectionTitle>
          <YoungGraph
            wavelength={source.params?.wavelength || 550}
            slitSeparation={slit.params?.separation || 0.5}
            slitWidth={slit.params?.width || 0.1}
            screenDistance={slit.params?.screenDistance || 300}
          />
          {(() => {
            const maxima = gratingMaxima(
              source.params?.wavelength || 550,
              (slit.params?.separation || 0.5) * 1e6,
              2
            )
            return (
              <div style={{ marginTop: 8 }}>
                <SectionTitle>MAXIMA PRINCIPAUX</SectionTitle>
                {maxima.map((m, i) => (
                  <Row key={i} k={`Ordre ${m.order}`}>
                    {m.angle.toFixed(2)}°
                  </Row>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* Réseau de diffraction */}
      {source && grating && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
          <SectionTitle>RÉSEAU — MAXIMA</SectionTitle>
          {gratingMaxima(
            source.params?.wavelength || 550,
            grating.params?.spacing || 600,
            3
          ).map((m, i) => (
            <Row key={i} k={`m = ${m.order > 0 ? '+' : ''}${m.order}`}>
              {m.angle.toFixed(3)}°
            </Row>
          ))}
        </div>
      )}

      {/* Effet photoélectrique */}
      {source && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
          <SectionTitle>EFFET PHOTOÉLECTRIQUE</SectionTitle>
          <PhotoelectricPanel wavelength={source.params?.wavelength || 550} />
        </div>
      )}

      {/* Vide */}
      {!source && (
        <div style={{
          padding: 20, textAlign: 'center',
          color: 'var(--lb-muted)', fontSize: 11,
        }}>
          Ajoute une source lumineuse pour voir les résultats
        </div>
      )}
    </div>
  )
}

function YoungGraph({ wavelength, slitSeparation, slitWidth, screenDistance }) {
  const canvasRef = useRef(null)
  const profile   = youngProfile({ wavelength, slitSeparation, slitWidth, screenDistance }, 8, 300)
  const { r, g, b } = wavelengthToRGB(wavelength)

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    const W = cvs.width, H = cvs.height
    ctx.clearRect(0, 0, W, H)

    // Fond
    ctx.fillStyle = '#0a1628'
    ctx.fillRect(0, 0, W, H)

    // Grille légère
    ctx.strokeStyle = '#1e2d45'
    ctx.lineWidth = .5
    for (let i = 0; i <= 4; i++) {
      const x = (i / 4) * W
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * H
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // Courbe d'intensité
    ctx.beginPath()
    ctx.strokeStyle = `rgb(${r},${g},${b})`
    ctx.lineWidth = 1.5
    ctx.shadowColor = `rgb(${r},${g},${b})`
    ctx.shadowBlur  = 4
    profile.forEach((pt, i) => {
      const px = (i / (profile.length - 1)) * W
      const py = H - pt.I * (H - 4) - 2
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    })
    ctx.stroke()

    // Remplissage
    ctx.shadowBlur = 0
    ctx.globalAlpha = .15
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill()
    ctx.globalAlpha = 1

    // Axes labels
    ctx.fillStyle = '#64748b'
    ctx.font = '8px monospace'
    ctx.fillText('−8mm', 2, H-2)
    ctx.fillText('+8mm', W-28, H-2)
    ctx.fillText('I', 2, 10)
  }, [wavelength, slitSeparation, slitWidth, screenDistance])

  return (
    <canvas
      ref={canvasRef}
      width={196} height={100}
      style={{ width: '100%', borderRadius: 4, display: 'block' }}
    />
  )
}

function PhotoelectricPanel({ wavelength }) {
  const metals = [
    { name: 'Sodium',    workFunction: 2.28 },
    { name: 'Potassium', workFunction: 2.30 },
    { name: 'Zinc',      workFunction: 4.33 },
    { name: 'Cuivre',    workFunction: 4.70 },
  ]
  return (
    <div>
      {metals.map(m => {
        const res = photoelectricEffect(wavelength, m.workFunction)
        return (
          <div key={m.name} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '4px 0',
            borderBottom: '1px solid var(--lb-border)', fontSize: 10,
          }}>
            <span style={{ color: 'var(--lb-muted)' }}>{m.name}</span>
            <span style={{ color: res.emitted ? 'var(--lb-success)' : '#ef4444' }}>
              {res.emitted ? `${res.kineticEnergy} eV` : 'Aucun e⁻'}
            </span>
          </div>
        )
      })}
      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--lb-muted)' }}>
        E photon = {(1240 / wavelength).toFixed(2)} eV
      </div>
    </div>
  )
}

// ─── ONGLET NOTES ────────────────────────────────────────────────────────────

function NotesTab() {
  const [text, setText] = useState('')
  return (
    <div style={{ padding: 12 }}>
      <SectionTitle>NOTES DE SIMULATION</SectionTitle>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Observations, hypothèses, résultats..."
        style={{
          width: '100%', height: 180, background: '#0a1628',
          border: '1px solid var(--lb-border)', borderRadius: 4,
          color: 'var(--lb-text)', fontSize: 10, fontFamily: 'inherit',
          padding: 8, resize: 'vertical', outline: 'none',
        }}
      />
      <div style={{ fontSize: 9, color: 'var(--lb-muted)', marginTop: 6 }}>
        {text.length} caractères
      </div>
    </div>
  )
}

// ─── COMPOSANTS UI RÉUTILISABLES ─────────────────────────────────────────────

function ParamControl({ paramKey, value, onChange }) {
  const labels = {
    wavelength:'Longueur d\'onde (nm)', intensity:'Intensité (W/m²)',
    focalLength:'Focale (mm)', diameter:'Diamètre (mm)',
    refractiveIndex:'Indice n', apexAngle:'Angle sommet (°)',
    separation:'Séparation (mm)', slitWidth:'Largeur fente (mm)',
    spacing:'Pas réseau (nm)', energy:'Énergie (MeV)',
    angle:'Angle (°)', transmittance:'Transmittance',
    screenDistance:'Distance écran (mm)',
  }
  const ranges = {
    wavelength:[380,780,1], intensity:[0,10,.1],
    focalLength:[-500,500,1], diameter:[5,200,1],
    refractiveIndex:[1,3,.01], apexAngle:[10,90,1],
    separation:[.05,5,.05], slitWidth:[.01,1,.01],
    spacing:[100,3000,10], energy:[.01,10,.01],
    angle:[0,360,1], transmittance:[0,1,.01],
    screenDistance:[50,1000,10],
  }
  const label = labels[paramKey] || paramKey
  const range = ranges[paramKey]

  if (typeof value === 'number' && range) {
    const accent = paramKey === 'wavelength'
      ? wavelengthToHex(value)
      : 'var(--lb-accent)'
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, color: 'var(--lb-muted)', marginBottom: 3,
        }}>
          <span>{label}</span>
          <span style={{ color: accent, fontWeight: 600 }}>
            {value.toFixed(range[2] < 1 ? 2 : 0)}
          </span>
        </div>
        <input type="range"
          min={range[0]} max={range[1]} step={range[2]} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--lb-accent)' }}
        />
      </div>
    )
  }
  if (typeof value === 'string') {
    return (
      <div style={{ marginBottom: 6 }}>
        <Row k={label}><span style={{ color: 'var(--lb-text)' }}>{value}</span></Row>
      </div>
    )
  }
  return null
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 9, letterSpacing: '0.8px',
      color: 'var(--lb-muted)', marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

function Row({ k, children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 5, fontSize: 10,
    }}>
      <span style={{ color: 'var(--lb-muted)' }}>{k}</span>
      <span style={{ color: 'var(--lb-text)' }}>{children}</span>
    </div>
  )
}

function getColorName(wl) {
  if (wl < 380) return 'UV'
  if (wl < 450) return 'Violet'
  if (wl < 495) return 'Bleu'
  if (wl < 500) return 'Cyan'
  if (wl < 570) return 'Vert'
  if (wl < 590) return 'Jaune'
  if (wl < 625) return 'Orange'
  if (wl < 750) return 'Rouge'
  return 'IR'
}