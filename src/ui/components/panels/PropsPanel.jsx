import { useAppStore }  from '../../../store/useAppStore'
import { useSimStore }  from '../../../store/useSimStore'
import { registry }     from '../../../core/plugin-api'

export default function PropsPanel() {
  const { selectedId }              = useAppStore()
  const { components, updateParam,
          removeComponent }         = useSimStore()

  const comp = components.find(c => c.id === selectedId)
  const def  = comp ? registry.getComponentDef(comp.type) : null

  if (!comp || !def) {
    return (
      <aside style={panelStyle}>
        <div style={{
          flex:           1,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          color:          'var(--lb-hint)',
          fontSize:       11,
          textAlign:      'center',
          padding:        20,
          gap:            10,
        }}>
          <div style={{ fontSize:24, opacity:.3 }}>⚙</div>
          Sélectionne un composant
        </div>
      </aside>
    )
  }

  return (
    <aside style={panelStyle}>

      {/* En-tête */}
      <div style={{
        padding:       '10px 14px',
        borderBottom:  '1px solid var(--lb-border)',
        display:       'flex',
        alignItems:    'center',
        gap:           8,
      }}>
        <span style={{ fontSize:16 }}>{def.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--lb-text)' }}>
            {comp.label}
          </div>
          <div style={{ fontSize:9, color:'var(--lb-hint)', fontFamily:'var(--font-mono)' }}>
            {comp.pluginId}
          </div>
        </div>
      </div>

      {/* Paramètres */}
      <div style={{ flex:1, overflowY:'auto' }}>
        <Section title="PARAMÈTRES">
          {getVisibleParams(def, comp).map(pDef => (
            <ParamField
              key={pDef.key}
              pDef={pDef}
              value={comp.params?.[pDef.key]}
              onChange={v => updateParam(comp.id, pDef.key, v)}
            />
          ))}
        </Section>

        {/* Panneau custom du plugin */}
        {registry.getAllPanels()
          .filter(p => p.pluginId === comp.pluginId && p.position === 'right')
          .map(panel => {
            const PanelComp = panel.component
            return (
              <div key={panel.id} style={{ borderTop:'1px solid var(--lb-border)' }}>
                <div style={{ padding:'8px 14px 4px', fontSize:9,
                  letterSpacing:'.6px', color:'var(--lb-muted)' }}>
                  {panel.title.toUpperCase()}
                </div>
                <PanelComp
                  results={useSimStore.getState().results}
                  components={[comp]}
                />
              </div>
            )
          })
        }

        {/* Position */}
        <Section title="POSITION">
          <InfoRow k="X">{Math.round(comp.x)} px</InfoRow>
          <InfoRow k="Y">{Math.round(comp.y)} px</InfoRow>
        </Section>
      </div>

      {/* Actions */}
      <div style={{
        padding:     '10px 14px',
        borderTop:   '1px solid var(--lb-border)',
        display:     'flex',
        gap:         6,
      }}>
        <ActionBtn
          onClick={() => removeComponent(comp.id)}
          danger
        >
          Supprimer
        </ActionBtn>
      </div>
    </aside>
  )
}

// filtrer selon sourceType si c'est une source

function getVisibleParams(def, comp) {
  if (comp.type !== 'source') return def.paramsDef || []

  const sourceType = comp.params?.sourceType || 'parallel'

  // Paramètres toujours visibles
  const always = ['sourceType', 'wavelength', 'intensity',
                  'coherence', 'polarization']

  // Paramètres selon le type
  const byType = {
    parallel:      ['beamDiameter'],
    point:         [],
    conical:       ['coneAngle', 'beamDiameter'],
    extended:      ['sourceHeight'],
    gaussian:      ['waist', 'divergence'],
    fiber_output:  ['numericalAperture'],
    polychromatic: ['beamDiameter'],
    led:           ['ledBandwidth', 'beamDiameter'],
    spectral_lamp: ['lampElement'],
    blackbody:     ['temperature', 'beamDiameter'],
  }

  const extra   = byType[sourceType] || []
  const visible = new Set([...always, ...extra])

  return (def.paramsDef || []).filter(p => visible.has(p.key))
}
// ─── Champ de paramètre ───────────────────────────────────────────

