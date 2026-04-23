import { useState, useEffect, useRef, useCallback } from 'react'
import {
  joinSession, leaveSession, syncComponents,
  updateCursor, isInSession, getSessionInfo,
} from './collabSession'
import { useSimStore } from '../store/useSimStore'

export function useCollab() {
  const [status,    setStatus]    = useState('offline') // offline|connecting|connected
  const [users,     setUsers]     = useState([])
  const [roomId,    setRoomId]    = useState('')
  const [localUser, setLocalUser] = useState(null)

  const { components, setComponents } = useSimStore()
  const isSyncing = useRef(false)

  // ─── Rejoindre ──────────────────────────────────────────────────

  const join = useCallback((room, name) => {
    if (!room.trim() || !name.trim()) return

    const info = joinSession(room.trim(), name.trim(), {
      onComponentsChange: (comps) => {
        if (isSyncing.current) return
        setComponents(comps)
      },
      onUsersChange:  setUsers,
      onStatusChange: setStatus,
    })

    setRoomId(room.trim())
    setLocalUser(info)
  }, [setComponents])

  // ─── Quitter ────────────────────────────────────────────────────

  const leave = useCallback(() => {
    leaveSession()
    setStatus('offline')
    setUsers([])
    setRoomId('')
    setLocalUser(null)
  }, [])

  // ─── Sync locale → Yjs ──────────────────────────────────────────

  useEffect(() => {
    if (status !== 'connected' || !isInSession()) return
    isSyncing.current = true
    syncComponents(components)
    setTimeout(() => { isSyncing.current = false }, 60)
  }, [components, status])

  // ─── Nettoyage ──────────────────────────────────────────────────

  useEffect(() => () => leaveSession(), [])

  return {
    join, leave, status, users,
    roomId, localUser, updateCursor,
    isConnected: status === 'connected',
  }
}