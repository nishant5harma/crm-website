import { useState, useEffect } from 'react'
import api from '../api/axios'

const INITIAL = { name: '', description: '' }

export default function AddRoleModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(INITIAL)
    setError('')
  }, [open])

  const handleChange = (e) => {
    setError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Role name must be at least 2 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = { name: form.name.trim() }
      if (form.description.trim()) payload.description = form.description.trim()
      const { data } = await api.post('/rbac/roles', payload)
      onSuccess(data)
      onClose()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to create role. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create Role</h2>
              <p className="text-xs text-gray-500 mt-0.5">Add a new role to assign to employees</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
          >
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

          {/* Role name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Role Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <input
                name="name"
                type="text"
                placeholder="e.g. Sales Agent, Team Lead"
                value={form.name}
                onChange={handleChange}
                autoFocus
                disabled={loading}
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="description"
              placeholder="Briefly describe what this role can do..."
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 resize-none"
            />
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-xs leading-snug">
            <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            New roles start with <strong className="mx-0.5">zero permissions</strong>. You can assign permissions to this role after creating it.
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition disabled:opacity-60 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
