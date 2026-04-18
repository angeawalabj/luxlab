import { useState }         from 'react'
import { useAppStore }      from '../../../store/useAppStore'
import { useSimStore }      from '../../../store/useSimStore'
import { useFileActions }   from '../../../core/useFileActions'
import SaveModal            from '../modals/SaveModal'

const FIDELITY = [
  { id:'fast',     label:'Rapide'   },
  { id:'standard', label:'Standard' },
  { id:'precise',  label:'Précis'   },
]

export default function TopBar({ onOpenTemplates }) {
  const { fidelity, setFidelity, toggleSidebar } = useAppStore()
  const { isRunning, toggleSim, components }      = useSimStore()
  const { newProject, save, open, exportReport }  = useFileActions()
  const [showSave, setShowSave]                   = useState(false)
  const [showFileMenu, setShowFileMenu]            = useState(false)

  const handleSave = async (meta) => {
    await save(meta)
    setShowSave(false)
  }

  return (
    <>
      <header style={headerStyle}>

        {/* Logo */}
        <div style={logoStyle}>
          <LogoMark size={22}/>
          <span style={logoTextStyle}>LuxLab</span>
        </div>

        {/* Menu Fichier */}
        <div style={{ position:'relative' }}>
          <TbBtn onClick={() => setShowFileMenu(v => !v)}>
            Fichier ▾
          </TbBtn>
          {showFileMenu && (
            <FileMenu
              onNew={()     => { newProject();        setShowFileMenu(false) }}
              onOpen={()    => { open();               setShowFileMenu(false) }}
              onSave={()    => { setShowSave(true);    setShowFileMenu(false) }}
              onPDF={()     => { exportReport();       setShowFileMenu(false) }}
              onClose={()   => setShowFileMenu(false)}
            />
          )}
        </div>

        <TbBtn onClick={onOpenTemplates}>Templates</TbBtn>
        <TbBtn onClick={toggleSidebar}>Sidebar</TbBtn>

        {/* Fidélité */}
        <div style={{ flex:1, display:'flex', justifyContent:'center', gap:2 }}>
          {FIDELITY.map(f => (
            <button key={f.id} onClick={() => setFidelity(f.id)} style={{
              padding:      '3px 10px',
              borderRadius: 4,
              border:       '1px solid',
              borderColor:  fidelity === f.id ? 'var(--lb-border-md)' : 'transparent',
              background:   fidelity === f.id ? 'var(--lb-bg)' : 'transparent',
              color:        fidelity === f.id ? 'var(--lb-text)' : 'var(--lb-muted)',
              fontSize:     11,
              cursor:       'pointer',
              fontFamily:   'var(--font-ui)',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Droite */}
        <div style={{ display:'flex', alignItems:'center', gap:6,
          padding:'0 12px', borderLeft:'1px solid var(--lb-border)' }}>
          <span style={{ fontSize:10, color:'var(--lb-muted)' }}>
            {components.length} composant{components.length !== 1 ? 's' : ''}
          </span>
          <SimBtn isRunning={isRunning} onClick={toggleSim}/>
        </div>
      </header>

      {showSave && (
        <SaveModal
          onSave={handleSave}
          onClose={() => setShowSave(false)}
        />
      )}
    </>
  )
}

// ─── Menu Fichier ─────────────────────────────────────────────────

function FileMenu({ onNew, onOpen, onSave, onPDF, onClose }) {
  const items = [
    { label:'Nouveau projet',    kbd:'Ctrl+N', action: onNew  },
    { label:'Ouvrir .lux…',      kbd:'Ctrl+O', action: onOpen },
    { label:'Enregistrer…',      kbd:'Ctrl+S', action: onSave },
    null,
    { label:'Exporter PDF…',     kbd:'',       action: onPDF  },
  ]

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:99,
      }}/>
      <div style={{
        position:   'absolute',
        top:        '110%',
        left:       0,
        minWidth:   200,
        background: 'var(--lb-surface)',
        border:     '1px solid var(--lb-border)',
        borderRadius: 6,
        zIndex:     100,
        boxShadow:  '0 4px 16px rgba(0,0,0,.1)',
        overflow:   'hidden',
      }}>
        {items.map((item, i) =>
          item === null
            ? <div key={i} style={{ height:1, background:'var(--lb-border)', margin:'3px 0' }}/>
            : <div key={i} onClick={item.action} style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                padding:        '8px 14px',
                fontSize:       11,
                color:          'var(--lb-text)',
                cursor:         'pointer',
                fontFamily:     'var(--font-ui)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--lb-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>{item.label}</span>
              {item.kbd && (
                <span style={{ fontSize:9, color:'var(--lb-hint)', fontFamily:'var(--font-mono)' }}>
                  {item.kbd}
                </span>
              )}
            </div>
        )}
      </div>
    </>
  )
}

// ─── Bouton Simuler ───────────────────────────────────────────────

function SimBtn({ isRunning, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:      '5px 14px',
      borderRadius: 4,
      border:       'none',
      background:   isRunning ? '#e74c3c' : 'var(--lb-text)',
      color:        '#fff',
      fontSize:     12,
      fontWeight:   600,
      cursor:       'pointer',
      fontFamily:   'var(--font-ui)',
      letterSpacing: 0.5,
      transition:   'background .15s',
    }}>
      {isRunning ? '⏹ Stop' : '▶ Simuler'}
    </button>
  )
}

// ─── Composants partagés ─────────────────────────────────────────

function TbBtn({ children, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      padding:      '4px 10px',
      borderRadius: 4,
      border:       '1px solid transparent',
      background:   'transparent',
      color:        'var(--lb-muted)',
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
        e.currentTarget.style.background  = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.color       = 'var(--lb-muted)'
      }}
    >
      {children}
    </button>
  )
}

export function LogoMark({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="10" y="10" width="25" height="25" fill="var(--lb-text)"/>
      <path d="M 35 22.5 L 77.5 22.5 L 77.5 65"
        fill="none" stroke="var(--lb-text)"
        strokeWidth={Math.round(4 * size / 100 * 10) / 10}
        strokeLinecap="square"
      />
      <path d="M 65 77.5 L 22.5 77.5 L 22.5 35"
        fill="none" stroke="var(--lb-text)"
        strokeWidth={Math.round(4 * size / 100 * 10) / 10}
        strokeLinecap="square"
      />
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