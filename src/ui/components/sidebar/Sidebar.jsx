import { useState, useEffect } from 'react'
import { registry }            from '../../../core/plugin-api'

const MODULE_COLORS = {
  '@luxlab/geo-optics':   'var(--lb-geo)',
  '@luxlab/wave-optics':  'var(--lb-wave)',
  '@luxlab/quantum':      'var(--lb-quant)',
  '@luxlab/nuclear':      'var(--lb-nuc)',
  '@luxlab/spectroscopy': 'var(--lb-spec)',
  '@luxlab/em':           'var(--lb-em)',
}

function getColor(moduleId) {
  return MODULE_COLORS[moduleId] || 'var(--lb-muted)'
}

export default function Sidebar() {
  const [allComps, setAllComps] = useState(registry.getAllComponents())
  const [open, setOpen]         = useState({})

  // Se reconstruit quand un plugin est chargé/déchargé
  useEffect(() => {
    const unsub = registry.onChange(() => {
      setAllComps(registry.getAllComponents())
    })
    return unsub
  }, [])

  // Grouper par moduleId → puis par category
  const byModule = allComps.reduce((acc, comp) => {
    const mod = comp.moduleId
    if (!acc[mod]) acc[mod] = {}
    const cat = comp.category || 'Général'
    if (!acc[mod][cat]) acc[mod][cat] = []
    acc[mod][cat].push(comp)
    return acc
  }, {})

  const toggleModule = (mod) =>
    setOpen(o => ({ ...o, [mod]: !(o[mod] ?? true) }))

  const handleDragStart = (e, comp) => {
    e.dataTransfer.setData(
      'application/luxlab',
      JSON.stringify({ type: comp.type, pluginId: comp.pluginId })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  const getPluginName = (moduleId) => {
    const p = registry.get(moduleId)
    return p?.name || moduleId.split('/').pop()
  }

  if (Object.keys(byModule).length === 0) {
    return (
      <aside style={sidebarStyle}>
        <div style={{ padding:20, color:'var(--lb-hint)', fontSize:11, textAlign:'center' }}>
          Aucun plugin chargé
        </div>
      </aside>
    )
  }

  return (
    <aside style={sidebarStyle}>
      {Object.entries(byModule).map(([moduleId, categories]) => {
        const color   = getColor(moduleId)
        const isOpen  = open[moduleId] !== false

        return (
          <div key={moduleId} style={{ borderBottom:'1px solid var(--lb-border)' }}>

            {/* En-tête module */}
            <div
              onClick={() => toggleModule(moduleId)}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        8,
                padding:    '8px 12px',
                cursor:     'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{
                width:        6,
                height:       6,
                borderRadius: '50%',
                background:   color,
                flexShrink:   0,
              }}/>
              <span style={{
                fontSize:      10,
                fontWeight:    600,
                color:         'var(--lb-muted)',
                letterSpacing: '.6px',
                flex:          1,
                textTransform: 'uppercase',
              }}>
                {getPluginName(moduleId)}
              </span>
              <span style={{ fontSize:9, color:'var(--lb-hint)' }}>
                {isOpen ? '▾' : '▸'}
              </span>
            </div>

            {/* Composants */}
            {isOpen && Object.entries(categories).map(([cat, comps]) => (
              <div key={cat}>
                {Object.keys(categories).length > 1 && (
                  <div style={{
                    padding:   '2px 16px',
                    fontSize:  9,
                    color:     'var(--lb-hint)',
                    letterSpacing: '.4px',
                  }}>
                    {cat}
                  </div>
                )}
                <div style={{ padding:'2px 6px 8px' }}>
                  {comps.map(comp => (
                    <CompItem
                      key={comp.type}
                      comp={comp}
                      color={color}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {/* Pied de sidebar */}
      <div style={{
        marginTop:   'auto',
        padding:     '8px 12px',
        borderTop:   '1px solid var(--lb-border)',
        fontSize:    9,
        color:       'var(--lb-hint)',
        fontFamily:  'var(--font-mono)',
      }}>
        {registry.getAll().length} plugin(s) · {allComps.length} composants
      </div>
    </aside>
  )
}

function CompItem({ comp, color, onDragStart }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, comp)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          8,
        padding:      '5px 8px',
        borderRadius: 'var(--radius-md)',
        cursor:       'grab',
        background:   hover ? 'var(--lb-bg)' : 'transparent',
        border:       `1px solid ${hover ? 'var(--lb-border)' : 'transparent'}`,
        marginBottom: 2,
        transition:   'all .1s',
      }}
    >
      <div style={{
        width:        18,
        height:       18,
        borderRadius: 3,
        background:   `${color}18`,
        border:       `1px solid ${color}44`,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontSize:     10,
        color:        color,
        flexShrink:   0,
      }}>
        {comp.icon}
      </div>
      <span style={{
        fontSize:  11,
        color:     hover ? 'var(--lb-text)' : '#555',
        fontFamily:'var(--font-ui)',
      }}>
        {comp.label}
      </span>
    </div>
  )
}

const sidebarStyle = {
  width:        200,
  background:   'var(--lb-surface)',
  borderRight:  '1px solid var(--lb-border)',
  display:      'flex',
  flexDirection:'column',
  overflowY:    'auto',
  flexShrink:   0,
}