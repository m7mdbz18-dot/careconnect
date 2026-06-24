export const accounts = {
  admin:        { password: 'admin123',     role: 'admin' },
  kitchen:      { password: 'kitchen123',   role: 'restaurant' },
  housekeeping: { password: 'house123',     role: 'housekeeping' },
  laundry:      { password: 'laundry123',   role: 'laundry' },
}

export function login(username, password) {
  const account = accounts[username.toLowerCase().trim()]
  if (account && account.password === password) {
    sessionStorage.setItem('cc_role', account.role)
    sessionStorage.setItem('cc_user', username.toLowerCase().trim())
    return account.role
  }
  return null
}

export function getRole() {
  return sessionStorage.getItem('cc_role')
}

export function logout() {
  sessionStorage.removeItem('cc_role')
  sessionStorage.removeItem('cc_user')
}