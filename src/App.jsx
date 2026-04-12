import { useSimStore } from './store/useSimStore'
import TopBar from './ui/components/toolbar/TopBar'
import Sidebar from './ui/components/sidebar/Sidebar'
import SimCanvas from './ui/components/canvas/SimCanvas'
import PropsPanel from './ui/components/panels/PropsPanel'

export default function App() {
  const { sidebarOpen, propsPanelOpen } = useAppStore()

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--lb-bg)',
      overflow: 'hidden',
    }}>
      <TopBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebarOpen && <Sidebar />}
        <SimCanvas />
        {propsPanelOpen && <PropsPanel />}
      </div>

      <StatusBar />
    </div>
  )
}

function StatusBar() {
  const { mode, zoom } = useAppStore()
  const { components, isRunning } = useSimStore()

  return (
    <div style={{
      height: 26,
      background: 'var(--lb-panel)',
      borderTop: '1px solid var(--lb-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: 16,
      fontSize: 10,
      color: 'var(--lb-muted)',
      flexShrink: 0,
    }}>
      <StatusItem dot={isRunning ? 'var(--lb-success)' : 'var(--lb-muted)'}>
        {isRunning ? 'Simulation active' : 'En pause'}
      </StatusItem>
      <StatusItem dot="var(--lb-accent)">Mode : {mode}</StatusItem>
      <StatusItem>Zoom : {Math.round(zoom * 100)}%</StatusItem>
      <StatusItem>{components.length} composants</StatusItem>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
        <StatusItem dot="var(--lb-success)">Offline ready</StatusItem>
        <StatusItem dot="var(--lb-accent2)">.lux v1.0</StatusItem>
      </div>
    </div>
  )
}

function StatusItem({ dot, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {dot && <div style={{
        width: 5, height: 5, borderRadius: '50%', background: dot
      }}/>}
      {children}
    </div>
  )
}