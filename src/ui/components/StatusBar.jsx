import { useState, useEffect }  from 'react'
import { useSimStore }           from '../../store/useSimStore'
import { useAppStore }           from '../../store/useAppStore'
import { registry }              from '../../core/plugin-api'

export default function StatusBar() {
  const { components, isRunning } = useSimStore()
  const { zoom, fidelity }        = useAppStore()
  const [saveStatus, setSaveStatus] = useState('saved')

  // Indicateur "sauvegarde en cours" quand les composants changent
  useEffect(() => {
    setSaveStatus('saving')
    const t = setTimeout(() => setSaveStatus('saved'), 1000)
    return () => clearTimeout(t)
  }, [components])

  return (
    <footer style={{
      height:      26,
      background:  'var(--lb-surface)',
      borderTop:   '1px solid var(--lb-border)',
      display:     'flex',
      alignItems:  'center',
      padding:     '0 14px',
      gap:         18,
      fontSize:    10,
      color:       'var(--lb-muted)',
      fontFamily:  'var(--font-mono)',
      flexShrink:  0,
      userSelect:  'none',
    }}>
      <StatusItem dot={isRunning ? '#27ae60' : 'var(--lb-border-md)'}>
        {isRunning ? 'Simulation active' : 'En pause'}
      </StatusItem>

      <StatusItem>
        {components.length} composant{components.length !== 1 ? 's' : ''}
      </StatusItem>

      <StatusItem>Zoom {Math.round(zoom * 100)}%</StatusItem>
      <StatusItem>{fidelity}</StatusItem>

      <div style={{ marginLeft:'auto', display:'flex', gap:18 }}>
        {/* Indicateur autosave */}
        <StatusItem dot={saveStatus === 'saved' ? '#27ae60' : '#f39c12'}>
          {saveStatus === 'saved' ? 'Session sauvegardée' : 'Sauvegarde...'}
        </StatusItem>

        <StatusItem dot="#27ae60">Offline</StatusItem>
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
          flexShrink:   0,
        }}/>
      )}
      {children}
    </div>
  )
}