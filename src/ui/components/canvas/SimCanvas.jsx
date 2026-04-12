import { useRef, useEffect, useState } from 'react'
import { useSimStore } from '../../../store/useSimStore'
import { useAppStore } from '../../../store/useAppStore'

const MODULE_COLORS = {
  geo: '#f59e0b', wave: '#06b6d4', quant: '#7c3aed',
  nuc: '#ef4444', spec: '#10b981', em: '#f97316',
}

const ICONS = {
  source: '✦', lens: '◎', mirror: '⌒', prism: '▽',
  screen: '▪', blocker: '▬', slit2: '⫿', grating: '|||',
  polarizer: '↕', halfwave: '◫', beamsplit: '⊡',
  photon1: 'ψ', entangle: '⊗', gamma: 'γ', alpha: 'α',
  dosimeter: '▣', shield: '⬛', fiber: '〜',
}

function wavelengthToColor(wl) {
  if (wl < 380) return '#8b00ff'
  if (wl < 440) return `hsl(${280 + (wl - 380) * 0.4}, 100%, 60%)`
  if (wl < 490) return `hsl(${240 + (wl - 440) * 0.8}, 100%, 60%)`
  if (wl < 510) return `hsl(${180 + (wl - 490) * 3}, 100%, 50%)`
  if (wl < 580) return `hsl(${120 - (wl - 510) * 1.7}, 100%, 45%)`
  if (wl < 645) return `hsl(${30 - (wl - 580) * 0.46}, 100%, 50%)`
  return `hsl(0, 100%, ${Math.max(30, 50 - (wl - 645) * 0.15)}%)`
}

