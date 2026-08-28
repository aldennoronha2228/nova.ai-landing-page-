import { useRouter } from 'next/router'
import { useState, useEffect, type FormEvent } from 'react'
import Head from 'next/head'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { token } = router.query

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`/api/admin/reset-password?token=${encodeURIComponent(String(token))}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setEmail(data.email)
          setStatus('valid')
        } else {
          setMessage(data.message || 'Invalid or expired reset link.')
          setStatus('invalid')
        }
      })
      .catch(() => {
        setMessage('Unable to validate reset link.')
        setStatus('invalid')
      })
  }, [token])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: String(token), password }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
      } else {
        setError(data.message || 'Reset failed.')
      }
    } catch (_err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Head><title>Reset Password — NovaBoard Admin</title></Head>
      <main className="admin-login-page">
        <section className="admin-login-card">
          <div className="admin-login-header">
            <img src="/nova-app-icon.png" alt="NovaBoard AI" className="admin-login-logo" />
            <h1>Reset Password</h1>
          </div>

          {status === 'loading' && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '24px 0' }}>
              Validating reset link…
            </p>
          )}

          {status === 'invalid' && (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <p className="admin-login-error" style={{ marginBottom: '20px' }}>{message}</p>
              <button
                type="button"
                className="admin-login-submit"
                onClick={() => void router.push('/admin/login')}
              >
                Back to Login
              </button>
            </div>
          )}

          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <p style={{ color: '#4ade80', marginBottom: '20px', fontSize: '0.95rem' }}>
                ✓ {message}
              </p>
              <button
                type="button"
                className="admin-login-submit"
                onClick={() => void router.push('/admin/login')}
              >
                Go to Login
              </button>
            </div>
          )}

          {status === 'valid' && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', marginBottom: '20px' }}>
                Setting new password for <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{email}</strong>
              </p>
              <form onSubmit={submit}>
                <div className="admin-login-field">
                  <label htmlFor="new-password">New Password</label>
                  <div className="admin-password-input-wrapper">
                    <input
                      id="new-password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min. 8 characters"
                      autoFocus
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)} aria-label="Toggle password">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        {showPass
                          ? <><path d="M5 15a8 8 0 0 1 14 0"/><circle cx="12" cy="15" r="3"/><line x1="3" y1="21" x2="21" y2="3"/></>
                          : <><path d="M5 15a8 8 0 0 1 14 0"/><circle cx="12" cy="15" r="3"/></>
                        }
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="admin-login-field">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Re-enter password"
                  />
                </div>
                <button type="submit" className="admin-login-submit" disabled={submitting}>
                  {submitting ? 'Updating…' : 'Set New Password'}
                </button>
                {error && <p className="admin-login-error">{error}</p>}
              </form>
            </>
          )}
        </section>
      </main>
    </>
  )
}
