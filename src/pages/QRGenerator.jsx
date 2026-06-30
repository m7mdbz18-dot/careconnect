import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../supabase'

const BASE_URL = 'https://careconnect-henna.vercel.app'

export default function QRGenerator() {
  const navigate = useNavigate()

  const [ward, setWard] = useState('')
  const [room, setRoom] = useState('')
  const [bed, setBed] = useState('')
  const [areaName, setAreaName] = useState('')
  const [generated, setGenerated] = useState([])
  const [addingBed, setAddingBed] = useState(false)
  const [addingArea, setAddingArea] = useState(false)

  async function addBed() {
    if (!ward.trim() || !room.trim() || !bed.trim()) return
    setAddingBed(true)
    const w = ward.trim().toLowerCase()
    const r = room.trim()
    const b = bed.trim().toLowerCase()
    const label = `Ward ${w.toUpperCase()} · Room ${r} · Bed ${b.toUpperCase()}`

    const { data: existing } = await supabase.from('qr_tokens')
      .select('id').eq('location_type', 'room').eq('ward', w).eq('room', r).eq('bed', b).maybeSingle()
    let tokenId
    if (existing) {
      tokenId = existing.id
    } else {
      const { data } = await supabase.from('qr_tokens').insert({ location_type: 'room', ward: w, room: r, bed: b, label }).select('id').single()
      tokenId = data?.id
    }
    setAddingBed(false)
    if (!tokenId) { alert('Could not generate QR — check Supabase connection.'); return }
    const url = `${BASE_URL}/q/${tokenId}`
    if (!generated.find(e => e.url === url)) {
      setGenerated(g => [...g, { type: 'bed', ward: w, room: r, bed: b, label, url }])
    }
    setWard(''); setRoom(''); setBed('')
  }

  async function addArea() {
    if (!areaName.trim()) return
    setAddingArea(true)
    const name = areaName.trim()

    const { data: existing } = await supabase.from('qr_tokens')
      .select('id').eq('location_type', 'waiting').eq('area', name).maybeSingle()
    let tokenId
    if (existing) {
      tokenId = existing.id
    } else {
      const { data } = await supabase.from('qr_tokens').insert({ location_type: 'waiting', area: name, label: name }).select('id').single()
      tokenId = data?.id
    }
    setAddingArea(false)
    if (!tokenId) { alert('Could not generate QR — check Supabase connection.'); return }
    const url = `${BASE_URL}/w/${tokenId}`
    if (!generated.find(e => e.url === url)) {
      setGenerated(g => [...g, { type: 'waiting', area: name, label: name, url }])
    }
    setAreaName('')
  }

  const bedReady = ward.trim() && room.trim() && bed.trim()
  const areaReady = areaName.trim()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>‹</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>QR Code Generator</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>CareConnect · Admin</p>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ background: '#FEF3C7', borderRadius: 12, padding: '11px 14px' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#92400E' }}>
            &#128274; QR codes now use secure tokens — only people who scan the physical QR can access CareConnect. Regenerate and reprint any old QRs.
          </p>
        </div>

        {/* Bed QR */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>🛏️ Bed QR code</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Ward</p>
              <input value={ward} onChange={e => setWard(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBed()} placeholder="e.g. A"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Room</p>
              <input value={room} onChange={e => setRoom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBed()} placeholder="e.g. 204"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Bed</p>
              <input value={bed} onChange={e => setBed(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBed()} placeholder="e.g. B"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>
          <button onClick={addBed} disabled={!bedReady || addingBed}
            style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: bedReady && !addingBed ? '#0F6E56' : '#ddd', color: bedReady && !addingBed ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: bedReady && !addingBed ? 'pointer' : 'not-allowed' }}>
            {addingBed ? 'Generating...' : 'Generate & add to print list'}
          </button>
        </div>

        {/* Waiting room QR */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>🪑 Waiting room QR code</p>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Area name</p>
            <input value={areaName} onChange={e => setAreaName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addArea()} placeholder="e.g. Cardiology Waiting, Main Lobby"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <button onClick={addArea} disabled={!areaReady || addingArea}
            style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: areaReady && !addingArea ? '#0F6E56' : '#ddd', color: areaReady && !addingArea ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: areaReady && !addingArea ? 'pointer' : 'not-allowed' }}>
            {addingArea ? 'Generating...' : 'Generate & add to print list'}
          </button>
        </div>

        {/* Print list */}
        {generated.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{generated.length} QR code{generated.length !== 1 ? 's' : ''} ready</p>
              <button onClick={() => window.print()}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>🖨️ Print all</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="print-grid">
              {generated.map((e, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, textAlign: 'center' }}>
                  <QRCodeSVG value={e.url} size={140} />
                  {e.type === 'bed' ? (
                    <>
                      <p style={{ margin: '10px 0 2px', fontWeight: 700, fontSize: 14, color: '#111' }}>Ward {e.ward.toUpperCase()} · Room {e.room} · Bed {e.bed.toUpperCase()}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#aaa' }}>Scan to access CareConnect</p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: '10px 0 2px', fontWeight: 700, fontSize: 14, color: '#111' }}>{e.area}</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#aaa' }}>Waiting room · Scan to order</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}