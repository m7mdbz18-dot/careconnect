export default function ScanRequired() {
  return (
    <div style={{ minHeight: '100vh', background: '#0F6E56', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>&#128247;</div>
      <h2 style={{ color: '#fff', margin: 0, fontSize: 22, fontWeight: 700 }}>Scan the QR code</h2>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 14, fontSize: 15, maxWidth: 280, lineHeight: 1.65 }}>
        Please scan the QR code at your bed or waiting area to access CareConnect.
      </p>
      <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: 48, fontSize: 12 }}>CareConnect &middot; Access via QR only</p>
    </div>
  )
}