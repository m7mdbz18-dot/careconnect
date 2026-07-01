import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function AccessManager() {
  const navigate = useNavigate()
  const [wards, setWards] = useState([])
  const [areas, setAreas] = useState([])
  const [vendors, setVendors] = useState([])
  const [rules, setRules] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [editIds, setEditIds] = useState(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: tokens }, { data: allVendors }, { data: allRules }] = await Promise.all([
      supabase.from('qr_tokens').select('location_type, ward, area'),
      supabase.from('vendors').select('id, name, emoji, active').order('sort_order').order('created_at'),
      supabase.from('location_vendor_access').select('location_type, location_key, vendor_id'),
    ])
    const uniqueWards = [...new Set((tokens || []).filter(t => t.location_type === 'room' && t.ward).map(t => t.ward))].sort()
    const uniqueAreas = [...new Set((tokens || []).filter(t => t.location_type === 'waiting' && t.area).map(t => t.area))].sort()
    const ruleMap = {}
    ;(allRules || []).forEach(r => {
      const k = r.location_type + '||' + r.location_key
      if (!ruleMap[k]) ruleMap[k] = new Set()
      ruleMap[k].add(r.vendor_id)
    })
    setWards(uniqueWards)
    setAreas(uniqueAreas)
    setVendors(allVendors || [])
    setRules(ruleMap)
    setLoading(false)
  }

  function startEdit(type, locKey) {
    setEditing({ type, locKey })
    const k = type + '||' + locKey
    setEditIds(new Set(rules[k] || []))
  }

  function toggleId(vid) {
    setEditIds(s => { const n = new Set(s); n.has(vid) ? n.delete(vid) : n.add(vid); return n })
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    const { type, locKey } = editing
    await supabase.from('location_vendor_access').delete().eq('location_type', type).eq('location_key', locKey)
    if (editIds.size > 0) {
      await supabase.from('location_vendor_access').insert(
        [...editIds].map(vid => ({ location_type: type, location_key: locKey, vendor_id: vid }))
      )
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  function statusBadge(type, locKey) {
    const k = type + '||' + locKey
    const ids = rules[k]
    if (!ids || ids.size === 0) return { text: 'All vendors', color: '#085041', bg: '#E1F5EE' }
    const names = vendors.filter(v => ids.has(v.id)).map(v => v.emoji + ' ' + v.name)
    const label = names.length <= 2 ? names.join(', ') : names.slice(0, 2).join(', ') + ' +' + (names.length - 2) + ' more'
    return { text: label, color: '#92400E', bg: '#FEF3C7' }
  }

  function renderCard(type, locKey, label) {
    const isEditing = editing?.type === type && editing?.locKey === locKey
    const badge = statusBadge(type, locKey)
    return (
      <div key={type + '||' + locKey} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 5px', fontWeight: 600, fontSize: 15, color: '#111' }}>{label}</p>
            <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 500, padding: '2px 10px', borderRadius: 20, background: badge.bg, color: badge.color }}>
              {badge.text}
            </span>
          </div>
          <button onClick={() => isEditing ? setEditing(null) : startEdit(type, locKey)}
            style={{ padding: '7px 16px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', color: '#555', fontSize: 13, cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {isEditing && (
          <div style={{ borderTop: '0.5px solid #f0f0f0', padding: '14px 16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#888' }}>
              Check the vendors allowed here. Leave all unchecked to allow every vendor.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {vendors.map(v => (
                <div key={v.id} onClick={() => toggleId(v.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: editIds.has(v.id) ? '1.5px solid #0F6E56' : '0.5px solid #eee', background: editIds.has(v.id) ? '#E1F5EE' : '#fafafa', cursor: 'pointer' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: editIds.has(v.id) ? '#0F6E56' : '#fff', border: editIds.has(v.id) ? 'none' : '1.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {editIds.has(v.id) && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>&#10003;</span>}
                  </div>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{v.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111' }}>{v.name}</p>
                    {!v.active && <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>Currently inactive</p>}
                  </div>
                </div>
              ))}
            </div>
            {editIds.size === 0 && (
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#0F6E56', fontWeight: 500 }}>
                &#10003; All vendors will be shown (no restriction)
              </p>
            )}
            <button onClick={saveEdit} disabled={saving}
              style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: saving ? '#ddd' : '#0F6E56', color: saving ? '#aaa' : '#fff', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>&#8249;</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Access Control</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>CareConnect &middot; Admin</p>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '11px 14px', marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#085041', lineHeight: 1.5 }}>
            By default all locations see all vendors. Restrict a ward or waiting area to limit which vendors appear for patients there.
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading...</p>
        ) : (
          <>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Wards (room QRs)</p>
            {wards.length === 0
              ? <p style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>No room QR codes generated yet</p>
              : wards.map(w => renderCard('ward', w, 'Ward ' + w.toUpperCase()))
            }

            <p style={{ margin: '16px 0 10px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Waiting areas</p>
            {areas.length === 0
              ? <p style={{ fontSize: 13, color: '#aaa' }}>No waiting area QR codes generated yet</p>
              : areas.map(a => renderCard('area', a, a))
            }
          </>
        )}
      </div>
    </div>
  )
}