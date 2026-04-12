import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'

let ydoc     = null
let provider = null
let persist  = null

export function initCollaboration(roomId, userName, userColor, onUpdate) {
  if (ydoc) destroyCollaboration()

  ydoc = new Y.Doc()

  // Persistence locale offline (IndexedDB)
  persist = new IndexeddbPersistence(`luxlab-${roomId}`, ydoc)

  // Sync WebRTC peer-to-peer (LAN ou internet)
  provider = new WebrtcProvider(roomId, ydoc, {
    signaling: [
      'wss://signaling.yjs.dev',
      'wss://y-webrtc-signaling-eu.herokuapp.com',
    ],
    password: null,
    awareness: true,
    maxConns: 20,
  })

  // Awareness — présence utilisateur
  provider.awareness.setLocalStateField('user', {
    name:   userName,
    color:  userColor,
    cursor: null,
  })

  // Map partagée des composants
  const yComponents = ydoc.getMap('components')

  // Écouter les changements distants
  yComponents.observe(() => {
    const comps = []
    yComponents.forEach((val, key) => comps.push(val))
    onUpdate(comps)
  })

  return { ydoc, provider, yComponents }
}

export function syncComponentsToYjs(yComponents, components) {
  if (!yComponents) return
  ydoc.transact(() => {
    // Supprime les composants qui n'existent plus
    yComponents.forEach((_, key) => {
      if (!components.find(c => c.id === key)) yComponents.delete(key)
    })
    // Met à jour / ajoute
    components.forEach(c => yComponents.set(c.id, c))
  })
}

export function getAwarenessUsers() {
  if (!provider) return []
  const states = []
  provider.awareness.getStates().forEach((state, clientId) => {
    if (state.user) states.push({ clientId, ...state.user })
  })
  return states
}

export function updateCursorPosition(x, y) {
  if (!provider) return
  const current = provider.awareness.getLocalState()
  provider.awareness.setLocalStateField('user', {
    ...current?.user,
    cursor: { x, y },
  })
}

export function destroyCollaboration() {
  provider?.destroy()
  persist?.destroy()
  ydoc?.destroy()
  ydoc = null; provider = null; persist = null
}

export function getProvider() { return provider }