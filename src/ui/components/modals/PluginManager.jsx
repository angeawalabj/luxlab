import { useState, useEffect } from 'react'
import { registry }             from '../../../core/plugin-api'

export default function PluginManager({ onClose }) {
  const [plugins,    setPlugins]    = useState(registry.getAll())
  const [installing, setInstalling] = useState(false)
  const [error,      setError]      = useState(null)
  const [selected,   setSelected]   = useState(null)

  useEffect(() => {
    const unsub = registry.onChange(() => setPlugins(registry.getAll()))
    return unsub
  }, [])

  const handleInstall = async () => {
    const input   = document.createElement('input')
    input.type    = 'file'
    input.accept  = '.js,.luxpkg'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      setInstalling(true)
      setError(null)
      try {
        await registry.loadFromFile(file)
        setPlugins(registry.getAll())
      } catch (err) {
        setError(err.message)
      } finally {
        setInstalling(false)
      }
    }
    input.click()
  }

  const handleToggle = async (id) => {
    const stored = JSON.parse(
      localStorage.getItem('luxlab:disabled-plugins') || '[]'
    )
    const isDisabled = stored.includes(id)
    const next = isDisabled
      ? stored.filter(x => x !== id)
      : [...stored, id]
    localStorage.setItem('luxlab:disabled-plugins', JSON.stringify(next))
    setPlugins(registry.getAll())
  }

  const sel = selected ? registry.get(selected) : null

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={modalHeaderStyle}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--lb-text)' }}>
              Gestionnaire de plugins
            </div>
            <div style={{ fontSize:10, color:'var(--lb-muted)', marginTop:2 }}>
              {plugins.length} plugin(s) installé(s) · {
                registry.getAllComponents().length
              } composants disponibles
            </div>
          </div>
          <button onClick={handleInstall} disabled={installing} style={installBtnStyle}>
            {installing ? '⟳ Installation...' : '+ Installer (.js / .luxpkg)'}
          </button>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {error && (
          <div style={{
            padding:    '8px 18px',
            background: '#fef2f2',
            borderBottom:'1px solid #fecaca',
            fontSize:   10,
            color:      '#dc2626',
          }}>
            ✗ {error}
          </div>
        )}

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          {/* Liste plugins */}
          <div style={{
            width:        260,
            borderRight:  '1px solid var(--lb-border)',
            overflowY:    'auto',
          }}>
            {plugins.map(p => {
              const disabled = JSON.parse(
                localStorage.getItem('luxlab:disabled-plugins') || '[]'
              ).includes(p.id)

              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  style={{
                    padding:     '12px 16px',
                    cursor:      'pointer',
                    borderBottom:'1px solid var(--lb-border)',
                    background:  selected === p.id
                      ? 'var(--lb-bg)'
                      : 'transparent',
                    borderLeft: `3px solid ${
                      selected === p.id ? 'var(--lb-text)' : 'transparent'
                    }`,
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  <div style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            8,
                    marginBottom:   4,
                  }}>
                    <span style={{
                      fontSize:   11,
                      fontWeight: 600,
                      color:      'var(--lb-text)',
                      flex:       1,
                    }}>
                      {p.name}
                    </span>
                    <span style={{
                      fontSize:   9,
                      padding:    '1px 5px',
                      borderRadius:3,
                      background: 'var(--lb-bg)',
                      border:     '1px solid var(--lb-border)',
                      color:      'var(--lb-muted)',
                    }}>
                      v{p.version}
                    </span>
                  </div>
                  <div style={{
                    fontSize:   9,
                    color:      'var(--lb-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {p.id}
                  </div>
                  <div style={{
                    display:   'flex',
                    gap:       6,
                    marginTop: 6,
                  }}>
                    {[
                      [p.components.length,  'composants'],
                      [p.templates.length,   'templates'],
                      [p.experiences.length, 'expériences'],
                    ].map(([n, label]) => n > 0 ? (
                      <span key={label} style={badgeStyle}>
                        {n} {label}
                      </span>
                    ) : null)}
                  </div>
                </div>
              )
            })}

            {plugins.length === 0 && (
              <div style={{
                padding:   40,
                textAlign: 'center',
                fontSize:  11,
                color:     'var(--lb-hint)',
              }}>
                Aucun plugin installé
              </div>
            )}
          </div>

          {/* Détail plugin */}
          <div style={{ flex:1, overflowY:'auto', padding:20 }}>
            {sel ? <PluginDetail plugin={sel} onToggle={handleToggle}/> : (
              <div style={{
                height:         '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                color:          'var(--lb-hint)',
                fontSize:       11,
              }}>
                Sélectionne un plugin pour voir ses détails
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PluginDetail({ plugin: p, onToggle }) {
  const disabled = JSON.parse(
    localStorage.getItem('luxlab:disabled-plugins') || '[]'
  ).includes(p.id)

  return (
    <div>
      {/* Titre */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--lb-text)', marginBottom:4 }}>
          {p.name}
        </div>
        <div style={{
          fontSize:   10,
          color:      'var(--lb-muted)',
          fontFamily: 'var(--font-mono)',
          marginBottom:8,
        }}>
          {p.id} · v{p.version} · {p.manifest.license}
        </div>
        {p.manifest.description && (
          <div style={{ fontSize:11, color:'var(--lb-muted)', lineHeight:1.6 }}>
            {p.manifest.description}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display:  'grid',
        gridTemplateColumns: 'repeat(4,1fr)',
        gap:      8,
        marginBottom: 16,
      }}>
        {[
          ['Composants',  p.components.length],
          ['Moteurs',     p.engines.length],
          ['Templates',   p.templates.length],
          ['Expériences', p.experiences.length],
        ].map(([k, v]) => (
          <div key={k} style={{
            background:   'var(--lb-bg)',
            border:       '1px solid var(--lb-border)',
            borderRadius: 6,
            padding:      '8px 10px',
            textAlign:    'center',
          }}>
            <div style={{ fontSize:18, fontWeight:700, color:'var(--lb-text)' }}>
              {v}
            </div>
            <div style={{ fontSize:9, color:'var(--lb-muted)', marginTop:2 }}>
              {k}
            </div>
          </div>
        ))}
      </div>

      {/* Composants */}
      {p.components.length > 0 && (
        <Section title="COMPOSANTS">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: 6,
          }}>
            {p.components.map(c => (
              <div key={c.type} style={{
                display:      'flex',
                alignItems:   'center',
                gap:          8,
                padding:      '6px 8px',
                background:   'var(--lb-bg)',
                border:       '1px solid var(--lb-border)',
                borderRadius: 5,
                fontSize:     10,
              }}>
                <span style={{ fontSize:14 }}>{c.icon}</span>
                <div>
                  <div style={{ color:'var(--lb-text)' }}>{c.label}</div>
                  <div style={{ color:'var(--lb-hint)', fontSize:9, fontFamily:'var(--font-mono)' }}>
                    {c.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Dépendances */}
      {(p.manifest.dependencies || []).length > 0 && (
        <Section title="DÉPENDANCES">
          {p.manifest.dependencies.map(dep => (
            <div key={dep} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          8,
              padding:      '4px 0',
              fontSize:     10,
            }}>
              <span style={{
                color: registry.isLoaded(dep) ? '#27ae60' : '#e74c3c',
              }}>
                {registry.isLoaded(dep) ? '✓' : '✗'}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                color:      'var(--lb-muted)',
              }}>
                {dep}
              </span>
            </div>
          ))}
        </Section>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:8, marginTop:16 }}>
        <button onClick={() => onToggle(p.id)} style={{
          padding:      '7px 16px',
          borderRadius: 4,
          border:       '1px solid var(--lb-border)',
          background:   'transparent',
          color:        disabled ? '#27ae60' : '#e74c3c',
          fontSize:     11,
          cursor:       'pointer',
          fontFamily:   'var(--font-ui)',
        }}>
          {disabled ? 'Activer' : 'Désactiver'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:16 }}>
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

// ─── Styles ───────────────────────────────────────────────────────

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
  width:         800,
  height:        '80vh',
  background:    'var(--lb-surface)',
  border:        '1px solid var(--lb-border)',
  borderRadius:  12,
  display:       'flex',
  flexDirection: 'column',
  overflow:      'hidden',
  boxShadow:     '0 8px 32px rgba(0,0,0,.12)',
}

const modalHeaderStyle = {
  padding:       '14px 18px',
  borderBottom:  '1px solid var(--lb-border)',
  display:       'flex',
  alignItems:    'center',
  gap:           12,
}

const installBtnStyle = {
  padding:      '6px 14px',
  borderRadius: 4,
  border:       '1px solid var(--lb-border)',
  background:   'var(--lb-text)',
  color:        '#fff',
  fontSize:     11,
  cursor:       'pointer',
  fontFamily:   'var(--font-ui)',
  marginLeft:   'auto',
}

const closeBtnStyle = {
  background: 'transparent',
  border:     'none',
  color:      'var(--lb-muted)',
  fontSize:   16,
  cursor:     'pointer',
  padding:    4,
}

const badgeStyle = {
  fontSize:   8,
  padding:    '1px 5px',
  borderRadius:3,
  background: 'var(--lb-bg)',
  border:     '1px solid var(--lb-border)',
  color:      'var(--lb-muted)',
}