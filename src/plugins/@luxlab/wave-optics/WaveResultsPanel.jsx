import { useRef, useEffect } from 'react'

export default function WaveResultsPanel({ results }) {
  const wave = results?.waveResults

  if (!wave || Object.keys(wave).length === 0) {
    return (
      <div style={{ padding:16, fontSize:10, color:'var(--lb-hint)', textAlign:'center' }}>
        Ajoute des fentes de Young ou un réseau pour voir les résultats
      </div>
    )
  }

  return (
    <div style={{ padding:'10px 12px' }}>

      {/* Profil Young */}
      {wave.youngProfile && (
        <Section title="PROFIL D'INTENSITÉ — YOUNG">
          <YoungGraph profile={wave.youngProfile}/>
          {wave.interfrange && (
            <Row k="Interfrange i">
              {wave.interfrange.toFixed(3)} mm
            </Row>
          )}
        </Section>
      )}

      {/* Maxima réseau */}
      {wave.gratingMaxima && (
        <Section title="MAXIMA DU RÉSEAU">
          {wave.gratingMaxima.map((m, i) => (
            <Row key={i} k={`Ordre ${m.order > 0 ? '+':''}${m.order}`}>
              {m.angle.toFixed(2)}°
            </Row>
          ))}
        </Section>
      )}

      {/* Malus */}
      {wave.malusTransmittance !== undefined && (
        <Section title="LOI DE MALUS">
          <Row k="Transmittance">
            {(wave.malusTransmittance * 100).toFixed(1)} %
          </Row>
        </Section>
      )}
    </div>
  )
}

function YoungGraph({ profile }) {
  const ref = useRef(null)

  useEffect(() => {
    const cvs = ref.current
    if (!cvs || !profile?.length) return
    const ctx = cvs.getContext('2d')
    const W = cvs.width, H = cvs.height
    ctx.clearRect(0, 0, W, H)

    // Fond
    ctx.fillStyle = '#f8f9fa'
    ctx.fillRect(0, 0, W, H)

    // Grille légère
    ctx.strokeStyle = '#e8eaed'
    ctx.lineWidth   = 0.5
    for (let i = 0; i <= 4; i++) {
      const x = (i/4) * W
      const y = (i/4) * H
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // Courbe
    ctx.beginPath()
    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth   = 1.5
    profile.forEach((pt, i) => {
      const x = (i / (profile.length - 1)) * W
      const y = H - pt.I * (H - 4) - 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Remplissage
    ctx.globalAlpha = 0.1
    ctx.fillStyle   = '#2c3e50'
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1

    // Labels
    ctx.fillStyle = '#bdc3c7'
    ctx.font      = '8px Courier New'
    ctx.fillText('−10mm', 2, H - 2)
    ctx.fillText('+10mm', W - 28, H - 2)
  }, [profile])

  return (
    <canvas
      ref={ref}
      width={190} height={90}
      style={{ width:'100%', borderRadius:4, display:'block', marginBottom:8 }}
    />
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:9, letterSpacing:'.6px',
        color:'var(--lb-muted)', marginBottom:7 }}>
        {title}
      </div>
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
        fontFamily:'var(--font-mono)' }}>
        {children}
      </span>
    </div>
  )
}