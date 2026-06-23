import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const BASE_URL = 'https://careconnect-henna.vercel.app'

export default function QRGenerator() {
  const [ward, setWard] = useState('')
  const [room, setRoom] = useState('')
  const [bed, setBed] = useState('')
  const [generated, setGenerated] = useState([])

  const url = ward && room && bed ? `${BASE_URL}/q/${ward.toLowerCase()}/${room}/${bed.toLowerCase()}` : null

  function addToList() {
    if (!url) return
    const entry = { ward, room, bed, url }
    if (!generated.find(e => e.url === url)) {
      setGenerated(g => [...g, entry])
    }
    setWard('')
    setRoom('')
    setBed('')
  }

  function printAll() {
    window.print()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0F6E56', padding: '20px 16px', color: '#fff' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>QR Code Generator</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>CareConnect · Admin</p>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, marginBottom: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Generate QR code</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Ward</p>
              <input value={ward} onChange={e => setWard(e.target.value)} placeholder="e.g. A" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Room</p>
              <input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. 204" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <p style={{ margin: '0 0 5px', fontSize: 12, color: '#888' }}>Bed</p>
              <input value={bed} onChange={e => setBed(e.target.value)} placeholder="e.g. B" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>

          {url && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0', padding: 16, background: '#f9f9f9', borderRadius: 10 }}>
              <QRCodeSVG value={url} size={180} />
            </div>
          )}

          {url && (
            <p style={{ textAlign: 'center', fontSize: 11, color: '#888', margin: '0 0 12px' }}>{url}</p>
          )}

          <button onClick={addToList} disabled={!url} style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: url ? '#0F6E56' : '#ddd', color: url ? '#fff' : '#aaa', fontWeight: 600, fontSize: 14, cursor: url ? 'pointer' : 'not-allowed' }}>
            Add to print list
          </button>
        </div>

        {generated.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{generated.length} QR codes ready</p>
              <button onClick={printAll} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>🖨️ Print all</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="print-grid">
              {generated.map((e, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #eee', padding: 16, textAlign: 'center' }}>
                  <QRCodeSVG value={e.url} size={140} />
                  <p style={{ margin: '10px 0 2px', fontWeight: 700, fontSize: 14, color: '#111' }}>Ward {e.ward.toUpperCase()} · Room {e.room} · Bed {e.bed.toUpperCase()}</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#aaa' }}>Scan to access CareConnect</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}