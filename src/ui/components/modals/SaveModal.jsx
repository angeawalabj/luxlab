import { useState } from 'react'

export default function SaveModal({ onSave, onClose }) {
  const [meta, setMeta] = useState({
    title:       '',
    author:      '',
    institution: '',
    license:     'CC-BY-4.0',
    tags:        '',
  })

  const handleSave = () => {
    onSave({
      ...meta,
      tags: meta.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'rgba(44,62,80,.4)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      zIndex:         200,
    }}>
      <div style={{
        width:        480,
        background:   'var(--lb-surface)',
        border:       '1px solid var(--lb-border)',
        borderRadius: 10,
        overflow:     'hidden',
        boxShadow:    '0 8px 32px rgba(0,0,0,.12)',
      }}>

        {/* Header */}
        <div style={{
          padding:       '14px 18px',
          borderBottom:  '1px solid var(--lb-border)',
          display:       'flex',
          alignItems:    'center',
        }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--lb-text)', flex:1 }}>
            Enregistrer le projet
          </span>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Champs */}
        <div style={{ padding:'18px' }}>
          {[
            { key:'title',       label:'Titre',         placeholder:'Mon expérience Young' },
            { key:'author',      label:'Auteur',         placeholder:'Nom Prénom' },
            { key:'institution', label:'Institution',    placeholder:'Université de ...' },
            { key:'tags',        label:'Tags (virgule)', placeholder:'optique, Young, L1' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:10,
                color:'var(--lb-muted)', marginBottom:4 }}>
                {f.label}
              </label>
              <input
                type="text"
                value={meta[f.key]}
                placeholder={f.placeholder}
                onChange={e => setMeta(m => ({ ...m, [f.key]: e.target.value }))}
                style={inputStyle}
              />
            </div>
          ))}

          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:10,
              color:'var(--lb-muted)', marginBottom:4 }}>
              Licence
            </label>
            <select
              value={meta.license}
              onChange={e => setMeta(m => ({ ...m, license: e.target.value }))}
              style={{ ...inputStyle, cursor:'pointer' }}
            >
              {['CC-BY-4.0','CC-BY-SA-4.0','MIT','Propriétaire'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding:       '12px 18px',
          borderTop:     '1px solid var(--lb-border)',
          display:       'flex',
          justifyContent:'flex-end',
          gap:           8,
        }}>
          <button onClick={onClose} style={cancelBtnStyle}>
            Annuler
          </button>
          <button onClick={handleSave} style={saveBtnStyle}>
            Enregistrer .lux
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width:        '100%',
  padding:      '7px 10px',
  background:   'var(--lb-bg)',
  border:       '1px solid var(--lb-border)',
  borderRadius: 4,
  color:        'var(--lb-text)',
  fontSize:     12,
  fontFamily:   'var(--font-ui)',
  outline:      'none',
  boxSizing:    'border-box',
}

const closeBtnStyle = {
  background: 'transparent',
  border:     'none',
  color:      'var(--lb-muted)',
  fontSize:   16,
  cursor:     'pointer',
  padding:    4,
}

const cancelBtnStyle = {
  padding:      '7px 16px',
  borderRadius: 4,
  border:       '1px solid var(--lb-border)',
  background:   'transparent',
  color:        'var(--lb-muted)',
  fontSize:     11,
  cursor:       'pointer',
  fontFamily:   'var(--font-ui)',
}

const saveBtnStyle = {
  padding:      '7px 16px',
  borderRadius: 4,
  border:       'none',
  background:   'var(--lb-text)',
  color:        '#fff',
  fontSize:     11,
  fontWeight:   600,
  cursor:       'pointer',
  fontFamily:   'var(--font-ui)',
}