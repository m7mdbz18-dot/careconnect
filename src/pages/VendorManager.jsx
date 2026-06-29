import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const EMOJIS = ['🍔', '☕', '🍕', '🌸', '🥗', '🍜', '🥤', '🍰', '🛒', '🍴']

export default function VendorManager() {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', emoji: '🛒', pdf_url: '', sort_order: '0' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('vendors').select('*').order('sort_order').order('created_at')
    setVendors(data || [])
    setLoading(false)
  }

  async function addVendor() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('vendors').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      emoji: form.emoji,
      pdf_url: form.pdf_url.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
      active: true,
    })
    setSaving(false)
    setForm({ name: '', description: '', emoji: '🛒', pdf_url: '', sort_order: '0' })
    setShowForm(false)
    load()
  }

  async function toggleActive(v) {
    await supabase.from('vendors').update({ active: !v.active }).eq('id', v.id)
    load()
  }

  async function deleteVendor(id) {
    if (!confirm('Delete this vendor and all its options?')) return
    await supabase.from('vendors').delete().eq('id', id)
    load()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Admin</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Manage Vendors</h1>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <button onClick={() => setShowForm(v => !v)}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>
          {showForm ? 'Cancel' : '+ Add vendor'}
        </button>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#111' }}>New vendor</p>

            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888' }}>Emoji</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {EMOJIS.map(e => (
                <div key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, cursor: 'pointer', border: form.emoji === e ? '2px solid #0F6E56' : '1px solid #eee', background: form.emoji === e ? '#E1F5EE' : '#fafafa' }}>
                  {e}
                </div>
              ))}
            </div>

            {[
              { key: 'name', label: 'Name *', placeholder: 'e.g. Main Café' },
              { key: 'description', label: 'Description', placeholder: 'e.g. Hot & cold drinks' },
              { key: 'pdf_url', label: 'Menu PDF URL', placeholder: 'https://...' },
              { key: 'sort_order', label: 'Sort order (lower = first)', placeholder: '0', type: 'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{f.label}</p>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  type={f.type || 'text'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}

            <button onClick={addVendor} disabled={saving || !form.name.trim()}
              style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: form.name.trim() ? '#0F6E56' : '#ddd', color: form.name.trim() ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: form.name.trim() ? 'pointer' : 'not-allowed', marginTop: 4 }}>
              {saving ? 'Saving...' : 'Save vendor'}
            </button>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading...</p>
        ) : vendors.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>No vendors yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vendors.map(v => (
              <div key={v.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{v.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: v.active ? '#111' : '#aaa' }}>{v.name}</p>
                    {v.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>{v.description}</p>}
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.active ? '#0F6E56' : '#ddd', flexShrink: 0 }} />
                </div>
                <div style={{ borderTop: '0.5px solid #f0f0f0', display: 'flex' }}>
                  <button onClick={() => navigate(`/admin/vendors/${v.id}`)}
                    style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderRight: '0.5px solid #f0f0f0', color: '#0F6E56', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    Edit options
                  </button>
                  <button onClick={() => toggleActive(v)}
                    style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderRight: '0.5px solid #f0f0f0', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                    {v.active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => deleteVendor(v.id)}
                    style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: '#e05', fontSize: 13, cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
