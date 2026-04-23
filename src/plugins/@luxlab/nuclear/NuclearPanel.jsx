import { useRef, useEffect } from 'react'

export default function NuclearPanel({ results }) {
  const nr = results?.nuclearResults
  if (!nr) return (
    <div style={emptyStyle}>Lance la simulation pour voir les résultats</div>
  )

  return (
    <div style={{ padding:'10px 12px' }}>

      <Section title="SOURCE">
        <Row k="Isotope">{nr.isotope}</Row>
        <Row k="Énergie">{nr.energy_MeV} MeV</Row>
        <Row k="Débit de dose">
          <span style={{ color: nr.classification.color, fontWeight:700 }}>
            {nr.doseRate_uSvh} µSv/h
          </span>
        </Row>
        <div style={{
          marginTop:6, padding:'4px 8px', borderRadius:4,
          background:`${nr.classification.color}18`,
          border:`1px solid ${nr.classification.color}44`,
          fontSize:9, color:nr.classification.color, fontWeight:600,
        }}>
          {nr.classification.level}
        </div>
      </Section>

      {nr.attenuationSteps?.length > 0 && (
        <Section title="BLINDAGE">
          {nr.attenuationSteps.map((s,i) => (
            <div key={i} style={{
              background:'var(--lb-bg)',
              border:'1px solid var(--lb-border)',
              borderRadius:4, padding:'5px 8px',
              marginBottom:5, fontSize:9,
            }}>
              <Row k={`${s.material} (${s.thickness}cm)`}>
                {s.transmittance}%
              </Row>
              <Row k="CDA">{s.hvl} cm</Row>
            </div>
          ))}
          <Row k="Fraction restante">
            <span style={{ fontWeight:700 }}>{nr.remainingFraction}%</span>
          </Row>
        </Section>
      )}

      {nr.accumulatedDose && (
        <Section title="DOSE ACCUMULÉE">
          <Row k="Dose">{nr.accumulatedDose} µSv</Row>
          <Row k="En mSv">{(parseFloat(nr.accumulatedDose)/1000).toFixed(4)}</Row>
        </Section>
      )}

      {nr.decayProfile && (
        <Section title="DÉCROISSANCE">
          <DecayGraph data={nr.decayProfile}/>
        </Section>
      )}

      {nr.comptonProfile && (
        <Section title="COMPTON">
          <ComptonGraph data={nr.comptonProfile}/>
        </Section>
      )}

      <Section title="RÉFÉRENCE ICRP 103">
        {[
          ['Fond naturel', '2.4 mSv/an'],
          ['Limite public','1 mSv/an'],
          ['Travailleurs', '20 mSv/an'],
          ['Seuil déterministe','100 mSv'],
        ].map(([k,v]) => (
          <Row key={k} k={k}>{v}</Row>
        ))}
      </Section>
    </div>
  )
}

function DecayGraph({ data }) {
  const ref = useRef(null)
  useEffect(() => {
    const cvs = ref.current
    if (!cvs||!data?.length) return
    const ctx=cvs.getContext('2d'), W=cvs.width, H=cvs.height
    ctx.clearRect(0,0,W,H)
    ctx.fillStyle='#fff9f9'; ctx.fillRect(0,0,W,H)
    ctx.beginPath(); ctx.strokeStyle='#e74c3c'; ctx.lineWidth=1.5
    data.forEach((pt,i) => {
      const x=(i/(data.length-1))*W
      const y=H-pt.A*(H-4)-2
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)
    })
    ctx.stroke()
    ctx.fillStyle='#bdc3c7'; ctx.font='7px monospace'
    ctx.fillText('A₀',2,10); ctx.fillText('5×T½',W-22,H-2)
  }, [data])
  return (
    <canvas ref={ref} width={186} height={70}
      style={{ width:'100%', borderRadius:4, display:'block' }}/>
  )
}

function ComptonGraph({ data }) {
  const ref = useRef(null)
  useEffect(() => {
    const cvs = ref.current
    if (!cvs||!data?.length) return
    const ctx=cvs.getContext('2d'), W=cvs.width, H=cvs.height
    ctx.clearRect(0,0,W,H)
    ctx.fillStyle='#fff9f9'; ctx.fillRect(0,0,W,H)
    const maxE = Math.max(...data.map(d=>d.energy))
    ctx.beginPath(); ctx.strokeStyle='#8e44ad'; ctx.lineWidth=1.5
    data.forEach((pt,i) => {
      const theta=pt.angle*Math.PI/180
      const r=(pt.energy/maxE)*(Math.min(W,H)/2-4)
      const cx=W/2+r*Math.cos(theta)
      const cy=H/2+r*Math.sin(theta)
      i===0?ctx.moveTo(cx,cy):ctx.lineTo(cx,cy)
    })
    ctx.closePath(); ctx.stroke()
    ctx.fillStyle='#bdc3c7'; ctx.font='7px monospace'
    ctx.fillText('Rose de diffusion',2,8)
  }, [data])
  return (
    <canvas ref={ref} width={186} height={80}
      style={{ width:'100%', borderRadius:4, display:'block' }}/>
  )
}

const emptyStyle = {
  padding:10, fontSize:10,
  color:'var(--lb-hint)', textAlign:'center',
}
function Section({title,children}) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:9,letterSpacing:'.6px',color:'var(--lb-muted)',marginBottom:7}}>
        {title}
      </div>
      {children}
    </div>
  )
}
function Row({k,children}) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:4}}>
      <span style={{color:'var(--lb-muted)'}}>{k}</span>
      <span style={{color:'var(--lb-text)',fontWeight:500,fontFamily:'var(--font-mono)'}}>
        {children}
      </span>
    </div>
  )
}