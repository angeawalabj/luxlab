import { useSimStore } from '../../../store/useSimStore'
import { registry }    from '../../../core/plugin-api'

export default function ResultsPanel() {
  const { results, components, isRunning } = useSimStore()

  const panels = registry.getAllPanels()
    .filter(p => p.position === 'right')

  if (panels.length === 0) {
    return (
      <aside style={panelStyle}>
        <div style={{
          padding:   16,
          fontSize:  10,
          color:     'var(--lb-hint)',
          textAlign: 'center',
        }}>
          Aucun plugin actif
        </div>
      </aside>
    )
  }

  return (
    <aside style={panelStyle}>
      <div style={{
        padding:       '8px 14px',
        borderBottom:  '1px solid var(--lb-border)',
        fontSize:      10,
        fontWeight:    600,
        color:         'var(--lb-muted)',
        letterSpacing: '.6px',
      }}>
        RÉSULTATS
      </div>
      {panels.map(panel => {
        const PanelComp = panel.component
        return (
          <div key={panel.id} style={{ flex:1, overflowY:'auto' }}>
            <PanelComp results={results} components={components}/>
          </div>
        )
      })}
    </aside>
  )
}

const panelStyle = {
  width:         200,
  background:    'var(--lb-surface)',
  borderLeft:    '1px solid var(--lb-border)',
  display:       'flex',
  flexDirection: 'column',
  flexShrink:    0,
}