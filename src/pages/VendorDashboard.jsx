import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { logout, getRole, getVendorId } from '../auth'
import { VAPID_PUBLIC_KEY } from '../vapid'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

const STATUS_LABEL = {
  pending:   { label: 'Pending',    bg: '#FEF3C7', color: '#92400E' },
  accepted:  { label: 'Accepted',   bg: '#DBEAFE', color: '#1E40AF' },
  ready:     { label: 'On the way', bg: '#D1FAE5', color: '#065F46' },
  delivered: { label: 'Delivered',  bg: '#F3F4F6', color: '#6B7280' },
}

const NEXT_ACTION = {
  pending:  { label: '✓ Accept order',        next: 'accepted', bg: '#0F6E56' },
  accepted: { label: '📦 Ready for delivery',  next: 'ready',    bg: '#2563EB' },
  ready:    { label: '✓ Mark as delivered',   next: 'delivered', bg: '#6B7280' },
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }

export default function VendorDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAdmin = getRole() === 'admin'
  const vendorId = searchParams.get('id') || getVendorId()

  const [vendor, setVendor] = useState(null)
  const [orders, setOrders] = useState([])
  const [options, setOptions] = useState([])
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [notifStatus, setNotifStatus] = useState(
    !('Notification' in window) ? 'unsupported' : Notification.permission
  )

  // Menu tab state
  const [pdfUrl, setPdfUrl] = useState('')
  const [savingPdf, setSavingPdf] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemForm, setItemForm] = useState({ name: '', description: '', category: '', sort_order: '0' })
  const [formExtras, setFormExtras] = useState([])
  const [formExtraInput, setFormExtraInput] = useState('')
  const [savingItem, setSavingItem] = useState(false)
  const [addingExtraFor, setAddingExtraFor] = useState(null)
  const [extraInput, setExtraInput] = useState('')

  async function setupPush(vid) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') return
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const { endpoint, keys } = sub.toJSON()
      await supabase.from('push_subscriptions').upsert(
        { vendor_id: vid, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'vendor_id,endpoint' }
      )
      setNotifStatus('granted')
    } catch { /* permission denied or SW error */ }
  }

  async function requestPush() {
    if (!vendorId) return
    const permission = await Notification.requestPermission()
    setNotifStatus(permission)
    if (permission === 'granted') setupPush(vendorId)
  }

  useEffect(() => {
    if (!vendorId) { navigate('/login'); return }
    loadAll()
    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vendorId}` }, () => loadOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [vendorId])

  async function loadAll() {
    await Promise.all([loadVendor(), loadOrders(), loadOptions()])
    setLoading(false)
  }

  async function loadVendor() {
    const { data } = await supabase.from('vendors').select('*').eq('id', vendorId).single()
    setVendor(data)
    setPdfUrl(data?.pdf_url || '')
    if (data && Notification.permission === 'granted') setupPush(data.id)
  }

  async function loadOrders() {
    const { data } = await supabase.from('orders').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
    setOrders(data || [])
  }

  async function loadOptions() {
    const { data } = await supabase.from('vendor_options').select('*').eq('vendor_id', vendorId).order('sort_order').order('created_at')
    setOptions(data || [])
  }

  async function advance(orderId, nextStatus) {
    setUpdating(orderId)
    await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId)
    setUpdating(null)
  }

  async function savePdfUrl() {
    setSavingPdf(true)
    await supabase.from('vendors').update({ pdf_url: pdfUrl.trim() || null }).eq('id', vendorId)
    setSavingPdf(false)
    loadVendor()
  }

  async function addItem() {
    if (!itemForm.name.trim()) return
    setSavingItem(true)
    await supabase.from('vendor_options').insert({
      vendor_id: vendorId,
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || null,
      category: itemForm.category.trim() || null,
      sort_order: parseInt(itemForm.sort_order) || 0,
      extras: formExtras.length > 0 ? formExtras : null,
      active: true,
    })
    setSavingItem(false)
    setItemForm({ name: '', description: '', category: '', sort_order: '0' })
    setFormExtras([])
    setFormExtraInput('')
    setShowItemForm(false)
    loadOptions()
  }

  function addFormExtra() {
    const val = formExtraInput.trim()
    if (!val || formExtras.includes(val)) return
    setFormExtras(f => [...f, val])
    setFormExtraInput('')
  }

  async function toggleOption(opt) {
    await supabase.from('vendor_options').update({ active: !opt.active }).eq('id', opt.id)
    loadOptions()
  }

  async function deleteOption(id) {
    if (!confirm('Delete this item?')) return
    await supabase.from('vendor_options').delete().eq('id', id)
    loadOptions()
  }

  async function addExtraToOption(opt) {
    const val = extraInput.trim()
    if (!val) return
    const newExtras = [...(opt.extras || []), val]
    await supabase.from('vendor_options').update({ extras: newExtras }).eq('id', opt.id)
    setExtraInput('')
    setAddingExtraFor(null)
    loadOptions()
  }

  async function removeExtraFromOption(opt, extra) {
    const newExtras = (opt.extras || []).filter(e => e !== extra)
    await supabase.from('vendor_options').update({ extras: newExtras.length > 0 ? newExtras : null }).eq('id', opt.id)
    loadOptions()
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered')
  const doneOrders   = orders.filter(o => o.status === 'delivered')
  const displayed    = tab === 'active' ? activeOrders : doneOrders

  const grouped = options.reduce((acc, opt) => {
    const cat = opt.category || 'Items'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(opt)
    return acc
  }, {})

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
        <div style={{ display: 'flex' }}>
          {[
            { key: 'active',    label: `Active${activeOrders.length ? ` (${activeOrders.length})` : ''}` },
            { key: 'done',      label: `Completed${doneOrders.length ? ` (${doneOrders.length})` : ''}` },
            { key: 'menu',      label: 'Menu' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: tab === t.key ? 700 : 400, fontSize: 13, cursor: 'pointer', borderBottom: tab === t.key ? '2px solid #fff' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification banner — only on order tabs */}
      {tab !== 'menu' && notifStatus === 'default' && (
        <div style={{ margin: '12px 16px 0', background: '#FAEEDA', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <p style={{ margin: 0, flex: 1, fontSize: 13, color: '#633806' }}>Enable notifications to get alerted when new orders arrive — even with this tab in the background.</p>
          <button onClick={requestPush} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Enable</button>
        </div>
      )}
      {tab !== 'menu' && notifStatus === 'denied' && (
        <div style={{ margin: '12px 16px 0', background: '#F3F4F6', borderRadius: 12, padding: '10px 16px' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>🔕 Notifications blocked. Enable them in your browser settings to receive order alerts.</p>
        </div>
      )}
      {tab !== 'menu' && notifStatus === 'granted' && (
        <div style={{ margin: '12px 16px 0', background: '#E1F5EE', borderRadius: 12, padding: '10px 16px' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#085041' }}>🔔 Push notifications active — you'll be alerted for new orders.</p>
        </div>
      )}

      {/* Orders tab */}
      {(tab === 'active' || tab === 'done') && (
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
                    <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #f0f0f0' }}>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ margin: '3px 0' }}>
                          <p style={{ margin: 0, fontSize: 13, color: '#111' }}>· {item.name}</p>
                          {item.extras?.length > 0 && (
                            <p style={{ margin: '1px 0 0 10px', fontSize: 12, color: '#0F6E56' }}>{item.extras.join(' · ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
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
                    {action && (
                      <div style={{ padding: '10px 14px' }}>
                        <button onClick={() => advance(order.id, action.next)} disabled={isUpdating}
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
      )}

      {/* Menu tab */}
      {tab === 'menu' && (
        <div style={{ padding: 16 }}>
          {/* PDF URL */}
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Menu PDF</p>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#aaa' }}>Paste a public link to your menu PDF (Google Drive, Dropbox, etc.) — customers see it under "View Menu".</p>
            <input value={pdfUrl} onChange={e => setPdfUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              style={inputStyle} />
            <button onClick={savePdfUrl} disabled={savingPdf}
              style={{ width: '100%', marginTop: 10, padding: '11px', borderRadius: 9, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              {savingPdf ? 'Saving...' : 'Save PDF link'}
            </button>
          </div>

          {/* Add item */}
          <button onClick={() => { setShowItemForm(v => !v); setFormExtras([]); setFormExtraInput('') }}
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>
            {showItemForm ? 'Cancel' : '+ Add menu item'}
          </button>

          {showItemForm && (
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, marginBottom: 16 }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#111' }}>New item</p>
              {[
                { key: 'name',        label: 'Name *',     placeholder: 'e.g. Latte' },
                { key: 'description', label: 'Description', placeholder: 'e.g. Espresso with steamed milk' },
                { key: 'category',    label: 'Category',   placeholder: 'e.g. Hot drinks' },
                { key: 'sort_order',  label: 'Sort order', placeholder: '0', type: 'number' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{f.label}</p>
                  <input value={itemForm[f.key]} onChange={e => setItemForm(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} type={f.type || 'text'} style={inputStyle} />
                </div>
              ))}

              <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#888' }}>
                Customizations <span style={{ color: '#bbb' }}>(optional — e.g. Extra sugar, No lettuce)</span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: formExtras.length > 0 ? 8 : 0 }}>
                {formExtras.map(e => (
                  <span key={e} onClick={() => setFormExtras(f => f.filter(x => x !== e))}
                    style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#E1F5EE', color: '#085041', cursor: 'pointer', border: '1px solid #A8DECE' }}>
                    {e} ×
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={formExtraInput} onChange={e => setFormExtraInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addFormExtra()}
                  placeholder="e.g. Extra sugar"
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={addFormExtra}
                  style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: formExtraInput.trim() ? '#0F6E56' : '#eee', color: formExtraInput.trim() ? '#fff' : '#aaa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Add
                </button>
              </div>

              <button onClick={addItem} disabled={savingItem || !itemForm.name.trim()}
                style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: itemForm.name.trim() ? '#0F6E56' : '#ddd', color: itemForm.name.trim() ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: itemForm.name.trim() ? 'pointer' : 'not-allowed' }}>
                {savingItem ? 'Saving...' : 'Save item'}
              </button>
            </div>
          )}

          {/* Items list */}
          {options.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>No items yet — add one above</p>
          ) : Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(opt => (
                  <div key={opt.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.active ? '#0F6E56' : '#ddd', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: opt.active ? '#111' : '#aaa' }}>{opt.name}</p>
                        {opt.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>{opt.description}</p>}
                      </div>
                    </div>
                    <div style={{ padding: '0 14px 12px' }}>
                      {(opt.extras || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {(opt.extras || []).map(e => (
                            <span key={e} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#E1F5EE', color: '#085041', display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #A8DECE' }}>
                              {e}
                              <span onClick={() => removeExtraFromOption(opt, e)} style={{ cursor: 'pointer', color: '#0F6E56', fontWeight: 700, lineHeight: 1 }}>×</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {addingExtraFor === opt.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input autoFocus value={extraInput} onChange={e => setExtraInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addExtraToOption(opt)}
                            placeholder="e.g. No lettuce"
                            style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                          <button onClick={() => addExtraToOption(opt)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Add
                          </button>
                          <button onClick={() => { setAddingExtraFor(null); setExtraInput('') }}
                            style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: '#f0f0f0', color: '#666', fontSize: 13, cursor: 'pointer' }}>
                            ×
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingExtraFor(opt.id); setExtraInput('') }}
                          style={{ background: 'none', border: '1px dashed #ccc', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#888', cursor: 'pointer' }}>
                          + add customization
                        </button>
                      )}
                    </div>
                    <div style={{ borderTop: '0.5px solid #f0f0f0', display: 'flex' }}>
                      <button onClick={() => toggleOption(opt)}
                        style={{ flex: 1, padding: '9px', background: 'none', border: 'none', borderRight: '0.5px solid #f0f0f0', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                        {opt.active ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => deleteOption(opt.id)}
                        style={{ flex: 1, padding: '9px', background: 'none', border: 'none', color: '#e05', fontSize: 13, cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
