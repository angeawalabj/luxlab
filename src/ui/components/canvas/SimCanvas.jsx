import { useRef, useEffect, useState, useCallback } from 'react'
import { useSimStore }  from '../../../store/useSimStore'
import { useAppStore }  from '../../../store/useAppStore'
import { registry }     from '../../../core/plugin-api'
import { bridge }       from '../../../core/SimulationBridge'

const MODULE_COLORS = {
  '@luxlab/geo-optics':   'var(--lb-geo)',
  '@luxlab/wave-optics':  'var(--lb-wave)',
  '@luxlab/quantum':      'var(--lb-quant)',
  '@luxlab/nuclear':      'var(--lb-nuc)',
  '@luxlab/spectroscopy': 'var(--lb-spec)',
  '@luxlab/em':           'var(--lb-em)',
}

export default function SimCanvas() {
  const canvasRef    = useRef(null)
  const containerRef = useRef(null)
  const [size, setSize] = useState({ w:1200, h:800 })

  const {
    components, addComponent, updateComponent,
    isRunning, results, setResults,
  } = useSimStore()

  const {
    zoom, setZoom, pan, setPan,
    selectedId, setSelected,
    fidelity,
  } = useAppStore()

  const dragging = useRef(null)
  const dragOffset = useRef({ x:0, y:0 })
  const isPanning  = useRef(false)
  const panStart   = useRef({ mx:0, my:0, px:0, py:0 })

  // ─── Resize observer ─────────────────────────────────────────────
  useEffect(() => {
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setSize({ w: Math.round(width), h: Math.round(height) })
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // ─── Rendu WASM → Canvas2D ───────────────────────────────────────
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    cvs.width  = size.w
    cvs.height = size.h
    const ctx  = cvs.getContext('2d')
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    if (!isRunning || !results?.rays) return

    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    const engine = registry.getEngineFor(components)
    if (engine?.renderResult) engine.renderResult(ctx, results)

    ctx.restore()
  }, [results, isRunning, size, zoom, pan, components])

  // ─── Lancer la simulation automatiquement ────────────────────────
  useEffect(() => {
    if (!isRunning) return
    const opts = buildOptions(fidelity)

    bridge.runSimulation(components, opts)
      .then(result => setResults(result))
      .catch(err => {
        if (err.message !== 'cancelled')
          console.warn('[Canvas] Simulation:', err.message)
      })
  }, [components, isRunning, fidelity])

  // ─── Drop depuis sidebar ─────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/luxlab')
    if (!raw) return
    const def  = JSON.parse(raw)
    const rect = containerRef.current.getBoundingClientRect()
    const x    = (e.clientX - rect.left - pan.x) / zoom
    const y    = (e.clientY - rect.top  - pan.y) / zoom
    addComponent(def, x, y)
  }, [zoom, pan, addComponent])

  // ─── Drag composant ──────────────────────────────────────────────
  const startDrag = useCallback((e, id) => {
    e.stopPropagation()
    setSelected(id)
    const comp = useSimStore.getState().components.find(c => c.id === id)
    dragging.current  = id
    dragOffset.current = {
      x: e.clientX - comp.x * zoom - pan.x,
      y: e.clientY - comp.y * zoom - pan.y,
    }
  }, [zoom, pan, setSelected])

  const handleMouseMove = useCallback((e) => {
    if (dragging.current) {
      updateComponent(dragging.current, {
        x: Math.round((e.clientX - dragOffset.current.x - pan.x) / zoom),
        y: Math.round((e.clientY - dragOffset.current.y - pan.y) / zoom),
      })
      return
    }
    if (isPanning.current) {
      setPan({
        x: panStart.current.px + (e.clientX - panStart.current.mx),
        y: panStart.current.py + (e.clientY - panStart.current.my),
      })
    }
  }, [zoom, pan, updateComponent, setPan])

  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true
      panStart.current  = { mx:e.clientX, my:e.clientY, px:pan.x, py:pan.y }
    }
  }, [pan])

  const handleMouseUp = useCallback(() => {
    dragging.current  = null
    isPanning.current = false
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta  = e.deltaY > 0 ? -0.08 : 0.08
    setZoom(zoom + delta)
  }, [zoom, setZoom])

  const handleKeyDown = useCallback((e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      useSimStore.getState().removeComponent(selectedId)
      setSelected(null)
    }
  }, [selectedId, setSelected])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onClick={() => setSelected(null)}
      style={{
        flex:       1,
        position:   'relative',
        overflow:   'hidden',
        background: 'var(--lb-bg)',
        outline:    'none',
        cursor:     isPanning.current ? 'grabbing' : 'default',
      }}
    >
      {/* Grille */}
      <Grid zoom={zoom} pan={pan}/>

      {/* Canvas rayons */}
      <canvas ref={canvasRef} style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        width:         '100%',
        height:        '100%',
      }}/>

      {/* Composants SVG */}
      <svg style={{
        position: 'absolute',
        inset:    0,
        width:    '100%',
        height:   '100%',
        overflow: 'visible',
      }}>
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {components.map(comp => {
            const def = registry.getComponentDef(comp.type)
            if (!def) return null
            return (
              <CompNode
                key={comp.id}
                comp={comp}
                def={def}
                selected={selectedId === comp.id}
                onMouseDown={e => startDrag(e, comp.id)}
              />
            )
          })}
        </g>
      </svg>

      {/* Toolbar flottante */}
      <CanvasToolbar zoom={zoom} setZoom={setZoom}/>

      {/* Hint canvas vide */}
      {components.length === 0 && <EmptyHint/>}

      {/* Overlay info */}
      <StatusOverlay components={components} isRunning={isRunning} results={results}/>
    </div>
  )
}

