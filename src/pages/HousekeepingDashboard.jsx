import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { logout, getRole } from '../auth'

const statusColors = {
  new: { bg: '#FCEBEB', color: '#A32D2D', label: 'New' },
  'in progress': { bg: '#FAEEDA', color: '#633806', label: 'In progress' },
  done: { bg: '#EAF3DE', color: '#27500A', label: 'Complete' },
}

const prevStatus = { 'in progress': 'new', done: 'in progress' }

export default function HousekeepingDashboard() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const isAdmin = getRole() === 'admin'

  useEffect(() => {
    load()
    const channel = supabase
      .channel('housekeeping-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function load() {
    const { data } = await supabase
      .from('service_requests')
      .select('*')
      .eq('type', 'housekeeping')
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('service_requests').update({ status }).eq('id', id)
    load()
  }

  async function deleteRequest(id) {
    if (!confirm('Delete this request? It will be moved to Deleted and kept for records.')) return
    await supabase.from('service_requests').update({ status: 'deleted' }).eq('id', id)
    load()
  }

  async function restoreRequest(id) {
    await supabase.from('service_requests').update({ status: 'new' }).eq('id', id)
    load()
  }

  const filtered = requests.filter(r => {
    if (filter === 'active') return r.status !== 'done' && r.status !== 'deleted'
    if (filter === 'done') return r.status === 'done'
    if (filter === 'deleted') return r.status === 'deleted'
    return false
  })

  const tabs = isAdmin
    ? [['active', 'Active'], ['done', 'Completed'], ['deleted', 'Deleted']]
    : [['active', 'Active'], ['done', 'Completed']]

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
              <h1 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 600 }}>✨ Housekeeping</h1>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
        <div style={{ display: 'flex' }}>
          {tabs.map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: filter === f ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: filter === f ? 700 : 400, fontSize: 14, cursor: 'pointer', borderBottom: filter === f ? '2px solid #fff' : '2px solid transparent' }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
            <p style={{ fontSize: 32 }}>✨</p>
            <p>No {filter} requests</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(r => {
              const sc = statusColors[r.status] || statusColors.new
              const canStepBack = prevStatus[r.status]
              const isDeleted = r.status === 'deleted'
              return (
                <div key={r.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', overflow: 'hidden', opacity: isDeleted ? 0.7 : 1 }}>
                  <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #f0f0f0' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Room {r.room} · Bed {r.bed}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {!isDeleted && canStepBack && (
                        <button onClick={() => updateStatus(r.id, canStepBack)} title="Step back one stage" style={{ background: '#f0f0f0', border: 'none', borderRadius: 6, width: 26, height: 24, cursor: 'pointer', fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↩</button>
                      )}
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: isDeleted ? '#eee' : sc.bg, color: isDeleted ? '#999' : sc.color, fontWeight: 600 }}>{isDeleted ? 'Deleted' : sc.label}</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#111' }}>🧹 {r.details}</p>
                    {r.note && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#888', fontStyle: 'italic' }}>"{r.note}"</p>}
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#bbb' }}>Ward {r.ward} · {formatTime(r.created_at)}</p>
                  </div>
                  <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8 }}>
                    {!isDeleted && r.status === 'new' && (
                      <button onClick={() => updateStatus(r.id, 'in progress')} style={btnStyle('#FAEEDA', '#633806')}>Start</button>
                    )}
                    {!isDeleted && r.status !== 'done' && (
                      <button onClick={() => updateStatus(r.id, 'done')} style={btnStyle('#0F6E56', '#fff')}>Mark done</button>
                    )}
                    {isAdmin && !isDeleted && (
                      <button onClick={() => deleteRequest(r.id)} style={btnStyle('#FCEBEB', '#A32D2D', true)}>Delete</button>
                    )}
                    {isAdmin && isDeleted && (
                      <button onClick={() => restoreRequest(r.id)} style={btnStyle('#E1F5EE', '#085041')}>Restore</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const btnStyle = (bg, color, shrink) => ({ flex: shrink ? '0 0 auto' : 1, padding: shrink ? '11px 16px' : '11px', borderRadius: 8, border: 'none', background: bg, color, fontWeight: 600, fontSize: 14, cursor: 'pointer' })