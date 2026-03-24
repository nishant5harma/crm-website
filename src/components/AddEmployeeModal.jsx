import { useState, useEffect } from 'react'
import api from '../api/axios'

const INITIAL = { name: '', email: '', password: '', roleIds: [] }

export default function AddEmployeeModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL)
  const [roles, setRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(INITIAL)
    setError('')
    setShowPassword(false)
    fetchRoles()
  }, [open])

  const fetchRoles = async () => {
    setRolesLoading(true)
    try {
      const { data } = await api.get('/rbac/roles')
      setRoles(data)
    } catch {
      setRoles([])
    } finally {
      setRolesLoading(false)
    }
  }

  const handleChange = (e) => {
    setError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const toggleRole = (id) => {
    setError('')
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(id)
        ? prev.roleIds.filter((r) => r !== id)
        : [...prev.roleIds, id],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Name must be at least 2 characters.')
      return
    }
    if (!form.email.trim()) {
      setError('Email is required.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (form.roleIds.length === 0) {
      setError('Please select at least one role.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        roleIds: form.roleIds,
      })
      // backend wraps response as { user: {...} } or returns user directly
      const employee = data?.user ?? data
      onSuccess(employee)
      onClose()
    } catch (err) {
      console.error('Create employee error:', err.response?.data)
      const d = err.response?.data

      // Detect the specific "Invalid UUID" error on roleIds from Zod validation
      const roleIdsErr = d?.error?.roleIds?.items?.some?.((item) =>
        item?.errors?.some?.((e) => e?.toLowerCase().includes('uuid'))
      )
      if (roleIdsErr) {
        setError(
          'Your backend is using CUID-format IDs for roles, but the POST /api/users endpoint requires proper UUID-format IDs. ' +
          'This is a backend data mismatch — re-seed your database so role IDs are generated as UUIDs, or ask your backend developer to fix the role ID format.'
        )
      } else {
        const msg =
          d?.message ||
          d?.error?.message ||
          (Array.isArray(d?.error?.errors) && d.error.errors[0]) ||
          (d?.error?.properties
            ? Object.entries(d.error.properties)
                .map(([field, v]) => `${field}: ${v?.errors?.[0] ?? JSON.stringify(v)}`)
                .join(', ')
            : null) ||
          (typeof d?.error === 'string' ? d.error : null) ||
          (typeof d === 'string' ? d : null) ||
          'Failed to create employee. Please check all fields and try again.'
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <line x1="12" y1="14" x2="12" y2="20" />
                <line x1="9" y1="17" x2="15" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Add Employee</h2>
              <p className="text-xs text-gray-500 mt-0.5">Create a new team member account</p>
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

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                name="email"
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full h-11 pl-10 pr-11 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition cursor-pointer p-1 rounded-md"
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400">Password must be at least 6 characters</p>
          </div>

          {/* Roles */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Assign Role(s) <span className="text-red-400">*</span>
            </label>
            {rolesLoading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                <span className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                Loading roles...
              </div>
            ) : roles.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No roles available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                {roles.map((role) => {
                  const selected = form.roleIds.includes(role.id)
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition cursor-pointer ${
                        selected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                        selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                      }`}>
                        {selected && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2 6 5 9 10 3" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize truncate">{role.name}</p>
                        {role.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{role.description}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
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
              disabled={loading || rolesLoading}
              className="flex-1 h-11 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Employee'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
