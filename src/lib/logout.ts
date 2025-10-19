type UserRole = 'admin' | 'user'

const parseSafe = <T = any>(value?: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
}

const clearCookie = (name: string, path: string = '/') => {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

const detectRole = (explicitRole?: UserRole | null): UserRole | undefined => {
  if (explicitRole) return explicitRole

  const sessionUser = parseSafe<{ role?: UserRole }>(sessionStorage.getItem('user'))
  if (sessionUser?.role) return sessionUser.role

  const cookieUser = parseSafe<{ role?: UserRole }>(readCookie('auth-token'))
  if (cookieUser?.role) return cookieUser.role

  const localUser = parseSafe<{ role?: UserRole }>(localStorage.getItem('user'))
  if (localUser?.role) return localUser.role

  return undefined
}

const handleSessionStorage = (role?: UserRole) => {
  // sessionStorage is scoped per tab, safe to clear general keys
  sessionStorage.removeItem('user')
  sessionStorage.removeItem('loginTime')
  sessionStorage.setItem('logout', 'true')

  if (role === 'admin') {
    sessionStorage.removeItem('admin-session')
  }

  if (role === 'user') {
    sessionStorage.removeItem('user-session')
  }
}

const handleLocalStorage = (role?: UserRole) => {
  const remembered = parseSafe<{ role?: UserRole }>(localStorage.getItem('user'))
  if (!role || !remembered || remembered.role === role) {
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('loginTime')
  }
}

const handleCookies = (role?: UserRole) => {
  const authCookie = parseSafe<{ role?: UserRole }>(readCookie('auth-token'))

  if (!role || authCookie?.role === role || !authCookie?.role) {
    clearCookie('auth-token')
  }

  if (!role || role === 'admin') {
    clearCookie('admin-auth-token', '/Admin')
  }

  if (!role || role === 'user') {
    clearCookie('user-auth-token')
  }
}

// Logout utility function with role awareness
export const logout = (role?: UserRole) => {
  if (typeof window === 'undefined') return

  const effectiveRole = detectRole(role)

  handleSessionStorage(effectiveRole)
  handleLocalStorage(effectiveRole)
  handleCookies(effectiveRole)

  window.location.href = '/Login'
}

// Check if user is remembered
export const isRemembered = () => {
    if (typeof window === 'undefined') return false;

    const rememberedUser = localStorage.getItem('user');
    const rememberMe = localStorage.getItem('rememberMe');

    if (rememberedUser && rememberMe === 'true') {
        try {
            const loginTime = localStorage.getItem('loginTime');
            const now = Date.now();

            // Check if login is still valid (within 30 days)
            return loginTime && (now - parseInt(loginTime)) < 2592000000;
        } catch (error) {
            return false;
        }
    }

    return false;
};
