import { useRef, useEffect } from 'react'

export default function QuantumPanel({ results }) {
  const qr = results?.quantumResults

  if (!qr) return (
    <div style={emptyStyle}>Lance la simulation pour voir les résultats quantiques</div>
  )

  return (
    <div style={{ padding:'10px 12px' }}>

      {/* Énergie photon */}
      {qr.photoelectric && (
        <Section title="EFFET PHOTOÉLECTRIQUE">
          <Row k="Énergie photon">{qr.photoelectric.photonEnergy_eV} eV</Row>
          <Row k="λ seuil (Na)">{qr.photoelectric.threshold_nm} nm</Row>
          <div style={{ marginTop:8 }}>
            {qr.photoelectric.metals.map(m => (
              <div key={m.name} style={{
                display:'flex', justifyContent:'space-between',
                padding:'3px 0',
                borderBottom:'1px solid var(--lb-border)',
                fontSize:9,
              }}>
                <span style={{ color:'var(--lb-muted)' }}>{m.name} ({m.workFunction} eV)</span>
                <span style={{ color: m.emitted ? '#27ae60' : '#e74c3c', fontWeight:600 }}>
                  {m.emitted ? `Eₖ=${m.kineticEnergy} eV` : 'Pas d\'e⁻'}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Schrödinger */}
      {qr.schrodinger && (
        <Section title="PARTICULE EN BOÎTE 1D">
          <Row k="Niveau n">{qr.schrodinger.level}</Row>
          <Row k="Énergie">E_{qr.schrodinger.level} = {qr.schrodinger.energy} ℏ²/2mL²</Row>
          <WaveGraph data={qr.schrodinger.points}/>
        </Section>
      )}

      {/* Malus */}
      {qr.malusTransmittance !== undefined && (
        <Section title="LOI DE MALUS">
          <Row k="Transmittance">
            {(qr.malusTransmittance * 100).toFixed(1)} %
          </Row>
        </Section>
      )}

      {/* Bell */}
      {qr.bellCorrelation && (
        <Section title="CORRÉLATION DE BELL">
          <div style={{
            padding:'6px 8px', borderRadius:4,
            background:'#f5eeff',
            border:'1px solid #d8b4fe',
            fontSize:10, color:'#6b21a8', marginBottom:6,
          }}>
            ✓ Viole les inégalités de Bell — intrication confirmée
          </div>
          <Row k="Paires de mesures">
            {qr.bellCorrelation.correlations.length}
          </Row>
        </Section>
      )}
    </div>
  )
}

function WaveGraph({ data }) {
  const ref = useRef(null)
  useEffect(() => {
    const cvs = ref.current
    if (!cvs || !data?.length) return
    const ctx = cvs.getContext('2d')
    const W = cvs.width, H = cvs.height
    ctx.clearRect(0,0,W,H)
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0,0,W,H)

    // ψ(x)
    ctx.beginPath()
    ctx.strokeStyle = '#8e44ad'
    ctx.lineWidth   = 1.5
    data.forEach((pt,i) => {
      const x = (i/(data.length-1))*W
      const y = H/2 - pt.psi * (H/2-4)
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
    })
    ctx.stroke()

    // |ψ|²
    ctx.beginPath()
    ctx.strokeStyle = '#2980b9'
    ctx.lineWidth   = 1
    ctx.setLineDash([3,2])
    data.forEach((pt,i) => {
      const x = (i/(data.length-1))*W
      const y = H - pt.prob*(H-4) - 2
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y)
    })
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#bdc3c7'
    ctx.font      = '7px monospace'
    ctx.fillText('ψ(x)', 2, 10)
    ctx.fillStyle = '#85c1e9'
    ctx.fillText('|ψ|²', 2, 20)
  }, [data])

  return (
    <canvas ref={ref} width={186} height={80}
      style={{ width:'100%', borderRadius:4, display:'block' }}
    />
  )
}

const emptyStyle = {
  padding:10, fontSize:10,
  color:'var(--lb-hint)', textAlign:'center',
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:9, letterSpacing:'.6px',
        color:'var(--lb-muted)', marginBottom:7 }}>{title}</div>
      {children}
    </div>
  )
}

function Row({ k, children }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between',
      fontSize:10, marginBottom:4,
    }}>
      <span style={{ color:'var(--lb-muted)' }}>{k}</span>
      <span style={{ color:'var(--lb-text)', fontWeight:500,
        fontFamily:'var(--font-mono)' }}>{children}</span>
    </div>
  )
}