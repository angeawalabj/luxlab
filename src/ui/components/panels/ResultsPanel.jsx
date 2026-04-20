import { useSimStore }  from '../../../store/useSimStore'
import { useAppStore }  from '../../../store/useAppStore'
import { registry }     from '../../../core/plugin-api'

export default function ResultsPanel() {
  const { results, components, isRunning } = useSimStore()
  const panels = registry.getAllPanels().filter(p => p.position === 'right')

  if (panels.length === 0) {
    return (
      <aside style={panelStyle}>
        <div style={emptyStyle}>Aucun plugin actif</div>
      </aside>
    )
  }

  return (
    <aside style={panelStyle}>
      <div style={headerStyle}>RÉSULTATS</div>

      {panels.map(panel => {
        const PanelComp = panel.component
        // Donner à chaque panneau les résultats + composants
        return (
          <div key={panel.id} style={{
            borderBottom: '1px solid var(--lb-border)',
          }}>
            <div style={sectionHeaderStyle}>
              {panel.icon} {panel.title}
            </div>
            <PanelComp
              results={results}
              components={components}
              isRunning={isRunning}
            />
          </div>
        )
      })}

      {!isRunning && components.length > 0 && (
        <div style={emptyStyle}>
          Clique ▶ Simuler pour voir les résultats
        </div>
      )}
    </aside>
  )
}

const panelStyle = {
  width:         220,
  background:    'var(--lb-surface)',
  borderLeft:    '1px solid var(--lb-border)',
  display:       'flex',
  flexDirection: 'column',
  flexShrink:    0,
  overflowY:     'auto',
}

const headerStyle = {
  padding:       '8px 14px',
  borderBottom:  '1px solid var(--lb-border)',
  fontSize:      9,
  fontWeight:    600,
  color:         'var(--lb-muted)',
  letterSpacing: '.6px',
  flexShrink:    0,
}

const sectionHeaderStyle = {
  padding:       '6px 14px 3px',
  fontSize:      9,
  letterSpacing: '.5px',
  color:         'var(--lb-hint)',
}

const emptyStyle = {
  padding:   16,
  fontSize:  10,
  color:     'var(--lb-hint)',
  textAlign: 'center',
}