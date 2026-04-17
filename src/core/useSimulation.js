import { useEffect, useRef, useCallback } from 'react'
import { bridge } from './SimulationBridge'
import { useSimStore } from '../store/useSimStore'
import { useAppStore }  from '../store/useAppStore'

/**
 * Hook principal de simulation.
 * Branche le store sur le bridge Worker.
 * À utiliser une seule fois, au niveau App.
 */
export function useSimulation() {
  const { components, isRunning, setResults } = useSimStore()
  const { fidelity }                           = useAppStore()
  const runningRef = useRef(false)
  const debounceRef = useRef(null)

  // Écouter les événements du bridge
  useEffect(() => {
    const offReady = bridge.on('ready', ({ version }) => {
      console.log(`[LuxLab] Moteur WASM prêt — v${version}`)
    })
    const offError = bridge.on('error', ({ error, code }) => {
      if (error !== 'cancelled') {
        console.warn(`[LuxLab] Erreur moteur [${code}]:`, error)
      }
    })
    return () => { offReady(); offError() }
  }, [])

  // Lancer la simulation quand composants changent (si active)
  const runSim = useCallback(async () => {
    if (!isRunning || !bridge.isReady) return

    const options = buildOptions(fidelity)

    try {
      const result = await bridge.runSimulation(components, options)
      setResults(result)
    } catch (err) {
      if (err.message !== 'cancelled') {
        console.warn('[LuxLab] Simulation échouée:', err.message)
      }
    }
  }, [components, isRunning, fidelity, setResults])

  // Debounce : relancer la sim 80ms après le dernier changement
  useEffect(() => {
    if (!isRunning) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(runSim, 80)
    return () => clearTimeout(debounceRef.current)
  }, [components, isRunning, runSim])

  // Lancer / arrêter la simulation
  const toggleSim = useCallback(() => {
    const { toggleSim: storeToggle } = useSimStore.getState()
    storeToggle()
  }, [])

  return { toggleSim, runSim }
}

// ─── Options selon le niveau de fidélité ─────────────────────────

function buildOptions(fidelity) {
  const presets = {
    fast:     { numRays: 3,  rayLength: 1200, aberrations: false },
    standard: { numRays: 7,  rayLength: 1200, aberrations: false },
    precise:  { numRays: 15, rayLength: 1200, aberrations: true  },
    max:      { numRays: 31, rayLength: 1200, aberrations: true  },
  }
  return presets[fidelity] || presets.standard
}