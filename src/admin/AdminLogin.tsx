import { useRouter } from 'next/router'
import { useState, type FormEvent } from 'react'

export function AdminLogin() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        <span className="admin-login-kicker">NovaBoard AI</span>
        <h1>Admin Login</h1>
        <p>Secure access for approved internal operators.</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" name="email" autoComplete="email" required /></label>
          <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
          <button type="submit" disabled={loading}>{loading ? 'Authenticating...' : 'Login'}</button>
          {error ? <p className="admin-login-error">{error}</p> : null}
        </form>
      </section>
    </main>
  )
}
