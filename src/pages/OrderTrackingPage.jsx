import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const STEPS = [
  { key: 'pending',   label: 'Order received',     desc: 'Waiting for the vendor to confirm' },
  { key: 'accepted',  label: 'Confirmed',           desc: 'Your order is being prepared' },
  { key: 'ready',     label: 'On the way',          desc: 'The delivery person is heading to you' },
  { key: 'delivered', label: 'Delivered',           desc: 'Enjoy! Pay in person — cash or card' },
]

function stepIndex(status) {
  return STEPS.findIndex(s => s.key === status)
}

export default function OrderTrackingPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wrongDevice, setWrongDevice] = useState(false)

  useEffect(() => {
    loadOrder()

    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, payload => {
        setOrder(prev => ({ ...prev, ...payload.new }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  async function loadOrder() {
    const { data: o } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (!o) { setLoading(false); return }

    const deviceToken = localStorage.getItem('cc_device_token')
    if (o.device_token !== deviceToken) {
      setWrongDevice(true)
      setLoading(false)
      return
    }

    const { data: v } = await supabase.from('vendors').select('*').eq('id', o.vendor_id).single()
    setOrder(o)
    setVendor(v)
    setLoading(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Loading your order...</p>
      </div>
    )
  }

  if (wrongDevice || !order) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🔒</div>
        <h2 style={{ color: '#111', margin: 0, fontSize: 20, fontWeight: 700 }}>Wrong device</h2>
        <p style={{ color: '#888', marginTop: 10, fontSize: 14, maxWidth: 300 }}>
          This order can only be viewed on the device that placed it.
        </p>
      </div>
    )
  }

  const currentStep = stepIndex(order.status)
  const current = STEPS[currentStep]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0F6E56', padding: '20px 16px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Your order</p>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{vendor?.emoji} {vendor?.name}</h1>
          </div>
        </div>

        {/* Status label */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{current.label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, opacity: 0.85 }}>{current.desc}</p>
        </div>
      </div>

      {/* Progress steps */}
      <div style={{ background: '#fff', padding: '20px 16px', borderBottom: '0.5px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((s, i) => {
            const done = i <= currentStep
            const isLast = i === STEPS.length - 1
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? '#0F6E56' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: 10, color: done ? '#0F6E56' : '#bbb', fontWeight: done ? 600 : 400, textAlign: 'center', width: 56 }}>{s.label}</p>
                </div>
                {!isLast && <div style={{ flex: 1, height: 2, background: i < currentStep ? '#0F6E56' : '#e0e0e0', margin: '0 4px', marginBottom: 18 }} />}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Handover code — hide once delivered */}
        {order.status !== 'delivered' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', padding: '18px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Your handover code</p>
            <p style={{ margin: '6px 0 2px', fontSize: 52, fontWeight: 800, letterSpacing: 10, color: '#0F6E56' }}>{order.tracking_code}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>Show this to the delivery person</p>
          </div>
        )}

        {/* Order summary */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', padding: '14px 16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888', fontWeight: 600 }}>What you ordered</p>
          {(order.items || []).map((item, i) => (
            <p key={i} style={{ margin: '4px 0', fontSize: 14, color: '#111' }}>· {item.name}</p>
          ))}
          {order.customer_name && <p style={{ margin: '10px 0 0', fontSize: 12, color: '#aaa' }}>Name: {order.customer_name}</p>}
          {order.customer_phone && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>Phone: {order.customer_phone}</p>}
        </div>

        {/* Location */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', padding: '14px 16px' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#888', fontWeight: 600 }}>Delivery location</p>
          {order.location_type === 'room' ? (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#111' }}>Ward {order.ward} · Room {order.room} · Bed {order.bed}</p>
          ) : (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#111' }}>{order.waiting_area}</p>
          )}
        </div>

        {/* Payment */}
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#085041' }}>💳 Pay in person on delivery — cash or card</p>
        </div>
      </div>
    </div>
  )
}

