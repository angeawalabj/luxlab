import { useAppStore } from '../../../store/useAppStore'
import { useSimStore } from '../../../store/useSimStore'

function wavelengthToColor(wl) {
  if (wl < 440) return '#8b5cf6'
  if (wl < 490) return '#3b82f6'
  if (wl < 510) return '#06b6d4'
  if (wl < 580) return '#22c55e'
  if (wl < 645) return '#f59e0b'
  return '#ef4444'
}

export default function PropsPanel() {
  const { selectedComponentId } = useAppStore()
  const { components, updateParam, removeComponent } = useSimStore()
  const comp = components.find(c => c.id === selectedComponentId)

  if (!comp) return (
    <div style={{
      width: 220, background: 'var(--lb-panel)',
      borderLeft: '1px solid var(--lb-border)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, color: 'var(--lb-muted)', fontSize: 11,
      textAlign: 'center', padding: 20,
    }}>
      <div style={{ fontSize: 28, marginBottom: 10, opacity: .3 }}>⚙</div>
      Sélectionne un composant
    </div>
  )

  return (
    <div style={{
      width: 220, background: 'var(--lb-panel)',
      borderLeft: '1px solid var(--lb-border)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid var(--lb-border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lb-text)' }}>
          {comp.label}
        </div>
        <div style={{
          marginLeft: 'auto', fontSize: 9, padding: '2px 6px',
          borderRadius: 3, background: '#1e2d45', color: 'var(--lb-muted)',
        }}>
          {comp.module.toUpperCase()}
        </div>
      </div>

      {/* Paramètres */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.8px', color: 'var(--lb-muted)', marginBottom: 10 }}>
          PARAMÈTRES
        </div>
        {Object.entries(comp.params || {}).map(([key, val]) => (
          <ParamControl
            key={key}
            paramKey={key}
            value={val}
            onChange={(v) => updateParam(comp.id, key, v)}
          />
        ))}
      </div>

      {/* Position */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--lb-border)' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.8px', color: 'var(--lb-muted)', marginBottom: 8 }}>
          POSITION
        </div>
        <Row label="X">{Math.round(comp.x)} px</Row>
        <Row label="Y">{Math.round(comp.y)} px</Row>
        <Row label="ID"><span style={{ fontFamily: 'monospace', fontSize: 9 }}>{comp.id}</span></Row>
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 12px' }}>
        <button onClick={() => removeComponent(comp.id)} style={{
          width: '100%', padding: '6px',
          background: 'transparent', border: '1px solid #3d1515',
          color: '#ef4444', borderRadius: 4,
          cursor: 'pointer', fontSize: 10, fontFamily: 'inherit',
        }}>
          ✕ Supprimer
        </button>
      </div>
    </div>
  )
}

function ParamControl({ paramKey, value, onChange }) {
  const labels = {
    wavelength: 'Longueur d\'onde (nm)',
    intensity: 'Intensité (W/m²)',
    focalLength: 'Distance focale (mm)',
    diameter: 'Diamètre (mm)',
    refractiveIndex: 'Indice réfraction',
    apexAngle: 'Angle sommet (°)',
    separation: 'Séparation (mm)',
    energy: 'Énergie (MeV)',
    angle: 'Angle (°)',
  }

  const ranges = {
    wavelength:      [380, 780, 1],
    intensity:       [0, 10, 0.1],
    focalLength:     [5, 500, 1],
    diameter:        [5, 200, 1],
    refractiveIndex: [1, 3, 0.01],
    apexAngle:       [10, 90, 1],
    separation:      [0.1, 5, 0.1],
    energy:          [0.01, 10, 0.01],
    angle:           [0, 360, 1],
  }

  const label = labels[paramKey] || paramKey
  const range = ranges[paramKey]

  if (typeof value === 'number' && range) {
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, color: 'var(--lb-muted)', marginBottom: 3,
        }}>
          <span>{label}</span>
          <span style={{
            color: paramKey === 'wavelength' ? wavelengthToColor(value) : 'var(--lb-accent)',
            fontWeight: 600,
          }}>
            {typeof value === 'number' ? value.toFixed(range[2] < 1 ? 2 : 0) : value}
          </span>
        </div>
        <input
          type="range" min={range[0]} max={range[1]} step={range[2]}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--lb-accent)' }}
        />
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 6 }}>
      <Row label={label}>
        <span style={{ color: 'var(--lb-text)' }}>{String(value)}</span>
      </Row>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 5,
      fontSize: 10,
    }}>
      <span style={{ color: 'var(--lb-muted)' }}>{label}</span>
      <span style={{ color: 'var(--lb-text)' }}>{children}</span>
    </div>
  )
}