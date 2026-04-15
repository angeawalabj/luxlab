import { StrictMode, useState } from 'react'
import { createRoot }           from 'react-dom/client'
import './index.css'
import SplashScreen             from './ui/SplashScreen'

function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {splashDone && (
        <div style={{ padding: 20, color: 'var(--lb-text)' }}>
          LuxLab — moteur prêt
        </div>
      )}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)