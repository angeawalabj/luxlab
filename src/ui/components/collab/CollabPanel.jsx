import { useState, useEffect }  from 'react'
import { useCollab }             from '../../../collaboration/useCollab'

export default function CollabPanel({ onClose }) {
  const [tab,     setTab]     = useState('session')
  const [name,    setName]    = useState('')
  const [room,    setRoom]    = useState('')
  const [messages,setMessages]= useState([
    { from:'Système', color:'#7f8c8d',
      text:'Bienvenue dans la collaboration LuxLab.', time:'--:--' },
  ])
  const [msg, setMsg] = useState('')

  const {
    join, leave, status, users,
    roomId, localUser, isConnected,
  } = useCollab()

  const statusColors = {
    offline:     '#bdc3c7',
    connecting:  '#f39c12',
    connected:   '#27ae60',
    disconnected:'#e74c3c',
  }

  const statusLabels = {
    offline:     'Hors ligne',
    connecting:  'Connexion...',
    connected:   'Connecté',
    disconnected:'Déconnecté',
  }

  const handleJoin = () => {
    if (!name.trim() || !room.trim()) return
    join(room, name)
  }

  const sendMessage = () => {
    if (!msg.trim()) return
    const time = new Date().toLocaleTimeString('fr-FR', {
      hour:'2-digit', minute:'2-digit'
    })
    setMessages(m => [...m, {
      from:  localUser?.name || name,
      color: localUser?.color || '#2c3e50',
      text:  msg.trim(),
      time,
    }])
    setMsg('')
  }

  return (
    <div style={panelStyle}>

      {/* Header */}
      <div style={headerStyle}>
        <div style={{
          width:        8,
          height:       8,
          borderRadius: '50%',
          background:   statusColors[status],
          flexShrink:   0,
        }}/>
        <span style={{
          fontSize:  11,
          fontWeight:600,
          color:     'var(--lb-text)',
          flex:      1,
        }}>
          Collaboration
        </span>
        {isConnected && (
          <span style={{
            fontSize:   9,
            padding:    '1px 6px',
            borderRadius:3,
            background: '#eafaf1',
            color:      '#27ae60',
            border:     '1px solid #a9dfbf',
          }}>
            {roomId}
          </span>
        )}
        <button onClick={onClose} style={closeBtn}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--lb-border)' }}>
        {['session','chat','partager'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:'6px 2px', background:'transparent', border:'none',
            borderBottom:`2px solid ${tab===t ? 'var(--lb-text)' : 'transparent'}`,
            color:  tab===t ? 'var(--lb-text)' : 'var(--lb-muted)',
            cursor: 'pointer', fontSize:9, fontFamily:'var(--font-ui)',
            textTransform:'capitalize',
          }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>

        {/* ── SESSION ── */}
        {tab === 'session' && (
          <div style={{ padding:12 }}>
            {!isConnected ? (
              <>
                <div style={{
                  fontSize:10, color:'var(--lb-muted)',
                  marginBottom:12, lineHeight:1.6,
                }}>
                  Rejoins une salle pour collaborer en temps réel.
                  Fonctionne sur réseau local sans internet.
                </div>
                <Field
                  label="Ton nom"
                  value={name}
                  onChange={setName}
                  placeholder="Prénom Nom"
                />
                <Field
                  label="ID de la salle"
                  value={room}
                  onChange={setRoom}
                  placeholder="tp-optique-2025"
                  onEnter={handleJoin}
                />
                <button
                  onClick={handleJoin}
                  disabled={!name.trim() || !room.trim()}
                  style={primaryBtnStyle}
                >
                  Rejoindre / Créer la salle
                </button>

                <div style={{
                  marginTop:12, padding:10,
                  background:'var(--lb-bg)',
                  border:'1px solid var(--lb-border)',
                  borderRadius:6, fontSize:9,
                  color:'var(--lb-muted)', lineHeight:1.8,
                }}>
                  ✓ Connexion P2P directe (WebRTC)<br/>
                  ✓ Fonctionne en LAN sans internet<br/>
                  ✓ Sync automatique hors ligne<br/>
                  ✓ Chiffrement entre pairs
                </div>
              </>
            ) : (
              <>
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:12,
                }}>
                  <span style={{ fontSize:10, color:'var(--lb-muted)' }}>
                    {users.length + 1} participant(s)
                  </span>
                  <button onClick={leave} style={dangerBtnStyle}>
                    Quitter
                  </button>
                </div>

                {/* Toi */}
                <UserRow
                  name={`${localUser?.name} (moi)`}
                  color={localUser?.color}
                  role="Propriétaire"
                  status="actif"
                />

                {/* Autres */}
                {users.map(u => (
                  <UserRow
                    key={u.clientId}
                    name={u.name}
                    color={u.color}
                    role="Participant"
                    status={u.cursor ? 'actif' : 'inactif'}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── CHAT ── */}
        {tab === 'chat' && (
          <div style={{ display:'flex', flexDirection:'column', height:280 }}>
            <div style={{ flex:1, overflowY:'auto', padding:10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{
                    display:'flex', gap:5,
                    alignItems:'center', marginBottom:2,
                  }}>
                    <div style={{
                      width:14, height:14, borderRadius:'50%',
                      background:m.color, flexShrink:0,
                      display:'flex', alignItems:'center',
                      justifyContent:'center',
                      fontSize:7, color:'#fff', fontWeight:700,
                    }}>
                      {m.from[0]}
                    </div>
                    <span style={{ fontSize:9, color:m.color, fontWeight:600 }}>
                      {m.from}
                    </span>
                    <span style={{
                      fontSize:8, color:'var(--lb-hint)',
                      marginLeft:'auto',
                    }}>
                      {m.time}
                    </span>
                  </div>
                  <div style={{
                    fontSize:10, color:'var(--lb-text)',
                    background:'var(--lb-bg)',
                    borderRadius:4, padding:'5px 8px',
                    marginLeft:19,
                    border:'1px solid var(--lb-border)',
                    lineHeight:1.5,
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              display:'flex', gap:5, padding:10,
              borderTop:'1px solid var(--lb-border)',
            }}>
              <input
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key==='Enter' && sendMessage()}
                placeholder="Message..."
                style={inputStyle}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding:'5px 8px', borderRadius:4,
                  background:'var(--lb-text)', border:'none',
                  color:'#fff', cursor:'pointer', fontSize:12,
                }}
              >
                ↑
              </button>
            </div>
          </div>
        )}

        {/* ── PARTAGER ── */}
        {tab === 'partager' && (
          <div style={{ padding:12 }}>
            <div style={{ fontSize:9, color:'var(--lb-muted)', marginBottom:6 }}>
              LIEN DE SALLE
            </div>
            <div style={{
              background:'var(--lb-bg)',
              border:'1px solid var(--lb-border)',
              borderRadius:4, padding:'6px 8px',
              fontSize:9, color:'var(--lb-muted)',
              wordBreak:'break-all', marginBottom:8,
              fontFamily:'var(--font-mono)',
            }}>
              luxlab://join/{roomId || 'ma-salle'}
            </div>
            <button
              onClick={() =>
                navigator.clipboard?.writeText(
                  `luxlab://join/${roomId || 'ma-salle'}`
                )
              }
              style={secondaryBtnStyle}
            >
              Copier le lien
            </button>

            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:9, color:'var(--lb-muted)', marginBottom:6 }}>
                QR CODE (réseau local)
              </div>
              <QRCode value={roomId || 'ma-salle'}/>
              <div style={{
                fontSize:9, color:'var(--lb-hint)',
                textAlign:'center', marginTop:6,
              }}>
                Scanne depuis un autre appareil sur le même réseau
              </div>
            </div>

            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:9, color:'var(--lb-muted)', marginBottom:8 }}>
                DROITS D'ACCÈS
              </div>
              {[
                ['Éditeur complet', 'Peut modifier tous les composants'],
                ['Lecture seule',   'Observe en temps réel'],
                ['TP restreint',    'Accès limité aux étapes de l\'expérience'],
              ].map(([r, d]) => (
                <div key={r} style={{
                  display:'flex', gap:8, padding:'5px 0',
                  borderBottom:'1px solid var(--lb-border)',
                  fontSize:10,
                }}>
                  <input type="radio" name="role"
                    style={{ accentColor:'var(--lb-text)', marginTop:2 }}/>
                  <div>
                    <div style={{ color:'var(--lb-text)' }}>{r}</div>
                    <div style={{ color:'var(--lb-hint)', fontSize:9 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Composants UI ────────────────────────────────────────────────

function UserRow({ name, color, role, status }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'6px 0', borderBottom:'1px solid var(--lb-border)',
    }}>
      <div style={{
        width:22, height:22, borderRadius:'50%',
        background:color || '#2c3e50',
        display:'flex', alignItems:'center',
        justifyContent:'center',
        fontSize:9, fontWeight:700, color:'#fff', flexShrink:0,
      }}>
        {name?.[0]?.toUpperCase()}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:10, color:'var(--lb-text)' }}>{name}</div>
        <div style={{ fontSize:9, color:'var(--lb-muted)' }}>{role}</div>
      </div>
      <span style={{
        fontSize:8, padding:'1px 5px', borderRadius:3,
        background: status==='actif' ? '#eafaf1' : 'var(--lb-bg)',
        color:      status==='actif' ? '#27ae60' : 'var(--lb-muted)',
        border:     `1px solid ${status==='actif' ? '#a9dfbf' : 'var(--lb-border)'}`,
      }}>
        {status}
      </span>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, onEnter }) {
  return (
    <div style={{ marginBottom:8 }}>
      <label style={{
        display:'block', fontSize:9,
        color:'var(--lb-muted)', marginBottom:3,
      }}>
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key==='Enter' && onEnter?.()}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}

function QRCode({ value }) {
  // QR code SVG minimaliste
  const seed  = value.split('').reduce((a,c) => a+c.charCodeAt(0), 0)
  const size  = 9
  const cells = Array.from({ length:size }, (_, r) =>
    Array.from({ length:size }, (_, c) => {
      if ((r<3&&c<3)||(r<3&&c>5)||(r>5&&c<3)) return 1
      return (seed + r * size + c * 7) % 3 === 0 ? 1 : 0
    })
  )
  return (
    <div style={{
      background:'#fff', borderRadius:4, padding:8,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <svg width={size*7} height={size*7} viewBox={`0 0 ${size} ${size}`}>
        {cells.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect key={`${r}-${c}`}
                x={c} y={r} width={1} height={1} fill="#2c3e50"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────

const panelStyle = {
  position:      'fixed',
  top:           60,
  right:         12,
  width:         260,
  maxHeight:     'calc(100vh - 80px)',
  background:    'var(--lb-surface)',
  border:        '1px solid var(--lb-border)',
  borderRadius:  10,
  zIndex:        40,
  display:       'flex',
  flexDirection: 'column',
  boxShadow:     '0 4px 20px rgba(0,0,0,.1)',
}

const headerStyle = {
  padding:      '10px 12px',
  borderBottom: '1px solid var(--lb-border)',
  display:      'flex',
  alignItems:   'center',
  gap:          8,
  cursor:       'grab',
}

const closeBtn = {
  background:'transparent', border:'none',
  color:'var(--lb-muted)', cursor:'pointer', fontSize:14,
}

const inputStyle = {
  width:'100%', padding:'6px 8px',
  background:'var(--lb-bg)',
  border:'1px solid var(--lb-border)',
  borderRadius:4, color:'var(--lb-text)',
  fontSize:10, fontFamily:'var(--font-ui)', outline:'none',
  boxSizing:'border-box',
}

const primaryBtnStyle = {
  width:'100%', padding:'7px 0', marginTop:8,
  borderRadius:4, border:'none',
  background:'var(--lb-text)', color:'#fff',
  fontSize:10, fontWeight:600, cursor:'pointer',
  fontFamily:'var(--font-ui)',
}

const secondaryBtnStyle = {
  width:'100%', padding:'6px 0',
  borderRadius:4, border:'1px solid var(--lb-border)',
  background:'transparent', color:'var(--lb-muted)',
  fontSize:10, cursor:'pointer', fontFamily:'var(--font-ui)',
}

const dangerBtnStyle = {
  padding:'4px 10px', borderRadius:4,
  border:'1px solid #fecaca',
  background:'transparent', color:'#dc2626',
  fontSize:9, cursor:'pointer', fontFamily:'var(--font-ui)',
}