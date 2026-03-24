import { useState, useEffect } from 'react'
import api from '../api/axios'

const INITIAL = { name: '', leadId: '' }

export default function CreateTeamModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(INITIAL)
    setError('')
    fetchUsers()
  }, [open])

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const { data } = await api.get('/users')
      // API returns { users: [...] } or plain array
      setUsers(Array.isArray(data) ? data : (data?.users ?? []))
    } catch {
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  const handleChange = (e) => {
    setError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Team name must be at least 2 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = { name: form.name.trim() }
      if (form.leadId) payload.leadId = form.leadId
      const { data } = await api.post('/teams', payload)
      // backend may return { team: {...} } or the team object directly
      onSuccess(data?.team ?? data)
      onClose()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to create team. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  // Only employees whose roles contain a "lead"-named role
  const leaders = users.filter((u) =>
    u.roles?.some((r) => r.name?.toLowerCase().includes('lead'))
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create Team</h2>
              <p className="text-xs text-gray-500 mt-0.5">Set up a new team in your organisation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm leading-snug">
              <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Team name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Team Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <input
                name="name"
                type="text"
                placeholder="e.g. Sales Team North"
                value={form.name}
                onChange={handleChange}
                autoFocus
                disabled={loading}
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Team lead */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Team Lead <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <select
                name="leadId"
                value={form.leadId}
                onChange={handleChange}
                disabled={loading || usersLoading || leaders.length === 0}
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-60 appearance-none cursor-pointer"
              >
                <option value="">— No team lead —</option>
                {leaders.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {!usersLoading && leaders.length === 0 ? (
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                No employees with a Team Lead role found. Assign the Team Lead role to an employee first.
              </p>
            ) : (
              <p className="text-xs text-gray-400">Only employees with a Team Lead role are shown.</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition disabled:opacity-60 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
              ) : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
