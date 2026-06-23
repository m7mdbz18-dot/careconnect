import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const timeSlots = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
]

export default function LaundryRequest() {
  const { ward, room, bed } = useParams()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#0F6E56', margin: 0, fontSize: 22 }}>Request sent!</h2>
        <p style={{ color: '#888', textAlign: 'center', marginTop: 8 }}>Laundry pickup scheduled for<br /><strong style={{ color: '#111' }}>{selected}</strong></p>
        <p style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>Room {room} · Bed {bed.toUpperCase()}</p>
        <button onClick={() => navigate(`/q/${ward}/${room}/${bed}`)} style={{ marginTop: 24, padding: '12px 32px', borderRadius: 10, background: '#0F6E56', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
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
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Laundry pickup</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Room {room} · Bed {bed.toUpperCase()}</p>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Choose a pickup time</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {timeSlots.map((slot, i) => (
            <div key={i} onClick={() => setSelected(slot)} style={{ background: selected === slot ? '#E1F5EE' : '#fff', borderRadius: 10, padding: '14px 16px', border: selected === slot ? '1.5px solid #0F6E56' : '0.5px solid #eee', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: selected === slot ? '5px solid #0F6E56' : '1.5px solid #ccc', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: selected === slot ? '#085041' : '#111' }}>{slot}</span>
            </div>
          ))}
        </div>

        <p style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Note (optional)</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Please handle gently, delicate items"
          style={{ width: '100%', borderRadius: 10, border: '0.5px solid #ddd', padding: '12px 14px', fontSize: 13, color: '#111', background: '#fff', resize: 'none', height: 90, boxSizing: 'border-box', fontFamily: 'sans-serif' }}
        />

        <button
          onClick={() => selected && setSubmitted(true)}
          disabled={!selected}
          style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: selected ? '#0F6E56' : '#ddd', color: selected ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: selected ? 'pointer' : 'not-allowed' }}>
          Confirm pickup request
        </button>
      </div>
    </div>
  )
}