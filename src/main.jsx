import { StrictMode, useState } from 'react'
import { createRoot }           from 'react-dom/client'
import './index.css'
import SplashScreen             from './ui/SplashScreen'
import Layout                   from './ui/Layout'
import { loadAll }              from './core/loader/pluginLoader'
import { registry }             from './core/plugin-api'
import {
  loadSession,
  loadPreferences,
} from './core/persistence'
import { useSimStore }          from './store/useSimStore'
import { useAppStore }          from './store/useAppStore'

async function bootstrap() {
  console.log('[Bootstrap] Démarrage...')

  // 1. Charger les plugins
  await loadAll()

  // 2. Restaurer les préférences UI
  const prefs = loadPreferences()
  if (prefs) {
    const appStore = useAppStore.getState()
    if (prefs.fidelity         !== undefined) appStore.setFidelity(prefs.fidelity)
    if (prefs.sidebarOpen      === false)     appStore.toggleSidebar()
    if (prefs.propsPanelOpen   === false)     appStore.togglePropsPanel()
    if (prefs.resultsPanelOpen === false)     appStore.toggleResultsPanel()
    console.log('[Bootstrap] Préférences restaurées')
  }

  // 3. Restaurer la session (composants sur le canvas)
  const session = loadSession()
  if (session?.components?.length > 0) {
    const simStore  = useSimStore.getState()
    const appStore  = useAppStore.getState()

    // Filtrer les composants dont le plugin est chargé
    const valid = session.components.filter(c => {
      const def = registry.getComponentDef(c.type)
      if (!def) {
        console.warn(`[Bootstrap] Composant ignoré (plugin manquant) : ${c.type}`)
        return false
      }
      return true
    })

    if (valid.length > 0) {
      simStore.setComponents(valid)
      if (session.zoom) appStore.setZoom(session.zoom)
      if (session.pan)  appStore.setPan(session.pan)
      if (session.fidelity) appStore.setFidelity(session.fidelity)
      console.log(`[Bootstrap] Session restaurée — ${valid.length} composants`)
    }
  }

  // 4. Monter React
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Root />
    </StrictMode>
  )
}

function Root() {
  const [ready, setReady] = useState(false)
  return (
    <>
      {!ready && <SplashScreen onDone={() => setReady(true)} />}
      {ready  && <Layout />}
    </>
  )
}

bootstrap()

// En bas du fichier, après bootstrap()
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('[LuxLab] Service Worker enregistré — mode offline activé')
    })
  })
}