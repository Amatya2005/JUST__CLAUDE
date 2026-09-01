export function saveSession(token, role, profile) {
  localStorage.setItem('token', token)
  localStorage.setItem('role', role)
  localStorage.setItem('profile', JSON.stringify(profile || {}))
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('profile')
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getRole() {
  return localStorage.getItem('role')
}

export function getProfile() {
  try {
    return JSON.parse(localStorage.getItem('profile') || '{}')
  } catch {
    return {}
  }
}