export default function SimCanvas() {
  const canvasRef = useRef(null)
  const { components, addComponent, updateComponent, isRunning } = useSimStore()
  const { selectedComponentId, setSelectedComponent, zoom, setZoom } = useAppStore()
  const [dragging, setDragging] = useState(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Dessin des rayons sur canvas 2D
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    if (!isRunning) return

    const source = components.find(c => c.type === 'source')
    const lenses = components.filter(c => c.type === 'lens')
    const screens = components.filter(c => c.type === 'screen')
    if (!source) return

    const wl = source.params?.wavelength || 550
    const color = wavelengthToColor(wl)

    ctx.shadowBlur = 6
    ctx.shadowColor = color

    // Tracé de 5 rayons parallèles
    for (let i = -2; i <= 2; i++) {
      const y0 = source.y + i * 12
      let x = source.x + 30
      let y = y0
      let angle = 0

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.2
      ctx.globalAlpha = 0.75

      // Interaction avec chaque lentille
      let sortedLenses = [...lenses].sort((a, b) => a.x - b.x)
      for (const lens of sortedLenses) {
        if (lens.x > x) {
          ctx.lineTo(lens.x, y + (lens.x - x) * Math.tan(angle))
          x = lens.x
          y = y + (lens.x - x) * Math.tan(angle)
          const f = lens.params?.focalLength || 50
          const h = y - lens.y
          angle = angle - h / f
        }
      }

      // Jusqu'au premier écran ou bord
      const screen = screens[0]
      const xEnd = screen ? screen.x : 800
      ctx.lineTo(xEnd, y + (xEnd - x) * Math.tan(angle))
      ctx.stroke()
    }

    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }, [components, isRunning])

  // Drop depuis sidebar
  const handleDrop = (e) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/luxlab')
    if (!raw) return
    const comp = JSON.parse(raw)
    const rect = e.currentTarget.getBoundingClientRect()
    addComponent({
      ...comp,
      x: Math.round((e.clientX - rect.left) / zoom),
      y: Math.round((e.clientY - rect.top) / zoom),
      params: getDefaultParams(comp.type),
    })
  }

  const handleDragOver = (e) => e.preventDefault()

  // Déplacement d'un composant
  const handleMouseDown = (e, id) => {
    e.stopPropagation()
    setSelectedComponent(id)
    const comp = components.find(c => c.id === id)
    setDragging(id)
    setOffset({
      x: e.clientX - comp.x,
      y: e.clientY - comp.y,
    })
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    updateComponent(dragging, {
      x: Math.round(e.clientX - offset.x),
      y: Math.round(e.clientY - offset.y),
    })
  }

  const handleMouseUp = () => setDragging(null)

  // Zoom molette
  const handleWheel = (e) => {
    e.preventDefault()
    setZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1))
  }

  return (
    <div
      style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--lb-bg)' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={() => setSelectedComponent(null)}
    >
      {/* Grille */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(var(--lb-border) 1px, transparent 1px),
          linear-gradient(90deg, var(--lb-border) 1px, transparent 1px)`,
        backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
        opacity: 0.3, pointerEvents: 'none',
      }}/>

      {/* Canvas rayons */}
      <canvas
        ref={canvasRef}
        width={2000} height={1200}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Composants */}
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
        {components.map(comp => (
          <SimComponent
            key={comp.id}
            comp={comp}
            selected={selectedComponentId === comp.id}
            onMouseDown={(e) => handleMouseDown(e, comp.id)}
          />
        ))}
      </div>

      {/* Toolbar flottante */}
      <div style={{
        position: 'absolute', top: 12,
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--lb-panel)',
        border: '1px solid var(--lb-border)',
        borderRadius: 8, padding: '5px 8px',
      }}>
        {['▲','✥',null,'+','−',null,'⊞','⟵',null,'↩','↪'].map((btn, i) =>
          btn === null
            ? <div key={i} style={{ width: 1, height: 20, background: 'var(--lb-border)', margin: '0 3px' }}/>
            : <button key={i} style={{
                width: 28, height: 28, borderRadius: 4,
                border: '1px solid transparent', background: 'transparent',
                color: 'var(--lb-muted)', cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1e2d45'; e.currentTarget.style.color = 'var(--lb-text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--lb-muted)' }}
              onClick={() => btn === '+' ? setZoom(zoom + 0.1) : btn === '−' ? setZoom(zoom - 0.1) : null}
            >{btn}</button>
        )}
      </div>

      {/* Hint si vide */}
      {components.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', color: 'var(--lb-muted)', fontSize: 12, pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: .3 }}>✦</div>
          Glisse un composant depuis la sidebar
        </div>
      )}

      {/* Info bas gauche */}
      {components.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'var(--lb-panel)', border: '1px solid var(--lb-border)',
          borderRadius: 8, padding: '8px 14px', fontSize: 10, color: 'var(--lb-muted)',
        }}>
          <div style={{ color: 'var(--lb-accent)', fontWeight: 600, marginBottom: 3 }}>
            {isRunning ? '● Simulation active' : '○ Simulation en pause'}
          </div>
          {(() => {
            const src = components.find(c => c.type === 'source')
            return src ? `λ = ${src.params?.wavelength || 550} nm` : 'Ajoute une source lumineuse'
          })()}
        </div>
      )}
    </div>
  )
}

function SimComponent({ comp, selected, onMouseDown }) {
  const color = MODULE_COLORS[comp.module] || '#64748b'
  const icon = ICONS[comp.type] || '?'
  const isLens = comp.type === 'lens'
  const isScreen = comp.type === 'screen' || comp.type === 'dosimeter'

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: comp.x, top: comp.y,
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4,
        cursor: 'grab', userSelect: 'none',
      }}
    >
      <div style={{
        ...(isLens
          ? { width: 14, height: 60, borderRadius: 7 }
          : isScreen
          ? { width: 10, height: 80, borderRadius: 2 }
          : { width: 44, height: 44, borderRadius: 8, fontSize: 18 }
        ),
        background: `${color}22`,
        border: `1.5px solid ${selected ? 'var(--lb-accent)' : color}`,
        color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? `0 0 0 2px var(--lb-accent)` : `0 0 8px ${color}44`,
        transition: 'box-shadow .15s',
      }}>
        {!isLens && !isScreen && icon}
      </div>
      <div style={{ fontSize: 9, color: 'var(--lb-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
        {comp.label}
        {comp.params?.wavelength && (
          <div style={{ color: wavelengthToColor(comp.params.wavelength) }}>
            λ={comp.params.wavelength}nm
          </div>
        )}
      </div>
    </div>
  )
}

function getDefaultParams(type) {
  const defaults = {
    source:     { wavelength: 550, intensity: 1.0, polarization: 'none', coherence: 'high' },
    lens:       { focalLength: 50, diameter: 40, material: 'BK7', refractiveIndex: 1.52 },
    mirror:     { radius: 100, angle: 0 },
    prism:      { apexAngle: 60, refractiveIndex: 1.52 },
    screen:     { width: 30, height: 80, sensitivity: 1.0 },
    polarizer:  { angle: 0, transmittance: 1.0 },
    slit2:      { separation: 0.5, width: 0.1 },
    grating:    { spacing: 600, order: 1 },
    gamma:      { energy: 1.25, activity: 1e6 },
    dosimeter:  { sensitivity: 1.0 },
  }
  return defaults[type] || {}
}