import { create } from 'zustand'

const defaultComponents = [
  {
    id: 'src-1',
    type: 'source',
    module: 'geo',
    label: 'Source lumineuse',
    x: 80,
    y: 180,
    params: {
      wavelength: 550,
      intensity: 1.0,
      polarization: 'none',
      coherence: 'high',
    }
  },
  {
    id: 'lens-1',
    type: 'lens',
    module: 'geo',
    label: 'Lentille L₁',
    x: 280,
    y: 180,
    params: {
      focalLength: 50,
      diameter: 40,
      material: 'BK7',
      refractiveIndex: 1.52,
    }
  },
  {
    id: 'screen-1',
    type: 'screen',
    module: 'geo',
    label: 'Écran détecteur',
    x: 500,
    y: 180,
    params: {
      width: 30,
      height: 80,
      sensitivity: 1.0,
    }
  },
]

export const useSimStore = create((set, get) => ({
  components: defaultComponents,
  connections: [],
  isRunning: false,
  results: {},
  setResults: (res) => set({ results: res }),

  // Ajouter un composant
  addComponent: (comp) => set((s) => ({
    components: [...s.components, { ...comp, id: `${comp.type}-${Date.now()}` }]
  })),

  // Mettre à jour un composant
  updateComponent: (id, patch) => set((s) => ({
    components: s.components.map(c => c.id === id ? { ...c, ...patch } : c)
  })),

  // Mettre à jour un paramètre
  updateParam: (id, key, value) => set((s) => ({
    components: s.components.map(c =>
      c.id === id ? { ...c, params: { ...c.params, [key]: value } } : c
    )
  })),

  // Supprimer un composant
  removeComponent: (id) => set((s) => ({
    components: s.components.filter(c => c.id !== id)
  })),

  // Lancer / arrêter la simulation
  toggleSim: () => set((s) => ({ isRunning: !s.isRunning })),
}))