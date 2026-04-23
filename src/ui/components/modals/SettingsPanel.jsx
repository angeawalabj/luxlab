import { useState } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { registry }    from '../../../core/plugin-api'

const SECTIONS = [
  { id:'simulation', label:'Simulation' },
  { id:'render',     label:'Rendu'      },
  { id:'interface',  label:'Interface'  },
  { id:'plugins',    label:'Plugins'    },
  { id:'offline',    label:'Hors-ligne' },
]

export default function SettingsPanel({ onClose }) {
  const [section, setSection] = useState('simulation')
  const {
    fidelity, setFidelity,
    renderSettings, setRenderSettings,
    sidebarOpen, propsPanelOpen, resultsPanelOpen,
    toggleSidebar, togglePropsPanel, toggleResultsPanel,
  } = useAppStore()

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={{
          padding:      '14px 18px',
          borderBottom: '1px solid var(--lb-border)',
          display:      'flex',
          alignItems:   'center',
        }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--lb-text)', flex:1 }}>
            Paramètres
          </span>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Navigation */}
          <nav style={{
            width:       180,
            borderRight: '1px solid var(--lb-border)',
            padding:     '8px 0',
          }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                display:    'block',
                width:      '100%',
                padding:    '8px 16px',
                textAlign:  'left',
                background: section === s.id ? 'var(--lb-bg)' : 'transparent',
                border:     'none',
                borderLeft: `2px solid ${section === s.id ? 'var(--lb-text)' : 'transparent'}`,
                color:      section === s.id ? 'var(--lb-text)' : 'var(--lb-muted)',
                fontSize:   11,
                cursor:     'pointer',
                fontFamily: 'var(--font-ui)',
              }}>
                {s.label}
              </button>
            ))}
          </nav>

          {/* Contenu */}
          <div style={{ flex:1, overflowY:'auto', padding:20 }}>

            {/* ── SIMULATION ── */}
            {section === 'simulation' && (
              <div>
                <SectionTitle>Niveau de fidélité</SectionTitle>
                <SectionDesc>
                  Contrôle la précision des calculs physiques.
                  Un niveau plus élevé est plus lent mais plus précis.
                </SectionDesc>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:20 }}>
                  {[
                    { id:'fast',     label:'Rapide',   desc:'3 rayons · PC faible' },
                    { id:'standard', label:'Standard', desc:'7 rayons · usage normal' },
                    { id:'precise',  label:'Précis',   desc:'15 rayons · publications' },
                    { id:'max',      label:'Maximum',  desc:'31 rayons · recherche' },
                  ].map(f => (
                    <button key={f.id} onClick={() => setFidelity(f.id)} style={{
                      padding:      12,
                      borderRadius: 6,
                      border:       `1px solid ${fidelity === f.id ? 'var(--lb-text)' : 'var(--lb-border)'}`,
                      background:   fidelity === f.id ? 'var(--lb-bg)' : 'transparent',
                      textAlign:    'left',
                      cursor:       'pointer',
                      fontFamily:   'var(--font-ui)',
                    }}>
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--lb-text)', marginBottom:3 }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize:9, color:'var(--lb-muted)' }}>
                        {f.desc}
                      </div>
                    </button>
                  ))}
                </div>

                <SectionTitle>Paramètres physiques</SectionTitle>
                {registry.getAll().map(plugin =>
                  plugin.settings.length > 0 ? (
                    <div key={plugin.id} style={{ marginBottom:16 }}>
                      <div style={{
                        fontSize:     10,
                        fontWeight:   600,
                        color:        'var(--lb-muted)',
                        marginBottom: 8,
                        fontFamily:   'var(--font-mono)',
                      }}>
                        {plugin.name}
                      </div>
                      {plugin.settings.map(s => (
                        <SettingField key={s.key} def={s}/>
                      ))}
                    </div>
                  ) : null
                )}
              </div>
            )}

            {/* ── RENDU ── */}
            {section === 'render' && (
              <div>
                <SectionTitle>Pipeline de rendu</SectionTitle>
                <SectionDesc>
                  Les effets avancés améliorent le réalisme visuel
                  mais consomment plus de ressources.
                </SectionDesc>

                {[
                  {
                    key:   'cie',
                    label: 'Conversion CIE XYZ → RGB',
                    desc:  'Couleurs physiquement correctes (recommandé). '
                         + 'Désactiver = approximation rapide.',
                  },
                  {
                    key:   'glow',
                    label: 'Halo lumineux sur les rayons',
                    desc:  'Effet de brillance autour des rayons. Désactiver sur PC faible.',
                  },
                  {
                    key:   'hdr',
                    label: 'Rendu HDR',
                    desc:  'Accumulation de lumière haute gamme. '
                         + 'Requis pour le bloom. Coûteux.',
                  },
                  {
                    key:   'bloom',
                    label: 'Bloom physique',
                    desc:  'Halo diffus sur les zones très lumineuses. Nécessite HDR.',
                  },
                ].map(item => (
                  <ToggleRow
                    key={item.key}
                    label={item.label}
                    desc={item.desc}
                    value={renderSettings?.[item.key] ?? (item.key === 'cie' || item.key === 'glow')}
                    onChange={v => setRenderSettings({ [item.key]: v })}
                    disabled={item.key === 'bloom' && !renderSettings?.hdr}
                  />
                ))}

                {renderSettings?.bloom && renderSettings?.hdr && (
                  <SliderRow
                    label="Intensité bloom"
                    value={renderSettings?.bloomStrength ?? 0.6}
                    min={0} max={2} step={0.1}
                    onChange={v => setRenderSettings({ bloomStrength: v })}
                  />
                )}

                {renderSettings?.glow && (
                  <SliderRow
                    label="Rayon du halo (px)"
                    value={renderSettings?.glowBlur ?? 4}
                    min={1} max={20} step={1}
                    onChange={v => setRenderSettings({ glowBlur: v })}
                  />
                )}
              </div>
            )}

            {/* ── INTERFACE ── */}
            {section === 'interface' && (
              <div>
                <SectionTitle>Panneaux visibles</SectionTitle>
                {[
                  { label:'Sidebar composants',  value:sidebarOpen,      toggle:toggleSidebar      },
                  { label:'Panneau propriétés',   value:propsPanelOpen,   toggle:togglePropsPanel   },
                  { label:'Panneau résultats',    value:resultsPanelOpen, toggle:toggleResultsPanel },
                ].map(item => (
                  <ToggleRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    onChange={item.toggle}
                  />
                ))}

                <SectionTitle style={{ marginTop:16 }}>Profil de démarrage</SectionTitle>
                <SectionDesc>
                  Configure les valeurs par défaut selon ton usage principal.
                  Tous les paramètres restent modifiables après.
                </SectionDesc>
                <div style={{
                  display:  'grid',
                  gridTemplateColumns: 'repeat(1,1fr)',
                  gap:      6,
                }}>
                  {[
                    { id:'etudiant',   label:'Étudiant / Apprenant',
                      desc:'Modules de base, interface guidée' },
                    { id:'enseignant', label:'Enseignant / Formateur',
                      desc:'Outils de création d\'expériences' },
                    { id:'chercheur',  label:'Chercheur',
                      desc:'Tous modules, paramètres avancés' },
                    { id:'ingenieur',  label:'Ingénieur / Professionnel',
                      desc:'Modules pro, import/export formats' },
                  ].map(p => (
                    <button key={p.id} style={{
                      padding:      '8px 12px',
                      borderRadius: 5,
                      border:       '1px solid var(--lb-border)',
                      background:   'transparent',
                      textAlign:    'left',
                      cursor:       'pointer',
                      fontFamily:   'var(--font-ui)',
                      display:      'flex',
                      gap:          10,
                      alignItems:   'center',
                    }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--lb-text)' }}>
                          {p.label}
                        </div>
                        <div style={{ fontSize:9, color:'var(--lb-muted)', marginTop:2 }}>
                          {p.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── PLUGINS ACTIFS ── */}
            {section === 'plugins' && (
              <div>
                <SectionTitle>Modules actifs</SectionTitle>
                <SectionDesc>
                  Désactiver un module retire ses composants de la sidebar
                  et arrête ses calculs. Les composants déjà sur le canvas
                  restent mais sont marqués inactifs.
                </SectionDesc>
                {registry.getAll().map(plugin => {
                  const disabled = JSON.parse(
                    localStorage.getItem('luxlab:disabled-plugins') || '[]'
                  ).includes(plugin.id)
                  return (
                    <ToggleRow
                      key={plugin.id}
                      label={plugin.name}
                      desc={`${plugin.components.length} composants · v${plugin.version}`}
                      value={!disabled}
                      onChange={() => {
                        const stored = JSON.parse(
                          localStorage.getItem('luxlab:disabled-plugins') || '[]'
                        )
                        const next = disabled
                          ? stored.filter(x => x !== plugin.id)
                          : [...stored, plugin.id]
                        localStorage.setItem(
                          'luxlab:disabled-plugins', JSON.stringify(next)
                        )
                      }}
                    />
                  )
                })}
              </div>
            )}

            {/* ── HORS-LIGNE ── */}
            {section === 'offline' && (
              <div>
                <SectionTitle>État hors-ligne</SectionTitle>
                <div style={{
                  background:   '#eafaf1',
                  border:       '1px solid #a9dfbf',
                  borderRadius: 6,
                  padding:      '10px 14px',
                  marginBottom: 16,
                  fontSize:     11,
                  color:        '#1e8449',
                }}>
                  ✓ LuxLab fonctionne intégralement sans internet.
                  Toutes les simulations, le save/load et la collaboration
                  LAN sont disponibles offline.
                </div>

                <SectionTitle>Persistance locale</SectionTitle>
                {[
                  ['Session canvas',   'Composants et paramètres du projet actuel'],
                  ['Préférences UI',   'Panneaux, fidélité, thème'],
                  ['Plugins installés','Plugins tiers ajoutés manuellement'],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display:      'flex',
                    justifyContent:'space-between',
                    padding:      '8px 0',
                    borderBottom: '1px solid var(--lb-border)',
                    fontSize:     10,
                  }}>
                    <div>
                      <div style={{ color:'var(--lb-text)', marginBottom:2 }}>{k}</div>
                      <div style={{ color:'var(--lb-muted)', fontSize:9 }}>{v}</div>
                    </div>
                    <span style={{
                      fontSize:   9,
                      padding:    '2px 6px',
                      borderRadius:3,
                      background: '#eafaf1',
                      color:      '#1e8449',
                      border:     '1px solid #a9dfbf',
                      alignSelf:  'center',
                    }}>
                      IndexedDB
                    </span>
                  </div>
                ))}

                <div style={{ marginTop:16 }}>
                  <button
                    onClick={() => {
                      if (window.confirm(
                        'Effacer toutes les données locales ? '
                        + 'Le projet actuel sera perdu.'
                      )) {
                        localStorage.clear()
                        window.location.reload()
                      }
                    }}
                    style={{
                      padding:      '7px 14px',
                      borderRadius: 4,
                      border:       '1px solid #fecaca',
                      background:   'transparent',
                      color:        '#dc2626',
                      fontSize:     10,
                      cursor:       'pointer',
                      fontFamily:   'var(--font-ui)',
                    }}
                  >
                    Effacer toutes les données locales
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Composants UI réutilisables ──────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize:      11,
      fontWeight:    600,
      color:         'var(--lb-text)',
      marginBottom:  8,
      paddingBottom: 6,
      borderBottom:  '1px solid var(--lb-border)',
    }}>
      {children}
    </div>
  )
}