// ─── Composant SVG ────────────────────────────────────────────────

function CompNode({ comp, def, selected, onMouseDown }) {
  const render = def.render?.() || {}
  const color  = MODULE_COLORS[comp.moduleId] || '#7f8c8d'
  const isLens   = render.shape === 'lens'
  const isScreen = render.shape === 'screen'
  const isMirror = render.shape === 'mirror'

  return (
    <g
      transform={`translate(${comp.x},${comp.y})`}
      style={{ cursor:'grab', userSelect:'none' }}
      onMouseDown={onMouseDown}
      onClick={e => e.stopPropagation()}
    >
      {/* Halo de sélection */}
      {selected && (
        <rect
          x={-28} y={-28} width={56} height={56}
          rx={10}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.5}
        />
      )}

      {isLens ? (
        <ellipse
          rx={10} ry={36}
          fill={`${color}18`}
          stroke={selected ? color : `${color}99`}
          strokeWidth={selected ? 2 : 1.5}
        />
      ) : isScreen ? (
        <rect
          x={-5} y={-45} width={10} height={90} rx={2}
          fill={`${color}22`}
          stroke={selected ? color : `${color}99`}
          strokeWidth={selected ? 2 : 1.5}
        />
      ) : isMirror ? (
        <line
          x1={-30} y1={0} x2={30} y2={0}
          stroke={color}
          strokeWidth={selected ? 3 : 2}
          strokeLinecap="round"
          transform={`rotate(${-(comp.params?.angle || 45)})`}
        />
      ) : (
        <rect
          x={-20} y={-20} width={40} height={40} rx={6}
          fill={`${color}15`}
          stroke={selected ? color : `${color}88`}
          strokeWidth={selected ? 2 : 1.5}
        />
      )}

      {/* Icône */}
      {!isLens && !isScreen && !isMirror && (
        <text
          x={0} y={6}
          textAnchor="middle"
          fontSize={16}
          fill={color}
          style={{ pointerEvents:'none' }}
        >
          {def.icon}
        </text>
      )}

      {/* Label */}
      <text
        x={0}
        y={isLens || isScreen ? 56 : 34}
        textAnchor="middle"
        fontSize={9}
        fill="var(--lb-muted)"
        style={{ pointerEvents:'none', fontFamily:'var(--font-mono)' }}
      >
        {comp.label}
      </text>

      {/* λ pour la source */}
      {comp.type === 'source' && comp.params?.wavelength && (
        <text
          x={0} y={isLens || isScreen ? 66 : 44}
          textAnchor="middle"
          fontSize={8}
          fill={wlToCSS(comp.params.wavelength)}
          style={{ pointerEvents:'none', fontFamily:'var(--font-mono)' }}
        >
          λ={comp.params.wavelength}nm
        </text>
      )}
    </g>
  )
}

// ─── Grille ───────────────────────────────────────────────────────

function Grid({ zoom, pan }) {
  const size = 40 * zoom
  return (
    <div style={{
      position:        'absolute',
      inset:           0,
      backgroundImage: `
        linear-gradient(to right, var(--lb-border) 1px, transparent 1px),
        linear-gradient(to bottom, var(--lb-border) 1px, transparent 1px)
      `,
      backgroundSize:     `${size}px ${size}px`,
      backgroundPosition: `${pan.x % size}px ${pan.y % size}px`,
      opacity:            0.7,
      pointerEvents:      'none',
    }}/>
  )
}

// ─── Toolbar flottante ────────────────────────────────────────────

