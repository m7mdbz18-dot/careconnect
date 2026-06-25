import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { logout, getRole } from '../auth'

const menuData = {
  breakfast: [
    { id: 1, name: 'Oatmeal with honey & dates', tag: 'Healthy', active: true },
    { id: 2, name: 'Scrambled eggs with toast', tag: 'Halal', active: true },
    { id: 3, name: 'Labneh & vegetables plate', tag: 'Veg', active: true },
    { id: 4, name: 'Low-sugar fruit bowl', tag: 'Diabetic', active: true },
  ],
  lunch: [
    { id: 1, name: 'Grilled chicken with rice', tag: 'Halal', active: true },
    { id: 2, name: 'Lemon herb fish', tag: 'Halal', active: true },
    { id: 3, name: 'Vegetable pasta', tag: 'Veg', active: true },
    { id: 4, name: 'Low-sugar lamb stew', tag: 'Diabetic', active: false },
  ],
  dinner: [
    { id: 1, name: 'Grilled salmon with quinoa', tag: 'Halal', active: true },
    { id: 2, name: 'Chicken soup with bread', tag: 'Halal', active: true },
    { id: 3, name: 'Stuffed vegetables', tag: 'Veg', active: true },
    { id: 4, name: 'Light grilled fish & salad', tag: 'Diabetic', active: true },
  ],
}

const tagColors = {
  Halal: { bg: '#E6F1FB', color: '#0C447C' },
  Veg: { bg: '#EAF3DE', color: '#27500A' },
  Diabetic: { bg: '#FAEEDA', color: '#633806' },
  Healthy: { bg: '#E1F5EE', color: '#085041' },
}

function getTomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function prettyDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function RestaurantDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('orders')
  const [menuTab, setMenuTab] = useState('breakfast')
  const [menu, setMenu] = useState(menuData)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(getTomorrowStr())
  const isAdmin = getRole() === 'admin'

  useEffect(() => {
    loadOrders()
    const channel = supabase
      .channel('meals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_selections' }, () => loadOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedDate])

  async function loadOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('meal_selections')
      .select('*')
      .eq('for_date', selectedDate)
      .order('ward', { ascending: true })
      .order('room', { ascending: true })
      .order('bed', { ascending: true })
    setOrders(data || [])
    setLoading(false)
  }

  function exportCSV() {
    if (orders.length === 0) { alert('No meals to export for this day.'); return }
    const headers = ['Ward', 'Room', 'Bed', 'Breakfast', 'Lunch', 'Dinner', 'For date']
    const rows = orders.map(o => [o.ward, o.room, o.bed, o.breakfast, o.lunch, o.dinner, o.for_date])
    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `meals-${selectedDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function toggleItem(slot, id) {
    setMenu(m => ({
      ...m,
      [slot]: m[slot].map(item => item.id === id ? { ...item, active: !item.active } : item)
    }))
  }

  const isTomorrow = selectedDate === getTomorrowStr()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 0', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAdmin && (
              <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}>‹</button>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Staff dashboard</p>
              <h1 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 600 }}>🍽️ Restaurant</h1>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
        <div style={{ display: 'flex' }}>
          {['orders', 'menu'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: tab === t ? 700 : 400, fontSize: 14, cursor: 'pointer', borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'orders' && (
        <div style={{ padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Showing meals for</p>
              <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#0F6E56' }}>{prettyDate(selectedDate)}{isTomorrow ? ' (tomorrow)' : ''}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit' }} />
              <button onClick={exportCSV} style={{ background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>⬇ Export to Excel</button>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading...</p>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
              <p style={{ fontSize: 32 }}>🍽️</p>
              <p>No meal selections for this day</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{orders.length} selection{orders.length > 1 ? 's' : ''}</p>
              {orders.map(order => (
                <div key={order.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', overflow: 'hidden' }}>
                  <div style={{ background: '#E1F5EE', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#085041' }}>Room {order.room} · Bed {order.bed}</span>
                    <span style={{ fontSize: 11, color: '#0F6E56' }}>Ward {order.ward}</span>
                  </div>
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[['🌅', 'Breakfast', order.breakfast], ['☀️', 'Lunch', order.lunch], ['🌙', 'Dinner', order.dinner]].map(([icon, label, item]) => (
                      <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                        <span>{icon}</span>
                        <span style={{ color: '#888', minWidth: 65 }}>{label}:</span>
                        <span style={{ color: '#111', fontWeight: 500 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'menu' && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 10, border: '0.5px solid #eee', overflow: 'hidden', marginBottom: 14 }}>
            {['breakfast', 'lunch', 'dinner'].map(t => (
              <button key={t} onClick={() => setMenuTab(t)} style={{ flex: 1, padding: '10px 0', background: menuTab === t ? '#0F6E56' : '#fff', color: menuTab === t ? '#fff' : '#888', border: 'none', fontWeight: menuTab === t ? 600 : 400, fontSize: 13, cursor: 'pointer' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {menu[menuTab].map(item => (
              <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '0.5px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.active ? '#0F6E56' : '#ddd', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: item.active ? '#111' : '#aaa' }}>{item.name}</span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: tagColors[item.tag].bg, color: tagColors[item.tag].color }}>{item.tag}</span>
                <div onClick={() => toggleItem(menuTab, item.id)} style={{ width: 36, height: 20, borderRadius: 10, background: item.active ? '#0F6E56' : '#ddd', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: item.active ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/staff/menu')} style={{ width: '100%', marginTop: 14, padding: '12px', borderRadius: 9, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>✏️ Edit full menu (add / remove items)</button>
        </div>
      )}
    </div>
  )
}