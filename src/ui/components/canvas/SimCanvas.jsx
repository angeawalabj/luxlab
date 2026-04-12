import { useRef, useEffect, useState, useCallback } from 'react'
import { useSimStore } from '../../../store/useSimStore'
import { useAppStore } from '../../../store/useAppStore'
import { traceRays, wavelengthToHex } from '../../../core/physics/geometric/raytracer'

const MODULE_COLORS = {
  geo:'#f59e0b', wave:'#06b6d4', quant:'#7c3aed',
  nuc:'#ef4444', spec:'#10b981', em:'#f97316',
}

const ICONS = {
  source:'✦', lens:'◎', mirror:'⌒', prism:'▽', screen:'▪', blocker:'▬',
  slit2:'⫿', grating:'|||', polarizer:'↕', halfwave:'◫', beamsplit:'⊡',
  photon1:'ψ', entangle:'⊗', gamma:'γ', alpha:'α', dosimeter:'▣', shield:'⬛', fiber:'〜',
}

function getDefaultParams(type) {
  const d = {
    source:    { wavelength:550, intensity:1.0, polarization:'none', coherence:'high' },
    lens:      { focalLength:50, diameter:40, material:'BK7', refractiveIndex:1.52 },
    mirror:    { radius:100, angle:0 },
    prism:     { apexAngle:60, refractiveIndex:1.52 },
    screen:    { width:30, height:80, sensitivity:1.0 },
    polarizer: { angle:0, transmittance:1.0 },
    slit2:     { separation:0.5, width:0.1 },
    grating:   { spacing:600, order:1 },
    gamma:     { energy:1.25, activity:1e6 },
    dosimeter: { sensitivity:1.0 },
    blocker:   { width:10, height:60 },
    halfwave:  { angle:0 },
    beamsplit:  { ratio:0.5 },
  }
  return d[type] || {}
}

