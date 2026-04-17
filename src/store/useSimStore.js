import { create } from 'zustand'

export const useSimStore = create((set, get) => ({

  // ─── Canvas ─────────────────────────────────────────────────────
  components:  [],
  connections: [],
  selectedIds: [],

  // ─── Simulation ─────────────────────────────────────────────────
  isRunning:   false,
  results:     {},

  // ─── Actions composants ──────────────────────────────────────────

  addComponent: (comp) => set(s => ({
    components: [
      ...s.components,
      { id: `${comp.type}-${Date.now()}`, ...comp }
    ]
  })),

  updateComponent: (id, patch) => set(s => ({
    components: s.components.map(c => c.id === id ? { ...c, ...patch } : c)
  })),

  updateParam: (id, key, value) => set(s => ({
    components: s.components.map(c =>
      c.id === id ? { ...c, params: { ...c.params, [key]: value } } : c
    )
  })),

  removeComponent: (id) => set(s => ({
    components: s.components.filter(c => c.id !== id),
    selectedIds: s.selectedIds.filter(sid => sid !== id),
  })),

  setComponents:   (comps) => set({ components: comps }),
  setSelectedIds:  (ids)   => set({ selectedIds: ids }),

  // ─── Actions simulation ──────────────────────────────────────────

  toggleSim: () => set(s => ({ isRunning: !s.isRunning, results: {} })),
  setResults: (results) => set({ results }),
  clearResults: () => set({ results: {} }),
}))