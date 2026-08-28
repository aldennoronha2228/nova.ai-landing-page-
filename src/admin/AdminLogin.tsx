import { useRouter } from 'next/router'
import { useState, type FormEvent } from 'react'

export function AdminLogin() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Forgot password state
  const [view, setView] = useState<'login' | 'forgot'>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

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

  const submitForgot = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    setForgotStatus('')
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      })
      const data = await res.json()
      setForgotStatus(data.message || 'Reset link sent.')
    } catch (_err) {
      setForgotStatus('Something went wrong. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-header">
          <img src="/nova-app-icon.png" alt="NovaBoard AI" className="admin-login-logo" />
          <h1>NovaBoard Admin{view === 'forgot' ? ' — Reset Password' : ' Login'}</h1>
        </div>

        {view === 'login' ? (
          <>
            <p>Secure access for approved internal operators.</p>
            <form onSubmit={submit}>
              <div className="admin-login-field">
                <label htmlFor="admin-email">Email</label>
                <input id="admin-email" type="email" name="email" autoComplete="email" required placeholder="admin@example.com" />
              </div>
              <div className="admin-login-field">
                <label htmlFor="admin-password">Password</label>
                <div className="admin-password-input-wrapper">
                  <input id="admin-password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" required placeholder="••••••••••••" />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 15a8 8 0 0 1 14 0" /><circle cx="12" cy="15" r="3" /><line x1="3" y1="21" x2="21" y2="3" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 15a8 8 0 0 1 14 0" /><circle cx="12" cy="15" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" className="admin-login-submit" disabled={loading}>
                {loading ? 'Authenticating...' : 'Login'}
              </button>
              {error ? <p className="admin-login-error">{error}</p> : null}
            </form>
            <button
              type="button"
              className="admin-forgot-link"
              onClick={() => { setView('forgot'); setError(''); setForgotStatus('') }}
            >
              Forgot password?
            </button>            </button>
          </>
        ) : (
          <>
            <p>Enter your admin email and we'll send a reset link valid for 15 minutes.</p>
            {forgotStatus ? (
              <div className="admin-forgot-sent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p>{forgotStatus}</p>
              </div>
            ) : (
              <form onSubmit={submitForgot}>
                <div className="admin-login-field">
                  <label htmlFor="forgot-email">Admin Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="admin@novaboard.dev"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <button type="submit" className="admin-login-submit" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}
            <button
              type="button"
              className="admin-forgot-link"
              onClick={() => { setView('login'); setForgotStatus('') }}
            >
              ← Back to login
            </button>
          </>
        )}
      </section>
    </main>
  )
}
