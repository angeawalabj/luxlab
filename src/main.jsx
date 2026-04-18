import { StrictMode, useState } from 'react'
import { createRoot }           from 'react-dom/client'
import './index.css'
import SplashScreen             from './ui/SplashScreen'
import Layout                   from './ui/Layout'
import { loadAll }              from './core/loader/pluginLoader'

async function bootstrap() {
  await loadAll()

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Root/>
    </StrictMode>
  )
}

function Root() {
  const [ready, setReady] = useState(false)

  return (
    <>
      {!ready && <SplashScreen onDone={() => setReady(true)}/>}
      {ready  && <Layout/>}
    </>
  )
}

bootstrap()