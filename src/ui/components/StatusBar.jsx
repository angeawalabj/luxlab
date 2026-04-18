import { useSimStore } from '../../store/useSimStore'
import { useAppStore } from '../../store/useAppStore'
import { registry }    from '../../core/plugin-api'

export default function StatusBar() {
  const { components, isRunning } = useSimStore()
  const { zoom, fidelity }        = useAppStore()

  return (
    <footer style={{
      height:       26,
      background:   'var(--lb-surface)',
      borderTop:    '1px solid var(--lb-border)',
      display:      'flex',
      alignItems:   'center',
      padding:      '0 14px',
      gap:          18,
      fontSize:     10,
      color:        'var(--lb-muted)',
      fontFamily:   'var(--font-mono)',
      flexShrink:   0,
    }}>
      <StatusItem dot={isRunning ? 'var(--lb-success)' : 'var(--lb-border-md)'}>
        {isRunning ? 'Simulation active' : 'En pause'}
      </StatusItem>

      <StatusItem>{components.length} composant{components.length !== 1 ? 's' : ''}</StatusItem>
      <StatusItem>Zoom {Math.round(zoom * 100)}%</StatusItem>
      <StatusItem>{fidelity}</StatusItem>

      <div style={{ marginLeft:'auto', display:'flex', gap:18 }}>
        <StatusItem dot="var(--lb-success)">Offline</StatusItem>
        <StatusItem>{registry.getAll().length} plugin(s)</StatusItem>
        <StatusItem>.lux v1.0</StatusItem>
      </div>
    </footer>
  )
}

function StatusItem({ dot, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      {dot && (
        <div style={{
          width:        5,
          height:       5,
          borderRadius: '50%',
          background:   dot,
        }}/>
      )}
      {children}
    </div>
  )
}