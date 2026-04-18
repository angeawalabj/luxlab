import { registry } from '../plugin-api'

const LUX_VERSION = '1.0'

// ─── Hash SHA-256 ─────────────────────────────────────────────────

async function sha256(str) {
  const buf    = new TextEncoder().encode(str)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Sérialisation ────────────────────────────────────────────────

export async function serializeLux(state, meta = {}) {
  const doc = {
    luxlab:  LUX_VERSION,
    meta: {
      title:       meta.title       || 'Sans titre',
      author:      meta.author      || '',
      institution: meta.institution || '',
      created:     meta.created     || new Date().toISOString(),
      modified:    new Date().toISOString(),
      hash:        '',
      doi:         null,
      license:     meta.license || 'CC-BY-4.0',
      lang:        meta.lang    || 'fr',
      tags:        meta.tags    || [],
      description: meta.description || '',
    },
    requires: {
      plugins: [
        ...new Set(state.components.map(c => c.pluginId))
      ].map(id => {
        const p = registry.get(id)
        return { id, version: p?.version || '1.0.0' }
      }),
    },
    settings: {
      activePlugins: registry.getAll().map(p => p.id),
      fidelity:      state.fidelity || 'standard',
      simParams:     {},
    },
    canvas: {
      zoom: state.zoom || 1.0,
      pan:  state.pan  || { x:0, y:0 },
    },
    components: state.components.map(c => ({
      id:       c.id,
      type:     c.type,
      pluginId: c.pluginId,
      moduleId: c.moduleId,
      x:        Math.round(c.x),
      y:        Math.round(c.y),
      params:   { ...c.params },
    })),
    connections: state.connections || [],
    notes:       state.notes       || '',
  }

  // Calculer le hash sur le contenu sans le champ hash lui-même
  const forHash = JSON.stringify({ ...doc, meta: { ...doc.meta, hash:'' } })
  doc.meta.hash = 'sha256:' + await sha256(forHash)

  return doc
}

// ─── Validation schema ────────────────────────────────────────────

function validateLux(doc) {
  const errors = []

  if (!doc.luxlab)    errors.push('Champ "luxlab" manquant')
  if (!doc.meta)      errors.push('Champ "meta" manquant')
  if (!doc.components || !Array.isArray(doc.components)) {
    errors.push('Champ "components" manquant ou invalide')
  }

  return errors
}

// ─── Migration entre versions ─────────────────────────────────────

function migrate(doc) {
  // v1.0 → v1.0 : rien à faire pour l'instant
  // Future : if (doc.luxlab === '0.9') { ... return migratedDoc }
  return doc
}

// ─── Export (Save) ────────────────────────────────────────────────

export async function saveLux(state, meta = {}) {
  const doc  = await serializeLux(state, meta)
  const json = JSON.stringify(doc, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const name = `${(doc.meta.title || 'projet').replace(/\s+/g, '_')}.lux`

  // File System Access API (Chrome/Edge)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{
          description: 'Projet LuxLab',
          accept: { 'application/json': ['.lux'] },
        }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return { success: true, filename: name }
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, cancelled: true }
      // Fallback si erreur
    }
  }

  // Fallback : download link
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href    = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { success: true, filename: name }
}

// ─── Import (Load) ────────────────────────────────────────────────

export async function loadLux(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const raw = e.target.result
        const doc = JSON.parse(raw)

        // Validation
        const errors = validateLux(doc)
        if (errors.length > 0) {
          reject(new Error('Fichier .lux invalide : ' + errors.join(', ')))
          return
        }

        // Migration
        const migrated = migrate(doc)

        // Vérification du hash (warning seulement)
        if (migrated.meta?.hash) {
          const forHash  = JSON.stringify({
            ...migrated,
            meta: { ...migrated.meta, hash:'' }
          })
          const computed = 'sha256:' + await sha256(forHash)
          if (computed !== migrated.meta.hash) {
            console.warn('[LuxLab] Hash invalide — fichier potentiellement modifié')
            migrated._hashWarning = true
          }
        }

        // Identifier les plugins manquants
        const missing = (migrated.requires?.plugins || [])
          .filter(p => !registry.isLoaded(p.id))

        resolve({ doc: migrated, missingPlugins: missing })

      } catch (err) {
        reject(new Error('Erreur lecture fichier .lux : ' + err.message))
      }
    }

    reader.onerror = () => reject(new Error('Erreur lecture fichier'))
    reader.readAsText(file)
  })
}

// ─── Ouvrir fichier via dialogue ──────────────────────────────────

export async function openLuxFile() {
  // File System Access API
  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Projet LuxLab',
          accept: { 'application/json': ['.lux', '.json'] },
        }],
      })
      const file = await handle.getFile()
      return loadLux(file)
    } catch (err) {
      if (err.name === 'AbortError') return null
      throw err
    }
  }

  // Fallback input[type=file]
  return new Promise((resolve, reject) => {
    const input    = document.createElement('input')
    input.type     = 'file'
    input.accept   = '.lux,.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) { resolve(null); return }
      try   { resolve(await loadLux(file)) }
      catch (err) { reject(err) }
    }
    input.click()
  })
}