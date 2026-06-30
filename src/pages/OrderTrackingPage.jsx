import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function extraName(e) { return typeof e === 'string' ? e : (e?.name || '') }
function extraPrice(e) { return typeof e === 'object' && e !== null ? (e.price || 0) : 0 }

const STEPS = [
  { key: 'pending',   label: 'Order received',     desc: 'Waiting for the vendor to confirm' },
  { key: 'accepted',  label: 'Confirmed',           desc: 'Your order is being prepared' },
  { key: 'ready',     label: 'On the way',          desc: 'The delivery person is heading to you' },
  { key: 'delivered', label: 'Delivered',           desc: 'Enjoy! Pay in person — cash or card' },
]

function stepIndex(status) { return STEPS.findIndex(s => s.key === status) }

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
      .channel('order-' + orderId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'id=eq.' + orderId }, payload => {
        setOrder(prev => ({ ...prev, ...payload.new }))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  async function loadOrder() {
    const { data: o } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (!o) { setLoading(false); return }
    const deviceToken = localStorage.getItem('cc_device_token')
    if (o.device_token !== deviceToken) { setWrongDevice(true); setLoading(false); return }
    const { data: v } = await supabase.from('vendors').select('*').eq('id', o.vendor_id).single()
    setOrder(o); setVendor(v); setLoading(false)
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
        <div style={{ fontSize: 56, marginBottom: 12 }}>&#128274;</div>
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
      <div style={{ background: '#0F6E56', padding: '20px 16px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>&#8249;</button>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Your order</p>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{vendor?.emoji} {vendor?.name}</h1>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{current.label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 13, opacity: 0.85 }}>{current.desc}</p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px 16px', borderBottom: '0.5px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((s, i) => {
            const done = i <= currentStep
            const isLast = i === STEPS.length - 1
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: done ? '#0F6E56' : '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>&#10003;</span>}
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
        {order.status !== 'delivered' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', padding: '18px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Your handover code</p>
            <p style={{ margin: '6px 0 2px', fontSize: 52, fontWeight: 800, letterSpacing: 10, color: '#0F6E56' }}>{order.tracking_code}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>Show this to the delivery person</p>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', padding: '14px 16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888', fontWeight: 600 }}>What you ordered</p>
          {(order.items || []).map((item, i) => (
            <div key={i} style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#111' }}>&#183; {item.name}</p>
                {item.extras && item.extras.length > 0 && (
                  <p style={{ margin: '1px 0 0 10px', fontSize: 12, color: '#0F6E56' }}>
                    {item.extras.map(e => extraName(e) + (extraPrice(e) > 0 ? ' +AED ' + Number(extraPrice(e)).toFixed(2) : '')).join(' · ')}
                  </p>
                )}
              </div>
              {item.price > 0 && (
                <p style={{ margin: 0, fontSize: 14, color: '#555', fontWeight: 600, marginLeft: 8, flexShrink: 0 }}>
                  AED {Number(item.price).toFixed(2)}
                </p>
              )}
            </div>
          ))}
          {order.total > 0 && (
            <div style={{ borderTop: '0.5px solid #f0f0f0', marginTop: 10, paddingTop: 10 }}>
              {order.subtotal !== order.total && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Subtotal</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#888' }}>AED {Number(order.subtotal || 0).toFixed(2)}</p>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Tax</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#888' }}>AED {Number(order.tax_amount).toFixed(2)}</p>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid #f0f0f0', paddingTop: 8, marginTop: 4 }}>
                <p style={{ margin: 0, fontSize: 15, color: '#111', fontWeight: 700 }}>Total</p>
                <p style={{ margin: 0, fontSize: 15, color: '#0F6E56', fontWeight: 700 }}>AED {Number(order.total).toFixed(2)}</p>
              </div>
            </div>
          )}
          {order.customer_name && <p style={{ margin: '10px 0 0', fontSize: 12, color: '#aaa' }}>Name: {order.customer_name}</p>}
          {order.customer_phone && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>Phone: {order.customer_phone}</p>}
        </div>

        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', padding: '14px 16px' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#888', fontWeight: 600 }}>Delivery location</p>
          {order.location_type === 'room' ? (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#111' }}>Ward {order.ward} &#183; Room {order.room} &#183; Bed {order.bed}</p>
          ) : (
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#111' }}>{order.waiting_area}</p>
          )}
        </div>

        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#085041' }}>&#128179; Pay in person on delivery &#8212; cash or card</p>
        </div>
      </div>
    </div>
  )
}