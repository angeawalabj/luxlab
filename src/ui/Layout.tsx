import { useEffect, useState }   from 'react'
import { useAppStore }            from '../store/useAppStore'
import { useSimStore }            from '../store/useSimStore'
import { useFileActions }         from '../core/useFileActions'
import TopBar                     from './components/toolbar/TopBar'
import Sidebar                    from './components/sidebar/Sidebar'
import SimCanvas                  from './components/canvas/SimCanvas'
import PropsPanel                 from './components/panels/PropsPanel'
import ResultsPanel               from './components/panels/ResultsPanel'
import StatusBar                  from './components/StatusBar'
import TemplateGallery            from './components/modals/TemplateGallery'
import ExperiencePanel            from './components/panels/ExperiencePanel'

export default function Layout() {
  const { sidebarOpen, propsPanelOpen,
          resultsPanelOpen, focusMode }    = useAppStore()
  const { toggleSim }                      = useSimStore()
  const { newProject, save, open }         = useFileActions()
  const [showTemplates, setShowTemplates]  = useState(false)
  const [activeExp,     setActiveExp]      = useState(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n': e.preventDefault(); newProject();    break
          case 'o': e.preventDefault(); open();          break
          case 's': e.preventDefault(); save();          break
          case 'Enter': e.preventDefault(); toggleSim(); break
        }
      }
      if (e.key === 'f' && e.target.tagName !== 'INPUT') {
        e.preventDefault()
        useAppStore.getState().toggleFocusMode()
      }
      if (e.key === 'Escape' && activeExp) {
        setActiveExp(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [newProject, save, open, toggleSim, activeExp])

  if (focusMode) {
    return (
      <div style={{ width:'100vw', height:'100vh', background:'var(--lb-bg)' }}>
        <SimCanvas/>
        <div style={{
          position:'absolute', bottom:8, right:8,
          fontSize:9, color:'var(--lb-hint)',
          fontFamily:'var(--font-mono)',
        }}>
          F — quitter le mode focus
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      height:'100vh', background:'var(--lb-bg)', overflow:'hidden',
    }}>
      <TopBar onOpenTemplates={() => setShowTemplates(true)}/>

      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>
        {sidebarOpen      && <Sidebar/>}
        <SimCanvas/>
        {resultsPanelOpen && <ResultsPanel/>}
        {propsPanelOpen   && <PropsPanel/>}

        {/* Panneau Expérience flottant sur le canvas */}
        {activeExp && (
          <ExperiencePanel
            experience={activeExp}
            onClose={() => setActiveExp(null)}
          />
        )}
      </div>

      <StatusBar/>

      {showTemplates && (
        <TemplateGallery
          onClose={() => setShowTemplates(false)}
          onLaunchExperience={(exp) => {
            setActiveExp(exp)
            setShowTemplates(false)
          }}
        />
      )}
    </div>
  )
}