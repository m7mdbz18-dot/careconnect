import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const services = [
  { id: 1, icon: '🧹', name: 'Full room clean', desc: 'Complete cleaning of the room' },
  { id: 2, icon: '🛏️', name: 'Bed linen change', desc: 'Fresh sheets and pillowcases' },
  { id: 3, icon: '🚿', name: 'Bathroom clean', desc: 'Bathroom sanitization only' },
  { id: 4, icon: '🗑️', name: 'Trash removal', desc: 'Empty bins and replace bags' },
  { id: 5, icon: '🧴', name: 'Toiletries restock', desc: 'Soap, shampoo, towels' },
]

export default function HousekeepingRequest() {
  const { ward, room, bed } = useParams()
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function toggle(id) {
    setSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id])
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#0F6E56', margin: 0, fontSize: 22 }}>Request sent!</h2>
        <p style={{ color: '#888', textAlign: 'center', marginTop: 8 }}>Housekeeping has been notified</p>
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: '14px 18px', marginTop: 16, width: '100%', maxWidth: 340 }}>
          {services.filter(s => selected.includes(s.id)).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '0.5px solid #f5f5f5' }}>
              <span>{s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{s.name}</span>
            </div>
          ))}
        </div>
        <p style={{ color: '#aaa', fontSize: 12, marginTop: 12 }}>Room {room} · Bed {bed.toUpperCase()}</p>
        <button onClick={() => navigate(`/q/${ward}/${room}/${bed}`)} style={{ marginTop: 20, padding: '12px 32px', borderRadius: 10, background: '#0F6E56', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Housekeeping</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Room {room} · Bed {bed.toUpperCase()}</p>
        </div>
      </div>

      <div style={{ padding: '10px 16px', background: '#E1F5EE', fontSize: 12, color: '#085041' }}>
        ✔ Select everything you need — multiple choices allowed
      </div>

      <div style={{ padding: 16 }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>What do you need?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map(s => {
            const isSelected = selected.includes(s.id)
            return (
              <div key={s.id} onClick={() => toggle(s.id)} style={{ background: isSelected ? '#E1F5EE' : '#fff', borderRadius: 12, padding: '14px 16px', border: isSelected ? '1.5px solid #0F6E56' : '0.5px solid #eee', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: isSelected ? '#C5E8DC' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: isSelected ? '#085041' : '#111' }}>{s.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{s.desc}</p>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: 5, border: isSelected ? 'none' : '1.5px solid #ccc', background: isSelected ? '#0F6E56' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSelected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
            )
          })}
        </div>

        <p style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Note (optional)</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Please come after 3 PM"
          style={{ width: '100%', borderRadius: 10, border: '0.5px solid #ddd', padding: '12px 14px', fontSize: 13, color: '#111', background: '#fff', resize: 'none', height: 90, boxSizing: 'border-box', fontFamily: 'sans-serif' }}
        />

        {selected.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#E1F5EE', borderRadius: 8, fontSize: 12, color: '#085041' }}>
            {selected.length} service{selected.length > 1 ? 's' : ''} selected
          </div>
        )}

        <button
          onClick={() => selected.length > 0 && setSubmitted(true)}
          disabled={selected.length === 0}
          style={{ marginTop: 12, width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: selected.length > 0 ? '#0F6E56' : '#ddd', color: selected.length > 0 ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: selected.length > 0 ? 'pointer' : 'not-allowed' }}>
          Submit request
        </button>
      </div>
    </div>
  )
}