import * as Y              from 'yjs'
import { WebrtcProvider }  from 'y-webrtc'

// ─── État de la session ───────────────────────────────────────────

let ydoc     = null
let provider = null
let ycomps   = null
let callbacks = {
  onComponentsChange: null,
  onUsersChange:      null,
  onStatusChange:     null,
}

// ─── Couleurs des curseurs ────────────────────────────────────────

const CURSOR_COLORS = [
  '#2c3e50','#2980b9','#27ae60','#8e44ad',
  '#e67e22','#e74c3c','#16a085','#d35400',
]

function randomColor() {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
}

// ─── Rejoindre une salle ──────────────────────────────────────────

export function joinSession(roomId, userName, onUpdate) {
  if (ydoc) leaveSession()

  callbacks = onUpdate

  ydoc   = new Y.Doc()
  ycomps = ydoc.getArray('components')

  // WebRTC P2P — fonctionne en LAN sans internet
  // Si pas de signaling disponible, utilise la découverte LAN native
  try {
    provider = new WebrtcProvider(roomId, ydoc, {
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
      ],
      password: null,
      maxConns:  20,
    })
  } catch {
    // Mode LAN pur sans signaling externe
    provider = new WebrtcProvider(roomId, ydoc, {
      signaling: [],
    })
  }

  // Awareness — présence utilisateur
  const color = randomColor()
  provider.awareness.setLocalStateField('user', {
    name:   userName,
    color,
    cursor: null,
    active: true,
  })

  // Écouter les changements de composants
  ycomps.observe(() => {
    const comps = ycomps.toArray()
    callbacks.onComponentsChange?.(comps)
  })

  // Écouter les changements de présence
  provider.awareness.on('change', () => {
    const users = []
    provider.awareness.getStates().forEach((state, clientId) => {
      if (state.user && clientId !== ydoc.clientID) {
        users.push({ clientId, ...state.user })
      }
    })
    callbacks.onUsersChange?.(users)
  })

  // Écouter l'état de la connexion
  provider.on('status', ({ connected }) => {
    callbacks.onStatusChange?.(connected ? 'connected' : 'disconnected')
  })

  callbacks.onStatusChange?.('connecting')

  return {
    roomId,
    userName,
    color,
    clientId: ydoc.clientID,
  }
}

// ─── Synchroniser les composants ──────────────────────────────────

export function syncComponents(components) {
  if (!ydoc || !ycomps) return
  ydoc.transact(() => {
    ycomps.delete(0, ycomps.length)
    ycomps.push(components)
  })
}

// ─── Mettre à jour le curseur ─────────────────────────────────────

export function updateCursor(x, y) {
  if (!provider) return
  const current = provider.awareness.getLocalState()
  provider.awareness.setLocalStateField('user', {
    ...current?.user,
    cursor: { x, y, t: Date.now() },
  })
}

// ─── Quitter la session ───────────────────────────────────────────

export function leaveSession() {
  provider?.destroy()
  ydoc?.destroy()
  ydoc = null; provider = null; ycomps = null
}

// ─── Infos sur la session ─────────────────────────────────────────

export function getSessionInfo() {
  if (!provider) return null
  const users = []
  provider.awareness.getStates().forEach((state, clientId) => {
    if (state.user) users.push({ clientId, ...state.user })
  })
  return {
    connected: provider.connected,
    userCount: users.length,
    users,
  }
}

export function isInSession() {
  return !!provider
}