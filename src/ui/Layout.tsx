import { useAppStore }  from '../store/useAppStore'
import TopBar           from './components/toolbar/TopBar'
import Sidebar          from './components/sidebar/Sidebar'
import SimCanvas        from './components/canvas/SimCanvas'
import PropsPanel       from './components/panels/PropsPanel'
import ResultsPanel     from './components/panels/ResultsPanel'
import StatusBar        from './components/StatusBar'

export default function Layout() {
  const { sidebarOpen, propsPanelOpen, resultsPanelOpen } = useAppStore()

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        '100vh',
      background:    'var(--lb-bg)',
      overflow:      'hidden',
    }}>
      <TopBar/>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {sidebarOpen      && <Sidebar/>}
        <SimCanvas/>
        {resultsPanelOpen && <ResultsPanel/>}
        {propsPanelOpen   && <PropsPanel/>}
      </div>

      <StatusBar/>
    </div>
  )
}