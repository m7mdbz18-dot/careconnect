import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, setVendorSession } from '../auth'
import { supabase } from '../supabase'

const destinations = {
  admin:        '/admin',
  housekeeping: '/staff/housekeeping',
  laundry:      '/staff/laundry',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (loading) return
    setError('')

    // Check hardcoded staff accounts first
    const role = login(username, password)
    if (role) {
      navigate(destinations[role] || '/admin')
      return
    }

    // Fall back to Supabase vendor accounts
    setLoading(true)
    const { data } = await supabase
      .from('vendors')
      .select('id, name, username, password, emoji')
      .eq('username', username.trim().toLowerCase())
      .eq('password', password)
      .eq('active', true)
      .single()
    setLoading(false)

    if (data) {
      setVendorSession(data)
      navigate('/staff/vendor')
    } else {
      setError('Wrong username or password')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F6E56', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>🏥</div>
      <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>CareConnect</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '6px 0 0' }}>Staff Login</p>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginTop: 28, width: '100%', maxWidth: 360 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888', fontWeight: 600 }}>Username</p>
        <input
          value={username}
          onChange={e => { setUsername(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="e.g. admin"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', marginBottom: 14, outline: 'none' }}
        />
        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#888', fontWeight: 600 }}>Password</p>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="••••••••"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 9, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
        />

        {error && <p style={{ color: '#A32D2D', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? '#ddd' : '#0F6E56', color: loading ? '#aaa' : '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 18 }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 24 }}>Authorized hospital staff only</p>
    </div>
  )
}
