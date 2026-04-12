import { useState } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { useSimStore } from '../../../store/useSimStore'

const MODULES = [
  {
    id: 'geo', label: 'Géométrique', color: '#f59e0b',
    components: [
      { type: 'source',    icon: '✦', label: 'Source lumineuse' },
      { type: 'lens',      icon: '◎', label: 'Lentille mince' },
      { type: 'mirror',    icon: '⌒', label: 'Miroir courbe' },
      { type: 'prism',     icon: '▽', label: 'Prisme' },
      { type: 'screen',    icon: '▪', label: 'Détecteur' },
      { type: 'blocker',   icon: '▬', label: 'Obstacle' },
    ]
  },
  {
    id: 'wave', label: 'Ondulatoire', color: '#06b6d4',
    components: [
      { type: 'slit2',     icon: '⫿', label: 'Fentes de Young' },
      { type: 'grating',   icon: '|||', label: 'Réseau diffraction' },
      { type: 'polarizer', icon: '↕', label: 'Polariseur' },
      { type: 'halfwave',  icon: '◫', label: 'Lame demi-onde' },
      { type: 'beamsplit', icon: '⊡', label: 'Séparateur' },
    ]
  },
  {
    id: 'quant', label: 'Quantique', color: '#7c3aed',
    components: [
      { type: 'photon1',   icon: 'ψ', label: 'Photon unique' },
      { type: 'entangle',  icon: '⊗', label: 'Source intriquée' },
      { type: 'qdetector', icon: '⬡', label: 'Détecteur quantique' },
    ]
  },
  {
    id: 'nuc', label: 'Nucléaire', color: '#ef4444',
    components: [
      { type: 'gamma',     icon: 'γ', label: 'Source gamma' },
      { type: 'alpha',     icon: 'α', label: 'Source alpha' },
      { type: 'dosimeter', icon: '▣', label: 'Dosimètre' },
      { type: 'shield',    icon: '⬛', label: 'Blindage' },
    ]
  },
  {
    id: 'spec', label: 'Spectroscopie', color: '#10b981',
    components: [
      { type: 'spectrometer', icon: '≋', label: 'Spectromètre' },
      { type: 'filter',       icon: '⬜', label: 'Filtre spectral' },
    ]
  },
  {
    id: 'em', label: 'Électromagn.', color: '#f97316',
    components: [
      { type: 'waveguide', icon: '⇒', label: 'Guide d\'onde' },
      { type: 'fiber',     icon: '〜', label: 'Fibre optique' },
    ]
  },
]

export default function Sidebar() {
  const { activeModules, toggleModule } = useAppStore()
  const { addComponent } = useSimStore()
  const [open, setOpen] = useState(['geo', 'wave'])

  const toggle = (id) => setOpen(o => o.includes(id) ? o.filter(x => x !== id) : [...o, id])

  const handleDragStart = (e, comp, moduleId) => {
    e.dataTransfer.setData('application/luxlab', JSON.stringify({ ...comp, module: moduleId }))
  }

  return (
    <div style={{
      width: 200, background: 'var(--lb-panel)',
      borderRight: '1px solid var(--lb-border)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', flexShrink: 0,
    }}>
      {MODULES.map(mod => (
        <div key={mod.id} style={{ borderBottom: '1px solid var(--lb-border)' }}>
          <div
            onClick={() => toggle(mod.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 12px', cursor: 'pointer',
              userSelect: 'none', fontSize: 10,
              letterSpacing: '0.8px', color: 'var(--lb-muted)',
            }}
          >
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: activeModules.includes(mod.id) ? mod.color : 'var(--lb-border)',
              cursor: 'pointer', flexShrink: 0,
            }}
              onClick={(e) => { e.stopPropagation(); toggleModule(mod.id) }}
              title={activeModules.includes(mod.id) ? 'Désactiver module' : 'Activer module'}
            />
            {mod.label}
            <span style={{ marginLeft: 'auto', fontSize: 9 }}>
              {open.includes(mod.id) ? '▾' : '▸'}
            </span>
          </div>

          {open.includes(mod.id) && (
            <div style={{ padding: '2px 6px 8px' }}>
              {mod.components.map(comp => (
                <div
                  key={comp.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, comp, mod.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 8px', borderRadius: 4,
                    cursor: 'grab', fontSize: 11,
                    color: activeModules.includes(mod.id) ? 'var(--lb-text)' : 'var(--lb-muted)',
                    border: '1px solid transparent',
                    transition: 'all .1s', marginBottom: 2,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#1a2740'
                    e.currentTarget.style.borderColor = 'var(--lb-border)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 3,
                    background: `${mod.color}22`,
                    color: mod.color, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, flexShrink: 0,
                  }}>
                    {comp.icon}
                  </div>
                  {comp.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}