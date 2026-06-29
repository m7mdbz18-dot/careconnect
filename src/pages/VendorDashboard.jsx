import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { logout, getRole, getVendorId } from '../auth'

const STATUS_LABEL = {
  pending:   { label: 'Pending',   bg: '#FEF3C7', color: '#92400E' },
  accepted:  { label: 'Accepted',  bg: '#DBEAFE', color: '#1E40AF' },
  ready:     { label: 'On the way', bg: '#D1FAE5', color: '#065F46' },
  delivered: { label: 'Delivered', bg: '#F3F4F6', color: '#6B7280' },
}

const NEXT_ACTION = {
  pending:  { label: '✓ Accept order',       next: 'accepted', bg: '#0F6E56' },
  accepted: { label: '📦 Ready for delivery', next: 'ready',    bg: '#2563EB' },
  ready:    { label: '✓ Mark as delivered',  next: 'delivered', bg: '#6B7280' },
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function VendorDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAdmin = getRole() === 'admin'

  // Admin can pass ?id= to view any vendor; vendors use their session
  const vendorId = searchParams.get('id') || getVendorId()

  const [vendor, setVendor] = useState(null)
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (!vendorId) { navigate('/login'); return }
    loadVendor()
    loadOrders()

    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vendorId}` }, () => loadOrders())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [vendorId])

  async function loadVendor() {
    const { data } = await supabase.from('vendors').select('id, name, emoji, description').eq('id', vendorId).single()
    setVendor(data)
  }

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function advance(orderId, nextStatus) {
    setUpdating(orderId)
    await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId)
    setUpdating(null)
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered')
  const doneOrders   = orders.filter(o => o.status === 'delivered')
  const displayed    = tab === 'active' ? activeOrders : doneOrders

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0F6E56', padding: '20px 16px 0', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAdmin && (
              <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}>‹</button>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Vendor dashboard</p>
              <h1 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 600 }}>{vendor?.emoji} {vendor?.name || '…'}</h1>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {[
            { key: 'active', label: `Active${activeOrders.length ? ` (${activeOrders.length})` : ''}` },
            { key: 'done',   label: `Completed${doneOrders.length ? ` (${doneOrders.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: tab === t.key ? 700 : 400, fontSize: 14, cursor: 'pointer', borderBottom: tab === t.key ? '2px solid #fff' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading orders...</p>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
            <p style={{ fontSize: 36 }}>{tab === 'active' ? '🎉' : '📋'}</p>
            <p style={{ fontSize: 14 }}>{tab === 'active' ? 'No active orders right now' : 'No completed orders yet'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayed.map(order => {
              const st = STATUS_LABEL[order.status] || STATUS_LABEL.pending
              const action = NEXT_ACTION[order.status]
              const isUpdating = updating === order.id

              return (
                <div key={order.id} style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #eee', overflow: 'hidden' }}>
                  {/* Card header */}
                  <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #f0f0f0' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
                        {order.location_type === 'room'
                          ? `Ward ${order.ward} · Room ${order.room} · Bed ${order.bed}`
                          : order.waiting_area}
                      </span>
                      <span style={{ marginLeft: 10, fontSize: 11, color: '#aaa' }}>{timeAgo(order.created_at)}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #f0f0f0' }}>
                    {(order.items || []).map((item, i) => (
                      <p key={i} style={{ margin: '2px 0', fontSize: 13, color: '#111' }}>· {item.name}</p>
                    ))}
                  </div>

                  {/* Customer info + code */}
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: action ? '0.5px solid #f0f0f0' : 'none' }}>
                    <div>
                      {order.customer_name && <p style={{ margin: 0, fontSize: 12, color: '#555', fontWeight: 600 }}>{order.customer_name}</p>}
                      {order.customer_phone && (
                        <a href={`tel:${order.customer_phone}`} style={{ fontSize: 12, color: '#0F6E56', textDecoration: 'none', fontWeight: 600 }}>
                          📞 {order.customer_phone}
                        </a>
                      )}
                      {!order.customer_name && !order.customer_phone && (
                        <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>No contact info</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Code</p>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 4, color: '#0F6E56' }}>{order.tracking_code}</p>
                    </div>
                  </div>

                  {/* Action button */}
                  {action && (
                    <div style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => advance(order.id, action.next)}
                        disabled={isUpdating}
                        style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: isUpdating ? '#ddd' : action.bg, color: isUpdating ? '#aaa' : '#fff', fontWeight: 700, fontSize: 14, cursor: isUpdating ? 'not-allowed' : 'pointer' }}>
                        {isUpdating ? 'Updating…' : action.label}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
