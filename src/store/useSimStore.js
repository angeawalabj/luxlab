import { create } from 'zustand'
import { registry } from '../core/plugin-api'

export const useSimStore = create((set, get) => ({

  components:  [],
  connections: [],
  isRunning:   false,
  results:     {},

  // ─── Composants ──────────────────────────────────────────────────

  addComponent: (typeDef, x, y) => {
    const def = registry.getComponentDef(typeDef.type)
    if (!def) {
      console.warn(`[Store] Composant inconnu : ${typeDef.type}`)
      return
    }
    const comp = {
      id:       `${typeDef.type}-${Date.now()}`,
      type:     typeDef.type,
      pluginId: def.pluginId,
      moduleId: def.moduleId,
      label:    def.label,
      x:        Math.round(x),
      y:        Math.round(y),
      params:   { ...def.defaultParams, ...(typeDef.params || {}) },
    }
    registry.fireHook('componentAdd', comp)
    set(s => ({ components: [...s.components, comp] }))
  },

  updateComponent: (id, patch) => set(s => ({
    components: s.components.map(c =>
      c.id === id ? { ...c, ...patch } : c
    )
  })),

  updateParam: (id, key, value) => {
    set(s => ({
      components: s.components.map(c =>
        c.id === id
          ? { ...c, params: { ...c.params, [key]: value } }
          : c
      )
    }))
    registry.fireHook('paramChange', { id, key, value })
  },

  removeComponent: (id) => {
    const comp = get().components.find(c => c.id === id)
    registry.fireHook('componentRemove', comp)
    set(s => ({
      components:  s.components.filter(c => c.id !== id),
    }))
  },

  setComponents: (comps) => set({ components: comps }),

  // ─── Simulation ──────────────────────────────────────────────────

  toggleSim: () => {
    const next = !get().isRunning
    set({ isRunning: next, results: next ? get().results : {} })
    registry.fireHook(next ? 'simStart' : 'simStop', get().components)
  },

  setResults:   (r) => set({ results: r }),
  clearResults: ()  => set({ results: {} }),
}))