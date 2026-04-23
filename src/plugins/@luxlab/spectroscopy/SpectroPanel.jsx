import { useRef, useEffect, useState } from 'react'
import { ATOMIC_SPECTRA, FRAUNHOFER }  from './index.js'
import { wavelengthToCSS }             from '../../../core/colorScience.js'

export default function SpectroPanel({ results }) {
  const sr       = results?.spectroResults
  const canvasRef = useRef(null)
  const [tab, setTab] = useState('spectrum')

  useEffect(() => {
    if (sr) drawSpectrum()
  }, [sr, tab])

  function drawSpectrum() {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    const W = cvs.width, H = cvs.height
    ctx.clearRect(0,0,W,H)
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H)

    const profile = tab==='solar' ? sr?.solar : sr?.profile
    if (!profile?.length) return

    for (const pt of profile) {
      const x   = ((pt.wl-380)/400)*W
      const col = wavelengthToCSS(pt.wl)
      ctx.strokeStyle = col
      ctx.globalAlpha = Math.max(0.02, pt.I)
      ctx.lineWidth   = 0.9
      ctx.beginPath()
      ctx.moveTo(x, H)
      ctx.lineTo(x, H*(1-pt.I))
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Raies de Fraunhofer
    if (tab==='solar' && sr?.fraunhofer) {
      ctx.setLineDash([2,2])
      for (const line of sr.fraunhofer) {
        const x = ((line.wl-380)/400)*W
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth   = 1
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke()
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.font      = '7px monospace'
        ctx.fillText(line.name, x+1, 9)
      }
      ctx.setLineDash([])
    }

    // Labels λ
    ctx.fillStyle = '#444'
    ctx.font      = '7px monospace'
    for (let wl=400; wl<=750; wl+=50) {
      const x = ((wl-380)/400)*W
      ctx.fillText(`${wl}`, x-8, H-2)
    }
  }

  if (!sr) return (
    <div style={emptyStyle}>Ajoute un spectromètre pour voir les spectres</div>
  )

  return (
    <div style={{ padding:'10px 12px' }}>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:8 }}>
        {['spectrum','solar','lines'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:'3px 0', fontSize:9,
            border:'1px solid',
            borderColor: tab===t ? 'var(--lb-text)' : 'var(--lb-border)',
            background:  tab===t ? 'var(--lb-text)' : 'transparent',
            color:       tab===t ? '#fff' : 'var(--lb-muted)',
            borderRadius:3, cursor:'pointer', fontFamily:'var(--font-ui)',
          }}>
            {t==='spectrum'?'Émission':t==='solar'?'Solaire':'Raies'}
          </button>
        ))}
      </div>

      {/* Canvas spectre */}
      {tab !== 'lines' && (
        <canvas ref={canvasRef} width={186} height={60}
          style={{ width:'100%', borderRadius:4, display:'block', marginBottom:10 }}
        />
      )}

      {/* Raies atomiques */}
      {tab === 'lines' && sr.lines && (
        <div>
          <div style={{ fontSize:9, color:'var(--lb-muted)',
            marginBottom:7, letterSpacing:'.5px' }}>
            {sr.element?.toUpperCase()} — RAIES D'ÉMISSION
          </div>
          {sr.lines.map((line,i) => {
            const col = wavelengthToCSS(line.wl)
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'4px 0', borderBottom:'1px solid var(--lb-border)',
                fontSize:10,
              }}>
                <div style={{
                  width:10, height:10, borderRadius:'50%',
                  background:col, flexShrink:0,
                  boxShadow:`0 0 4px ${col}`,
                }}/>
                <span style={{ color:'var(--lb-text)', fontFamily:'var(--font-mono)',
                  fontWeight:600 }}>
                  {line.wl} nm
                </span>
                <span style={{ color:'var(--lb-muted)', flex:1 }}>{line.name}</span>
                <span style={{ color:'var(--lb-hint)', fontSize:9 }}>
                  {(line.I*100).toFixed(0)}%
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Identification */}
      {sr.identification?.length > 0 && (
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:9, color:'var(--lb-muted)',
            marginBottom:6, letterSpacing:'.5px' }}>
            IDENTIFICATION
          </div>
          {sr.identification.map((m,i) => (
            <div key={i} style={{
              display:'flex', justifyContent:'space-between',
              fontSize:10, padding:'3px 0',
              borderBottom:'1px solid var(--lb-border)',
            }}>
              <span style={{ color:'var(--lb-text)' }}>{m.element}</span>
              <span style={{ color:'#27ae60', fontFamily:'var(--font-mono)' }}>
                {m.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const emptyStyle = {
  padding:10, fontSize:10, color:'var(--lb-hint)', textAlign:'center',
}