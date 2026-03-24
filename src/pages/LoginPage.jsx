import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      })
      login(data.accessToken, data.user)
      navigate('/dashboard')
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-12 flex-col justify-between">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className="text-white text-xl font-bold tracking-tight">CRM Pro</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <h2 className="text-white text-4xl font-bold leading-tight tracking-tight mb-4">
            Manage your pipeline,<br />close more deals.
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-10 max-w-sm">
            A complete CRM platform for sales teams — track leads, manage teams, and grow your business.
          </p>

          {/* Stats card */}
          <div className="flex items-center gap-6 bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl px-6 py-5 w-fit">
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-xl font-bold tracking-tight">10k+</span>
              <span className="text-white/55 text-xs">Active Users</span>
            </div>
            <div className="w-px h-9 bg-white/20" />
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-xl font-bold tracking-tight">98%</span>
              <span className="text-white/55 text-xs">Uptime</span>
            </div>
            <div className="w-px h-9 bg-white/20" />
            <div className="flex flex-col gap-0.5">
              <span className="text-white text-xl font-bold tracking-tight">4.9★</span>
              <span className="text-white/55 text-xs">Rating</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex">
            {['S', 'R', 'A', 'P'].map((l, i) => (
              <div
                key={i}
                style={{ zIndex: 4 - i, marginRight: '-8px' }}
                className="w-9 h-9 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white text-sm font-semibold"
              >
                {l}
              </div>
            ))}
          </div>
          <span className="text-white/65 text-sm ml-3">Join thousands of sales professionals</span>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-[480px] flex items-center justify-center bg-gray-50 px-6 py-12 lg:px-10">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-gray-900 tracking-tight leading-tight">Welcome back</h1>
              <p className="text-sm text-gray-500 mt-0.5">Sign in to your CRM account</p>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5 leading-snug">
              <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email address
              </label>
              <div className="relative flex items-center">
                <svg className="absolute left-3.5 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:bg-gray-50 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative flex items-center">
                <svg className="absolute left-3.5 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full h-11 pl-10 pr-11 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:bg-gray-50 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 transition p-1 rounded-md"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-12 w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 active:scale-[0.99] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            🔒 Protected by enterprise-grade security &amp; encryption
          </p>
        </div>
      </div>
    </div>
  )
}
