import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function getDeviceToken() {
  let token = localStorage.getItem('cc_device_token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('cc_device_token', token)
  }
  return token
}

function generateTrackingCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export default function VendorPage() {
  const { ward, room, bed, area, vendorId } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [options, setOptions] = useState([])
  const [tab, setTab] = useState('order')
  const [selected, setSelected] = useState([])
  const [step, setStep] = useState('select') // 'select' | 'checkout' | 'success'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [orderId, setOrderId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const isWaiting = !!area
  const displayArea = area ? decodeURIComponent(area) : null
  const userType = sessionStorage.getItem(`userType-${room}-${bed}`) || 'patient'
  const homePath = isWaiting ? `/w/${area}` : `/q/${ward}/${room}/${bed}/${userType}`
  const canPlace = !submitting && !(isWaiting && (!name.trim() || !phone.trim()))

  useEffect(() => {
    Promise.all([
      supabase.from('vendors').select('*').eq('id', vendorId).single(),
      supabase.from('vendor_options').select('*').eq('vendor_id', vendorId).eq('active', true).order('sort_order').order('created_at'),
    ]).then(([{ data: v }, { data: o }]) => {
      setVendor(v)
      setOptions(o || [])
      setLoading(false)
    })
  }, [vendorId])

  function toggleOption(opt) {
    setSelected(s =>
      s.find(x => x.id === opt.id)
        ? s.filter(x => x.id !== opt.id)
        : [...s, { id: opt.id, name: opt.name }]
    )
  }

  async function placeOrder() {
    if (selected.length === 0 || !canPlace) return
    setSubmitting(true)
    const code = generateTrackingCode()
    const location = isWaiting
      ? { location_type: 'waiting', waiting_area: displayArea }
      : { location_type: 'room', ward: ward.toUpperCase(), room, bed: bed.toUpperCase() }

    const { data, error } = await supabase.from('orders').insert({
      device_token: getDeviceToken(),
      tracking_code: code,
      vendor_id: vendorId,
      items: selected,
      ...location,
      customer_name: name.trim() || null,
      customer_phone: phone.trim() || null,
    }).select('id').single()
    setSubmitting(false)
    if (error) { alert('Something went wrong. Please try again.'); return }
    setOrderId(data.id)
    setTrackingCode(code)
    setStep('success')
  }

  const grouped = options.reduce((acc, opt) => {
    const cat = opt.category || 'Items'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(opt)
    return acc
  }, {})

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#aaa' }}>Loading...</p>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ fontSize: 70, marginBottom: 12 }}>🎉</div>
        <h2 style={{ color: '#0F6E56', margin: 0, fontSize: 24, fontWeight: 700 }}>Order placed!</h2>
        <p style={{ color: '#888', textAlign: 'center', marginTop: 8, fontSize: 14 }}>
          {vendor.name} has received your order.<br />Pay in person when it arrives.
        </p>

        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', padding: '20px 24px', marginTop: 24, width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Your handover code</p>
          <p style={{ margin: '8px 0 4px', fontSize: 52, fontWeight: 800, letterSpacing: 10, color: '#0F6E56' }}>{trackingCode}</p>
          <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>Show this to the delivery person</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', padding: '14px 18px', marginTop: 12, width: '100%', maxWidth: 360 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888', fontWeight: 600 }}>Your order · {vendor.emoji} {vendor.name}</p>
          {selected.map(item => (
            <p key={item.id} style={{ margin: '4px 0', fontSize: 13, color: '#111' }}>· {item.name}</p>
          ))}
          {name && <p style={{ margin: '10px 0 0', fontSize: 12, color: '#aaa' }}>Name: {name}</p>}
          {phone && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>Phone: {phone}</p>}
        </div>

        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 16px', marginTop: 12, width: '100%', maxWidth: 360 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#085041' }}>💳 Pay in person on delivery — cash or card</p>
        </div>

        <button onClick={() => navigate(`/order/${orderId}`)}
          style={{ marginTop: 24, width: '100%', maxWidth: 360, padding: '14px', borderRadius: 10, background: '#0F6E56', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          Track your order →
        </button>
        <button onClick={() => navigate(homePath)}
          style={{ marginTop: 10, width: '100%', maxWidth: 360, padding: '13px', borderRadius: 10, background: 'none', color: '#0F6E56', border: '1.5px solid #0F6E56', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', paddingBottom: tab === 'order' && step === 'select' && selected.length > 0 ? 80 : 0 }}>
      {/* Header */}
      <div style={{ background: '#0F6E56', padding: '20px 16px 0', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button
            onClick={() => step === 'checkout' ? setStep('select') : navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0, flexShrink: 0 }}>
            ‹
          </button>
          <span style={{ fontSize: 26 }}>{vendor.emoji}</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{vendor.name}</h1>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
              {vendor.description || (isWaiting ? displayArea : `Room ${room} · Bed ${bed.toUpperCase()}`)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          {['order', 'menu'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: tab === t ? 700 : 400, fontSize: 14, cursor: 'pointer', borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent' }}>
              {t === 'order' ? 'Order' : 'View Menu'}
            </button>
          ))}
        </div>
      </div>

      {/* Order tab — item selection */}
      {tab === 'order' && step === 'select' && (
        <div style={{ padding: '16px 0 16px' }}>
          {Object.keys(grouped).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
              <p style={{ fontSize: 36 }}>🛒</p>
              <p style={{ fontSize: 14 }}>No items available yet</p>
            </div>
          ) : Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={{ margin: '0 16px 20px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(opt => {
                  const isSelected = selected.some(x => x.id === opt.id)
                  return (
                    <div key={opt.id} onClick={() => toggleOption(opt)}
                      style={{ borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: isSelected ? '1.5px solid #0F6E56' : '0.5px solid #eee', background: isSelected ? '#E1F5EE' : '#fff' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: isSelected ? '6px solid #0F6E56' : '1.5px solid #ccc', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: isSelected ? '#085041' : '#111' }}>{opt.name}</p>
                        {opt.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{opt.description}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order tab — checkout */}
      {tab === 'order' && step === 'checkout' && (
        <div style={{ padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: '14px 16px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888', fontWeight: 600 }}>Your order · {vendor.emoji} {vendor.name}</p>
            {selected.map(item => (
              <p key={item.id} style={{ margin: '4px 0', fontSize: 14, color: '#111' }}>· {item.name}</p>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: '16px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {isWaiting ? 'Your details — required for delivery' : 'Optional — helps delivery find you'}
            </p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isWaiting ? 'Your name *' : 'Your name (optional)'}
              style={{ width: '100%', padding: '11px 12px', borderRadius: 9, border: isWaiting && !name.trim() ? '1px solid #f87171' : '0.5px solid #ddd', fontSize: 14, fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
            />
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={isWaiting ? 'Phone number *' : 'Phone number (optional)'}
              type="tel"
              style={{ width: '100%', padding: '11px 12px', borderRadius: 9, border: isWaiting && !phone.trim() ? '1px solid #f87171' : '0.5px solid #ddd', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
            />
            {isWaiting && (!name.trim() || !phone.trim()) && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#e05' }}>Name and phone are required for waiting room orders</p>
            )}
          </div>

          <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#085041' }}>💳 Pay in person on delivery — cash or card</p>
          </div>

          <button
            onClick={placeOrder}
            disabled={!canPlace}
            style={{ width: '100%', padding: '15px', borderRadius: 10, border: 'none', background: canPlace ? '#0F6E56' : '#ddd', color: canPlace ? '#fff' : '#aaa', fontWeight: 700, fontSize: 15, cursor: canPlace ? 'pointer' : 'not-allowed' }}>
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </div>
      )}

      {/* View Menu tab */}
      {tab === 'menu' && (
        <div style={{ padding: 16 }}>
          {vendor.pdf_url ? (
            <>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#888' }}>Pinch to zoom · Swipe to browse</p>
              <iframe
                src={vendor.pdf_url}
                style={{ width: '100%', height: '75vh', border: 'none', borderRadius: 12 }}
                title={`${vendor.name} menu`}
              />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
              <p style={{ fontSize: 40 }}>📄</p>
              <p style={{ fontSize: 14 }}>No menu PDF uploaded yet</p>
            </div>
          )}
        </div>
      )}

      {/* Sticky continue bar */}
      {tab === 'order' && step === 'select' && selected.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: '#fff', borderTop: '0.5px solid #eee' }}>
          <button
            onClick={() => setStep('checkout')}
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Continue · {selected.length} item{selected.length !== 1 ? 's' : ''} selected
          </button>
        </div>
      )}
    </div>
  )
}
