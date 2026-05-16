function CanvasToolbar({ zoom, setZoom, setZoomX, setZoomY }) {
  return (
    <div style={{
      position:'absolute', bottom:16, right:16,
      display:'flex', flexDirection:'column', gap:4,
      background:'var(--lb-surface)',
      border:'1px solid var(--lb-border)',
      borderRadius:8, padding:6,
      boxShadow:'0 2px 8px rgba(0,0,0,.08)',
    }}>
      {/* Zoom global */}
      <BtnTool label="+" title="Zoom avant"    onClick={() => setZoom(zoom.x+0.1)}/>
      <BtnTool label="−" title="Zoom arrière"  onClick={() => setZoom(zoom.x-0.1)}/>
      <BtnTool label="⌂" title="Réinitialiser" onClick={() => setZoom(1.0)}/>
      {/* Séparateur */}
      <div style={{ height:1, background:'var(--lb-border)', margin:'2px 0' }}/>
      {/* Zoom horizontal */}
      <BtnTool label="↔+" title="Élargir (Shift+molette)"   onClick={() => setZoomX(zoom.x+0.1)}/>
      <BtnTool label="↔−" title="Rétrécir horizontal"       onClick={() => setZoomX(zoom.x-0.1)}/>
      {/* Zoom vertical */}
      <BtnTool label="↕+" title="Étirer (Ctrl+molette)"     onClick={() => setZoomY(zoom.y+0.1)}/>
      <BtnTool label="↕−" title="Comprimer vertical"        onClick={() => setZoomY(zoom.y-0.1)}/>
      {/* Indicateurs */}
      <div style={{ fontSize:8, color:'var(--lb-hint)',
        fontFamily:'var(--font-mono)', textAlign:'center', marginTop:2 }}>
        X:{Math.round(zoom.x*100)}%<br/>
        Y:{Math.round(zoom.y*100)}%
      </div>
    </div>
  )
}

function BtnTool({ label, title, onClick }) {
  return (
    <button onClick={onClick} title={title} style={{
      width:28, height:22, borderRadius:4,
      border:'1px solid var(--lb-border)',
      background:'transparent', color:'var(--lb-muted)',
      cursor:'pointer', fontSize:11,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--font-mono)',
    }}>
      {label}
    </button>
  )
}