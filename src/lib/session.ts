// Lightweight session persistence for the login gate.
// No credentials are stored — only which demo person_ref is "logged in" and
// whether that should survive a browser restart (localStorage) or just the
// current tab (sessionStorage). Real credential checking is a follow-up once
// Supabase Auth is wired in.
const SESSION_KEY = 'smartrh_session'

interface StoredSession {
  person_ref: string
}

export function readSession(): string | null {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = storage.getItem(SESSION_KEY)
      if (!raw) continue
      const parsed = JSON.parse(raw) as StoredSession
      if (parsed?.person_ref) return parsed.person_ref
    } catch {
      // ignore malformed/unavailable storage and keep checking the other one
    }
  }
  return null
}

export function writeSession(personRef: string, remember: boolean) {
  const value = JSON.stringify({ person_ref: personRef } satisfies StoredSession)
  try {
    if (remember) {
      window.localStorage.setItem(SESSION_KEY, value)
      window.sessionStorage.removeItem(SESSION_KEY)
    } else {
      window.sessionStorage.setItem(SESSION_KEY, value)
      window.localStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // storage unavailable (e.g. private browsing) — session just won't persist
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
