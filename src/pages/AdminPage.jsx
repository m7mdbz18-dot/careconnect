import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { logout } from '../auth'

export default function AdminPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ active: 0 })

  useEffect(() => {
    loadStats()
    const channel = supabase
      .channel('admin-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => loadStats())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadStats() {
    const active = await supabase.from('service_requests').select('id', { count: 'exact', head: true }).neq('status', 'done')
    setStats({ active: active.count || 0 })
  }

  const sections = [
    { title: 'Manage Vendors', desc: 'Add vendors & their ordering options', icon: '🛒', path: '/admin/vendors', bg: '#FAEEDA' },
    { title: 'QR Code Generator', desc: 'Create & print bed QR codes', icon: '🔳', path: '/admin/qr', bg: '#E1F5EE' },
  ]

  const statCards = [
    { label: 'Active requests', value: stats.active, bg: '#FAEEDA', color: '#633806' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 24px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>CareConnect</p>
            <h1 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 700 }}>Admin Dashboard</h1>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: s.color, fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Manage</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sections.map(s => (
            <div key={s.title} onClick={() => navigate(s.path)} style={{ background: '#fff', borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '0.5px solid #eee' }}>
              <div style={{ width: 46, height: 46, borderRadius: 11, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#111' }}>{s.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{s.desc}</p>
              </div>
              <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>

        <p style={{ margin: '20px 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Staff dashboards</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { title: 'Housekeeping', icon: '✨', path: '/staff/housekeeping' },
            { title: 'Laundry', icon: '👕', path: '/staff/laundry' },
          ].map(s => (
            <div key={s.title} onClick={() => navigate(s.path)} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '0.5px solid #eee' }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <p style={{ margin: 0, flex: 1, fontWeight: 500, fontSize: 14, color: '#111' }}>{s.title}</p>
              <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
