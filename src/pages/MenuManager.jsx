import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const tagColors = {
  Halal: { bg: '#E6F1FB', color: '#0C447C' },
  Veg: { bg: '#EAF3DE', color: '#27500A' },
  Diabetic: { bg: '#FAEEDA', color: '#633806' },
  Healthy: { bg: '#E1F5EE', color: '#085041' },
}
const tagOptions = ['Halal', 'Veg', 'Diabetic', 'Healthy', 'None']

export default function MenuManager() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [slot, setSlot] = useState('breakfast')
  const [newName, setNewName] = useState('')
  const [newTag, setNewTag] = useState('Halal')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    load()
    const channel = supabase
      .channel('menu-manager')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function load() {
    const { data } = await supabase.from('menu_items').select('*').order('created_at', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  async function toggle(item) {
    await supabase.from('menu_items').update({ active: !item.active }).eq('id', item.id)
    load()
  }

  async function remove(id) {
    if (!confirm('Remove this item?')) return
    await supabase.from('menu_items').delete().eq('id', id)
    load()
  }

  async function rename(item) {
    const name = prompt('Edit item name:', item.name)
    if (name === null || !name.trim()) return
    await supabase.from('menu_items').update({ name: name.trim() }).eq('id', item.id)
    load()
  }

  async function addItem() {
    if (!newName.trim()) return
    setAdding(true)
    await supabase.from('menu_items').insert({
      slot,
      name: newName.trim(),
      tag: newTag === 'None' ? null : newTag,
      active: true,
    })
    setNewName('')
    setAdding(false)
    load()
  }

  const slotItems = items.filter(i => i.slot === slot)

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', paddingBottom: 40 }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Edit Menu</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Changes show to patients instantly</p>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', background: '#fff', borderRadius: 10, border: '0.5px solid #eee', overflow: 'hidden', marginBottom: 16 }}>
          {['breakfast', 'lunch', 'dinner'].map(s => (
            <button key={s} onClick={() => setSlot(s)} style={{ flex: 1, padding: '10px 0', background: slot === s ? '#0F6E56' : '#fff', color: slot === s ? '#fff' : '#888', border: 'none', fontWeight: slot === s ? 600 : 400, fontSize: 13, cursor: 'pointer' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 14, marginBottom: 18 }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Add {slot} item</p>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Item name" style={{ width: '100%', padding: '11px 13px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={newTag} onChange={e => setNewTag(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, fontFamily: 'inherit' }}>
              {tagOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={addItem} disabled={!newName.trim() || adding} style={{ padding: '11px 20px', borderRadius: 8, border: 'none', background: newName.trim() && !adding ? '#0F6E56' : '#ddd', color: newName.trim() && !adding ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: newName.trim() && !adding ? 'pointer' : 'not-allowed' }}>+ Add</button>
          </div>
        </div>

        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{slot} items ({slotItems.length})</p>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 20 }}>Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slotItems.map(item => (
              <div key={item.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '0.5px solid #eee', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: item.active ? '#111' : '#bbb', textDecoration: item.active ? 'none' : 'line-through' }}>{item.name}</span>
                {item.tag && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: (tagColors[item.tag] || {}).bg || '#eee', color: (tagColors[item.tag] || {}).color || '#666' }}>{item.tag}</span>}
                <button onClick={() => rename(item)} title="Rename" style={{ background: '#f0f0f0', border: 'none', borderRadius: 6, padding: '6px 8px', fontSize: 12, cursor: 'pointer', color: '#666' }}>✏️</button>
                <button onClick={() => remove(item.id)} title="Remove" style={{ background: '#FCEBEB', border: 'none', borderRadius: 6, padding: '6px 8px', fontSize: 12, cursor: 'pointer', color: '#A32D2D' }}>🗑</button>
                <div onClick={() => toggle(item)} title={item.active ? 'Active' : 'Hidden'} style={{ width: 36, height: 20, borderRadius: 10, background: item.active ? '#0F6E56' : '#ddd', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: item.active ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}
            {slotItems.length === 0 && <p style={{ textAlign: 'center', color: '#aaa', padding: 16 }}>No items yet</p>}
          </div>
        )}
      </div>
    </div>
  )
}