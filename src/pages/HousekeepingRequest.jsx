import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../supabase'

const tasks = [
  'General room cleaning',
  'Change bed sheets',
  'Bathroom cleaning',
  'Empty trash',
  'Refill water / supplies',
  'Mop floor',
]

export default function HousekeepingRequest() {
  const { ward, room, bed } = useParams()
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  function toggle(task) {
    setSelected(s => s.includes(task) ? s.filter(t => t !== task) : [...s, task])
  }

  async function submit() {
    if (selected.length === 0) return
    setSaving(true)
    const { error } = await supabase.from('service_requests').insert({
      type: 'housekeeping',
      ward: ward.toUpperCase(),
      room,
      bed: bed.toUpperCase(),
      details: selected.join(', '),
      note,
      status: 'new',
    })
    setSaving(false)
    if (error) { alert('Could not submit request. Please try again.'); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#0F6E56', margin: 0, fontSize: 24, fontWeight: 700 }}>Housekeeping requested!</h2>
        <p style={{ color: '#888', textAlign: 'center', marginTop: 8, fontSize: 14 }}>{selected.length} task{selected.length > 1 ? 's' : ''} requested.<br />The housekeeping team has been notified.</p>
        <button onClick={() => navigate(`/q/${ward}/${room}/${bed}/visitor`)} style={{ marginTop: 24, padding: '13px 40px', borderRadius: 10, background: '#0F6E56', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Back to home</button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', paddingBottom: 100 }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Housekeeping</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Room {room} · Bed {bed.toUpperCase()}</p>
        </div>
      </div>

      <p style={{ margin: '16px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Select what you need</p>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.map(task => (
          <div key={task} onClick={() => toggle(task)} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: selected.includes(task) ? '1.5px solid #0F6E56' : '0.5px solid #eee', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: selected.includes(task) ? '#0F6E56' : '#fff', border: selected.includes(task) ? 'none' : '1.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {selected.includes(task) && <span style={{ color: '#fff', fontSize: 13 }}>✓</span>}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{task}</span>
          </div>
        ))}
      </div>

      <p style={{ margin: '20px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Note (optional)</p>
      <div style={{ padding: '0 16px' }}>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Patient resting, please come after 2 PM" rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none' }} />
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: '#fff', borderTop: '0.5px solid #eee' }}>
        {selected.length > 0 && <p style={{ textAlign: 'center', fontSize: 12, color: '#0F6E56', margin: '0 0 8px', fontWeight: 600 }}>{selected.length} selected</p>}
        <button onClick={submit} disabled={selected.length === 0 || saving} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: selected.length > 0 && !saving ? '#0F6E56' : '#ddd', color: selected.length > 0 && !saving ? '#fff' : '#aaa', fontWeight: 700, fontSize: 15, cursor: selected.length > 0 && !saving ? 'pointer' : 'not-allowed' }}>
          {saving ? 'Submitting...' : 'Submit request'}
        </button>
      </div>
    </div>
  )
}