function CanvasToolbar({ zoom, setZoom }) {
  const tools = [
    { label:'+', title:'Zoom avant',   action: () => setZoom(zoom + 0.1) },
    { label:'−', title:'Zoom arrière', action: () => setZoom(zoom - 0.1) },
    { label:'⌂', title:'Réinitialiser', action: () => setZoom(1.0) },
  ]
  return (
    <div style={{
      position:     'absolute',
      bottom:       16,
      right:        16,
      display:      'flex',
      flexDirection:'column',
      gap:          4,
      background:   'var(--lb-surface)',
      border:       '1px solid var(--lb-border)',
      borderRadius: 8,
      padding:      6,
      boxShadow:    '0 2px 8px rgba(0,0,0,.08)',
    }}>
      {tools.map(t => (
        <button key={t.label} onClick={t.action} title={t.title} style={{
          width:        28,
          height:       28,
          borderRadius: 4,
          border:       '1px solid var(--lb-border)',
          background:   'transparent',
          color:        'var(--lb-muted)',
          cursor:       'pointer',
          fontSize:     14,
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          fontFamily:   'var(--font-mono)',
        }}>
          {t.label}
        </button>
      ))}
      <div style={{
        textAlign:  'center',
        fontSize:   9,
        color:      'var(--lb-hint)',
        fontFamily: 'var(--font-mono)',
        marginTop:  2,
      }}>
        {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}

// ─── Hint vide ────────────────────────────────────────────────────

function EmptyHint() {
  return (
    <div style={{
      position:       'absolute',
      top:            '50%',
      left:           '50%',
      transform:      'translate(-50%,-50%)',
      textAlign:      'center',
      color:          'var(--lb-hint)',
      pointerEvents:  'none',
    }}>
      <LogoMarkHint/>
      <div style={{ fontSize:13, marginTop:12, color:'var(--lb-muted)' }}>
        Glisse un composant depuis la sidebar
      </div>
      <div style={{ fontSize:10, marginTop:6, fontFamily:'var(--font-mono)' }}>
        Alt+clic pour déplacer la vue · Molette pour zoomer
      </div>
    </div>
  )
}

function LogoMarkHint() {
  return (
    <svg width={48} height={48} viewBox="0 0 100 100" style={{ opacity:.15 }}>
      <rect x="10" y="10" width="25" height="25" fill="var(--lb-text)"/>
      <path d="M 35 22.5 L 77.5 22.5 L 77.5 65"
        fill="none" stroke="var(--lb-text)" strokeWidth="4" strokeLinecap="square"/>
      <path d="M 65 77.5 L 22.5 77.5 L 22.5 35"
        fill="none" stroke="var(--lb-text)" strokeWidth="4" strokeLinecap="square"/>
      <rect x="65" y="65" width="25" height="25" fill="var(--lb-text)"/>
    </svg>
  )
}

// ─── Overlay statut ───────────────────────────────────────────────

function StatusOverlay({ components, isRunning, results }) {
  const src = components.find(c => c.type === 'source')
  return (
    <div style={{
      position:     'absolute',
      bottom:       16,
      left:         16,
      background:   'var(--lb-surface)',
      border:       '1px solid var(--lb-border)',
      borderRadius: 8,
      padding:      '8px 12px',
      fontSize:     10,
      fontFamily:   'var(--font-mono)',
      boxShadow:    '0 2px 8px rgba(0,0,0,.08)',
    }}>
      <div style={{
        color:        isRunning ? 'var(--lb-success)' : 'var(--lb-muted)',
        fontWeight:   600,
        marginBottom: 4,
      }}>
        {isRunning ? '● Simulation active' : '○ En pause'}
      </div>
      {src && (
        <div style={{ color:'var(--lb-muted)' }}>
          λ = {src.params?.wavelength || 550} nm
        </div>
      )}
      {results?.durationMs && (
        <div style={{ color:'var(--lb-hint)', marginTop:2 }}>
          {results.durationMs.toFixed(1)} ms
        </div>
      )}
    </div>
  )
}

// ─── Utils ───────────────────────────────────────────────────────

function buildOptions(fidelity) {
  const p = {
    fast:     { numRays:3,  rayLength:1200, aberrations:false },
    standard: { numRays:7,  rayLength:1200, aberrations:false },
    precise:  { numRays:15, rayLength:1200, aberrations:true  },
    max:      { numRays:31, rayLength:1200, aberrations:true  },
  }
  return p[fidelity] || p.standard
}

function wlToCSS(wl) {
  if (wl < 440) return '#8e44ad'
  if (wl < 490) return '#2980b9'
  if (wl < 510) return '#16a085'
  if (wl < 580) return '#27ae60'
  if (wl < 645) return '#f39c12'
  return '#e74c3c'
}