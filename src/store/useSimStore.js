import { create }       from 'zustand'
import { registry }     from '../core/plugin-api'
import { saveSession }  from '../core/persistence'

// Debounce pour ne pas sauvegarder à chaque frappe de slider
let saveTimer = null
function debouncedSave(state) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveSession(state), 800)
}

export const useSimStore = create((set, get) => ({

  components:  [],
  connections: [],
  isRunning:   false,
  results:     {},

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
    set(s => {
      const next = { components: [...s.components, comp] }
      debouncedSave({ ...s, ...next })
      return next
    })
  },

  updateComponent: (id, patch) => set(s => {
    const next = {
      components: s.components.map(c =>
        c.id === id ? { ...c, ...patch } : c
      )
    }
    debouncedSave({ ...s, ...next })
    return next
  }),

  updateParam: (id, key, value) => {
    set(s => {
      const next = {
        components: s.components.map(c =>
          c.id === id
            ? { ...c, params: { ...c.params, [key]: value } }
            : c
        )
      }
      debouncedSave({ ...s, ...next })
      return next
    })
    registry.fireHook('paramChange', { id, key, value })
  },

  removeComponent: (id) => {
    const comp = get().components.find(c => c.id === id)
    registry.fireHook('componentRemove', comp)
    set(s => {
      const next = {
        components: s.components.filter(c => c.id !== id),
      }
      debouncedSave({ ...s, ...next })
      return next
    })
  },

  setComponents: (comps) => set(s => {
    const next = { components: comps }
    debouncedSave({ ...s, ...next })
    return next
  }),

  toggleSim: () => {
    const next = !get().isRunning
    set({ isRunning: next, results: next ? get().results : {} })
    registry.fireHook(next ? 'simStart' : 'simStop', get().components)
  },

  setResults:   (r) => set({ results: r }),
  clearResults: ()  => set({ results: {} }),
}))