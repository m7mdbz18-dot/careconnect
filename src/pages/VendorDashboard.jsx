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

function extraName(e) { return typeof e === 'string' ? e : (e?.name || '') }
function extraPrice(e) { return typeof e === 'object' && e !== null ? (e.price || 0) : 0 }

const STATUS_LABEL = {
  pending:   { label: 'Pending',    bg: '#FEF3C7', color: '#92400E' },
  accepted:  { label: 'Accepted',   bg: '#DBEAFE', color: '#1E40AF' },
  ready:     { label: 'On the way', bg: '#D1FAE5', color: '#065F46' },
  delivered: { label: 'Delivered',  bg: '#F3F4F6', color: '#6B7280' },
}
const NEXT_ACTION = {
  pending:  { label: 'Accept order',       next: 'accepted', bg: '#0F6E56' },
  accepted: { label: 'Ready for delivery', next: 'ready',    bg: '#2563EB' },
  ready:    { label: 'Mark as delivered',  next: 'delivered', bg: '#6B7280' },
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return diff + 's ago'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  return Math.floor(diff / 3600) + 'h ago'
}

export default function VendorDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAdmin = getRole() === 'admin'
  const vendorId = searchParams.get('id') || getVendorId()

  const [vendor, setVendor] = useState(null)
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [notifStatus, setNotifStatus] = useState(
    !('Notification' in window) ? 'unsupported' : Notification.permission
  )
  const [menuOptions, setMenuOptions] = useState([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuLoaded, setMenuLoaded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', description: '', category: '', sort_order: '0', price: '' })
  const [formExtras, setFormExtras] = useState([])
  const [formExtraInput, setFormExtraInput] = useState('')
  const [formExtraPriceInput, setFormExtraPriceInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingExtraFor, setAddingExtraFor] = useState(null)
  const [extraInput, setExtraInput] = useState('')
  const [extraPriceInput, setExtraPriceInput] = useState('')
  const [uploadingPdf, setUploadingPdf] = useState(false)

  async function setupPush(vid) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') return
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) })
      const { endpoint, keys } = sub.toJSON()
      await supabase.from('push_subscriptions').upsert({ vendor_id: vid, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: 'vendor_id,endpoint' })
      setNotifStatus('granted')
    } catch { }
  }

  async function requestPush() {
    if (!vendorId) return
    const permission = await Notification.requestPermission()
    setNotifStatus(permission)
    if (permission === 'granted') setupPush(vendorId)
  }

  useEffect(() => {
    if (!vendorId) { navigate('/login'); return }
    loadVendor(); loadOrders()
    const channel = supabase.channel('vendor-orders-' + vendorId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'vendor_id=eq.' + vendorId }, () => loadOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [vendorId])

  useEffect(() => { if (tab === 'menu' && !menuLoaded) loadMenu() }, [tab])

  async function loadVendor() {
    const { data } = await supabase.from('vendors').select('id, name, emoji, description, tax_rate, pdf_url').eq('id', vendorId).single()
    setVendor(data)
    if (data && Notification.permission === 'granted') setupPush(data.id)
  }

  async function loadOrders() {
    const { data } = await supabase.from('orders').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
    setOrders(data || []); setLoading(false)
  }

  async function loadMenu() {
    setMenuLoading(true)
    const { data } = await supabase.from('vendor_options').select('*').eq('vendor_id', vendorId).order('sort_order').order('created_at')
    setMenuOptions(data || []); setMenuLoading(false); setMenuLoaded(true)
  }

  async function uploadMenuPdf(file) {
    if (!file || file.type !== 'application/pdf') { alert('Please select a PDF file.'); return }
    setUploadingPdf(true)
    const path = vendorId + '/menu.pdf'
    const { error } = await supabase.storage.from('menus').upload(path, file, { upsert: true, contentType: 'application/pdf' })
    if (error) { alert('Upload failed: ' + error.message); setUploadingPdf(false); return }
    const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(path)
    await supabase.from('vendors').update({ pdf_url: publicUrl }).eq('id', vendorId)
    setUploadingPdf(false); loadVendor()
  }

  async function removeMenuPdf() {
    if (!confirm('Remove the menu PDF?')) return
    await supabase.storage.from('menus').remove([vendorId + '/menu.pdf'])
    await supabase.from('vendors').update({ pdf_url: null }).eq('id', vendorId)
    loadVendor()
  }

  async function advance(orderId, nextStatus) {
    setUpdating(orderId)
    await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId)
    setUpdating(null)
  }

  async function addMenuItem() {
    if (!addForm.name.trim()) return
    setSaving(true)
    await supabase.from('vendor_options').insert({
      vendor_id: vendorId, name: addForm.name.trim(),
      description: addForm.description.trim() || null, category: addForm.category.trim() || null,
      sort_order: parseInt(addForm.sort_order) || 0, price: parseFloat(addForm.price) || null,
      extras: formExtras.length > 0 ? formExtras : null, active: true,
    })
    setSaving(false)
    setAddForm({ name: '', description: '', category: '', sort_order: '0', price: '' })
    setFormExtras([]); setFormExtraInput(''); setFormExtraPriceInput(''); setShowAddForm(false); loadMenu()
  }

  function addFormExtra() {
    const val = formExtraInput.trim()
    if (!val || formExtras.some(e => extraName(e) === val)) return
    const price = parseFloat(formExtraPriceInput) || 0
    setFormExtras(f => [...f, price > 0 ? { name: val, price } : val])
    setFormExtraInput(''); setFormExtraPriceInput('')
  }

  async function toggleMenuItem(opt) { await supabase.from('vendor_options').update({ active: !opt.active }).eq('id', opt.id); loadMenu() }
  async function deleteMenuItem(id) { if (!confirm('Delete this item?')) return; await supabase.from('vendor_options').delete().eq('id', id); loadMenu() }

  async function addExtraToItem(opt) {
    const val = extraInput.trim(); if (!val) return
    const price = parseFloat(extraPriceInput) || 0
    await supabase.from('vendor_options').update({ extras: [...(opt.extras || []), price > 0 ? { name: val, price } : val] }).eq('id', opt.id)
    setExtraInput(''); setExtraPriceInput(''); setAddingExtraFor(null); loadMenu()
  }

  async function removeExtraFromItem(opt, extra) {
    const newExtras = (opt.extras || []).filter(e => extraName(e) !== extraName(extra))
    await supabase.from('vendor_options').update({ extras: newExtras.length > 0 ? newExtras : null }).eq('id', opt.id); loadMenu()
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered')
  const doneOrders   = orders.filter(o => o.status === 'delivered')
  const displayed    = tab === 'active' ? activeOrders : doneOrders

  const grouped = menuOptions.reduce((acc, opt) => {
    const cat = opt.category || 'Items'; if (!acc[cat]) acc[cat] = []; acc[cat].push(opt); return acc
  }, {})

  const tabs = [
    { key: 'active', label: 'Active' + (activeOrders.length ? ' (' + activeOrders.length + ')' : '') },
    { key: 'done',   label: 'Completed' + (doneOrders.length ? ' (' + doneOrders.length + ')' : '') },
    { key: 'menu',   label: 'Menu' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 0', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAdmin && <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}>&#8249;</button>}
            <div>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Vendor dashboard</p>
              <h1 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 600 }}>{vendor?.emoji} {vendor?.name || '...'}</h1>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Logout</button>
        </div>
        <div style={{ display: 'flex' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.55)', fontWeight: tab === t.key ? 700 : 400, fontSize: 13, cursor: 'pointer', borderBottom: tab === t.key ? '2px solid #fff' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'menu' && notifStatus === 'default' && (
        <div style={{ margin: '12px 16px 0', background: '#FAEEDA', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>&#128276;</span>
          <p style={{ margin: 0, flex: 1, fontSize: 13, color: '#633806' }}>Enable notifications to get alerted when new orders arrive.</p>
          <button onClick={requestPush} style={{ background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Enable</button>
        </div>
      )}
      {tab !== 'menu' && notifStatus === 'denied' && (
        <div style={{ margin: '12px 16px 0', background: '#F3F4F6', borderRadius: 12, padding: '10px 16px' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Notifications blocked. Enable them in your browser settings.</p>
        </div>
      )}
      {tab !== 'menu' && notifStatus === 'granted' && (
        <div style={{ margin: '12px 16px 0', background: '#E1F5EE', borderRadius: 12, padding: '10px 16px' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#085041' }}>&#128276; Push notifications active.</p>
        </div>
      )}

      {(tab === 'active' || tab === 'done') && (
        <div style={{ padding: 16 }}>
          {loading ? <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading orders...</p>
          : displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
              <p style={{ fontSize: 36 }}>{tab === 'active' ? '&#127881;' : '&#128203;'}</p>
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
                          {order.location_type === 'room' ? 'Ward ' + order.ward + ' · Room ' + order.room + ' · Bed ' + order.bed : order.waiting_area}
                        </span>
                        <span style={{ marginLeft: 10, fontSize: 11, color: '#aaa' }}>{timeAgo(order.created_at)}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #f0f0f0' }}>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ margin: '3px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 13, color: '#111' }}>&#183; {item.name}</p>
                            {item.extras && item.extras.length > 0 && (
                              <p style={{ margin: '1px 0 0 10px', fontSize: 12, color: '#0F6E56' }}>
                                {item.extras.map(e => extraName(e) + (extraPrice(e) > 0 ? ' +AED ' + Number(extraPrice(e)).toFixed(2) : '')).join(' · ')}
                              </p>
                            )}
                          </div>
                          {item.price > 0 && <p style={{ margin: 0, fontSize: 13, color: '#555', fontWeight: 600, marginLeft: 8, flexShrink: 0 }}>AED {Number(item.price).toFixed(2)}</p>}
                        </div>
                      ))}
                      {order.total > 0 && (
                        <div style={{ borderTop: '0.5px solid #f0f0f0', marginTop: 8, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                          {order.tax_amount > 0 && <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>incl. tax AED {Number(order.tax_amount).toFixed(2)}</p>}
                          <p style={{ margin: '0 0 0 auto', fontSize: 14, color: '#0F6E56', fontWeight: 700 }}>Total: AED {Number(order.total).toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: action ? '0.5px solid #f0f0f0' : 'none' }}>
                      <div>
                        {order.customer_name && <p style={{ margin: 0, fontSize: 12, color: '#555', fontWeight: 600 }}>{order.customer_name}</p>}
                        {order.customer_phone && <a href={'tel:' + order.customer_phone} style={{ fontSize: 12, color: '#0F6E56', textDecoration: 'none', fontWeight: 600 }}>&#128222; {order.customer_phone}</a>}
                        {!order.customer_name && !order.customer_phone && <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>No contact info</p>}
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
                          {isUpdating ? 'Updating...' : action.label}
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

      {tab === 'menu' && (
        <div style={{ padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#111' }}>Menu PDF</p>
            {vendor?.pdf_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <a href={vendor.pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#0F6E56', textDecoration: 'none', fontWeight: 500 }}>
                  &#128196; View current menu PDF &#8599;
                </a>
                <button onClick={removeMenuPdf} style={{ background: 'none', border: 'none', color: '#e05', fontSize: 12, cursor: 'pointer', padding: 0 }}>Remove</button>
              </div>
            ) : (
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#aaa' }}>No PDF uploaded yet</p>
            )}
            <label style={{ display: 'block', padding: '12px', borderRadius: 9, border: '1.5px dashed #ccc', fontSize: 14, color: uploadingPdf ? '#aaa' : '#0F6E56', cursor: uploadingPdf ? 'not-allowed' : 'pointer', textAlign: 'center', background: '#f9fffe', fontWeight: 600 }}>
              {uploadingPdf ? 'Uploading...' : vendor?.pdf_url ? '&#8593; Replace PDF' : '&#8593; Upload PDF'}
              <input type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} disabled={uploadingPdf}
                onChange={e => e.target.files[0] && uploadMenuPdf(e.target.files[0])} />
            </label>
          </div>

          <button onClick={() => { setShowAddForm(v => !v); setFormExtras([]); setFormExtraInput(''); setFormExtraPriceInput('') }}
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>
            {showAddForm ? 'Cancel' : '+ Add menu item'}
          </button>

          {showAddForm && (
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, marginBottom: 16 }}>
              {[
                { key: 'name', label: 'Name *', placeholder: 'e.g. Latte' },
                { key: 'description', label: 'Description', placeholder: 'e.g. Espresso with steamed milk' },
                { key: 'category', label: 'Category', placeholder: 'e.g. Hot drinks' },
                { key: 'price', label: 'Price (AED)', placeholder: 'e.g. 15.00', type: 'number' },
                { key: 'sort_order', label: 'Sort order', placeholder: '0', type: 'number' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{f.label}</p>
                  <input value={addForm[f.key]} onChange={e => setAddForm(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} type={f.type || 'text'}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#888' }}>Customization options</p>
              {formExtras.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {formExtras.map(e => (
                    <span key={extraName(e)} onClick={() => setFormExtras(f => f.filter(x => extraName(x) !== extraName(e)))}
                      style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#E1F5EE', color: '#085041', cursor: 'pointer', border: '1px solid #A8DECE' }}>
                      {extraName(e)}{extraPrice(e) > 0 ? ' +AED ' + Number(extraPrice(e)).toFixed(2) : ''} &#215;
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <input value={formExtraInput} onChange={e => setFormExtraInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFormExtra()}
                  placeholder="Option name" style={{ flex: 2, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <input value={formExtraPriceInput} onChange={e => setFormExtraPriceInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFormExtra()}
                  placeholder="+AED" type="number" min="0" step="0.5" style={{ flex: 1, minWidth: 80, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                <button onClick={addFormExtra} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: formExtraInput.trim() ? '#0F6E56' : '#eee', color: formExtraInput.trim() ? '#fff' : '#aaa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: '#bbb' }}>Leave +AED blank if the option is free</p>
              <button onClick={addMenuItem} disabled={saving || !addForm.name.trim()}
                style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: addForm.name.trim() ? '#0F6E56' : '#ddd', color: addForm.name.trim() ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: addForm.name.trim() ? 'pointer' : 'not-allowed' }}>
                {saving ? 'Saving...' : 'Save item'}
              </button>
            </div>
          )}

          {menuLoading ? <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading menu...</p>
          : menuOptions.length === 0 ? <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>No items yet — add your first one above</p>
          : Object.entries(grouped).map(([cat, items]) => (
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
                      {opt.price > 0 && <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F6E56', flexShrink: 0 }}>AED {Number(opt.price).toFixed(2)}</p>}
                    </div>
                    <div style={{ padding: '0 14px 12px' }}>
                      {(opt.extras || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {(opt.extras || []).map(e => (
                            <span key={extraName(e)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#E1F5EE', color: '#085041', display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #A8DECE' }}>
                              {extraName(e)}{extraPrice(e) > 0 ? ' +AED ' + Number(extraPrice(e)).toFixed(2) : ''}
                              <span onClick={() => removeExtraFromItem(opt, e)} style={{ cursor: 'pointer', color: '#0F6E56', fontWeight: 700, lineHeight: 1 }}>&#215;</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {addingExtraFor === opt.id ? (
                        <div>
                          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                            <input autoFocus value={extraInput} onChange={e => setExtraInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExtraToItem(opt)}
                              placeholder="e.g. Extra coffee" style={{ flex: 2, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                            <input value={extraPriceInput} onChange={e => setExtraPriceInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExtraToItem(opt)}
                              placeholder="+AED" type="number" min="0" step="0.5" style={{ flex: 1, minWidth: 70, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                            <button onClick={() => addExtraToItem(opt)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                            <button onClick={() => { setAddingExtraFor(null); setExtraInput(''); setExtraPriceInput('') }} style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: '#f0f0f0', color: '#666', fontSize: 13, cursor: 'pointer' }}>&#215;</button>
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: '#bbb' }}>Leave +AED blank if the option is free</p>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingExtraFor(opt.id); setExtraInput(''); setExtraPriceInput('') }}
                          style={{ background: 'none', border: '1px dashed #ccc', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#888', cursor: 'pointer' }}>
                          + add customization
                        </button>
                      )}
                    </div>
                    <div style={{ borderTop: '0.5px solid #f0f0f0', display: 'flex' }}>
                      <button onClick={() => toggleMenuItem(opt)} style={{ flex: 1, padding: '9px', background: 'none', border: 'none', borderRight: '0.5px solid #f0f0f0', color: '#888', fontSize: 13, cursor: 'pointer' }}>{opt.active ? 'Hide' : 'Show'}</button>
                      <button onClick={() => deleteMenuItem(opt.id)} style={{ flex: 1, padding: '9px', background: 'none', border: 'none', color: '#e05', fontSize: 13, cursor: 'pointer' }}>Delete</button>
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