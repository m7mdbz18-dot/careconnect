import { useNavigate } from 'react-router-dom'
import { useQRToken } from '../hooks/useQRToken'
import ScanRequired from './ScanRequired'

export default function PatientPage() {
  const navigate = useNavigate()
  const { token, loading, invalid, ward, room, bed } = useQRToken()

  if (loading) return <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#aaa' }}>Loading...</p></div>
  if (invalid) return <ScanRequired />

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff' }}>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Good morning</p>
        <h1 style={{ margin: '4px 0', fontSize: 22, fontWeight: 600 }}>Room {room} · Bed {bed.toUpperCase()}</h1>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Ward {ward.toUpperCase()} — CareConnect</p>
      </div>

      <p style={{ margin: '16px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Services</p>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ServiceCard icon="🛒" iconBg="#FAEEDA" title="Order food & items" desc="Restaurants, café, flowers & more" onClick={() => navigate(`/q/${token}/vendors`)} />
        <ServiceCard icon="👕" iconBg="#EAF3DE" title="Laundry pickup" desc="Schedule a collection" onClick={() => navigate(`/q/${token}/laundry`)} />
        <ServiceCard icon="✨" iconBg="#E6F1FB" title="Housekeeping" desc="Room cleaning request" onClick={() => navigate(`/q/${token}/housekeeping`)} />
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