export default function SimCanvas() {
  const canvasRef   = useRef(null)
  const containerRef = useRef(null)
  const { components, addComponent, updateComponent, isRunning, setResults } = useSimStore()
  const { selectedComponentId, setSelectedComponent, zoom, setZoom } = useAppStore()
  const [dragging, setDragging] = useState(null)
  const [offset,   setOffset]   = useState({ x:0, y:0 })
  const [canvasSize, setCanvasSize] = useState({ w:1200, h:800 })

  // Resize observer
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setCanvasSize({ w: Math.round(width), h: Math.round(height) })
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Dessin
  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    cvs.width  = canvasSize.w
    cvs.height = canvasSize.h
    const ctx  = cvs.getContext('2d')
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    if (!isRunning) return


    const res = traceRays(components)
    setResults(res)

    // Rayons
    for (const ray of res.rays) {
      const color = wavelengthToHex(ray.wl)
      ctx.strokeStyle = color
      ctx.lineWidth   = 1.3
      ctx.globalAlpha = 0.8
      ctx.shadowColor = color
      ctx.shadowBlur  = 5
      ctx.beginPath()
      ray.segments.forEach((pt, i) =>
        i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)
      )
      ctx.stroke()
    }

    // Points d'intersection
    ctx.shadowBlur  = 0
    ctx.globalAlpha = 1
    for (const pt of res.intersections) {
      const colors = { refraction:'#06b6d4', reflection:'#f59e0b', dispersion:'#7c3aed', detection:'#10b981' }
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = colors[pt.type] || '#fff'
      ctx.fill()
    }

    // Images conjuguées
    for (const img of res.images) {
      ctx.beginPath()
      ctx.arc(img.x, img.y, 5, 0, Math.PI * 2)
      ctx.strokeStyle = img.real ? '#10b981' : '#f59e0b'
      ctx.lineWidth   = 1.5
      ctx.setLineDash(img.real ? [] : [3, 3])
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle   = 'var(--lb-text)'
      ctx.font        = '9px monospace'
      ctx.fillText(
        `${img.real ? 'Image réelle' : 'Image virtuelle'} | m=${img.magnification.toFixed(2)}`,
        img.x + 8, img.y - 5
      )
    }

    if (typeof setResults === 'function') setResults(res)
  }, [components, isRunning, canvasSize])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/luxlab')
    if (!raw) return
    const comp = JSON.parse(raw)
    const rect = containerRef.current.getBoundingClientRect()
    addComponent({
      ...comp,
      x: Math.round((e.clientX - rect.left) / zoom),
      y: Math.round((e.clientY - rect.top)  / zoom),
      params: getDefaultParams(comp.type),
    })
  }, [zoom, addComponent])

  const handleMouseDown = useCallback((e, id) => {
    e.stopPropagation()
    setSelectedComponent(id)
    const comp = components.find(c => c.id === id)
    setDragging(id)
    setOffset({ x: e.clientX - comp.x * zoom, y: e.clientY - comp.y * zoom })
  }, [components, zoom, setSelectedComponent])

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    updateComponent(dragging, {
      x: Math.round((e.clientX - offset.x) / zoom),
      y: Math.round((e.clientY - offset.y) / zoom),
    })
  }, [dragging, offset, zoom, updateComponent])

  return (
    <div
      ref={containerRef}
      style={{ flex:1, position:'relative', overflow:'hidden', background:'var(--lb-bg)' }}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragging(null)}
      onWheel={e => { e.preventDefault(); setZoom(zoom + (e.deltaY > 0 ? -0.08 : 0.08)) }}
      onClick={() => setSelectedComponent(null)}
    >
      {/* Grille */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:`linear-gradient(var(--lb-border) 1px,transparent 1px),
          linear-gradient(90deg,var(--lb-border) 1px,transparent 1px)`,
        backgroundSize:`${40*zoom}px ${40*zoom}px`,
        opacity:0.25,
      }}/>

      {/* Canvas 2D rayons */}
      <canvas ref={canvasRef} style={{
        position:'absolute', inset:0, pointerEvents:'none',
        width:'100%', height:'100%',
      }}/>

      {/* Composants SVG */}
      <svg style={{
        position:'absolute', inset:0,
        width:'100%', height:'100%', overflow:'visible',
      }}>
        {components.map(comp => (
          <ComponentSVG
            key={comp.id}
            comp={comp}
            zoom={zoom}
            selected={selectedComponentId === comp.id}
            onMouseDown={e => handleMouseDown(e, comp.id)}
          />
        ))}
      </svg>

      {/* Toolbar flottante */}
      <CanvasToolbar zoom={zoom} setZoom={setZoom} />

      {/* Hint vide */}
      {components.length === 0 && (
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          textAlign:'center', color:'var(--lb-muted)',
          fontSize:12, pointerEvents:'none',
        }}>
          <div style={{ fontSize:36, marginBottom:12, opacity:.2 }}>✦</div>
          Glisse un composant depuis la sidebar
        </div>
      )}

      {/* Overlay info */}
      {components.length > 0 && (
        <InfoOverlay components={components} isRunning={isRunning} />
      )}
    </div>
  )
}

