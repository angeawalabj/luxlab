import { useState, useRef, useEffect } from 'react'
import { useAppStore }                  from '../../../store/useAppStore'
import { useSimStore }                  from '../../../store/useSimStore'
import { useFileActions }               from '../../../core/useFileActions'
import SaveModal                        from '../modals/SaveModal'

const FIDELITY = [
  { id:'fast',     label:'Rapide'   },
  { id:'standard', label:'Standard' },
  { id:'precise',  label:'Précis'   },
]

export default function TopBar({ onOpenTemplates }) {
  const { fidelity, setFidelity, toggleSidebar } = useAppStore()
  const { isRunning, toggleSim, components }      = useSimStore()
  const { newProject, save, open, exportReport, clearCanvas } = useFileActions()
  const [showSave, setShowSave]   = useState(false)
  const [fileMenu, setFileMenu]   = useState(false)
  const fileMenuRef               = useRef(null)

  // Fermer le menu si clic en dehors
  useEffect(() => {
    if (!fileMenu) return
    const handler = (e) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
        setFileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [fileMenu])

  const menuItems = [
    { label:'Nouveau projet', kbd:'Ctrl+N',
      action: () => { newProject(); setFileMenu(false) } },
    { label:'Ouvrir .lux…',  kbd:'Ctrl+O',
      action: () => { open(); setFileMenu(false) } },
    { label:'Enregistrer…',  kbd:'Ctrl+S',
      action: () => { setShowSave(true); setFileMenu(false) } },
    null,
    { label:'Exporter PDF…', kbd:'',
      action: () => { exportReport(); setFileMenu(false) } },
    null,
    { label:'Effacer le canvas', kbd:'', danger:true,
      action: () => { clearCanvas(); setFileMenu(false) } },
  ]

  return (
    <>
      <header style={headerStyle}>

        {/* Logo */}
        <div style={logoStyle}>
          <LogoMark size={22}/>
          <span style={logoTextStyle}>LuxLab</span>
        </div>

        {/* Menu Fichier */}
        <div ref={fileMenuRef} style={{ position:'relative' }}>
          <TbBtn
            active={fileMenu}
            onClick={() => setFileMenu(v => !v)}
          >
            Fichier
          </TbBtn>
          {fileMenu && (
            <div style={dropdownStyle}>
              {menuItems.map((item, i) =>
                item === null
                  ? <div key={i} style={separatorStyle}/>
                  : <button
                      key={i}
                      onClick={item.action}
                      style={menuItemStyle(item.danger)}
                      onMouseEnter={e =>
                        e.currentTarget.style.background = 'var(--lb-bg)'}
                      onMouseLeave={e =>
                        e.currentTarget.style.background = 'transparent'}
                    >
                      <span>{item.label}</span>
                      {item.kbd && (
                        <span style={kbdStyle}>{item.kbd}</span>
                      )}
                    </button>
              )}
            </div>
          )}
        </div>

        <TbBtn onClick={onOpenTemplates}>Bibliothèque</TbBtn>
        <TbBtn onClick={toggleSidebar}>Sidebar</TbBtn>

        {/* Fidélité */}
        <div style={{
          flex:1, display:'flex',
          justifyContent:'center', gap:2,
        }}>
          {FIDELITY.map(f => (
            <button key={f.id} onClick={() => setFidelity(f.id)} style={{
              padding:      '3px 10px',
              borderRadius: 4,
              border:       '1px solid',
              borderColor:  fidelity===f.id ? 'var(--lb-border-md)' : 'transparent',
              background:   fidelity===f.id ? 'var(--lb-bg)' : 'transparent',
              color:        fidelity===f.id ? 'var(--lb-text)' : 'var(--lb-muted)',
              fontSize:     11,
              cursor:       'pointer',
              fontFamily:   'var(--font-ui)',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Droite */}
        <div style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'0 12px',
          borderLeft:'1px solid var(--lb-border)',
        }}>
          <span style={{ fontSize:10, color:'var(--lb-muted)' }}>
            {components.length} composant{components.length!==1?'s':''}
          </span>
          <button onClick={toggleSim} style={{
            padding:      '5px 14px',
            borderRadius: 4,
            border:       'none',
            background:   isRunning ? '#e74c3c' : 'var(--lb-text)',
            color:        '#fff',
            fontSize:     12,
            fontWeight:   600,
            cursor:       'pointer',
            fontFamily:   'var(--font-ui)',
          }}>
            {isRunning ? '⏹ Stop' : '▶ Simuler'}
          </button>
        </div>
      </header>

      {showSave && (
        <SaveModal
          onSave={async (meta) => { await save(meta); setShowSave(false) }}
          onClose={() => setShowSave(false)}
        />
      )}
    </>
  )
}

function TbBtn({ children, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      padding:      '4px 10px',
      borderRadius: 4,
      border:       '1px solid',
      borderColor:  active ? 'var(--lb-border)' : 'transparent',
      background:   active ? 'var(--lb-bg)' : 'transparent',
      color:        active ? 'var(--lb-text)' : 'var(--lb-muted)',
      fontSize:     11,
      cursor:       'pointer',
      fontFamily:   'var(--font-ui)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = 'var(--lb-bg)'
        e.currentTarget.style.borderColor = 'var(--lb-border)'
        e.currentTarget.style.color       = 'var(--lb-text)'
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background  = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
          e.currentTarget.style.color       = 'var(--lb-muted)'
        }
      }}
    >
      {children}
    </button>
  )
}

