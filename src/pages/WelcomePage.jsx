import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useQRToken } from '../hooks/useQRToken'
import ScanRequired from './ScanRequired'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { token, loading, invalid, ward, room, bed } = useQRToken()
  const [activeOrder, setActiveOrder] = useState(null)

  useEffect(() => {
    const dt = localStorage.getItem('cc_device_token')
    if (!dt) return
    supabase.from('orders').select('id, status, vendor_id, tracking_code')
      .eq('device_token', dt).neq('status', 'delivered')
      .order('created_at', { ascending: false }).limit(1)
      .then(async ({ data }) => {
        if (!data || data.length === 0) return
        const order = data[0]
        const { data: vendor } = await supabase.from('vendors').select('name, emoji').eq('id', order.vendor_id).single()
        setActiveOrder({ ...order, vendor })
      })
  }, [])

  if (loading) return <div style={{ minHeight: '100vh', background: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'sans-serif' }}>Loading...</p></div>
  if (invalid) return <ScanRequired />

  function choose(type) {
    sessionStorage.setItem(`userType-${room}-${bed}`, type)
    navigate(`/q/${token}/${type}`)
  }

  const statusLabel = {
    pending:  'Waiting for confirmation',
    accepted: 'Being prepared',
    ready:    'On the way to you',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F6E56', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>&#127973;</div>
      <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, textAlign: 'center' }}>CareConnect</h1>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '6px 0 0', textAlign: 'center' }}>Room {room} &middot; Bed {bed.toUpperCase()} &middot; Ward {ward.toUpperCase()}</p>

      {activeOrder && (
        <div onClick={() => navigate(`/order/${activeOrder.id}`)}
          style={{ marginTop: 28, width: '100%', maxWidth: 320, background: '#fff', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {activeOrder.vendor?.emoji || '&#128722;'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111' }}>Active order &middot; {activeOrder.vendor?.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#0F6E56' }}>{statusLabel[activeOrder.status] || activeOrder.status} &middot; Code {activeOrder.tracking_code}</p>
          </div>
          <span style={{ color: '#0F6E56', fontSize: 18, fontWeight: 700 }}>&rsaquo;</span>
        </div>
      )}

      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginTop: activeOrder ? 24 : 40, marginBottom: 20, fontWeight: 500 }}>Who are you?</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button onClick={() => choose('patient')} style={{ padding: '18px 0', borderRadius: 14, background: '#fff', color: '#0F6E56', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          &#128716; I am the patient
        </button>
        <button onClick={() => choose('visitor')} style={{ padding: '18px 0', borderRadius: 14, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          &#128101; I am a visitor
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 40 }}>Your choice will be remembered for this session</p>
    </div>
  )
}