function SectionDesc({ children }) {
  return (
    <div style={{
      fontSize:     10,
      color:        'var(--lb-muted)',
      lineHeight:   1.6,
      marginBottom: 14,
    }}>
      {children}
    </div>
  )
}

function ToggleRow({ label, desc, value, onChange, disabled }) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        '8px 0',
      borderBottom:   '1px solid var(--lb-border)',
      opacity:        disabled ? 0.4 : 1,
    }}>
      <div>
        <div style={{ fontSize:11, color:'var(--lb-text)' }}>{label}</div>
        {desc && (
          <div style={{ fontSize:9, color:'var(--lb-muted)', marginTop:2 }}>
            {desc}
          </div>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        style={{
          width:        36,
          height:       20,
          borderRadius: 10,
          border:       'none',
          background:   value ? 'var(--lb-text)' : 'var(--lb-border)',
          cursor:       disabled ? 'not-allowed' : 'pointer',
          position:     'relative',
          transition:   'background .2s',
          flexShrink:   0,
        }}
      >
        <div style={{
          position:   'absolute',
          top:        2,
          left:       value ? 18 : 2,
          width:      16,
          height:     16,
          borderRadius:'50%',
          background: '#fff',
          transition: 'left .2s',
        }}/>
      </button>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ marginBottom:12, paddingLeft:16 }}>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        fontSize:       10,
        color:          'var(--lb-muted)',
        marginBottom:   4,
      }}>
        <span>{label}</span>
        <span style={{ color:'var(--lb-text)', fontFamily:'var(--font-mono)' }}>
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width:'100%', accentColor:'var(--lb-text)' }}
      />
    </div>
  )
}

function SettingField({ def }) {
  const [val, setVal] = useState(def.default)
  if (def.type === 'boolean') {
    return (
      <ToggleRow
        label={def.label}
        desc={def.description}
        value={val}
        onChange={v => setVal(v)}
      />
    )
  }
  if (def.type === 'range') {
    return (
      <SliderRow
        label={def.label}
        value={val}
        min={def.min} max={def.max} step={1}
        onChange={v => setVal(v)}
      />
    )
  }
  return null
}

const overlayStyle = {
  position:       'fixed',
  inset:          0,
  background:     'rgba(44,62,80,.35)',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  zIndex:         150,
}

const modalStyle = {
  width:         720,
  height:        '78vh',
  background:    'var(--lb-surface)',
  border:        '1px solid var(--lb-border)',
  borderRadius:  12,
  display:       'flex',
  flexDirection: 'column',
  overflow:      'hidden',
  boxShadow:     '0 8px 32px rgba(0,0,0,.12)',
}

const closeBtnStyle = {
  background: 'transparent',
  border:     'none',
  color:      'var(--lb-muted)',
  fontSize:   16,
  cursor:     'pointer',
  padding:    4,
}