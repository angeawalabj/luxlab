import { useEffect, useRef, useState, useCallback } from 'react'
import {
  initCollaboration, syncComponentsToYjs,
  getAwarenessUsers, updateCursorPosition,
  destroyCollaboration, getProvider,
} from './yjsProvider'
import { useSimStore } from '../store/useSimStore'
import { useAppStore  } from '../store/useAppStore'

const COLORS = ['#7c3aed','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316']

function randomColor() { return COLORS[Math.floor(Math.random() * COLORS.length)] }

export function useCollaboration() {
  const { components, setComponents } = useSimStore()
  const { collabSession }             = useAppStore()
  const [users,       setUsers]       = useState([])
  const [connected,   setConnected]   = useState(false)
  const [roomId,      setRoomId]      = useState('')
  const yComponentsRef = useRef(null)
  const isSyncingRef   = useRef(false)

  const join = useCallback((room, userName) => {
    const color = randomColor()
    const { yComponents } = initCollaboration(
      room, userName, color,
      (remoteComps) => {
        if (isSyncingRef.current) return
        setComponents(remoteComps)
      }
    )
    yComponentsRef.current = yComponents
    setRoomId(room)
    setConnected(true)

    // Mettre à jour la liste des utilisateurs toutes les 2s
    const interval = setInterval(() => {
      setUsers(getAwarenessUsers())
    }, 2000)

    getProvider()?.on('status', ({ connected }) => setConnected(connected))

    return () => { clearInterval(interval); destroyCollaboration() }
  }, [])

  const leave = useCallback(() => {
    destroyCollaboration()
    setConnected(false)
    setUsers([])
    setRoomId('')
  }, [])

  // Synchro locale → Yjs quand components changent
  useEffect(() => {
    if (!yComponentsRef.current || !connected) return
    isSyncingRef.current = true
    syncComponentsToYjs(yComponentsRef.current, components)
    setTimeout(() => { isSyncingRef.current = false }, 50)
  }, [components, connected])

  const trackCursor = useCallback((x, y) => {
    if (connected) updateCursorPosition(x, y)
  }, [connected])

  return { join, leave, connected, users, roomId, trackCursor }
}