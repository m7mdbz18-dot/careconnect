import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function WaitingRoomPage() {
  const { area } = useParams()
  const navigate = useNavigate()
  const [activeOrder, setActiveOrder] = useState(null)

  const displayArea = decodeURIComponent(area)

  useEffect(() => {
    const token = localStorage.getItem('cc_device_token')
    if (!token) return
    supabase
      .from('orders')
      .select('id, status, vendor_id, tracking_code')
      .eq('device_token', token)
      .neq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return
        const order = data[0]
        const { data: vendor } = await supabase.from('vendors').select('name, emoji').eq('id', order.vendor_id).single()
        setActiveOrder({ ...order, vendor })
      })
  }, [])

  const statusLabel = {
    pending:  'Waiting for confirmation',
    accepted: 'Being prepared',
    ready:    'On the way to you',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F6E56', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🏥</div>
      <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, textAlign: 'center' }}>CareConnect</h1>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '6px 0 0', textAlign: 'center' }}>{displayArea}</p>

      {/* Active order banner */}
      {activeOrder && (
        <div
          onClick={() => navigate(`/order/${activeOrder.id}`)}
          style={{ marginTop: 28, width: '100%', maxWidth: 320, background: '#fff', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {activeOrder.vendor?.emoji || '🛒'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111' }}>Active order · {activeOrder.vendor?.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#0F6E56' }}>{statusLabel[activeOrder.status] || activeOrder.status} · Code {activeOrder.tracking_code}</p>
          </div>
          <span style={{ color: '#0F6E56', fontSize: 18, fontWeight: 700 }}>›</span>
        </div>
      )}

      <div style={{ marginTop: activeOrder ? 20 : 40, width: '100%', maxWidth: 320 }}>
        <button
          onClick={() => navigate(`/w/${area}/vendors`)}
          style={{ width: '100%', padding: '18px 0', borderRadius: 14, background: '#fff', color: '#0F6E56', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          🛒 Order food & items
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 40 }}>Pay in person on delivery · Cash or card</p>
    </div>
  )
}
