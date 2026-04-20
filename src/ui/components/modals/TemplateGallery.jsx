import { useState }   from 'react'
import { registry }   from '../../../core/plugin-api'
import { useSimStore } from '../../../store/useSimStore'

const LEVELS = ['Tous', 'débutant', 'intermédiaire', 'avancé']
const TABS   = [
  { id:'templates',   label:'Templates' },
  { id:'experiences', label:'Expériences' },
]

export default function TemplateGallery({ onClose }) {
  const [tab,    setTab]    = useState('templates')
  const [level,  setLevel]  = useState('Tous')
  const [search, setSearch] = useState('')
  const { setComponents, clearResults } = useSimStore()

  const allTemplates   = registry.getAllTemplates()
  const allExperiences = registry.getAllExperiences()

  const filter = (items) => items.filter(item => {
    const matchLevel  = level === 'Tous' || item.level === level
    const matchSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchLevel && matchSearch
  })

  const loadTemplate = (t) => {
    if (!window.confirm(`Charger "${t.title}" ? Le projet actuel sera remplacé.`)) return
    setComponents(t.components || [])
    clearResults()
    onClose()
  }
const loadItem = (item, type) => {
    if (type === 'experiences') {
      // Lancer l'expérience en mode guidé
      const { setComponents, clearResults } = useSimStore.getState()
      if (item.initialState?.components?.length > 0) {
        setComponents(item.initialState.components)
      } else {
        setComponents([])
      }
      clearResults()
      onLaunchExperience?.(item)
      return
    }
    // Template normal
    if (!window.confirm(`Charger "${item.title}" ? Le projet actuel sera remplacé.`)) return
    useSimStore.getState().setComponents(item.components || [])
    useSimStore.getState().clearResults()
    onClose()
  }
  const items = tab === 'templates' ? filter(allTemplates) : filter(allExperiences)

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(44,62,80,.35)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:150,
    }}>
      <div style={{
        width:700, maxHeight:'85vh',
        background:'var(--lb-surface)',
        border:'1px solid var(--lb-border)',
        borderRadius:12,
        display:'flex', flexDirection:'column',
        overflow:'hidden',
        boxShadow:'0 8px 32px rgba(0,0,0,.12)',
      }}>

        {/* Header */}
        <div style={{
          padding:'14px 18px',
          borderBottom:'1px solid var(--lb-border)',
          display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--lb-text)' }}>
              Bibliothèque
            </div>
            <div style={{ fontSize:10, color:'var(--lb-muted)' }}>
              {allTemplates.length} templates · {allExperiences.length} expériences
            </div>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{
              flex:1, padding:'6px 10px',
              background:'var(--lb-bg)',
              border:'1px solid var(--lb-border)',
              borderRadius:6, color:'var(--lb-text)',
              fontSize:11, fontFamily:'var(--font-ui)', outline:'none',
            }}
          />
          <button onClick={onClose} style={{
            background:'transparent', border:'none',
            color:'var(--lb-muted)', fontSize:16, cursor:'pointer',
          }}>✕</button>
        </div>

        {/* Tabs + filtres */}
        <div style={{
          display:'flex', alignItems:'center',
          padding:'0 18px',
          borderBottom:'1px solid var(--lb-border)',
          gap:0,
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'8px 14px', background:'transparent', border:'none',
              borderBottom:`2px solid ${tab===t.id ? 'var(--lb-text)' : 'transparent'}`,
              color:tab===t.id ? 'var(--lb-text)' : 'var(--lb-muted)',
              fontSize:11, cursor:'pointer', fontFamily:'var(--font-ui)',
            }}>
              {t.label}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{
                padding:'3px 8px', borderRadius:4, fontSize:9,
                border:'1px solid',
                borderColor: level===l ? 'var(--lb-border-md)' : 'transparent',
                background:  level===l ? 'var(--lb-bg)' : 'transparent',
                color:       level===l ? 'var(--lb-text)' : 'var(--lb-muted)',
                cursor:'pointer', fontFamily:'var(--font-ui)',
              }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Grille */}
        <div style={{
          flex:1, overflowY:'auto', padding:18,
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
          gap:10, alignContent:'start',
        }}>
          {items.length === 0 ? (
            <div style={{
              gridColumn:'1/-1', textAlign:'center',
              padding:40, color:'var(--lb-hint)', fontSize:11,
            }}>
              Aucun résultat
            </div>
          ) : items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              type={tab}
              onLoad={() => loadTemplate(item)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item, type }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:   hover ? 'var(--lb-bg)' : 'var(--lb-surface)',
        border:       `1px solid ${hover ? 'var(--lb-border-md)' : 'var(--lb-border)'}`,
        borderRadius: 8,
        padding:      12,
        display:      'flex',
        flexDirection:'column',
        gap:          8,
        transition:   'all .12s',
      }}
    >
      {/* Preview */}
      <div style={{
        height:       48,
        background:   'var(--lb-bg)',
        borderRadius: 4,
        border:       '1px solid var(--lb-border)',
        display:      'flex',
        alignItems:   'center',
        justifyContent:'center',
        gap:          6,
        fontSize:     16,
        color:        'var(--lb-border-md)',
      }}>
        {(item.components || []).slice(0, 4).map((c, i) => (
          <span key={i} style={{ opacity:.7 }}>
            {getIcon(c.type)}
          </span>
        ))}
        {type === 'experiences' && (
          <span style={{ fontSize:10, color:'var(--lb-accent-hl)', opacity:.7 }}>▶</span>
        )}
      </div>

      {/* Infos */}
      <div>
        <div style={{
          display:'flex', alignItems:'center', gap:4, marginBottom:3,
        }}>
          <span style={{
            fontSize:11, fontWeight:600,
            color:'var(--lb-text)', flex:1,
          }}>
            {item.title}
          </span>
          {item.certified && (
            <span style={{
              fontSize:8, padding:'1px 5px', borderRadius:3,
              background:'#eafaf1', color:'#1e8449',
              border:'1px solid #a9dfbf',
            }}>✓</span>
          )}
        </div>
        <div style={{ fontSize:9, color:'var(--lb-muted)', lineHeight:1.5 }}>
          {item.description}
        </div>
      </div>

      {/* Tags + niveau */}
      <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
        {item.level && (
          <span style={{
            fontSize:8, padding:'1px 5px', borderRadius:3,
            background:'var(--lb-bg)',
            border:'1px solid var(--lb-border)',
            color:'var(--lb-muted)',
          }}>
            {item.level}
          </span>
        )}
        {(item.estimatedDuration) && (
          <span style={{
            fontSize:8, padding:'1px 5px', borderRadius:3,
            background:'var(--lb-bg)',
            border:'1px solid var(--lb-border)',
            color:'var(--lb-muted)',
          }}>
            {item.estimatedDuration}
          </span>
        )}
      </div>

      {/* Bouton */}
      <button  onClick={() => loadItem(item, type)} style={{
        width:'100%', padding:'6px 0',
        borderRadius:4, border:'1px solid var(--lb-border)',
        background:'transparent',
        color:'var(--lb-text)',
        fontSize:10, cursor:'pointer',
        fontFamily:'var(--font-ui)',
        transition:'all .12s',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.background  = 'var(--lb-text)'
          e.currentTarget.style.color       = '#fff'
          e.currentTarget.style.borderColor = 'var(--lb-text)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background  = 'transparent'
          e.currentTarget.style.color       = 'var(--lb-text)'
          e.currentTarget.style.borderColor = 'var(--lb-border)'
        }}
      >
        {type === 'templates' ? '⟶ Charger' : '▶ Lancer l\'expérience'}
      </button>
    </div>
  )
}

function getIcon(type) {
  const icons = {
    source:'✦', lens:'◎', mirror:'⌒', prism:'▽',
    screen:'▪', slit2:'⫿', grating:'|||',
    polarizer:'↕', beamsplitter:'⊡',
  }
  return icons[type] || '○'
}