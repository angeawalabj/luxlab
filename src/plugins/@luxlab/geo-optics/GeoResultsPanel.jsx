export default function GeoResultsPanel({ results }) {
  if (!results?.images?.length && !results?.rays?.length) {
    return (
      <div style={{
        padding: 16, fontSize: 11,
        color: 'var(--lb-muted)', textAlign: 'center',
      }}>
        Lance la simulation pour voir les résultats
      </div>
    )
  }

  const src = null // sera récupéré depuis le store plus tard

  return (
    <div style={{ padding: '10px 12px' }}>

      {/* Rayons */}
      {results.rays?.length > 0 && (
        <Section title="TRACÉ">
          <Row k="Rayons tracés">{results.rays.length}</Row>
          <Row k="Durée calcul">
            {results.durationMs?.toFixed(1) || '—'} ms
          </Row>
        </Section>
      )}

      {/* Images conjuguées */}
      {results.images?.length > 0 && (
        <Section title="IMAGES CONJUGUÉES">
          {results.images.map((img, i) => (
            <div key={i} style={{
              background:   img.real ? '#eafaf1' : '#fef9e7',
              border:       `1px solid ${img.real ? '#a9dfbf' : '#f9e79f'}`,
              borderRadius: 5,
              padding:      '6px 8px',
              marginBottom: 6,
            }}>
              <div style={{
                fontSize:    10,
                fontWeight:  600,
                color:       img.real ? '#1e8449' : '#b7950b',
                marginBottom: 4,
              }}>
                {img.real ? '● Image réelle' : '○ Image virtuelle'}
              </div>
              <Row k="Grandissement">{img.magnification.toFixed(3)}</Row>
              <Row k="Position X">{Math.round(img.x)} px</Row>
              <Row k="Sens">
                {img.magnification < 0 ? 'Renversée' : 'Droite'}
              </Row>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 9, letterSpacing: '.8px',
        color: 'var(--lb-muted)', marginBottom: 7,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Row({ k, children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: 10, marginBottom: 4,
    }}>
      <span style={{ color: 'var(--lb-muted)' }}>{k}</span>
      <span style={{ color: 'var(--lb-text)', fontWeight: 500 }}>{children}</span>
    </div>
  )
}