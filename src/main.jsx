import { StrictMode, useState, useEffect } from 'react'
import { createRoot }                       from 'react-dom/client'
import './index.css'
import SplashScreen                         from './ui/SplashScreen'
import { bridge }                           from './core/SimulationBridge'

// ─── Test moteur ──────────────────────────────────────────────────

async function testWorker() {
  return new Promise((resolve) => {
    bridge.on('ready', async ({ version }) => {
      console.log(`✓ Worker prêt — moteur v${version}`)

      try {
        const result = await bridge.runSimulation([
          {
            id: 'src-1', type: 'source',
            x: 80, y: 220,
            params: { wavelength: 550, intensity: 1.0 }
          },
          {
            id: 'lens-1', type: 'lens',
            x: 280, y: 220,
            params: { focalLength: 50, diameter: 40, material: 'BK7' }
          },
          {
            id: 'screen-1', type: 'screen',
            x: 520, y: 220,
            params: { height: 80 }
          },
        ], { numRays: 7 })

        console.log(`✓ Simulation OK — ${result.rays.length} rayons en ${result.durationMs?.toFixed(1)}ms`)
        console.log(`✓ Images conjuguées:`, result.images.length)
        if (result.images[0]) {
          console.log(`  → m = ${result.images[0].magnification.toFixed(3)}, réelle = ${result.images[0].real}`)
        }

        const color = await bridge.getWavelengthColor(632)
        console.log(`✓ λ=632nm →`, color)

      } catch (err) {
        console.error('✗ Test échoué:', err.message)
      }

      resolve()
    })
  })
}

// ─── App ──────────────────────────────────────────────────────────

function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [engineStatus, setEngineStatus] = useState('initialisation...')

  useEffect(() => {
    bridge.on('ready', ({ version }) => {
      setEngineStatus(`moteur v${version} prêt`)
    })
    bridge.on('error', ({ error }) => {
      setEngineStatus(`erreur : ${error}`)
    })
    // Lancer le test en dev
    if (import.meta.env.DEV) testWorker()
  }, [])

  return (
    <>
      {!splashDone && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}
      {splashDone && (
        <div style={{
          padding: '32px',
          color: 'var(--lb-text)',
          fontFamily: 'var(--font-ui)',
        }}>
          <h2 style={{ marginBottom: 12 }}>LuxLab</h2>
          <code style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--lb-muted)',
          }}>
            {'>'} {engineStatus}
          </code>
          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--lb-hint)' }}>
            Ouvre la console (F12) pour voir les résultats du test moteur.
          </p>
        </div>
      )}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)