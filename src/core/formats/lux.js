export function exportLux(components, meta = {}) {
  const doc = {
    version: '1.0',
    format:  'luxlab',
    meta: {
      title:      meta.title      || 'Sans titre',
      author:     meta.author     || '',
      university: meta.university || '',
      created:    new Date().toISOString(),
      ...meta,
    },
    components,
  }
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${doc.meta.title.replace(/\s+/g,'_')}.lux`
  a.click()
  URL.revokeObjectURL(url)
}

export function importLux(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => {
      try {
        const doc = JSON.parse(e.target.result)
        if (doc.format !== 'luxlab') throw new Error('Format invalide')
        resolve(doc)
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture'))
    reader.readAsText(file)
  })
}