function ParamField({ pDef, value, onChange }) {
  const isWL    = pDef.key === 'wavelength'
  const accent  = isWL ? wlToCSS(value) : 'var(--lb-text)'

  if (pDef.type === 'range') {
    return (
      <div style={{ marginBottom:10 }}>
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          fontSize:       10,
          marginBottom:   3,
        }}>
          <span style={{ color:'var(--lb-muted)' }}>{pDef.label}</span>
          <span style={{ color:accent, fontWeight:600, fontFamily:'var(--font-mono)' }}>
            {typeof value === 'number'
              ? value.toFixed(pDef.step < 1 ? 2 : 0)
              : value ?? pDef.default ?? '—'}
          </span>
        </div>
        <input
          type="range"
          min={pDef.min} max={pDef.max} step={pDef.step}
          value={value ?? pDef.default ?? pDef.min}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ width:'100%', accentColor:'var(--lb-text)' }}
        />
        {isWL && (
          <div style={{
            height:       4,
            borderRadius: 2,
            marginTop:    4,
            background:   'linear-gradient(to right,#8e44ad,#2980b9,#16a085,#27ae60,#f39c12,#e74c3c)',
          }}/>
        )}
      </div>
    )
  }

  if (pDef.type === 'select') {
    return (
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:10, color:'var(--lb-muted)', marginBottom:3 }}>
          {pDef.label}
        </div>
        <select
          value={value ?? pDef.default ?? ''}
          onChange={e => onChange(e.target.value)}
          style={{
            width:        '100%',
            padding:      '4px 6px',
            background:   'var(--lb-bg)',
            border:       '1px solid var(--lb-border)',
            borderRadius: 4,
            color:        'var(--lb-text)',
            fontSize:     10,
            fontFamily:   'var(--font-ui)',
          }}
        >
          {pDef.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  if (pDef.type === 'boolean') {
    return (
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   8,
      }}>
        <span style={{ fontSize:10, color:'var(--lb-muted)' }}>{pDef.label}</span>
        <input
          type="checkbox"
          checked={!!value}
          onChange={e => onChange(e.target.checked)}
          style={{ accentColor:'var(--lb-text)' }}
        />
      </div>
    )
  }

  return null
}

// ─── Composants UI réutilisables ──────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--lb-border)' }}>
      <div style={{
        fontSize:      9,
        letterSpacing: '.6px',
        color:         'var(--lb-muted)',
        marginBottom:  8,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ k, children }) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      fontSize:       10,
      marginBottom:   4,
    }}>
      <span style={{ color:'var(--lb-muted)' }}>{k}</span>
      <span style={{ color:'var(--lb-text)', fontFamily:'var(--font-mono)' }}>
        {children}
      </span>
    </div>
  )
}

function ActionBtn({ children, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      flex:         1,
      padding:      '6px 0',
      borderRadius: 4,
      border:       `1px solid ${danger ? '#f5c6cb' : 'var(--lb-border)'}`,
      background:   'transparent',
      color:        danger ? '#e74c3c' : 'var(--lb-muted)',
      fontSize:     10,
      cursor:       'pointer',
      fontFamily:   'var(--font-ui)',
    }}>
      {children}
    </button>
  )
}

function wlToCSS(wl) {
  if (!wl) return 'var(--lb-text)'
  if (wl < 440) return '#8e44ad'
  if (wl < 490) return '#2980b9'
  if (wl < 510) return '#16a085'
  if (wl < 580) return '#27ae60'
  if (wl < 645) return '#f39c12'
  return '#e74c3c'
}

const panelStyle = {
  width:         220,
  background:    'var(--lb-surface)',
  borderLeft:    '1px solid var(--lb-border)',
  display:       'flex',
  flexDirection: 'column',
  flexShrink:    0,
}