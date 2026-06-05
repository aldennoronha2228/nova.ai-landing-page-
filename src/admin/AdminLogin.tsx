import { useRouter } from 'next/router'
import { useState, type FormEvent } from 'react'

export function AdminLogin() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password'),
      }),
    })
    const text = await response.text()
    const data = text ? JSON.parse(text) : {}
    setLoading(false)

    if (!response.ok) {
      setError(data.message || 'Login failed.')
      return
    }

    const next = typeof router.query.next === 'string' ? router.query.next : '/admin'
    void router.push(next)
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-header">
          <img src="/nova-app-icon.png" alt="NovaBoard AI" className="admin-login-logo" />
          <h1>NovaBoard Admin Login</h1>
        </div>
        <p>Secure access for approved internal operators.</p>
        <form onSubmit={submit}>
          <div className="admin-login-field">
            <label htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" name="email" autoComplete="email" required placeholder="admin@example.com" />
          </div>
          <div className="admin-login-field">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-password-input-wrapper">
              <input id="admin-password" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" required placeholder="••••••••••••" />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 15a8 8 0 0 1 14 0" />
                    <circle cx="12" cy="15" r="3" />
                    <line x1="3" y1="21" x2="21" y2="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 15a8 8 0 0 1 14 0" />
                    <circle cx="12" cy="15" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="admin-login-submit" disabled={loading}>{loading ? 'Authenticating...' : 'Login'}</button>
          {error ? <p className="admin-login-error">{error}</p> : null}
        </form>
      </section>
    </main>
  )
}
