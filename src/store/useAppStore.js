import { create } from 'zustand'

export const useAppStore = create((set) => ({

  // ─── UI ──────────────────────────────────────────────────────────
  sidebarOpen:     true,
  propsPanelOpen:  true,
  resultsPanelOpen:true,
  focusMode:       false,

  toggleSidebar:      () => set(s => ({ sidebarOpen:      !s.sidebarOpen })),
  togglePropsPanel:   () => set(s => ({ propsPanelOpen:   !s.propsPanelOpen })),
  toggleResultsPanel: () => set(s => ({ resultsPanelOpen: !s.resultsPanelOpen })),
  toggleFocusMode:    () => set(s => ({ focusMode:        !s.focusMode })),

  // ─── Canvas ──────────────────────────────────────────────────────
  zoom: 1.0,
  pan:  { x: 0, y: 0 },

  setZoom: (z) => set({ zoom: Math.min(Math.max(z, 0.2), 4.0) }),
  setPan:  (p) => set({ pan: p }),

  // ─── Paramètres simulation ───────────────────────────────────────
  fidelity:      'standard',   // fast | standard | precise | max
  activePlugins: [],

  setFidelity:      (f)    => set({ fidelity: f }),
  setActivePlugins: (list) => set({ activePlugins: list }),

  // ─── Sélection composant ─────────────────────────────────────────
  selectedComponentId: null,
  setSelectedComponent: (id) => set({ selectedComponentId: id }),

  // ─── Collaboration ───────────────────────────────────────────────
  collabOpen: false,
  toggleCollab: () => set(s => ({ collabOpen: !s.collabOpen })),
}))