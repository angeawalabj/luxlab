import { useRef, useEffect, useState, useCallback } from 'react'
import { useSimStore }     from '../../../store/useSimStore'
import { useAppStore }     from '../../../store/useAppStore'
import { registry }        from '../../../core/plugin-api'
import { bridge }          from '../../../core/SimulationBridge'
import { useCollab }       from '../../../collaboration/useCollab'
import { renderInterferenceOnScreen } from './interferenceRenderer'

const MODULE_COLORS = {
  '@luxlab/geo-optics':    '#e67e22',
  '@luxlab/wave-optics':   '#2980b9',
  '@luxlab/quantum':       '#8e44ad',
  '@luxlab/nuclear':       '#e74c3c',
  '@luxlab/spectroscopy':  '#16a085',
  '@luxlab/em':            '#d35400',
}

function getModuleColor(moduleId) {
  return MODULE_COLORS[moduleId] || '#7f8c8d'
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
    fidelity, renderSettings,
  } = useAppStore()

  const { users, updateCursor, isConnected } = useCollab()

  const dragging   = useRef(null)
  const dragOffset = useRef({ x:0, y:0 })

  // ─── Resize observer ─────────────────────────────────────────────
  useEffect(() => {
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setSize({ w: Math.round(width), h: Math.round(height) })
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // ─── Rendu canvas 2D ─────────────────────────────────────────────
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    cvs.width  = size.w
    cvs.height = size.h
    const ctx  = cvs.getContext('2d')
    ctx.clearRect(0, 0, size.w, size.h)
    if (!isRunning) return

    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    const engines = registry.getAllEngines().filter(e => {
      try { return e.canHandle(components) } catch { return false }
    })

    for (const engine of engines) {
      if (engine?.renderResult) {
        engine.renderResult(ctx, results, { renderSettings, zoom })
      }
    }

    // Franges sur l'écran
    if (results?.waveResults?.youngProfile) {
      renderInterferenceOnScreen(ctx, components, results, 1, { x:0, y:0 })
    }

    ctx.restore()
  }, [results, isRunning, size, zoom, pan, components, renderSettings])

  // ─── Simulation auto ──────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || components.length === 0) return

    const opts = buildOptions(fidelity)
    const engines = registry.getAllEngines().filter(e => {
      try { return e.canHandle(components) } catch { return false }
    })

    if (engines.length === 0) return

    const run = async () => {
      try {
        let merged = {
          rays:[], intersections:[], images:[],
          waveResults:{}, quantumResults:{},
          nuclearResults:{}, spectroResults:{},
        }
        for (const engine of engines) {
          const r = await Promise.resolve(engine.run(components, opts))
          merged.rays          = [...merged.rays,         ...(r.rays         || [])]
          merged.intersections = [...merged.intersections,...(r.intersections || [])]
          merged.images        = [...merged.images,       ...(r.images        || [])]
          if (r.waveResults)   Object.assign(merged.waveResults,   r.waveResults)
          if (r.quantumResults)Object.assign(merged.quantumResults, r.quantumResults)
          if (r.nuclearResults)Object.assign(merged.nuclearResults, r.nuclearResults)
          if (r.spectroResults)Object.assign(merged.spectroResults, r.spectroResults)
          merged.durationMs = r.durationMs
        }
        setResults(merged)
      } catch (err) {
        if (err.message !== 'cancelled')
          console.warn('[Canvas] Moteur:', err.message)
      }
    }

    run()
  }, [components, isRunning, fidelity])

  // ─── Drop depuis sidebar ──────────────────────────────────────────
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

  // ─── Drag composant ───────────────────────────────────────────────
  const startDrag = useCallback((e, id) => {
    e.stopPropagation()
    setSelected(id)
    const comp = useSimStore.getState().components.find(c => c.id === id)
    if (!comp) return
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
    }
    if (isConnected) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) updateCursor(e.clientX - rect.left, e.clientY - rect.top)
    }
  }, [zoom, pan, updateComponent, isConnected, updateCursor])

  const handleMouseUp = useCallback(() => {
    dragging.current = null
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    setZoom(zoom + (e.deltaY > 0 ? -0.08 : 0.08))
  }, [zoom, setZoom])

  const handleKeyDown = useCallback((e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      if (e.target.tagName !== 'INPUT') {
        useSimStore.getState().removeComponent(selectedId)
        setSelected(null)
      }
    }
  }, [selectedId, setSelected])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onMouseMove={handleMouseMove}
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
      }}
    >
      {/* Grille */}
      <GridBg zoom={zoom} pan={pan}/>

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
        position:  'absolute',
        inset:     0,
        width:     '100%',
        height:    '100%',
        overflow:  'visible',
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

          {/* Curseurs distants */}
          {users.map(u => u.cursor && (
            <g key={u.clientId}
              transform={`translate(${u.cursor.x / zoom - pan.x / zoom},${u.cursor.y / zoom - pan.y / zoom})`}
              style={{ pointerEvents:'none' }}
            >
              <path
                d="M0,0 L0,14 L4,10 L7,16 L9,15 L6.5,9 L11,9 Z"
                fill={u.color || '#2c3e50'}
                stroke="#fff"
                strokeWidth={0.5 / zoom}
              />
              <rect
                x={12 / zoom} y={0}
                width={(u.name?.length * 5.5 + 8) / zoom}
                height={14 / zoom}
                rx={3 / zoom}
                fill={u.color || '#2c3e50'}
              />
              <text
                x={16 / zoom} y={10 / zoom}
                fontSize={8 / zoom}
                fill="#fff"
                fontFamily="var(--font-ui)"
              >
                {u.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Toolbar */}
      <CanvasToolbar zoom={zoom} setZoom={setZoom}/>

      {/* Hint vide */}
      {components.length === 0 && <EmptyHint/>}

      {/* Overlay statut */}
      {components.length > 0 && (
        <StatusOverlay
          components={components}
          isRunning={isRunning}
          results={results}
        />
      )}
    </div>
  )
}

// ─── Composant SVG ────────────────────────────────────────────────

function CompNode({ comp, def, selected, onMouseDown }) {
  const render   = def.render?.({ params: comp.params }) || {}
  const color    = getModuleColor(comp.moduleId)
  const isLens   = render.shape === 'lens'
  const isScreen = render.shape === 'screen'
  const isMirror = render.shape === 'mirror'
  const isFilter = render.shape === 'filter'

  const ry       = render.height ? render.height / 2 : 36
  const screenH  = render.height ? render.height / 2 : 45

  return (
    <g
      transform={`translate(${comp.x},${comp.y})`}
      style={{ cursor:'grab', userSelect:'none' }}
      onMouseDown={onMouseDown}
      onClick={e => e.stopPropagation()}
    >
      {selected && (
        <rect
          x={-28} y={-(ry + 8)}
          width={56} height={(ry + 8) * 2}
          rx={8} fill="none"
          stroke={color} strokeWidth={1}
          strokeDasharray="4 3" opacity={0.5}
        />
      )}

      {isLens ? (
        <ellipse
          rx={10} ry={ry}
          fill={`${color}18`}
          stroke={selected ? color : `${color}99`}
          strokeWidth={selected ? 2 : 1.5}
        />
      ) : isScreen || isFilter ? (
        <rect
          x={-5} y={-screenH} width={10} height={screenH * 2} rx={2}
          fill={`${color}22`}
          stroke={selected ? color : `${color}99`}
          strokeWidth={selected ? 2 : 1.5}
        />
      ) : isMirror ? (
        <line
          x1={-30} y1={0} x2={30} y2={0}
          stroke={color} strokeWidth={selected ? 3 : 2}
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

      {!isLens && !isScreen && !isMirror && !isFilter && (
        <text x={0} y={6} textAnchor="middle" fontSize={16}
          fill={color} style={{ pointerEvents:'none' }}>
          {def.icon}
        </text>
      )}

      <text
        x={0}
        y={isLens || isScreen || isFilter ? ry + 14 : 34}
        textAnchor="middle" fontSize={9} fill="var(--lb-muted)"
        style={{ pointerEvents:'none', fontFamily:'var(--font-mono)' }}
      >
        {comp.label}
      </text>

      {comp.type === 'source' && comp.params?.wavelength && (
        <text
          x={0} y={isLens || isScreen ? ry + 24 : 44}
          textAnchor="middle" fontSize={8}
          fill={wlToHue(comp.params.wavelength)}
          style={{ pointerEvents:'none', fontFamily:'var(--font-mono)' }}
        >
          λ={comp.params.wavelength}nm
        </text>
      )}

      {comp.type === 'lens' && comp.params?.focalLength && (
        <text
          x={0} y={ry + 24}
          textAnchor="middle" fontSize={8} fill="var(--lb-hint)"
          style={{ pointerEvents:'none', fontFamily:'var(--font-mono)' }}
        >
          f={comp.params.focalLength}mm
        </text>
      )}
    </g>
  )
}

// ─── Grille ───────────────────────────────────────────────────────

function GridBg({ zoom, pan }) {
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

// ─── Toolbar ─────────────────────────────────────────────────────

function CanvasToolbar({ zoom, setZoom }) {
  return (
    <div style={{
      position:      'absolute',
      bottom:        16,
      right:         16,
      display:       'flex',
      flexDirection: 'column',
      gap:           4,
      background:    'var(--lb-surface)',
      border:        '1px solid var(--lb-border)',
      borderRadius:  8,
      padding:       6,
      boxShadow:     '0 2px 8px rgba(0,0,0,.08)',
    }}>
      {[
        { label:'+', title:'Zoom avant',    action:() => setZoom(zoom+0.1) },
        { label:'−', title:'Zoom arrière',  action:() => setZoom(zoom-0.1) },
        { label:'⌂', title:'Réinitialiser', action:() => setZoom(1.0)     },
      ].map(t => (
        <button key={t.label} onClick={t.action} title={t.title} style={{
          width:          28,
          height:         28,
          borderRadius:   4,
          border:         '1px solid var(--lb-border)',
          background:     'transparent',
          color:          'var(--lb-muted)',
          cursor:         'pointer',
          fontSize:       14,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     'var(--font-mono)',
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

// ─── Hint canvas vide ─────────────────────────────────────────────

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
      <svg width={48} height={48} viewBox="0 0 100 100"
        style={{ opacity:.15, display:'block', margin:'0 auto 12px' }}>
        <rect x="10" y="10" width="25" height="25" fill="var(--lb-text)"/>
        <path d="M 35 22.5 L 77.5 22.5 L 77.5 65"
          fill="none" stroke="var(--lb-text)"
          strokeWidth="4" strokeLinecap="square"/>
        <path d="M 65 77.5 L 22.5 77.5 L 22.5 35"
          fill="none" stroke="var(--lb-text)"
          strokeWidth="4" strokeLinecap="square"/>
        <rect x="65" y="65" width="25" height="25" fill="var(--lb-text)"/>
      </svg>
      <div style={{ fontSize:13, color:'var(--lb-muted)' }}>
        Glisse un composant depuis la sidebar
      </div>
      <div style={{ fontSize:10, marginTop:6, fontFamily:'var(--font-mono)' }}>
        Alt+clic pour déplacer · Molette pour zoomer
      </div>
    </div>
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
        color:        isRunning ? '#27ae60' : 'var(--lb-muted)',
        fontWeight:   600,
        marginBottom: 4,
      }}>
        {isRunning ? '● Simulation active' : '○ En pause'}
      </div>
      {src?.params?.wavelength && (
        <div style={{ color:'var(--lb-muted)' }}>
          λ = {src.params.wavelength} nm
        </div>
      )}
      {results?.durationMs != null && (
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

function wlToHue(wl) {
  if (!wl) return 'var(--lb-text)'
  if (wl < 440) return '#8e44ad'
  if (wl < 490) return '#2980b9'
  if (wl < 510) return '#16a085'
  if (wl < 580) return '#27ae60'
  if (wl < 645) return '#f39c12'
  return '#e74c3c'
}