import { useParams, useNavigate } from 'react-router-dom'

const restaurants = [
  { name: 'Main cafeteria', hours: '7:00 AM – 9:00 PM', phone: '+97124XXXXXX', ext: 'Ext. 1204' },
  { name: 'Ground floor café', hours: '6:00 AM – 11:00 PM', phone: '+97124XXXXXX', ext: 'Ext. 1210' },
  { name: 'Family lounge kitchen', hours: '8:00 AM – 8:00 PM', phone: '+97124XXXXXX', ext: 'Ext. 1218' },
]

export default function VisitorPage() {
  const { ward, room, bed } = useParams()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff' }}>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Welcome, visitor</p>
        <h1 style={{ margin: '4px 0', fontSize: 22, fontWeight: 600 }}>Room {room} · Bed {bed.toUpperCase()}</h1>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Ward {ward.toUpperCase()} — CareConnect</p>
      </div>

      <p style={sectionLabel}>Request for patient</p>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ServiceCard icon="👕" iconBg="#EAF3DE" title="Laundry pickup" desc="Schedule for this room" onClick={() => navigate(`/q/${ward}/${room}/${bed}/laundry`)} />
        <ServiceCard icon="✨" iconBg="#E6F1FB" title="Housekeeping" desc="Request room cleaning" onClick={() => navigate(`/q/${ward}/${room}/${bed}/housekeeping`)} />
      </div>

      <p style={sectionLabel}>Hospital restaurants</p>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {restaurants.map((r, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '0.5px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍴</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111' }}>{r.name}</p>
                <p style={{ margin: '2px 0 4px', fontSize: 12, color: '#888' }}>{r.hours} · {r.ext}</p>
                <a href={`tel:${r.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#0F6E56', fontWeight: 600, textDecoration: 'none', background: '#E1F5EE', padding: '4px 10px', borderRadius: 20 }}>
                  📞 Tap to call
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 32 }}>CareConnect · Powered by your care team</p>
    </div>
  )
}

function ServiceCard({ icon, iconBg, title, desc, onClick }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '0.5px solid #eee' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111' }}>{title}</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{desc}</p>
      </div>
      <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
    </div>
  )
}

const sectionLabel = { margin: '16px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }