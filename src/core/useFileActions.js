import { saveLux, openLuxFile } from './formats/lux'
import { exportPDF }            from './formats/exportPDF'
import { useSimStore }          from '../store/useSimStore'
import { useAppStore }          from '../store/useAppStore'

export function useFileActions() {
  const simStore = useSimStore()
  const appStore = useAppStore()

  // ─── Nouveau projet ───────────────────────────────────────────

  const newProject = () => {
    if (simStore.components.length > 0) {
      const ok = window.confirm(
        'Créer un nouveau projet ? Les modifications non sauvegardées seront perdues.'
      )
      if (!ok) return
    }
    simStore.setComponents([])
    simStore.clearResults()
    if (simStore.isRunning) simStore.toggleSim()
  }

  // ─── Sauvegarder ─────────────────────────────────────────────

  const save = async (meta = {}) => {
    try {
      const state = {
        components:  simStore.components,
        connections: [],
        zoom:        appStore.zoom,
        pan:         appStore.pan,
        fidelity:    appStore.fidelity,
      }
      const result = await saveLux(state, meta)
      if (result.success) {
        console.log(`[LuxLab] Projet sauvegardé : ${result.filename}`)
      }
      return result
    } catch (err) {
      console.error('[LuxLab] Erreur sauvegarde :', err.message)
      throw err
    }
  }

  // ─── Ouvrir ───────────────────────────────────────────────────

  const open = async () => {
    try {
      const result = await openLuxFile()
      if (!result) return null

      const { doc, missingPlugins } = result

      if (missingPlugins.length > 0) {
        const names = missingPlugins.map(p => p.id).join(', ')
        const ok    = window.confirm(
          `Ce projet nécessite des plugins non installés :\n${names}\n\n` +
          `Ouvrir quand même ? Les composants concernés seront marqués "plugin manquant".`
        )
        if (!ok) return null
      }

      if (doc._hashWarning) {
        console.warn('[LuxLab] Ce fichier a été modifié depuis sa dernière sauvegarde.')
      }

      // Appliquer l'état
      simStore.setComponents(doc.components || [])
      if (doc.canvas?.zoom) appStore.setZoom(doc.canvas.zoom)
      if (doc.canvas?.pan)  appStore.setPan(doc.canvas.pan)
      if (doc.settings?.fidelity) appStore.setFidelity(doc.settings.fidelity)
      simStore.clearResults()
      if (simStore.isRunning) simStore.toggleSim()

      console.log(`[LuxLab] Projet ouvert : ${doc.meta?.title}`)
      return doc

    } catch (err) {
      console.error('[LuxLab] Erreur ouverture :', err.message)
      alert('Erreur lors de l\'ouverture du fichier : ' + err.message)
      throw err
    }
  }

  // ─── Export PDF ───────────────────────────────────────────────

  const exportReport = async () => {
    try {
      await exportPDF(
        simStore.components,
        simStore.results,
        { title: 'Simulation LuxLab' }
      )
    } catch (err) {
      console.error('[LuxLab] Erreur export PDF :', err.message)
      alert('Erreur lors de l\'export PDF : ' + err.message)
    }
  }

const clearCanvas = () => {
  if (!window.confirm('Effacer tous les composants du canvas ?')) return
  simStore.setComponents([])
  simStore.clearResults()
  clearSession()
  if (simStore.isRunning) simStore.toggleSim()
}

return { newProject, save, open, exportReport, clearCanvas }
}