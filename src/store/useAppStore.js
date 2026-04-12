import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // Mode actif
  mode: 'pro', // 'etudiant' | 'pro' | 'recherche' | 'tp'
  setMode: (mode) => set({ mode }),

  // Modules physiques activés
  activeModules: ['geo', 'wave'],
  toggleModule: (mod) => set((s) => ({
    activeModules: s.activeModules.includes(mod)
      ? s.activeModules.filter(m => m !== mod)
      : [...s.activeModules, mod]
  })),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Panneau propriétés
  propsPanelOpen: true,

  // Composant sélectionné
  selectedComponentId: null,
  setSelectedComponent: (id) => set({ selectedComponentId: id }),

  // Collaboration
  collabOpen: false,
  toggleCollab: () => set((s) => ({ collabOpen: !s.collabOpen })),

  // Zoom canvas
  zoom: 1,
  setZoom: (z) => set({ zoom: Math.min(Math.max(z, 0.2), 4) }),
}))