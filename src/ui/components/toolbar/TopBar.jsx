import { useAppStore } from '../../../store/useAppStore'
import { useSimStore } from '../../../store/useSimStore'
import { exportLux, importLux } from '../../../core/formats/lux'

const MODES = [
  { id: 'etudiant', label: 'Étudiant' },
  { id: 'pro',      label: 'Professionnel' },
  { id: 'recherche',label: 'Recherche' },
  { id: 'tp',       label: 'Mode TP' },
]

const COLLABORATORS = [
  { initials: 'KM', color: '#7c3aed', name: 'Kofi Mensah' },
  { initials: 'DA', color: '#10b981', name: 'Dr. Adjovi' },
]

export default function TopBar() {
  const { mode, setMode, toggleCollab } = useAppStore()
  const { isRunning, toggleSim } = useSimStore()
  const { components, addComponent } = useSimStore()

const handleExport = () => exportLux(components, { title: 'Mon projet LuxLab' })

const handleImport = () => {
  const input = document.createElement('input')
  input.type  = 'file'
  input.accept = '.lux,.json'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const doc = await importLux(file)
    doc.components.forEach(c => addComponent(c))
  }
  input.click()
}

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 44,
      background: 'var(--lb-panel)',
      borderBottom: '1px solid var(--lb-border)',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 16px', borderRight: '1px solid var(--lb-border)',
        height: '100%', minWidth: 160,
      }}>
        <LuxIcon />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: .5 }}>
          Lux<span style={{ color: 'var(--lb-accent)' }}>Lab</span>
        </span>
      </div>

      {/* Modes */}
      <div style={{ display: 'flex', gap: 2, padding: '0 12px', flex: 1 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            padding: '4px 12px', borderRadius: 4, border: '1px solid',
            borderColor: mode === m.id ? 'var(--lb-border)' : 'transparent',
            background: mode === m.id ? '#1e2d45' : 'transparent',
            color: mode === m.id ? 'var(--lb-accent)' : 'var(--lb-muted)',
            cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
            transition: 'all .15s',
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Droite */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', borderLeft: '1px solid var(--lb-border)',
      }}>
        {/* Collaborateurs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {COLLABORATORS.map(c => (
            <div key={c.initials} title={c.name} style={{
              width: 24, height: 24, borderRadius: '50%',
              background: c.color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff',
              cursor: 'pointer',
            }}>
              {c.initials}
            </div>
          ))}
        </div>

        <TbBtn onClick={toggleCollab}>⟳ Collab</TbBtn>
        <TbBtn onClick={handleImport}>⬆ Import</TbBtn>
        <TbBtn onClick={handleExport}>⬇ Export</TbBtn>
        <TbBtn
          onClick={toggleSim}
          style={{
            background: isRunning ? 'var(--lb-danger)' : 'var(--lb-accent)',
            color: '#000',
            borderColor: isRunning ? 'var(--lb-danger)' : 'var(--lb-accent)',
            fontWeight: 700,
          }}
        >
          {isRunning ? '⏹ Stop' : '▶ Simuler'}
        </TbBtn>
      </div>
    </div>
  )
}

function TbBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 4,
      border: '1px solid var(--lb-border)',
      background: 'transparent', color: 'var(--lb-text)',
      cursor: 'pointer', fontSize: 10, fontFamily: 'inherit',
      ...style,
    }}>
      {children}
    </button>
  )
}

function LuxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill="#00c9ff"/>
      <line x1="12" y1="2" x2="12" y2="6" stroke="#00c9ff" strokeWidth="1.5"/>
      <line x1="12" y1="18" x2="12" y2="22" stroke="#00c9ff" strokeWidth="1.5"/>
      <line x1="2" y1="12" x2="6" y2="12" stroke="#f59e0b" strokeWidth="1.5"/>
      <line x1="18" y1="12" x2="22" y2="12" stroke="#f59e0b" strokeWidth="1.5"/>
      <line x1="4.9" y1="4.9" x2="7.8" y2="7.8" stroke="#7c3aed" strokeWidth="1.5"/>
      <line x1="16.2" y1="16.2" x2="19.1" y2="19.1" stroke="#7c3aed" strokeWidth="1.5"/>
      <line x1="19.1" y1="4.9" x2="16.2" y2="7.8" stroke="#10b981" strokeWidth="1.5"/>
      <line x1="7.8" y1="16.2" x2="4.9" y2="19.1" stroke="#10b981" strokeWidth="1.5"/>
    </svg>
  )
}