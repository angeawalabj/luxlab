import { create }          from 'zustand'
import { savePreferences } from '../core/persistence'

let prefTimer = null
function debouncedSavePrefs(state) {
  clearTimeout(prefTimer)
  prefTimer = setTimeout(() => {
    savePreferences({
      fidelity:         state.fidelity,
      sidebarOpen:      state.sidebarOpen,
      propsPanelOpen:   state.propsPanelOpen,
      resultsPanelOpen: state.resultsPanelOpen,
    })
  }, 500)
}

export const useAppStore = create((set, get) => ({

  sidebarOpen:      true,
  propsPanelOpen:   true,
  resultsPanelOpen: true,
  focusMode:        false,

  toggleSidebar: () => set(s => {
    const next = { sidebarOpen: !s.sidebarOpen }
    debouncedSavePrefs({ ...s, ...next })
    return next
  }),
  togglePropsPanel: () => set(s => {
    const next = { propsPanelOpen: !s.propsPanelOpen }
    debouncedSavePrefs({ ...s, ...next })
    return next
  }),
  toggleResultsPanel: () => set(s => {
    const next = { resultsPanelOpen: !s.resultsPanelOpen }
    debouncedSavePrefs({ ...s, ...next })
    return next
  }),
  toggleFocusMode: () => set(s => ({ focusMode: !s.focusMode })),

  zoom: 1.0,
  pan:  { x: 0, y: 0 },

  setZoom: (z) => set({ zoom: Math.min(Math.max(z, 0.15), 5.0) }),
  setPan:  (p) => set({ pan: p }),

  selectedId:       null,
  setSelected:      (id) => set({ selectedId: id }),

  fidelity: 'standard',
  setFidelity: (f) => set(s => {
    const next = { fidelity: f }
    debouncedSavePrefs({ ...s, ...next })
    return next
  }),

  collabOpen:   false,
  toggleCollab: () => set(s => ({ collabOpen: !s.collabOpen })),

  // Paramètres de rendu (désactivables)
renderSettings: {
  hdr:          false,   // HDR + bloom (coûteux)
  bloom:        false,
  bloomStrength: 0.6,
  cie:          true,    // Conversion CIE (recommandé)
  glow:         true,    // Glow simple sur les rayons
  glowBlur:     4,
},
setRenderSettings: (patch) => set(s => ({
  renderSettings: { ...s.renderSettings, ...patch }
})),
}))