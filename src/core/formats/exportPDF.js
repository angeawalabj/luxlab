// Export PDF rapport de simulation
// Nécessite : npm install jspdf

export async function exportPDF(components, results, meta = {}) {
  // Import dynamique — jsPDF chargé seulement quand nécessaire
  const { jsPDF } = await import('jspdf')
  const doc  = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const W    = 210
  const pad  = 18
  let y      = 18

  // ─── En-tête ───────────────────────────────────────────────────
  doc.setFillColor(44, 62, 80)
  doc.rect(0, 0, W, 30, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('LuxLab', pad, 13)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Rapport de simulation', pad, 19)

  doc.setFontSize(12)
  doc.text(meta.title || 'Simulation sans titre', pad, 26)

  doc.setFontSize(8)
  doc.text(
    `${meta.author || ''} · ${new Date().toLocaleDateString('fr-FR')}`,
    W - pad, 26, { align:'right' }
  )

  y = 40

  // ─── Métadonnées ──────────────────────────────────────────────
  doc.setFillColor(248, 249, 250)
  doc.rect(pad, y, W - pad*2, 20, 'F')

  doc.setTextColor(127, 140, 141)
  doc.setFontSize(8)
  const fields = [
    ['Institution', meta.institution || '—'],
    ['Composants',  `${components.length}`],
    ['Format',      '.lux v1.0'],
    ['Hash',        (meta.hash || '—').slice(0, 20) + '...'],
  ]
  fields.forEach(([k, v], i) => {
    const col = pad + (i % 2) * ((W - pad*2) / 2)
    const row = y + 6 + Math.floor(i / 2) * 8
    doc.text(k, col + 3, row)
    doc.setTextColor(44, 62, 80)
    doc.text(v, col + 3, row + 4)
    doc.setTextColor(127, 140, 141)
  })

  y += 28

  // ─── Composants ──────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setTextColor(44, 62, 80)
  doc.setFont('helvetica', 'bold')
  doc.text('Composants', pad, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  for (const comp of components) {
    doc.setFillColor(248, 249, 250)
    doc.rect(pad, y - 3, W - pad*2, 7, 'F')
    doc.setTextColor(44, 62, 80)
    doc.text(`${comp.label}`, pad + 3, y + 1)
    const params = Object.entries(comp.params || {})
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ')
    doc.setTextColor(127, 140, 141)
    doc.text(params, pad + 55, y + 1)
    y += 9
    if (y > 265) { doc.addPage(); y = 20 }
  }

  y += 4

  // ─── Résultats ────────────────────────────────────────────────
  if (results?.images?.length > 0) {
    doc.setFontSize(10)
    doc.setTextColor(44, 62, 80)
    doc.setFont('helvetica', 'bold')
    doc.text('Images conjuguées', pad, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    for (const img of results.images) {
      doc.setTextColor(44, 62, 80)
      doc.text(
        `${img.real ? 'Image réelle' : 'Image virtuelle'} — ` +
        `m = ${img.magnification.toFixed(3)} — ` +
        `x = ${Math.round(img.x)} px`,
        pad + 3, y
      )
      y += 7
    }
  }

  // ─── Pied de page ─────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFillColor(244, 246, 248)
    doc.rect(0, 285, W, 12, 'F')
    doc.setFontSize(7)
    doc.setTextColor(127, 140, 141)
    doc.text('Généré par LuxLab', pad, 292)
    doc.text(`Page ${p} / ${pages}`, W - pad, 292, { align:'right' })
  }

  const filename = `${(meta.title || 'simulation').replace(/\s+/g,'_')}_rapport.pdf`
  doc.save(filename)
  return { success: true, filename }
}