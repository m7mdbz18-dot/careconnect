import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { supabase } from '../supabase'
import { QRCodeSVG } from 'qrcode.react'

function escapeWifi(str) {
  return String(str).replace(/[\\;,:"]/g, c => '\\' + c)
}
function wifiQrString(ssid, password) {
  return `WIFI:T:WPA;S:${escapeWifi(ssid)};P:${escapeWifi(password)};;`
}

function printNetwork(net) {
  const qrStr = wifiQrString(net.ssid, net.password)
  const svgMarkup = renderToStaticMarkup(<QRCodeSVG value={qrStr} size={220} />)
  const win = window.open('', '_blank', 'width=440,height=600')
  win.document.write(`<!DOCTYPE html><html><head><title>${net.label} – WiFi QR</title>
<style>
body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;box-sizing:border-box;background:#fff}
h2{margin:18px 0 4px;font-size:20px;color:#111;text-align:center}
.sub{color:#666;font-size:13px;margin:4px 0;text-align:center}
.btn{margin-top:22px;padding:10px 28px;background:#0F6E56;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:sans-serif}
@media print{.btn{display:none}}
</style></head><body>
${svgMarkup}
<h2>${net.label}</h2>
<p class="sub">Guest WiFi · Scan to connect</p>
<button class="btn" onclick="window.print()">Print</button>
</body></html>`)
  win.document.close()
}

const EMPTY = { label: '', ssid: '', password: '' }

export default function WifiManager() {
  const navigate = useNavigate()
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY)
  const [showPass, setShowPass] = useState({})

  useEffect(() => {
    load()
    const ch = supabase.channel('wifi-networks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wifi_networks' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function load() {
    const { data } = await supabase.from('wifi_networks').select('*').order('created_at')
    setNetworks(data || [])
    setLoading(false)
  }

  async function addNetwork() {
    const { label, ssid, password } = form
    if (!label.trim() || !ssid.trim() || !password.trim()) return
    setSaving(true)
    await supabase.from('wifi_networks').insert({ label: label.trim(), ssid: ssid.trim(), password: password.trim() })
    setForm(EMPTY)
    setSaving(false)
  }

  async function saveEdit(id) {
    const { label, ssid, password } = editForm
    if (!label.trim() || !ssid.trim() || !password.trim()) return
    await supabase.from('wifi_networks').update({ label: label.trim(), ssid: ssid.trim(), password: password.trim() }).eq('id', id)
    setEditingId(null)
  }

  async function removeNetwork(id) {
    if (!confirm('Remove this WiFi network?')) return
    await supabase.from('wifi_networks').delete().eq('id', id)
  }

  function startEdit(net) {
    setEditingId(net.id)
    setEditForm({ label: net.label, ssid: net.ssid, password: net.password })
  }

  const formValid = form.label.trim() && form.ssid.trim() && form.password.trim()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>&#8249;</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>WiFi QR Codes</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>CareConnect &middot; Admin</p>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>&#9888;&#65039;</span>
          <p style={{ margin: 0, fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
            <strong>Guest &amp; public networks only.</strong> WiFi QR codes embed the password in plain text &mdash; anyone who scans gets it. Never use this for staff or internal networks.
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>&#128225; Add network</p>
          {[
            { key: 'label', label: 'Label', placeholder: 'e.g. Ground floor guest WiFi' },
            { key: 'ssid',  label: 'Network name (SSID)', placeholder: 'e.g. Hospital_Guest' },
            { key: 'password', label: 'Password', placeholder: 'Guest password' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 10 }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{f.label}</p>
              <input value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addNetwork()}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
            </div>
          ))}
          <button onClick={addNetwork} disabled={saving || !formValid}
            style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: formValid ? '#0F6E56' : '#ddd', color: formValid ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: formValid ? 'pointer' : 'not-allowed' }}>
            {saving ? 'Saving...' : 'Add network'}
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading...</p>
        ) : networks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>No WiFi networks yet &mdash; add one above</p>
        ) : networks.map(net => (
          <div key={net.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', overflow: 'hidden' }}>
            {editingId === net.id ? (
              <div style={{ padding: 16 }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Edit network</p>
                {[
                  { key: 'label', label: 'Label', placeholder: 'e.g. Ground floor guest WiFi' },
                  { key: 'ssid',  label: 'Network name (SSID)', placeholder: 'e.g. Hospital_Guest' },
                  { key: 'password', label: 'Password', placeholder: 'Guest password' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 10 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{f.label}</p>
                    <input value={editForm[f.key]} onChange={e => setEditForm(v => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveEdit(net.id)}
                    style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)}
                    style={{ padding: '11px 16px', borderRadius: 9, border: 'none', background: '#f0f0f0', color: '#555', fontSize: 14, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 15, color: '#111' }}>{net.label}</p>
                  <p style={{ margin: '0 0 2px', fontSize: 13, color: '#555' }}>SSID: <span style={{ fontFamily: 'monospace' }}>{net.ssid}</span></p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#555', fontFamily: 'monospace' }}>
                      {showPass[net.id] ? net.password : '••••••••'}
                    </p>
                    <button onClick={() => setShowPass(p => ({ ...p, [net.id]: !p[net.id] }))}
                      style={{ background: 'none', border: 'none', fontSize: 11, color: '#0F6E56', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                      {showPass[net.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px', background: '#f9f9f9', borderTop: '0.5px solid #f0f0f0', borderBottom: '0.5px solid #f0f0f0' }}>
                  <QRCodeSVG value={wifiQrString(net.ssid, net.password)} size={160} />
                </div>
                <div style={{ display: 'flex' }}>
                  <button onClick={() => startEdit(net)}
                    style={{ flex: 1, padding: '11px', background: 'none', border: 'none', borderRight: '0.5px solid #f0f0f0', color: '#0F6E56', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => printNetwork(net)}
                    style={{ flex: 1, padding: '11px', background: 'none', border: 'none', borderRight: '0.5px solid #f0f0f0', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    &#128424;&#65039; Print
                  </button>
                  <button onClick={() => removeNetwork(net.id)}
                    style={{ flex: 1, padding: '11px', background: 'none', border: 'none', color: '#e05', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}