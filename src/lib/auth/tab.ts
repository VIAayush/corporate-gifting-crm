export const TAB_HEADER = 'x-giffter-tab'
export const TAB_QUERY = 'giffter_tab'
export const TAB_STORAGE_KEY = 'giffter.tab-id'
export const AUTH_COOKIE_PREFIX = 'gf-auth-'
export const RECOVERY_COOKIE_NAME = `${AUTH_COOKIE_PREFIX}recovery`

export function authCookieName(tabId: string) {
  return `${AUTH_COOKIE_PREFIX}${tabId}`
}

export function isAuthCallbackLocation(href: string) {
  try {
    const url = new URL(href)
    if (url.searchParams.has('code') || url.searchParams.has('token_hash')) return true
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
    return hash.has('access_token') || hash.get('type') === 'recovery'
  } catch {
    return false
  }
}

export function isPublicAuthPath(pathname: string) {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/signup' ||
    pathname.startsWith('/signup/') ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/forgot-password/') ||
    pathname === '/reset-password' ||
    pathname.startsWith('/reset-password/')
  )
}

export function createTabId() {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function isTabId(value: string | null | undefined): value is string {
  return Boolean(value && /^[a-f0-9]{16}$/.test(value))
}

export function isLegacySupabaseAuthCookie(name: string) {
  return /^sb-[a-z0-9]+-auth-token(\.\d+)?$/i.test(name)
}
