import { create } from 'zustand'

export const useAppStore = create((set, get) => ({

  // ─── Panneaux ────────────────────────────────────────────────────
  sidebarOpen:      true,
  propsPanelOpen:   true,
  resultsPanelOpen: true,
  focusMode:        false,

  toggleSidebar:       () => set(s => ({ sidebarOpen:      !s.sidebarOpen })),
  togglePropsPanel:    () => set(s => ({ propsPanelOpen:   !s.propsPanelOpen })),
  toggleResultsPanel:  () => set(s => ({ resultsPanelOpen: !s.resultsPanelOpen })),
  toggleFocusMode:     () => set(s => ({ focusMode:        !s.focusMode })),

  // ─── Canvas ──────────────────────────────────────────────────────
  zoom: 1.0,
  pan:  { x: 0, y: 0 },

  setZoom: (z) => set({ zoom: Math.min(Math.max(z, 0.15), 5.0) }),
  setPan:  (p) => set({ pan: p }),

  // ─── Sélection ───────────────────────────────────────────────────
  selectedId: null,
  setSelected: (id) => set({ selectedId: id }),

  // ─── Simulation ──────────────────────────────────────────────────
  fidelity: 'standard',
  setFidelity: (f) => set({ fidelity: f }),

  // ─── Collab ──────────────────────────────────────────────────────
  collabOpen: false,
  toggleCollab: () => set(s => ({ collabOpen: !s.collabOpen })),
}))