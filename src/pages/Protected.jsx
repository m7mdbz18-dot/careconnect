import { Navigate } from 'react-router-dom'
import { getRole } from '../auth'

export default function Protected({ allow, children }) {
  const role = getRole()
  if (!role) return <Navigate to="/login" replace />
  if (role !== 'admin' && role !== allow) return <Navigate to="/login" replace />
  return children
}