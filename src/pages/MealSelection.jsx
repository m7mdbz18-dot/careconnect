import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const CUTOFF_HOUR = 16 // 4 PM. Change this number to adjust the cutoff.

const tagColors = {
  Halal: { bg: '#E6F1FB', color: '#0C447C' },
  Veg: { bg: '#EAF3DE', color: '#27500A' },
  Diabetic: { bg: '#FAEEDA', color: '#633806' },
  Healthy: { bg: '#E1F5EE', color: '#085041' },
}

const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }

function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d
}
function toDateString(d) {
  return d.toISOString().split('T')[0]
}

export default function MealSelection() {
  const { ward, room, bed } = useParams()
  const navigate = useNavigate()
  const [menu, setMenu] = useState({ breakfast: [], lunch: [], dinner: [] })
  const [menuLoading, setMenuLoading] = useState(true)
  const [selections, setSelections] = useState({ breakfast: null, lunch: null, dinner: null })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const tomorrow = getTomorrow()
  const tomorrowLabel = tomorrow.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const isClosed = new Date().getHours() >= CUTOFF_HOUR

  useEffect(() => {
    loadMenu()
    const channel = supabase
      .channel('patient-menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => loadMenu())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadMenu() {
    const { data } = await supabase.from('menu_items').select('*').eq('active', true).order('created_at', { ascending: true })
    const grouped = { breakfast: [], lunch: [], dinner: [] }
    ;(data || []).forEach(item => {
      if (grouped[item.slot]) grouped[item.slot].push(item)
    })
    // add a "No preference" option to each slot
    Object.keys(grouped).forEach(slot => {
      grouped[slot].push({ id: `none-${slot}`, name: 'No preference', tag: null })
    })
    setMenu(grouped)
    setMenuLoading(false)
  }

  const allSelected = selections.breakfast !== null && selections.lunch !== null && selections.dinner !== null

  function select(slot, item) {
    setSelections(s => ({ ...s, [slot]: item }))
  }

  async function submit() {
    if (!allSelected || isClosed) return
    setSaving(true)
    const { error } = await supabase.from('meal_selections').insert({
      ward: ward.toUpperCase(),
      room,
      bed: bed.toUpperCase(),
      breakfast: selections.breakfast.name,
      lunch: selections.lunch.name,
      dinner: selections.dinner.name,
      for_date: toDateString(tomorrow),
    })
    setSaving(false)
    if (error) { alert('Something went wrong saving your meals. Please try again.'); return }
    setSubmitted(true)
  }

  if (isClosed) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🕓</div>
        <h2 style={{ color: '#0F6E56', margin: 0, fontSize: 22, fontWeight: 700, textAlign: 'center' }}>Meal selection is closed</h2>
        <p style={{ color: '#888', textAlign: 'center', marginTop: 10, fontSize: 14, maxWidth: 320 }}>
          Tomorrow's meals must be chosen before 4:00 PM. The kitchen has already started preparing.
        </p>
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: 6, fontSize: 13, maxWidth: 320 }}>
          Please speak to your nurse if you have dietary needs, and select before 4:00 PM tomorrow.
        </p>
        <button onClick={() => navigate(`/q/${ward}/${room}/${bed}/patient`)} style={{ marginTop: 24, padding: '13px 40px', borderRadius: 10, background: '#0F6E56', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Back to home
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 70, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: '#0F6E56', margin: 0, fontSize: 24, fontWeight: 700 }}>Meals submitted!</h2>
        <p style={{ color: '#888', textAlign: 'center', marginTop: 8, fontSize: 14 }}>Your meals for {tomorrowLabel} are saved.<br />The kitchen has been notified.</p>

        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', padding: '16px 20px', marginTop: 24, width: '100%', maxWidth: 360 }}>
          {[['🌅', 'Breakfast', selections.breakfast], ['☀️', 'Lunch', selections.lunch], ['🌙', 'Dinner', selections.dinner]].map(([icon, label, item]) => (
            <div key={label} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: label !== 'Dinner' ? '0.5px solid #f0f0f0' : 'none' }}>
              <span>{icon}</span>
              <span style={{ color: '#888', minWidth: 70, fontSize: 13 }}>{label}:</span>
              <span style={{ color: '#111', fontWeight: 600, fontSize: 13 }}>{item.name}</span>
            </div>
          ))}
        </div>

        <button onClick={() => navigate(`/q/${ward}/${room}/${bed}/patient`)} style={{ marginTop: 24, padding: '13px 40px', borderRadius: 10, background: '#0F6E56', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Back to home
        </button>
      </div>
    )
  }

  if (menuLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Loading menu...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', paddingBottom: 100 }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(`/q/${ward}/${room}/${bed}/patient`)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Tomorrow's meals</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Room {room} · Bed {bed.toUpperCase()}</p>
        </div>
      </div>

      <div style={{ padding: '14px 16px', background: '#E1F5EE', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, color: '#085041', fontWeight: 700 }}>📅 Meals for {tomorrowLabel}</span>
        <span style={{ fontSize: 12, color: '#0F6E56' }}>Select one option per meal · Closes 4:00 PM today</span>
      </div>

      {['breakfast', 'lunch', 'dinner'].map(slot => (
        <div key={slot} style={{ margin: '12px 16px', background: '#fff', borderRadius: 14, border: '0.5px solid #eee', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{icons[slot]} {slot.charAt(0).toUpperCase() + slot.slice(1)}</span>
            <span style={{ fontSize: 11, color: selections[slot] ? '#0F6E56' : '#aaa', fontWeight: selections[slot] ? 600 : 400 }}>
              {selections[slot] ? '✓ Selected' : 'Choose one'}
            </span>
          </div>
          <div style={{ padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {menu[slot].map(item => {
              const isNone = String(item.id).startsWith('none-')
              return (
                <div key={item.id} onClick={() => select(slot, item)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: selections[slot]?.id === item.id ? '1.5px solid #0F6E56' : '0.5px solid #eee', background: selections[slot]?.id === item.id ? '#E1F5EE' : '#fafafa', cursor: 'pointer' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: selections[slot]?.id === item.id ? '5px solid #0F6E56' : '1.5px solid #ccc', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: isNone ? 400 : 500, color: selections[slot]?.id === item.id ? '#085041' : isNone ? '#aaa' : '#111', fontStyle: isNone ? 'italic' : 'normal' }}>{item.name}</span>
                  {item.tag && tagColors[item.tag] && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: tagColors[item.tag].bg, color: tagColors[item.tag].color }}>{item.tag}</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: '#fff', borderTop: '0.5px solid #eee' }}>
        {!allSelected && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', margin: '0 0 8px' }}>
            Select a meal for each slot to continue
          </p>
        )}
        <button
          onClick={submit}
          disabled={!allSelected || saving}
          style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: allSelected && !saving ? '#0F6E56' : '#ddd', color: allSelected && !saving ? '#fff' : '#aaa', fontWeight: 700, fontSize: 15, cursor: allSelected && !saving ? 'pointer' : 'not-allowed' }}>
          {saving ? 'Saving...' : allSelected ? 'Submit all meals ✓' : 'Choose all 3 meals to submit'}
        </button>
      </div>
    </div>
  )
}