function ComponentSVG({ comp, zoom, selected, onMouseDown }) {
  const color = MODULE_COLORS[comp.module] || '#64748b'
  const icon  = ICONS[comp.type] || '?'
  const cx    = comp.x * zoom
  const cy    = comp.y * zoom

  const isLens   = comp.type === 'lens'
  const isScreen = ['screen','dosimeter'].includes(comp.type)

  return (
    <g
      transform={`translate(${cx},${cy})`}
      style={{ cursor:'grab', userSelect:'none' }}
      onMouseDown={onMouseDown}
    >
      {isLens ? (
        <>
          <ellipse rx={10} ry={35} fill={`${color}22`} stroke={selected?'var(--lb-accent)':color} strokeWidth={1.5}/>
          <ellipse rx={10} ry={35} fill="none" stroke={color} strokeWidth={.5} strokeDasharray="2,2"/>
        </>
      ) : isScreen ? (
        <rect x={-5} y={-45} width={10} height={90}
          fill={`${color}33`} stroke={selected?'var(--lb-accent)':color} strokeWidth={1.5}
          rx={2}
        />
      ) : (
        <>
          <rect x={-20} y={-20} width={40} height={40} rx={6}
            fill={`${color}22`}
            stroke={selected?'var(--lb-accent)':color}
            strokeWidth={selected?2:1.5}
          />
          {selected && (
            <rect x={-23} y={-23} width={46} height={46} rx={8}
              fill="none" stroke="var(--lb-accent)" strokeWidth={1} opacity={.4}
            />
          )}
          <text x={0} y={6} textAnchor="middle" fontSize={16} fill={color}>{icon}</text>
        </>
      )}
      <text x={0} y={isLens||isScreen?55:32} textAnchor="middle"
        fontSize={9} fill="var(--lb-muted)" fontFamily="monospace">
        {comp.label}
      </text>
      {comp.params?.wavelength && (
        <text x={0} y={isLens||isScreen?65:42} textAnchor="middle"
          fontSize={8} fill={wavelengthToHex(comp.params.wavelength)} fontFamily="monospace">
          λ={comp.params.wavelength}nm
        </text>
      )}
    </g>
  )
}

function wavelengthToHex(wl) {
  if (wl < 440) return '#8b5cf6'
  if (wl < 490) return '#3b82f6'
  if (wl < 510) return '#06b6d4'
  if (wl < 580) return '#22c55e'
  if (wl < 645) return '#f59e0b'
  return '#ef4444'
}

function CanvasToolbar({ zoom, setZoom }) {
  return (
    <div style={{
      position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
      display:'flex', alignItems:'center', gap:3,
      background:'var(--lb-panel)', border:'1px solid var(--lb-border)',
      borderRadius:8, padding:'4px 8px', zIndex:10,
    }}>
      {[['▲','Sélectionner'],['✥','Déplacer'],null,['+','Zoom +'],['−','Zoom −'],null,['⊞','Grille'],null,['↩','Annuler'],['↪','Rétablir']].map((item,i) =>
        item === null
          ? <div key={i} style={{ width:1, height:18, background:'var(--lb-border)', margin:'0 2px' }}/>
          : <button key={i} title={item[1]} onClick={() => {
              if (item[0]==='+') setZoom(zoom+0.1)
              if (item[0]==='−') setZoom(zoom-0.1)
            }} style={{
              width:26, height:26, borderRadius:4,
              border:'1px solid transparent', background:'transparent',
              color:'var(--lb-muted)', cursor:'pointer', fontSize:12,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'inherit',
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#1e2d45'; e.currentTarget.style.color='var(--lb-text)' }}
            onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--lb-muted)' }}
          >{item[0]}</button>
      )}
      <div style={{ width:1, height:18, background:'var(--lb-border)', margin:'0 2px' }}/>
      <span style={{ fontSize:10, color:'var(--lb-muted)', padding:'0 4px' }}>
        {Math.round(zoom*100)}%
      </span>
    </div>
  )
}

function InfoOverlay({ components, isRunning }) {
  const src = components.find(c => c.type === 'source')
  return (
    <div style={{
      position:'absolute', bottom:16, left:16,
      background:'var(--lb-panel)', border:'1px solid var(--lb-border)',
      borderRadius:8, padding:'8px 14px', fontSize:10, color:'var(--lb-muted)',
    }}>
      <div style={{
        color: isRunning ? 'var(--lb-success)' : 'var(--lb-muted)',
        fontWeight:600, marginBottom:4,
      }}>
        {isRunning ? '● Simulation active' : '○ En pause — cliquer ▶ Simuler'}
      </div>
      {src && <>
        <div>λ = {src.params?.wavelength || 550} nm</div>
        <div style={{ marginTop:2, display:'flex', alignItems:'center', gap:5 }}>
          <div style={{
            width:40, height:6, borderRadius:3,
            background:`linear-gradient(to right,
              #8b5cf6,#3b82f6,#06b6d4,#22c55e,#f59e0b,#ef4444)`,
          }}/>
          <span>spectre visible</span>
        </div>
      </>}
    </div>
  )
}