import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function RestaurantManager() {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [hours, setHours] = useState('')
  const [phone, setPhone] = useState('')
  const [ext, setExt] = useState('')
  const [adding, setAdding] = useState(false)

 useEffect(() => {
    load()
    const channel = supabase
      .channel('admin-restaurants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => {
        load()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function load() {
    const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: true })
    setRestaurants(data || [])
    setLoading(false)
  }

  async function addRestaurant() {
    if (!name.trim()) return
    setAdding(true)
    const { error } = await supabase.from('restaurants').insert({ name, hours, phone, ext })
    setAdding(false)
    if (error) { alert('Could not add restaurant'); return }
    setName(''); setHours(''); setPhone(''); setExt('')
    load()
  }

  async function removeRestaurant(id) {
    if (!confirm('Remove this restaurant?')) return
    await supabase.from('restaurants').delete().eq('id', id)
    load()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Restaurant Directory</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Manage what visitors see</p>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, marginBottom: 20 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Add a restaurant</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Main cafeteria)" style={inputStyle} />
          <input value={hours} onChange={e => setHours(e.target.value)} placeholder="Hours (e.g. 7:00 AM – 9:00 PM)" style={inputStyle} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (e.g. +97124000000)" style={inputStyle} />
          <input value={ext} onChange={e => setExt(e.target.value)} placeholder="Extension (e.g. Ext. 1204)" style={inputStyle} />
          <button onClick={addRestaurant} disabled={!name.trim() || adding} style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: name.trim() && !adding ? '#0F6E56' : '#ddd', color: name.trim() && !adding ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: name.trim() && !adding ? 'pointer' : 'not-allowed', marginTop: 4 }}>
            {adding ? 'Adding...' : '+ Add restaurant'}
          </button>
        </div>

        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Current restaurants ({restaurants.length})</p>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {restaurants.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🍴</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111' }}>{r.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{r.hours} · {r.ext}</p>
                </div>
                <button onClick={() => removeRestaurant(r.id)} style={{ background: '#FCEBEB', color: '#A32D2D', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
              </div>
            ))}
            {restaurants.length === 0 && <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>No restaurants yet</p>}
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '11px 13px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', marginBottom: 10 }