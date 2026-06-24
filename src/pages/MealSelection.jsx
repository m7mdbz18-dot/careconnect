import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../supabase'

const menuData = {
  breakfast: [
    { id: 1, name: 'Oatmeal with honey & dates', tag: 'Healthy' },
    { id: 2, name: 'Scrambled eggs with toast', tag: 'Halal' },
    { id: 3, name: 'Labneh & vegetables plate', tag: 'Veg' },
    { id: 4, name: 'Low-sugar fruit bowl', tag: 'Diabetic' },
    { id: 0, name: 'No preference', tag: null },
  ],
  lunch: [
    { id: 1, name: 'Grilled chicken with rice', tag: 'Halal' },
    { id: 2, name: 'Lemon herb fish', tag: 'Halal' },
    { id: 3, name: 'Vegetable pasta', tag: 'Veg' },
    { id: 4, name: 'Low-sugar lamb stew', tag: 'Diabetic' },
    { id: 0, name: 'No preference', tag: null },
  ],
  dinner: [
    { id: 1, name: 'Grilled salmon with quinoa', tag: 'Halal' },
    { id: 2, name: 'Chicken soup with bread', tag: 'Halal' },
    { id: 3, name: 'Stuffed vegetables', tag: 'Veg' },
    { id: 4, name: 'Light grilled fish & salad', tag: 'Diabetic' },
    { id: 0, name: 'No preference', tag: null },
  ],
}

const tagColors = {
  Halal: { bg: '#E6F1FB', color: '#0C447C' },
  Veg: { bg: '#EAF3DE', color: '#27500A' },
  Diabetic: { bg: '#FAEEDA', color: '#633806' },
  Healthy: { bg: '#E1F5EE', color: '#085041' },
}

const cutoffs = {
  breakfast: '9:00 PM tonight',
  lunch: '9:00 AM tomorrow',
  dinner: '2:00 PM tomorrow',
}

const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }

export default function MealSelection() {
  const { ward, room, bed } = useParams()
  const navigate = useNavigate()
  const [selections, setSelections] = useState({ breakfast: null, lunch: null, dinner: null })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const allSelected = selections.breakfast !== null && selections.lunch !== null && selections.dinner !== null

  function select(slot, item) {
    setSelections(s => ({ ...s, [slot]: item }))
  }

  async function submit() {
    if (!allSelected) return
    setSaving(true)
    const { error } = await supabase.from('meal_selections').insert({
      ward: ward.toUpperCase(),
      room,
      bed: bed.toUpperCase(),
      breakfast: selections.breakfast.name,
      lunch: selections.lunch.name,
      dinner: selections.dinner.name,
    })
    setSaving(false)
    if (error) {
      alert('Something went wrong saving your meals. Please try again.')
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 70, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: '#0F6E56', margin: 0, fontSize: 24, fontWeight: 700 }}>Meals submitted!</h2>
        <p style={{ color: '#888', textAlign: 'center', marginTop: 8, fontSize: 14 }}>Your meal selections for tomorrow are saved.<br />The kitchen has been notified.</p>

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

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', paddingBottom: 100 }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(`/q/${ward}/${room}/${bed}/patient`)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Tomorrow's meals</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Room {room} · Bed {bed.toUpperCase()}</p>
        </div>
      </div>

      <div style={{ padding: '12px 16px', background: '#E1F5EE', fontSize: 12, color: '#085041', display: 'flex', alignItems: 'center', gap: 6 }}>
        📅 Select one option per meal then submit all at once
      </div>

      {['breakfast', 'lunch', 'dinner'].map(slot => (
        <div key={slot} style={{ margin: '12px 16px', background: '#fff', borderRadius: 14, border: '0.5px solid #eee', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{icons[slot]} {slot.charAt(0).toUpperCase() + slot.slice(1)}</span>
            <span style={{ fontSize: 11, color: selections[slot] ? '#0F6E56' : '#aaa', fontWeight: selections[slot] ? 600 : 400 }}>
              {selections[slot] ? '✓ Selected' : `Cutoff: ${cutoffs[slot]}`}
            </span>
          </div>
          <div style={{ padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {menuData[slot].map(item => (
              <div key={item.id} onClick={() => select(slot, item)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: selections[slot]?.id === item.id ? '1.5px solid #0F6E56' : '0.5px solid #eee', background: selections[slot]?.id === item.id ? '#E1F5EE' : '#fafafa', cursor: 'pointer' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: selections[slot]?.id === item.id ? '5px solid #0F6E56' : '1.5px solid #ccc', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: item.id === 0 ? 400 : 500, color: selections[slot]?.id === item.id ? '#085041' : item.id === 0 ? '#aaa' : '#111', fontStyle: item.id === 0 ? 'italic' : 'normal' }}>{item.name}</span>
                {item.tag && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: tagColors[item.tag].bg, color: tagColors[item.tag].color }}>{item.tag}</span>}
              </div>
            ))}
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