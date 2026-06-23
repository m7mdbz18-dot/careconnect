import { useState } from 'react'

const initialOrders = [
  { id: 1, room: '204', bed: 'B', ward: 'A', breakfast: 'Oatmeal with honey & dates', lunch: 'Grilled chicken with rice', dinner: 'Grilled salmon with quinoa' },
  { id: 2, room: '112', bed: 'A', ward: 'A', breakfast: 'Scrambled eggs with toast', lunch: 'Vegetable pasta', dinner: 'Chicken soup with bread' },
  { id: 3, room: '307', bed: 'C', ward: 'B', breakfast: 'Low-sugar fruit bowl', lunch: 'Low-sugar lamb stew', dinner: 'Light grilled fish & salad' },
  { id: 4, room: '201', bed: 'A', ward: 'A', breakfast: 'Labneh & vegetables plate', lunch: 'Lemon herb fish', dinner: 'Stuffed vegetables' },
  { id: 5, room: '118', bed: 'B', ward: 'B', breakfast: 'Oatmeal with honey & dates', lunch: 'Grilled chicken with rice', dinner: 'Chicken soup with bread' },
]

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

export default function RestaurantDashboard() {
  const [tab, setTab] = useState('orders')
  const [menuTab, setMenuTab] = useState('breakfast')
  const [menu, setMenu] = useState(menuData)

  function toggleItem(slot, id) {
    setMenu(m => ({
      ...m,
      [slot]: m[slot].map(item => item.id === id ? { ...item, active: !item.active } : item)
    }))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 0', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Staff dashboard</p>
            <h1 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 600 }}>Restaurant</h1>
          </div>
          <div style={{ background: '#fff', color: '#0F6E56', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
            {initialOrders.length} selections
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[['Total', initialOrders.length], ['Wards', 2], ['Pending', initialOrders.length]].map(([label, val]) => (
              <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '12px', textAlign: 'center', border: '0.5px solid #eee' }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F6E56' }}>{val}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>{label}</p>
              </div>
            ))}
          </div>

          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Tomorrow's meal selections</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {initialOrders.map(order => (
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
          <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 12 }}>Toggle items on/off · Changes reflect instantly for patients</p>
        </div>
      )}
    </div>
  )
}