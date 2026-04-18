import { StrictMode, useState, useEffect } from 'react'
import { createRoot }                       from 'react-dom/client'
import './index.css'
import SplashScreen                         from './ui/SplashScreen'
import { bridge }                           from './core/SimulationBridge'
import { loadAll }                          from './core/loader/pluginLoader'
import { registry }                         from './core/plugin-api'

async function bootstrap() {
  // 1. Charger les plugins
  await loadAll()

  // 2. Test en dev
  if (import.meta.env.DEV) {
    console.group('[LuxLab] Tests bootstrap')

    // Registry
    const comps = registry.getAllComponents()
    console.log(`✓ ${comps.length} composants enregistrés :`,
      comps.map(c => c.type).join(', '))

    const engine = registry.getEngineFor([{ type: 'source' }])
    console.log(`✓ Moteur trouvé :`, engine?.id)

    const templates = registry.getAllTemplates()
    console.log(`✓ ${templates.length} templates :`,
      templates.map(t => t.title).join(', '))

    const exps = registry.getAllExperiences()
    console.log(`✓ ${exps.length} expériences :`,
      exps.map(e => e.title).join(', '))

    // Worker
    bridge.on('ready', async ({ version }) => {
      console.log(`✓ Moteur WASM v${version} prêt`)

      const result = await bridge.runSimulation([
        { id:'src-1', type:'source', x:80,  y:220,
          params:{ wavelength:550, intensity:1.0 } },
        { id:'l-1',   type:'lens',   x:280, y:220,
          params:{ focalLength:50, material:'BK7' } },
        { id:'scr-1', type:'screen', x:520, y:220,
          params:{ height:80 } },
      ], { numRays: 7 })

      console.log(`✓ Simulation : ${result.rays?.length} rayons,`,
        `${result.images?.length} image(s) conjuguée(s)`)

      console.groupEnd()
    })
  }

  // 3. Monter React
  createRoot(document.getElementById('root')).render(
    <StrictMode><AppRoot /></StrictMode>
  )
}

function AppRoot() {
  const [splashDone, setSplashDone] = useState(false)
  const [status, setStatus]         = useState('initialisation...')

  useEffect(() => {
    bridge.on('ready', ({ version }) =>
      setStatus(`moteur v${version} — ${registry.getAllComponents().length} composants`)
    )
  }, [])

  return (
    <>
      {!splashDone && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}
      {splashDone && (
        <div style={{ padding: 32, color: 'var(--lb-text)' }}>
          <div style={{
            fontSize: 18, fontWeight: 700,
            marginBottom: 8,
          }}>
            LuxLab
          </div>
          <code style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--lb-muted)',
          }}>
            {'>'} {status}
          </code>
        </div>
      )}
    </>
  )
}

bootstrap()