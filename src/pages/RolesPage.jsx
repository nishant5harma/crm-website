import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import AddRoleModal from '../components/AddRoleModal'
import ManagePermissionsModal from '../components/ManagePermissionsModal'

const ROLE_COLORS = [
  'from-indigo-500 to-violet-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-blue-500',
  'from-fuchsia-500 to-purple-500',
]

function getRoleColor(name = '') {
  const idx = name.charCodeAt(0) % ROLE_COLORS.length
  return ROLE_COLORS[idx]
}

export default function RolesPage() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [permModalRole, setPermModalRole] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/rbac/roles')
      setRoles(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load roles.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleSuccess = (newRole) => {
    setRoles((prev) => [...prev, newRole])
    setSuccessMsg(`Role "${newRole.name}" created successfully!`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const refreshRole = async (roleId) => {
    try {
      const { data } = await api.get(`/rbac/roles/${roleId}`)
      setRoles((prev) => prev.map((r) => (r.id === roleId ? data : r)))
    } catch {
      // silently ignore
    }
  }

  const filtered = roles.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Roles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage roles to assign to employees
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Role
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 font-medium">Total Roles</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">🎭 {roles.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500 font-medium">Showing</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">🔍 {filtered.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <span className="w-8 h-8 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-sm">Loading roles...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-red-500 font-medium">{error}</p>
          <button onClick={fetchRoles} className="text-sm text-violet-600 hover:underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">
            {search ? 'No roles match your search' : 'No roles yet'}
          </p>
          {!search && (
            <button onClick={() => setModalOpen(true)} className="text-sm text-violet-600 hover:underline cursor-pointer">
              Create your first role
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((role) => (
            <div key={role.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex flex-col">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getRoleColor(role.name)} flex items-center justify-center text-white flex-shrink-0`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 capitalize">{role.name}</h3>
                    {role.name?.toLowerCase() === 'superadmin' && (
                      <span className="text-[10px] font-semibold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                        Pre-seeded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {role.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Permissions count + manage button */}
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className={role.permissions?.length > 0 ? 'text-violet-600 font-semibold' : 'text-gray-400'}>
                    {role.permissions?.length ?? 0} permission{role.permissions?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => setPermModalRole(role)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Manage
                </button>
              </div>
            </div>
          ))}

          {/* Add role card */}
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-200 hover:border-violet-300 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-violet-500 transition cursor-pointer min-h-[130px] group"
          >
            <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-violet-50 border border-gray-200 group-hover:border-violet-200 flex items-center justify-center transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-sm font-medium">Create new role</span>
          </button>
        </div>
      )}

      <AddRoleModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={handleSuccess} />

      <ManagePermissionsModal
        open={!!permModalRole}
        role={permModalRole}
        onClose={() => setPermModalRole(null)}
        onUpdated={() => permModalRole && refreshRole(permModalRole.id)}
      />
    </div>
  )
}
