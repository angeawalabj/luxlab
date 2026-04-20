// Sauvegarde et restaure l'état de la session dans localStorage.
// Pas de serveur, pas de cloud — 100% local.

const KEYS = {
  SESSION:    'luxlab:session',
  PREFERENCES:'luxlab:preferences',
}

// ─── Sauvegarder la session courante ─────────────────────────────

export function saveSession(state) {
  try {
    const session = {
      savedAt:    new Date().toISOString(),
      components: state.components,
      zoom:       state.zoom,
      pan:        state.pan,
      fidelity:   state.fidelity,
      isRunning:  false,
    }
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session))
  } catch (err) {
    console.warn('[Persistence] Erreur sauvegarde session :', err.message)
  }
}

// ─── Restaurer la session ─────────────────────────────────────────

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEYS.SESSION)
    if (!raw) return null
    const session = JSON.parse(raw)
    console.log('[Persistence] Session restaurée du', session.savedAt)
    return session
  } catch (err) {
    console.warn('[Persistence] Erreur lecture session :', err.message)
    return null
  }
}

// ─── Effacer la session ───────────────────────────────────────────

export function clearSession() {
  localStorage.removeItem(KEYS.SESSION)
}

// ─── Préférences utilisateur ──────────────────────────────────────

export function savePreferences(prefs) {
  try {
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs))
  } catch (err) {
    console.warn('[Persistence] Erreur sauvegarde préférences :', err.message)
  }
}

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(KEYS.PREFERENCES)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}