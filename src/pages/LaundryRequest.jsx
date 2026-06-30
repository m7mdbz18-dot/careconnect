import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../supabase'
import { useQRToken } from '../hooks/useQRToken'
import ScanRequired from './ScanRequired'

const timeSlots = ['Morning (8–11 AM)', 'Afternoon (1–4 PM)', 'Evening (6–9 PM)']
const services = ['Washing', 'Ironing', 'Dry cleaning', 'Fold & pack']

export default function LaundryRequest() {
  const navigate = useNavigate()
  const { token, loading, invalid, ward, room, bed } = useQRToken()
  const [slot, setSlot] = useState(null)
  const [selectedServices, setSelectedServices] = useState([])
  const [express, setExpress] = useState(false)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  if (loading) return <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#aaa' }}>Loading...</p></div>
  if (invalid) return <ScanRequired />

  function goHome() {
    const who = sessionStorage.getItem(`userType-${room}-${bed}`)
    navigate(`/q/${token}/${who === 'visitor' ? 'visitor' : 'patient'}`)
  }

  function toggleService(s) {
    setSelectedServices(cur => cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s])
  }

  async function submit() {
    if (!slot || selectedServices.length === 0) return
    setSaving(true)
    const detailParts = [slot, 'Services: ' + selectedServices.join(', ')]
    if (express) detailParts.push('⚡ EXPRESS / URGENT')
    const { error } = await supabase.from('service_requests').insert({
      type: 'laundry', ward: ward.toUpperCase(), room, bed: bed.toUpperCase(),
      details: detailParts.join(' · '), note, status: 'new',
    })
    setSaving(false)
    if (error) { alert('Could not submit request. Please try again.'); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#0F6E56', margin: 0, fontSize: 24, fontWeight: 700 }}>Laundry requested!</h2>
        <p style={{ color: '#888', textAlign: 'center', marginTop: 8, fontSize: 14 }}>{selectedServices.join(', ')}<br />Pickup: {slot}{express ? ' · Express' : ''}<br />The laundry team has been notified.</p>
        <button onClick={goHome} style={{ marginTop: 24, padding: '13px 40px', borderRadius: 10, background: '#0F6E56', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Back to home</button>
      </div>
    )
  }

  const canSubmit = slot && selectedServices.length > 0 && !saving

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', paddingBottom: 100 }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Laundry pickup</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Room {room} · Bed {bed.toUpperCase()}</p>
        </div>
      </div>

      <p style={{ margin: '16px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Services needed</p>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {services.map(s => (
          <div key={s} onClick={() => toggleService(s)} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: selectedServices.includes(s) ? '1.5px solid #0F6E56' : '0.5px solid #eee', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: selectedServices.includes(s) ? '#0F6E56' : '#fff', border: selectedServices.includes(s) ? 'none' : '1.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {selectedServices.includes(s) && <span style={{ color: '#fff', fontSize: 13 }}>✓</span>}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{s}</span>
          </div>
        ))}
      </div>

      <p style={{ margin: '20px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Pickup time</p>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {timeSlots.map(t => (
          <div key={t} onClick={() => setSlot(t)} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: slot === t ? '1.5px solid #0F6E56' : '0.5px solid #eee', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: slot === t ? '5px solid #0F6E56' : '1.5px solid #ccc', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{t}</span>
          </div>
        ))}
      </div>

      <p style={{ margin: '20px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Priority</p>
      <div style={{ padding: '0 16px' }}>
        <div onClick={() => setExpress(e => !e)} style={{ background: express ? '#FAEEDA' : '#fff', borderRadius: 12, padding: '14px 16px', border: express ? '1.5px solid #633806' : '0.5px solid #eee', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: express ? '#633806' : '#111' }}>Express / urgent</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>Prioritize this request</p>
          </div>
          <div style={{ width: 36, height: 20, borderRadius: 10, background: express ? '#633806' : '#ddd', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: express ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
        </div>
      </div>

      <p style={{ margin: '20px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Note (optional)</p>
      <div style={{ padding: '0 16px' }}>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Delicate items, please handle with care" rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none' }} />
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: '#fff', borderTop: '0.5px solid #eee' }}>
        {(!slot || selectedServices.length === 0) && <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', margin: '0 0 8px' }}>Choose at least one service and a pickup time</p>}
        <button onClick={submit} disabled={!canSubmit} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: canSubmit ? '#0F6E56' : '#ddd', color: canSubmit ? '#fff' : '#aaa', fontWeight: 700, fontSize: 15, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
          {saving ? 'Submitting...' : 'Submit request'}
        </button>
      </div>
    </div>
  )
}