import { StrictMode, useState } from 'react'
import { createRoot }           from 'react-dom/client'
import './index.css'
import SplashScreen             from './ui/SplashScreen'
import Layout                   from './ui/Layout'
import { loadAll }              from './core/loader/pluginLoader'
import { registry }             from './core/plugin-api'

async function bootstrap() {
  console.log('[Bootstrap] Démarrage...')

  try {
    await loadAll()
  } catch (err) {
    console.error('[Bootstrap] Erreur loadAll :', err)
  }

  console.log('[Bootstrap] Plugins chargés :',
    registry.getAll().map(p => p.id))
  console.log('[Bootstrap] Composants :',
    registry.getAllComponents().map(c => c.type))

  const root = document.getElementById('root')
  createRoot(root).render(
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