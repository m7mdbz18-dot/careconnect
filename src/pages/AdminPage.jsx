import { useNavigate } from 'react-router-dom'

export default function AdminPage() {
  const navigate = useNavigate()

  const sections = [
    { title: 'QR Code Generator', desc: 'Create & print QR codes for beds', icon: '🔲', path: '/admin/qr', bg: '#FAEEDA' },
    { title: 'Restaurant Dashboard', desc: 'View meal selections & edit menu', icon: '🍽️', path: '/staff/restaurant', bg: '#E1F5EE' },
    { title: 'Housekeeping Dashboard', desc: 'Manage cleaning requests', icon: '✨', path: '/staff/housekeeping', bg: '#E6F1FB' },
    { title: 'Laundry Dashboard', desc: 'Manage laundry pickups', icon: '👕', path: '/staff/laundry', bg: '#EEEDFE' },
    { title: 'Restaurant Directory', desc: 'Add or remove visitor restaurants', icon: '🍴', path: '/admin/restaurants', bg: '#FCEBEB' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '24px 16px', color: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>CareConnect Admin</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.75 }}>Hospital management dashboard</p>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[['Wards', '2'], ['Rooms', '48'], ['Beds', '96']].map(([label, val]) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '16px 12px', textAlign: 'center', border: '0.5px solid #eee' }}>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0F6E56' }}>{val}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>{label}</p>
            </div>
          ))}
        </div>

        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Management</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sections.map(s => (
            <div key={s.path} onClick={() => navigate(s.path)} style={{ background: '#fff', borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '0.5px solid #eee' }}>
              <div style={{ width: 46, height: 46, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#111' }}>{s.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{s.desc}</p>
              </div>
              <span style={{ color: '#ccc', fontSize: 20 }}>›</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 24, paddingBottom: 24 }}>CareConnect · Admin Panel</p>
    </div>
  )
}