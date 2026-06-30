import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useQRToken } from '../hooks/useQRToken'
import ScanRequired from './ScanRequired'

export default function VendorListPage() {
  const navigate = useNavigate()
  const { token, loading, invalid, locationType, ward, room, bed, area } = useQRToken()
  const [vendors, setVendors] = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(true)

  const isWaiting = locationType === 'waiting'

  useEffect(() => {
    supabase.from('vendors').select('*').eq('active', true).order('sort_order').order('created_at')
      .then(({ data }) => { setVendors(data || []); setVendorsLoading(false) })
  }, [])

  if (loading) return <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#aaa' }}>Loading...</p></div>
  if (invalid) return <ScanRequired />

  function vendorPath(vendorId) {
    return isWaiting ? `/w/${token}/vendors/${vendorId}` : `/q/${token}/vendors/${vendorId}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Order food & items</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
            {isWaiting ? area : `Room ${room} · Bed ${bed.toUpperCase()} · Ward ${ward.toUpperCase()}`}
          </p>
        </div>
      </div>

      <p style={{ margin: '16px 16px 8px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Choose a vendor</p>

      {vendorsLoading ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Loading...</p>
      ) : vendors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
          <p style={{ fontSize: 36 }}>🛒</p>
          <p style={{ fontSize: 14 }}>No vendors available yet</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vendors.map(v => (
            <div key={v.id} onClick={() => navigate(vendorPath(v.id))}
              style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '0.5px solid #eee' }}>
              <div style={{ width: 46, height: 46, borderRadius: 11, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {v.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111' }}>{v.name}</p>
                {v.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{v.description}</p>}
              </div>
              <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 32 }}>Pay in person on delivery · Cash or card</p>
    </div>
  )
}