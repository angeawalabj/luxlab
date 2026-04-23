import { useState, useEffect } from 'react'
import { useSimStore }          from '../../../store/useSimStore'

export default function ExperiencePanel({ experience, onClose }) {
  const [stepIdx,   setStepIdx]   = useState(0)
  const [completed, setCompleted] = useState([])
  const [feedback,  setFeedback]  = useState(null)
  const [answer,    setAnswer]    = useState('')
  const [showFinal, setShowFinal] = useState(false)
  const [pos,      setPos]      = useState({ x: window.innerWidth - 310, y: 60 })
  const [dragging, setDragging] = useState(false)
  const [dragStart,setDragStart]= useState({ mx:0, my:0, px:0, py:0 })
  const { components, isRunning } = useSimStore()

  const step  = experience.steps[stepIdx]
  const total = experience.steps.length
  const pct   = Math.round((completed.length / total) * 100)

  // Auto-validation en temps réel
useEffect(() => {
  const move = (e) => {
    if (!dragging) return
    setPos({
      x: Math.max(0, dragStart.px + e.clientX - dragStart.mx),
      y: Math.max(0, dragStart.py + e.clientY - dragStart.my),
    })
  }
  const up = () => setDragging(false)
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup',   up)
  return () => {
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup',   up)
  }
}, [dragging, dragStart])

  return (
    <div style={{
      position: 'fixed',       // fixed au lieu de absolute
      left:     pos.x,
      top:      pos.y,
      width:         290,
      maxHeight:     'calc(100vh - 80px)',
      background:    'var(--lb-surface)',
      border:        '1px solid var(--lb-border)',
      borderRadius:  10,
      zIndex:        30,
      display:       'flex',
      flexDirection: 'column',
      boxShadow:     '0 4px 20px rgba(0,0,0,.1)',
    }}>

      {/* Header */}
      <div style={{
        cursor: dragging ?'grabbing' : 'grab',
        padding:      '10px 14px',
        borderBottom: '1px solid var(--lb-border)',
        display:      'flex',
        alignItems:   'center',
        gap:          8,
      }}
      onMouseDown={(e) => {
        setDragging(true)
        setDragStart({ mx:e.clientX, my:e.clientY, px:pos.x, py:pos.y })
        e.preventDefault()
      }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--lb-text)' }}>
            {experience.title}
          </div>
          <div style={{ fontSize:9, color:'var(--lb-muted)', marginTop:2 }}>
            Étape {Math.min(stepIdx + 1, total)} / {total} · {pct}%
          </div>
        </div>
        <button onClick={onClose} style={{
          background:'transparent', border:'none',
          color:'var(--lb-muted)', cursor:'pointer', fontSize:14,
        }}>✕</button>
      </div>

      {/* Barre de progression */}
      <div style={{ height:3, background:'var(--lb-border)', flexShrink:0 }}>
        <div style={{
          height:     '100%',
          width:      `${pct}%`,
          background: pct === 100 ? '#27ae60' : 'var(--lb-text)',
          transition: 'width .4s',
        }}/>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:14 }}>

        {/* Théorie */}
        <div style={{
          background:   'var(--lb-bg)',
          borderRadius: 6,
          padding:      '8px 10px',
          marginBottom: 12,
          fontSize:     10,
          color:        'var(--lb-muted)',
          lineHeight:   1.6,
          borderLeft:   '2px solid var(--lb-border-md)',
        }}>
          {experience.theory}
        </div>

        {/* Objectifs */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, letterSpacing:'.6px',
            color:'var(--lb-muted)', marginBottom:6 }}>
            OBJECTIFS
          </div>
          {experience.objectives.map((obj, i) => (
            <div key={i} style={{
              display:      'flex',
              alignItems:   'flex-start',
              gap:          6,
              fontSize:     10,
              color:        'var(--lb-muted)',
              marginBottom: 4,
            }}>
              <span style={{ color:'var(--lb-hint)', flexShrink:0 }}>
                {i + 1}.
              </span>
              {obj}
            </div>
          ))}
        </div>

        {/* Étapes */}
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:9, letterSpacing:'.6px',
            color:'var(--lb-muted)', marginBottom:6 }}>
            ÉTAPES
          </div>
          {experience.steps.map((s, i) => {
            const done    = completed.includes(s.id)
            const current = i === stepIdx && !showFinal
            const future  = i > stepIdx

            return (
              <div key={s.id} style={{
                display:      'flex',
                gap:          8,
                padding:      '6px 0',
                borderBottom: '1px solid var(--lb-border)',
                opacity:      future ? .4 : 1,
              }}>
                {/* Indicateur */}
                <div style={{
                  width:          20,
                  height:         20,
                  borderRadius:   '50%',
                  flexShrink:     0,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  background:     done
                    ? '#27ae60'
                    : current ? 'var(--lb-text)' : 'var(--lb-border)',
                  color:          done || current ? '#fff' : 'var(--lb-muted)',
                  fontSize:       done ? 10 : 9,
                  fontWeight:     600,
                }}>
                  {done ? '✓' : i + 1}
                </div>

                <div style={{ flex:1 }}>
                  <div style={{
                    fontSize:    10,
                    fontWeight:  current ? 600 : 400,
                    color:       current ? 'var(--lb-text)' : 'var(--lb-muted)',
                    lineHeight:  1.4,
                    marginBottom: current && s.hint ? 4 : 0,
                  }}>
                    {s.title || s.instruction}
                  </div>
                  {current && !done && (
                    <div style={{
                      fontSize:    10,
                      color:       'var(--lb-muted)',
                      lineHeight:  1.4,
                      marginBottom: 4,
                    }}>
                      {s.instruction}
                    </div>
                  )}
                  {current && s.hint && (
                    <div style={{
                      fontSize:   9,
                      color:      '#3498db',
                      fontStyle:  'italic',
                    }}>
                      💡 {s.hint}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            padding:      '8px 10px',
            borderRadius: 6,
            marginBottom: 10,
            background:   feedback.ok ? '#eafaf1' : '#fef9e7',
            border:       `1px solid ${feedback.ok ? '#a9dfbf' : '#f9e79f'}`,
            fontSize:     10,
            color:        feedback.ok ? '#1e8449' : '#7d6608',
          }}>
            {feedback.ok ? '✓ ' : '→ '}{feedback.msg}
          </div>
        )}

        {/* Vérification manuelle */}
        {!showFinal && step && !completed.includes(step.id) && (
          <button
            onClick={() => {
              if (!validateStep(step, components, isRunning)) {
                setFeedback({ ok:false, msg: step.onError })
                setTimeout(() => setFeedback(null), 3000)
              }
            }}
            style={{
              width:        '100%',
              padding:      '6px 0',
              borderRadius: 4,
              border:       '1px solid var(--lb-border)',
              background:   'transparent',
              color:        'var(--lb-muted)',
              fontSize:     10,
              cursor:       'pointer',
              fontFamily:   'var(--font-ui)',
              marginBottom: 8,
            }}
          >
            Vérifier cette étape
          </button>
        )}

        {/* Question finale */}
        {showFinal && experience.finalAssessment && (
          <div style={{
            background:   'var(--lb-bg)',
            borderRadius: 8,
            padding:      12,
            border:       '1px solid var(--lb-border-md)',
          }}>
            <div style={{
              fontSize:     10,
              fontWeight:   600,
              color:        'var(--lb-text)',
              marginBottom: 8,
            }}>
              Question de synthèse
            </div>
            <div style={{
              fontSize:    10,
              color:       'var(--lb-muted)',
              marginBottom: 10,
              lineHeight:  1.5,
            }}>
              {experience.finalAssessment.question}
            </div>
            {experience.finalAssessment.hint && (
              <div style={{
                fontSize:     9,
                color:        '#3498db',
                marginBottom: 8,
                fontStyle:    'italic',
              }}>
                💡 {experience.finalAssessment.hint}
              </div>
            )}
            <input
              type="number"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={`Réponse en ${experience.finalAssessment.unit || '...'}`}
              style={{
                width:        '100%',
                padding:      '6px 8px',
                background:   'var(--lb-surface)',
                border:       '1px solid var(--lb-border)',
                borderRadius: 4,
                color:        'var(--lb-text)',
                fontSize:     11,
                fontFamily:   'var(--font-mono)',
                outline:      'none',
                marginBottom: 8,
                boxSizing:    'border-box',
              }}
            />
            <button
              onClick={() => {
                const val = parseFloat(answer)
                const exp = experience.finalAssessment
                const ok  = !isNaN(val) &&
                  Math.abs(val - exp.answer) <= (exp.tolerance || 1)
                setFeedback({
                  ok,
                  msg: ok
                    ? `Correct ! Réponse : ${exp.answer} ${exp.unit}`
                    : `Incorrect. ${exp.hint || 'Relis la théorie.'}`,
                })
              }}
              style={{
                width:        '100%',
                padding:      '7px 0',
                borderRadius: 4,
                border:       'none',
                background:   'var(--lb-text)',
                color:        '#fff',
                fontSize:     11,
                fontWeight:   600,
                cursor:       'pointer',
                fontFamily:   'var(--font-ui)',
              }}
            >
              Soumettre
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Validation d'une étape ───────────────────────────────────────

function validateStep(step, components, isRunning) {
  const v = step.validate
  if (!v) return false

  try {
    switch (v.type) {

      case 'component-exists':
        return components.some(c => c.type === v.componentType)

      case 'param-range': {
        const comp = components.find(c => c.type === v.componentType)
        if (!comp) return false
        const val = comp.params?.[v.param]
        return typeof val === 'number' && val >= v.min && val <= v.max
      }

      case 'component-count': {
        const count = components.filter(c => c.type === v.componentType).length
        return count >= (v.min || 1)
      }

      case 'simulation-running':
        return isRunning

      case 'all':
        return (v.conditions || []).every(
          cond => validateStep({ validate: cond }, components, isRunning)
        )

      case 'any':
        return (v.conditions || []).some(
          cond => validateStep({ validate: cond }, components, isRunning)
        )

      default:
        return false
    }
  } catch {
    return false
  }
}