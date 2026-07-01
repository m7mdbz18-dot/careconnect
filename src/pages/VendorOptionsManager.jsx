import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'

function extraName(e) { return typeof e === 'string' ? e : (e?.name || '') }
function extraPrice(e) { return typeof e === 'object' && e !== null ? (e.price || 0) : 0 }

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
  const [formExtraPriceInput, setFormExtraPriceInput] = useState('')
  const [editingVendor, setEditingVendor] = useState(false)
  const [vendorForm, setVendorForm] = useState({})
  const [savingVendor, setSavingVendor] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [addingExtraFor, setAddingExtraFor] = useState(null)
  const [extraInput, setExtraInput] = useState('')
  const [extraPriceInput, setExtraPriceInput] = useState('')
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [areas, setAreas] = useState([])
  const [areaAccess, setAreaAccess] = useState(new Set())
  const [editingAreas, setEditingAreas] = useState(false)
  const [savingAreas, setSavingAreas] = useState(false)

  useEffect(() => { load() }, [vendorId])

  async function load() {
    const [{ data: v }, { data: o }, { data: tokens }, { data: rules }] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', vendorId).single(),
      supabase.from('vendor_options').select('*').eq('vendor_id', vendorId).order('sort_order').order('created_at'),
      supabase.from('qr_tokens').select('area').eq('location_type', 'waiting'),
      supabase.from('vendor_location_access').select('location_key').eq('vendor_id', vendorId).eq('location_type', 'area'),
    ])
    setVendor(v)
    setVendorForm({
      name: v?.name || '',
      description: v?.description || '',
      emoji: v?.emoji || '🛒',
      sort_order: String(v?.sort_order ?? 0),
      tax_rate: String(v?.tax_rate ?? 0),
      username: v?.username || '',
      password: v?.password || '',
    })
    setOptions(o || [])
    setAreas([...new Set((tokens || []).filter(t => t.area).map(t => t.area))].sort())
    setAreaAccess(new Set((rules || []).map(r => r.location_key)))
    setLoading(false)
  }

  function toggleArea(a) {
    setAreaAccess(s => { const n = new Set(s); n.has(a) ? n.delete(a) : n.add(a); return n })
  }

  async function saveAreas() {
    setSavingAreas(true)
    await supabase.from('vendor_location_access').delete().eq('vendor_id', vendorId).eq('location_type', 'area')
    if (areaAccess.size > 0) {
      await supabase.from('vendor_location_access').insert(
        [...areaAccess].map(a => ({ vendor_id: vendorId, location_type: 'area', location_key: a }))
      )
    }
    setSavingAreas(false)
    setEditingAreas(false)
    load()
  }

  async function uploadMenuPdf(file) {
    if (!file || file.type !== 'application/pdf') { alert('Please select a PDF file.'); return }
    setUploadingPdf(true)
    const path = vendorId + '/menu.pdf'
    const { error } = await supabase.storage.from('menus').upload(path, file, { upsert: true, contentType: 'application/pdf' })
    if (error) { alert('Upload failed: ' + error.message); setUploadingPdf(false); return }
    const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(path)
    await supabase.from('vendors').update({ pdf_url: publicUrl }).eq('id', vendorId)
    setUploadingPdf(false)
    load()
  }

  async function removeMenuPdf() {
    if (!confirm('Remove the menu PDF?')) return
    await supabase.storage.from('menus').remove([vendorId + '/menu.pdf'])
    await supabase.from('vendors').update({ pdf_url: null }).eq('id', vendorId)
    load()
  }

  async function saveVendor() {
    setSavingVendor(true); setSaveError('')
    const { error } = await supabase.from('vendors').update({
      name: vendorForm.name.trim(),
      description: vendorForm.description.trim() || null,
      emoji: vendorForm.emoji,
      sort_order: parseInt(vendorForm.sort_order) || 0,
      tax_rate: parseFloat(vendorForm.tax_rate) || 0,
      username: vendorForm.username.trim().toLowerCase() || null,
      password: vendorForm.password.trim() || null,
    }).eq('id', vendorId)
    setSavingVendor(false)
    if (error) { setSaveError(error.message); return }
    setEditingVendor(false); load()
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
    setFormExtras([]); setFormExtraInput(''); setFormExtraPriceInput('')
    setShowForm(false); load()
  }

  function addFormExtra() {
    const val = formExtraInput.trim()
    if (!val || formExtras.some(e => extraName(e) === val)) return
    const price = parseFloat(formExtraPriceInput) || 0
    setFormExtras(f => [...f, price > 0 ? { name: val, price } : val])
    setFormExtraInput(''); setFormExtraPriceInput('')
  }

  async function toggleOption(opt) {
    await supabase.from('vendor_options').update({ active: !opt.active }).eq('id', opt.id); load()
  }

  async function deleteOption(id) {
    if (!confirm('Delete this option?')) return
    await supabase.from('vendor_options').delete().eq('id', id); load()
  }

  async function addExtraToOption(opt) {
    const val = extraInput.trim()
    if (!val) return
    const price = parseFloat(extraPriceInput) || 0
    const newExtra = price > 0 ? { name: val, price } : val
    await supabase.from('vendor_options').update({ extras: [...(opt.extras || []), newExtra] }).eq('id', opt.id)
    setExtraInput(''); setExtraPriceInput(''); setAddingExtraFor(null); load()
  }

  async function removeExtraFromOption(opt, extra) {
    const newExtras = (opt.extras || []).filter(e => extraName(e) !== extraName(extra))
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

        {/* Menu PDF upload */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#111' }}>Menu PDF</p>
          {vendor?.pdf_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <a href={vendor.pdf_url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#0F6E56', textDecoration: 'none', fontWeight: 500 }}>
                &#128196; View current menu PDF &#8599;
              </a>
              <button onClick={removeMenuPdf}
                style={{ background: 'none', border: 'none', color: '#e05', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Remove
              </button>
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

        {/* Waiting room visibility */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#111' }}>Waiting room visibility</p>
              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                {areaAccess.size === 0 ? 'Visible in all waiting rooms' : `Restricted to ${areaAccess.size} waiting room${areaAccess.size > 1 ? 's' : ''}`}
              </p>
            </div>
            <button onClick={() => setEditingAreas(v => !v)}
              style={{ padding: '7px 16px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', color: '#555', fontSize: 13, cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}>
              {editingAreas ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editingAreas && (
            <div style={{ marginTop: 14 }}>
              {areas.length === 0 ? (
                <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 12px' }}>No waiting room QR codes generated yet</p>
              ) : (
                <>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#888' }}>
                    Check the waiting rooms this vendor should appear in. Leave all unchecked to show it everywhere.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {areas.map(a => (
                      <div key={a} onClick={() => toggleArea(a)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: areaAccess.has(a) ? '1.5px solid #0F6E56' : '0.5px solid #eee', background: areaAccess.has(a) ? '#E1F5EE' : '#fafafa', cursor: 'pointer' }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: areaAccess.has(a) ? '#0F6E56' : '#fff', border: areaAccess.has(a) ? 'none' : '1.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {areaAccess.has(a) && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>&#10003;</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111', flex: 1 }}>{a}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <button onClick={saveAreas} disabled={savingAreas}
                style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: savingAreas ? '#ddd' : '#0F6E56', color: savingAreas ? '#aaa' : '#fff', fontWeight: 600, fontSize: 14, cursor: savingAreas ? 'not-allowed' : 'pointer' }}>
                {savingAreas ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {editingVendor && (
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#111' }}>Edit vendor details</p>
            {[
              { key: 'name', label: 'Name *', placeholder: 'Vendor name' },
              { key: 'description', label: 'Description', placeholder: 'Short description' },
              { key: 'emoji', label: 'Emoji', placeholder: '🛒' },
              { key: 'sort_order', label: 'Sort order', placeholder: '0', type: 'number' },
              { key: 'tax_rate', label: 'Tax rate (%)', placeholder: 'e.g. 5 for 5% VAT', type: 'number' },
              { key: 'username', label: 'Dashboard login username', placeholder: 'e.g. starbucks' },
              { key: 'password', label: 'Dashboard login password', placeholder: 'Set a password for this vendor' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{f.label}</p>
                <input value={vendorForm[f.key] || ''} onChange={e => setVendorForm(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} type={f.type || 'text'} style={inputStyle} />
              </div>
            ))}
            {saveError && <p style={{ color: '#A32D2D', fontSize: 13, margin: '0 0 10px' }}>Error: {saveError}</p>}
            <button onClick={saveVendor} disabled={savingVendor}
              style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              {savingVendor ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}

        <button onClick={() => { setShowForm(v => !v); setFormExtras([]); setFormExtraInput(''); setFormExtraPriceInput('') }}
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
            <p style={{ margin: '4px 0 8px', fontSize: 12, color: '#888' }}>Customization options <span style={{ color: '#bbb' }}>(optional)</span></p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: formExtras.length > 0 ? 8 : 0 }}>
              {formExtras.map(e => (
                <span key={extraName(e)} onClick={() => setFormExtras(f => f.filter(x => extraName(x) !== extraName(e)))}
                  style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#E1F5EE', color: '#085041', cursor: 'pointer', border: '1px solid #A8DECE' }}>
                  {extraName(e)}{extraPrice(e) > 0 ? ' +AED ' + Number(extraPrice(e)).toFixed(2) : ''} &#215;
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <input value={formExtraInput} onChange={e => setFormExtraInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFormExtra()}
                placeholder="Option name"
                style={{ flex: 2, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <input value={formExtraPriceInput} onChange={e => setFormExtraPriceInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFormExtra()}
                placeholder="+AED" type="number" min="0" step="0.5"
                style={{ flex: 1, minWidth: 80, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={addFormExtra}
                style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: formExtraInput.trim() ? '#0F6E56' : '#eee', color: formExtraInput.trim() ? '#fff' : '#aaa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + Add
              </button>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: '#bbb' }}>Leave +AED blank if the option is free</p>
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
                          <span key={extraName(e)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, background: '#E1F5EE', color: '#085041', display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #A8DECE' }}>
                            {extraName(e)}{extraPrice(e) > 0 ? ' +AED ' + Number(extraPrice(e)).toFixed(2) : ''}
                            <span onClick={() => removeExtraFromOption(opt, e)} style={{ cursor: 'pointer', color: '#0F6E56', fontWeight: 700, lineHeight: 1 }}>&#215;</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {addingExtraFor === opt.id ? (
                      <div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                          <input autoFocus value={extraInput} onChange={e => setExtraInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addExtraToOption(opt)}
                            placeholder="e.g. Extra coffee"
                            style={{ flex: 2, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                          <input value={extraPriceInput} onChange={e => setExtraPriceInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addExtraToOption(opt)}
                            placeholder="+AED" type="number" min="0" step="0.5"
                            style={{ flex: 1, minWidth: 70, padding: '7px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                          <button onClick={() => addExtraToOption(opt)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                          <button onClick={() => { setAddingExtraFor(null); setExtraInput(''); setExtraPriceInput('') }}
                            style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: '#f0f0f0', color: '#666', fontSize: 13, cursor: 'pointer' }}>&#215;</button>
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