import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Phase 0 → 0ms  : montage
    // Phase 1 → 200ms : rect TL apparaît
    // Phase 2 → 700ms : line-a se trace
    // Phase 3 → 1200ms: line-b se trace
    // Phase 4 → 1700ms: rect BR apparaît
    // Phase 5 → 2000ms: nom apparaît
    // Phase 6 → 2600ms: tagline apparaît
    // Phase 7 → 3400ms: fade out → onDone
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 1700),
      setTimeout(() => setPhase(5), 2000),
      setTimeout(() => setPhase(6), 2600),
      setTimeout(() => setPhase(7), 3400),
      setTimeout(() => onDone?.(), 3900),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#ffffff',
      opacity: phase >= 7 ? 0 : 1,
      transition: 'opacity 0.5s ease',
      zIndex: 9999,
    }}>

      {/* Grille de fond — identique à ton HTML */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(to right, #f0f0f0 1px, transparent 1px),
          linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        animation: 'gridMove 30s linear infinite',
      }}/>

      <style>{`
        @keyframes gridMove {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ textAlign: 'center', position: 'relative' }}>

        {/* Logo SVG — fidèle à ton original */}
        <svg
          width="120" height="120"
          viewBox="0 0 100 100"
          style={{ display: 'block', margin: '0 auto 20px' }}
        >
          {/* Rect haut-gauche */}
          <rect
            x="10" y="10" width="25" height="25"
            fill="#2c3e50"
            style={{
              opacity: phase >= 1 ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />

          {/* Line A : de (35,22.5) → (77.5,22.5) → (77.5,65) */}
          <path
            d="M 35 22.5 L 77.5 22.5 L 77.5 65"
            fill="none"
            stroke="#2c3e50"
            strokeWidth="4"
            strokeLinecap="square"
            style={{
              strokeDasharray: 200,
              strokeDashoffset: phase >= 2 ? 0 : 200,
              transition: 'stroke-dashoffset 0.7s ease-out',
            }}
          />

          {/* Line B : de (65,77.5) → (22.5,77.5) → (22.5,35) */}
          <path
            d="M 65 77.5 L 22.5 77.5 L 22.5 35"
            fill="none"
            stroke="#2c3e50"
            strokeWidth="4"
            strokeLinecap="square"
            style={{
              strokeDasharray: 200,
              strokeDashoffset: phase >= 3 ? 0 : 200,
              transition: 'stroke-dashoffset 0.7s ease-out',
            }}
          />

          {/* Rect bas-droit */}
          <rect
            x="65" y="65" width="25" height="25"
            fill="#2c3e50"
            style={{
              opacity: phase >= 4 ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
        </svg>

        {/* Nom */}
        <div style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#2c3e50',
          letterSpacing: '2px',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
          opacity: phase >= 5 ? 1 : 0,
          transform: phase >= 5 ? 'translateY(0)' : 'translateY(16px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          LuxLab
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: 'Courier New, Courier, monospace',
          fontSize: '0.85rem',
          color: '#7f8c8d',
          marginTop: '10px',
          opacity: phase >= 6 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}>
          {'>'} initializing_physics_engine... OK
        </div>

      </div>
    </div>
  )
}