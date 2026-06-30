import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'

export function useQRToken() {
  const { token } = useParams()
  const [state, setState] = useState({ loading: true, invalid: false })

  useEffect(() => {
    if (!token) { setState({ loading: false, invalid: true }); return }
    const key = 'cc_qr_' + token
    const cached = sessionStorage.getItem(key)
    if (cached) {
      try { setState({ loading: false, ...JSON.parse(cached) }) } catch { setState({ loading: false, invalid: true }) }
      return
    }
    supabase.from('qr_tokens').select('*').eq('id', token).single()
      .then(({ data }) => {
        if (!data) { setState({ loading: false, invalid: true }); return }
        const loc = {
          loading: false, invalid: false,
          locationType: data.location_type,
          ward: data.ward || null,
          room: data.room || null,
          bed: data.bed || null,
          area: data.area || null,
          label: data.label,
        }
        sessionStorage.setItem(key, JSON.stringify(loc))
        setState(loc)
      })
  }, [token])

  return { ...state, token }
}