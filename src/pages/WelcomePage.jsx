import { useParams, useNavigate } from 'react-router-dom'

export default function WelcomePage() {
  const { ward, room, bed } = useParams()
  const navigate = useNavigate()

  function choose(type) {
    sessionStorage.setItem(`userType-${room}-${bed}`, type)
    if (type === 'patient') navigate(`/q/${ward}/${room}/${bed}/patient`)
    else navigate(`/q/${ward}/${room}/${bed}/visitor`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F6E56', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🏥</div>
      <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, textAlign: 'center' }}>CareConnect</h1>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '6px 0 0', textAlign: 'center' }}>Room {room} · Bed {bed.toUpperCase()} · Ward {ward.toUpperCase()}</p>

      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginTop: 40, marginBottom: 20, fontWeight: 500 }}>Who are you?</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button onClick={() => choose('patient')} style={{ padding: '18px 0', borderRadius: 14, background: '#fff', color: '#0F6E56', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          🛏️ I am the patient
        </button>
        <button onClick={() => choose('visitor')} style={{ padding: '18px 0', borderRadius: 14, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          👥 I am a visitor
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 40 }}>Your choice will be remembered for this session</p>
    </div>
  )
}