export function LogoMark({ size = 24 }) {
  const sw = Math.round(4 * size / 100 * 10) / 10
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="10" y="10" width="25" height="25" fill="var(--lb-text)"/>
      <path d="M 35 22.5 L 77.5 22.5 L 77.5 65"
        fill="none" stroke="var(--lb-text)"
        strokeWidth={sw} strokeLinecap="square"/>
      <path d="M 65 77.5 L 22.5 77.5 L 22.5 35"
        fill="none" stroke="var(--lb-text)"
        strokeWidth={sw} strokeLinecap="square"/>
      <rect x="65" y="65" width="25" height="25" fill="var(--lb-text)"/>
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────

const headerStyle = {
  height:       44,
  background:   'var(--lb-surface)',
  borderBottom: '1px solid var(--lb-border)',
  display:      'flex',
  alignItems:   'center',
  gap:          2,
  padding:      '0 4px',
  flexShrink:   0,
  userSelect:   'none',
  position:     'relative',
  zIndex:       50,
}

const logoStyle = {
  display:     'flex',
  alignItems:  'center',
  gap:         8,
  padding:     '0 14px 0 10px',
  borderRight: '1px solid var(--lb-border)',
  height:      '100%',
  minWidth:    130,
}

const logoTextStyle = {
  fontSize:      14,
  fontWeight:    700,
  color:         'var(--lb-text)',
  letterSpacing: 1,
  fontFamily:    'var(--font-ui)',
}

const dropdownStyle = {
  position:     'absolute',
  top:          'calc(100% + 4px)',
  left:         0,
  minWidth:     210,
  background:   'var(--lb-surface)',
  border:       '1px solid var(--lb-border)',
  borderRadius: 6,
  zIndex:       100,
  boxShadow:    '0 4px 16px rgba(0,0,0,.1)',
  overflow:     'hidden',
  padding:      '4px 0',
}

const separatorStyle = {
  height:     1,
  background: 'var(--lb-border)',
  margin:     '4px 0',
}

const menuItemStyle = (danger) => ({
  display:        'flex',
  justifyContent: 'space-between',
  alignItems:     'center',
  width:          '100%',
  padding:        '7px 14px',
  fontSize:       11,
  color:          danger ? '#e74c3c' : 'var(--lb-text)',
  background:     'transparent',
  border:         'none',
  cursor:         'pointer',
  fontFamily:     'var(--font-ui)',
  textAlign:      'left',
})

const kbdStyle = {
  fontSize:   9,
  color:      'var(--lb-hint)',
  fontFamily: 'var(--font-mono)',
}