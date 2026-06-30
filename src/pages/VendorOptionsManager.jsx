import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'

const EMOJIS = ['🍔', '☕', '🍕', '🌸', '🥗', '🍜', '🥤', '🍰', '🛒', '🍴']

export default function VendorOptionsManager() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', category: '', sort_order: '0', price: '' })
  const [formExtras, setFormExtras] = useState([])
  const [formExtraInput, setFormExtraInput] = useState('')
  const [editingVendor, setEditingVendor] = useState(false)
  const [vendorForm, setVendorForm] = useState({})
  const [savingVendor, setSavingVendor] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [addingExtraFor, setAddingExtraFor] = useState(null)
  const [extraInput, setExtraInput] = useState('')

  useEffect(() => { load() }, [vendorId])

  async function load() {
    const [{ data: v }, { data: o }] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', vendorId).single(),
      supabase.from('vendor_options').select('*').eq('vendor_id', vendorId).order('sort_order').order('created_at'),
    ])
    setVendor(v)
    setVendorForm({
      name: v?.name || '',
      description: v?.description || '',
      emoji: v?.emoji || '🛒',
      pdf_url: v?.pdf_url || '',
      sort_order: String(v?.sort_order ?? 0),
      username: v?.username || '',
      password: v?.password || '',
      tax_rate: String(v?.tax_rate ?? 0),
    })
    setOptions(o || [])
    setLoading(false)
  }

  async function saveVendor() {
    setSavingVendor(true)
    setSaveError('')
    const { error } = await supabase.from('vendors').update({
      name: vendorForm.name.trim(),
      description: vendorForm.description.trim() || null,
      emoji: vendorForm.emoji,
      pdf_url: vendorForm.pdf_url.trim() || null,
      sort_order: parseInt(vendorForm.sort_order) || 0,
      username: vendorForm.username.trim().toLowerCase() || null,
      password: vendorForm.password.trim() || null,
      tax_rate: parseFloat(vendorForm.tax_rate) || 0,
    }).eq('id', vendorId)
    setSavingVendor(false)
    if (error) { setSaveError(error.message); return }
    setEditingVendor(false)
    load()
  }

  async function addOption() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('vendor_options').insert({
      vendor_id: vendorId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
      price: parseFloat(form.price) || null,
      extras: formExtras.length > 0 ? formExtras : null,
      active: true,
    })
    setSaving(false)
    setForm({ name: '', description: '', category: '', sort_order: '0', price: '' })
    setFormExtras([])
    setFormExtraInput('')
    setShowForm(false)
    load()
  }

  function addFormExtra() {
    const val = formExtraInput.trim()
    if (!val || formExtras.includes(val)) return
    setFormExtras(f => [...f, val])
    setFormExtraInput('')
  }

  async function toggleOption(opt) {
    await supabase.from('vendor_options').update({ active: !opt.active }).eq('id', opt.id)
    load()
  }

  async function deleteOption(id) {
    if (!confirm('Delete this option?')) return
    await supabase.from('vendor_options').delete().eq('id', id)
    load()
  }

  async function addExtraToOption(opt) {
    const val = extraInput.trim()
    if (!val) return
    const newExtras = [...(opt.extras || []), val]
    await supabase.from('vendor_options').update({ extras: newExtras }).eq('id', opt.id)
    setExtraInput('')
    setAddingExtraFor(null)
    load()
  }

  async function removeExtraFromOption(opt, extra) {
    const newExtras = (opt.extras || []).filter(e => e !== extra)
    await supabase.from('vendor_options').update({ extras: newExtras.length > 0 ? newExtras : null }).eq('id', opt.id)
    load()
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

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/admin/vendors')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>&#8249;</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Vendor options</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{vendor?.emoji} {vendor?.name}</h1>
        </div>
        <button onClick={() => setEditingVendor(v => !v)}
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
          {editingVendor ? 'Cancel' : 'Edit vendor'}
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {editingVendor && (
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#111' }}>Edit vendor details</p>
            {[
              { key: 'name', label: 'Name *', placeholder: 'Vendor name' },
              { key: 'description', label: 'Description', placeholder: 'Short description' },
              { key: 'emoji', label: 'Emoji', placeholder: '🛒' },
              { key: 'pdf_url', label: 'Menu PDF URL', placeholder: 'https://...' },
              { key: 'sort_order', label: 'Sort order', placeholder: '0', type: 'number' },
              { key: 'tax_rate', label: 'Tax rate (%)', placeholder: 'e.g. 5 for 5% VAT', type: 'number' },
              { key: 'username', label: 'Dashboard login username', placeholder: 'e.g. starbucks' },
              { key: 'password', label: 'Dashboard login password', placeholder: 'Set a password for this vendor' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{f.label}</p>
                <input value={vendorForm[f.key] || ''} onChange={e => setVendorForm(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} type={f.type || 'text'}
                  style={inputStyle} />
              </div>
            ))}
            {saveError && <p style={{ color: '#A32D2D', fontSize: 13, margin: '0 0 10px' }}>Error: {saveError}</p>}
            <button onClick={saveVendor} disabled={savingVendor}
              style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              {savingVendor ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}

        <button onClick={() => { setShowForm(v => !v); setFormExtras([]); setFormExtraInput('') }}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>
          {showForm ? 'Cancel' : '+ Add menu item'}
        </button>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#111' }}>New item</p>
            {[
              { key: 'name', label: 'Name *', placeholder: 'e.g. Latte' },
              { key: 'description', label: 'Description', placeholder: 'e.g. Espresso with steamed milk' },
              { key: 'category', label: 'Category', placeholder: 'e.g. Hot drinks' },
              { key: 'price', label: 'Price (AED)', placeholder: 'e.g. 15.00', type: 'number' },
              { key: 'sort_order', label: 'Sort order', placeholder: '0', type: 'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{f.label}</p>
                <input value={form[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} type={f.type || 'text'} style={inputStyle} />
              </div>
            ))}

            <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#888' }}>Customization options <span style={{ color: '#bbb' }}>(optional — e.g. Extra sugar, No lettuce)</span></p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: formExtras.length > 0 ? 8 : 0 }}>
              {formExtras.map(e => (
                <span key={e} onClick={() => setFormExtras(f => f.filter(x => x !== e))}
                  style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#E1F5EE', color: '#085041', cursor: 'pointer', border: '1px solid #A8DECE' }}>
                  {e} &#215;
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

            <button onClick={addOption} disabled={saving || !form.name.trim()}
              style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: form.name.trim() ? '#0F6E56' : '#ddd', color: form.name.trim() ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: form.name.trim() ? 'pointer' : 'not-allowed' }}>
              {saving ? 'Saving...' : 'Save item'}
            </button>
          </div>
        )}

        {options.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>No items yet — add some above</p>
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
                    {opt.price > 0 && (
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F6E56', flexShrink: 0 }}>
                        AED {Number(opt.price).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div style={{ padding: '0 14px 12px' }}>
                    {(opt.extras || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {(opt.extras || []).map(e => (
                          <span key={e} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#E1F5EE', color: '#085041', display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #A8DECE' }}>
                            {e}
                            <span onClick={() => removeExtraFromOption(opt, e)} style={{ cursor: 'pointer', color: '#0F6E56', fontWeight: 700, lineHeight: 1 }}>&#215;</span>
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
                          &#215;
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
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }