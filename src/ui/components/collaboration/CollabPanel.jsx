import { useState, useEffect } from 'react'
import { useCollaboration }    from '../../../collaboration/useCollaboration'
import { useAppStore }         from '../../../store/useAppStore'

const AVATARS = [
  { initials:'KM', color:'#7c3aed', name:'Kofi Mensah',   role:'Éditeur' },
  { initials:'DA', color:'#10b981', name:'Dr. Adjovi',     role:'Observateur' },
  { initials:'FT', color:'#f59e0b', name:'Fatou Traoré',   role:'Éditeur' },
]

export default function CollabPanel({ onClose }) {
  const [tab,      setTab]      = useState('equipe')
  const [name,     setName]     = useState('Moi')
  const [room,     setRoom]     = useState('')
  const [chatMsg,  setChatMsg]  = useState('')
  const [messages, setMessages] = useState([
    { author:'Dr. Adjovi', color:'#10b981', text:'La lentille L1 devrait avoir f=75mm ici', time:'14:32' },
    { author:'Kofi',       color:'#7c3aed', text:'D\'accord, j\'ajuste le paramètre',        time:'14:33' },
  ])

  const { join, leave, connected, users, roomId, trackCursor } = useCollaboration()

  const handleJoin = () => {
    if (!room.trim() || !name.trim()) return
    join(room.trim(), name.trim())
  }

  const sendMessage = () => {
    if (!chatMsg.trim()) return
    setMessages(m => [...m, {
      author: name, color: '#00c9ff',
      text: chatMsg.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }),
    }])
    setChatMsg('')
  }

  return (
    <div style={{
      position: 'absolute', top: 12, right: 12,
      width: 240, background: 'var(--lb-panel)',
      border: '1px solid var(--lb-border)', borderRadius: 10,
      zIndex: 30, display: 'flex', flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0,0,0,.5)',
      maxHeight: '80vh',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--lb-border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connected ? 'var(--lb-success)' : '#ef4444',
        }}/>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lb-text)', flex: 1 }}>
          Collaboration
        </span>
        {connected && (
          <span style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 3,
            background: '#0d2a1a', color: 'var(--lb-success)',
          }}>
            {roomId}
          </span>
        )}
        <span
          onClick={onClose}
          style={{ cursor: 'pointer', color: 'var(--lb-muted)', fontSize: 14 }}
        >✕</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--lb-border)' }}>
        {['equipe','chat','partager','versions'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '6px 2px', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab===t ? 'var(--lb-accent)' : 'transparent'}`,
            color: tab===t ? 'var(--lb-accent)' : 'var(--lb-muted)',
            cursor: 'pointer', fontSize: 9, fontFamily: 'inherit', letterSpacing: '.5px',
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── ÉQUIPE ── */}
        {tab === 'equipe' && (
          <div>
            {!connected ? (
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--lb-muted)', marginBottom: 10 }}>
                  Rejoins une session pour collaborer en temps réel (LAN ou internet)
                </div>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ton nom"
                  style={inputStyle}
                />
                <input
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  placeholder="ID de la salle (ex: tp-optique-2025)"
                  style={{ ...inputStyle, marginTop: 6 }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
                <button onClick={handleJoin} style={btnPrimaryStyle}>
                  ⟶ Rejoindre / Créer
                </button>
                <div style={{
                  marginTop: 10, padding: 8, borderRadius: 4,
                  background: '#0a1628', border: '1px solid var(--lb-border)',
                  fontSize: 9, color: 'var(--lb-muted)',
                }}>
                  ✓ Fonctionne en LAN sans internet<br/>
                  ✓ Synchronisation automatique offline<br/>
                  ✓ Chiffrement peer-to-peer
                </div>
              </div>
            ) : (
              <div style={{ padding: 12 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 10,
                }}>
                  <span style={{ fontSize: 10, color: 'var(--lb-muted)' }}>
                    {(users.length || AVATARS.length) + 1} participants
                  </span>
                  <button onClick={leave} style={{
                    fontSize: 9, padding: '2px 8px',
                    background: 'transparent', border: '1px solid #3d1515',
                    color: '#ef4444', borderRadius: 3, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>
                    Quitter
                  </button>
                </div>

                {/* Toi */}
                <UserRow
                  initials={name.slice(0,2).toUpperCase()}
                  color="#00c9ff"
                  name={`${name} (toi)`}
                  role="Propriétaire"
                  status="édite"
                  statusColor="var(--lb-accent)"
                />

                {/* Autres participants (démo + yjs réels) */}
                {AVATARS.map(u => (
                  <UserRow key={u.initials} {...u} status="live" statusColor="var(--lb-success)" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 320 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: m.color, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 7, fontWeight: 700, color: '#fff',
                    }}>
                      {m.author.slice(0,1)}
                    </div>
                    <span style={{ fontSize: 10, color: m.color, fontWeight: 600 }}>{m.author}</span>
                    <span style={{ fontSize: 9, color: 'var(--lb-muted)', marginLeft: 'auto' }}>{m.time}</span>
                  </div>
                  <div style={{
                    fontSize: 10, color: 'var(--lb-text)',
                    background: '#0a1628', borderRadius: 4,
                    padding: '5px 8px', marginLeft: 21,
                    border: '1px solid var(--lb-border)',
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex', gap: 5, padding: 10,
              borderTop: '1px solid var(--lb-border)',
            }}>
              <input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Message..."
                style={{ ...inputStyle, flex: 1, margin: 0 }}
              />
              <button onClick={sendMessage} style={{
                padding: '5px 8px', borderRadius: 4,
                background: 'var(--lb-accent)', border: 'none',
                color: '#000', cursor: 'pointer', fontSize: 12,
              }}>↑</button>
            </div>
          </div>
        )}

        {/* ── PARTAGER ── */}
        {tab === 'partager' && (
          <div style={{ padding: 12 }}>
            <SectionLabel>LIEN DE PARTAGE</SectionLabel>
            <div style={{
              background: '#0a1628', border: '1px solid var(--lb-border)',
              borderRadius: 4, padding: '6px 8px', fontSize: 9,
              color: 'var(--lb-muted)', wordBreak: 'break-all',
              marginBottom: 8,
            }}>
              luxlab://join/{roomId || 'ma-salle'}
            </div>
            <button style={btnStyle} onClick={() =>
              navigator.clipboard?.writeText(`luxlab://join/${roomId || 'ma-salle'}`)
            }>
              ⊕ Copier le lien
            </button>

            <div style={{ marginTop: 12 }}>
              <SectionLabel>QR CODE (LAN)</SectionLabel>
              <div style={{
                background: '#fff', borderRadius: 4, padding: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
              }}>
                <QRPlaceholder room={roomId || 'ma-salle'} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--lb-muted)', textAlign: 'center' }}>
                Scanne depuis un autre appareil sur le même WiFi
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <SectionLabel>DROITS D'ACCÈS</SectionLabel>
              {['Éditeur complet','Lecture seule','TP guidé (restreint)'].map(r => (
                <div key={r} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 0', fontSize: 10,
                  borderBottom: '1px solid var(--lb-border)', color: 'var(--lb-muted)',
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    border: '1px solid var(--lb-border)', flexShrink: 0,
                  }}/>
                  {r}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VERSIONS ── */}
        {tab === 'versions' && (
          <div style={{ padding: 12 }}>
            <SectionLabel>HISTORIQUE</SectionLabel>
            {[
              { msg:'Ajout lentille L2',         author:'Kofi',     time:'14:45', hash:'a3f9' },
              { msg:'λ modifié → 632nm',          author:'Dr. Adjovi',time:'14:33', hash:'b21c' },
              { msg:'Source ajoutée',             author:'Toi',      time:'14:20', hash:'d8e1' },
              { msg:'Initialisation du projet',   author:'Toi',      time:'14:10', hash:'0001' },
            ].map((v, i) => (
              <div key={i} style={{
                padding: '7px 0', borderBottom: '1px solid var(--lb-border)',
                display: 'flex', gap: 8,
              }}>
                <div style={{
                  width: 2, background: i === 0 ? 'var(--lb-accent)' : 'var(--lb-border)',
                  borderRadius: 1, flexShrink: 0,
                }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--lb-text)', marginBottom: 2 }}>
                    {v.msg}
                  </div>
                  <div style={{
                    display: 'flex', gap: 6,
                    fontSize: 9, color: 'var(--lb-muted)',
                  }}>
                    <span>{v.author}</span>
                    <span>{v.time}</span>
                    <code style={{ color: 'var(--lb-accent)', marginLeft: 'auto' }}>
                      #{v.hash}
                    </code>
                  </div>
                </div>
              </div>
            ))}
            <button style={{ ...btnStyle, marginTop: 10 }}>
              ⊕ Créer un point de sauvegarde
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function UserRow({ initials, color, name, role, status, statusColor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 0', borderBottom: '1px solid var(--lb-border)',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: 'var(--lb-text)' }}>{name}</div>
        <div style={{ fontSize: 9, color: 'var(--lb-muted)' }}>{role}</div>
      </div>
      <span style={{
        fontSize: 9, padding: '2px 6px', borderRadius: 3,
        background: `${statusColor}18`, color: statusColor,
      }}>
        {status}
      </span>
    </div>
  )
}

function QRPlaceholder({ room }) {
  // QR code SVG minimaliste représentatif
  const seed = room.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const cells = Array.from({ length: 7 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => {
      if (r < 2 && c < 2) return 1
      if (r < 2 && c > 4) return 1
      if (r > 4 && c < 2) return 1
      return (seed + r * 7 + c) % 3 === 0 ? 1 : 0
    })
  )
  return (
    <svg width="56" height="56" viewBox="0 0 7 7">
      {cells.map((row, r) =>
        row.map((cell, c) =>
          cell ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#000"/> : null
        )
      )}
    </svg>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, letterSpacing: '.8px',
      color: 'var(--lb-muted)', marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '6px 8px',
  background: '#0a1628', border: '1px solid var(--lb-border)',
  borderRadius: 4, color: 'var(--lb-text)',
  fontSize: 10, fontFamily: 'inherit', outline: 'none',
}

const btnStyle = {
  width: '100%', padding: '6px 0',
  background: 'transparent', border: '1px solid var(--lb-border)',
  color: 'var(--lb-text)', borderRadius: 4,
  cursor: 'pointer', fontSize: 10, fontFamily: 'inherit',
}

const btnPrimaryStyle = {
  ...btnStyle,
  background: 'var(--lb-accent)', borderColor: 'var(--lb-accent)',
  color: '#000', fontWeight: 700, marginTop: 8,
}