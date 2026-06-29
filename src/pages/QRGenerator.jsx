import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

const BASE_URL = 'https://careconnect-henna.vercel.app'

export default function QRGenerator() {
  const navigate = useNavigate()

  // Bed QR state
  const [ward, setWard] = useState('')
  const [room, setRoom] = useState('')
  const [bed, setBed] = useState('')

  // Waiting room QR state
  const [areaName, setAreaName] = useState('')

  // Shared print list — each entry has a `type` field
  const [generated, setGenerated] = useState([])

  const bedUrl = ward && room && bed ? `${BASE_URL}/q/${ward.toLowerCase()}/${room}/${bed.toLowerCase()}` : null
  const areaUrl = areaName.trim() ? `${BASE_URL}/w/${encodeURIComponent(areaName.trim())}` : null

  function addBed() {
    if (!bedUrl) return
    if (!generated.find(e => e.url === bedUrl)) {
      setGenerated(g => [...g, { type: 'bed', ward, room, bed, url: bedUrl }])
    }
    setWard(''); setRoom(''); setBed('')
  }

  function addArea() {
    if (!areaUrl) return
    if (!generated.find(e => e.url === areaUrl)) {
      setGenerated(g => [...g, { type: 'waiting', area: areaName.trim(), url: areaUrl }])
    }
    setAreaName('')
  }

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

        {/* Bed QR */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>🛏️ Bed QR code</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Ward</p>
              <input value={ward} onChange={e => setWard(e.target.value)} placeholder="e.g. A"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Room</p>
              <input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. 204"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Bed</p>
              <input value={bed} onChange={e => setBed(e.target.value)} placeholder="e.g. B"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            </div>
          </div>
          {bedUrl && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0', padding: 16, background: '#f9f9f9', borderRadius: 10 }}>
                <QRCodeSVG value={bedUrl} size={180} />
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#888', margin: '0 0 12px' }}>{bedUrl}</p>
            </>
          )}
          <button onClick={addBed} disabled={!bedUrl}
            style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: bedUrl ? '#0F6E56' : '#ddd', color: bedUrl ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: bedUrl ? 'pointer' : 'not-allowed' }}>
            Add to print list
          </button>
        </div>

        {/* Waiting room QR */}
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>🪑 Waiting room QR code</p>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Area name</p>
            <input value={areaName} onChange={e => setAreaName(e.target.value)} placeholder="e.g. Cardiology Waiting, Main Lobby"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          {areaUrl && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0', padding: 16, background: '#f9f9f9', borderRadius: 10 }}>
                <QRCodeSVG value={areaUrl} size={180} />
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#888', margin: '0 0 12px' }}>{areaUrl}</p>
            </>
          )}
          <button onClick={addArea} disabled={!areaUrl}
            style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: areaUrl ? '#0F6E56' : '#ddd', color: areaUrl ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: areaUrl ? 'pointer' : 'not-allowed' }}>
            Add to print list
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
