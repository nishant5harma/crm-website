import { useState, useEffect } from 'react'
import api from '../api/axios'

const MODULE_ICONS = {
  User:        { icon: '👤', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  Role:        { icon: '🛡️', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  Permission:  { icon: '🔑', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  Team:        { icon: '🏆', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  Attendance:  { icon: '📅', color: 'bg-teal-50 text-teal-600 border-teal-100' },
  Location:    { icon: '📍', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  Device:      { icon: '📱', color: 'bg-orange-50 text-orange-600 border-orange-100' },
  Consent:     { icon: '✅', color: 'bg-lime-50 text-lime-600 border-lime-100' },
  Lead:        { icon: '📋', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  Inventory:   { icon: '🏠', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  'Cold Call': { icon: '📞', color: 'bg-pink-50 text-pink-600 border-pink-100' },
  System:      { icon: '⚙️', color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

export default function ManagePermissionsModal({ open, onClose, role, onUpdated }) {
  const [allPermissions, setAllPermissions] = useState([])
  const [assignedIds, setAssignedIds] = useState(new Set())
  const [loadingInit, setLoadingInit] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open || !role) return
    setError('')
    setSearch('')
    loadData()
  }, [open, role])

  const loadData = async () => {
    setLoadingInit(true)
    try {
      const [permsRes, roleRes] = await Promise.all([
        api.get('/rbac/permissions'),
        api.get(`/rbac/roles/${role.id}`),
      ])
      const perms = Array.isArray(permsRes.data) ? permsRes.data : []
      setAllPermissions(perms)

      // extract currently assigned permission IDs
      const assigned = roleRes.data?.permissions ?? []
      const ids = new Set(
        assigned.map((p) => p.permission?.id ?? p.permissionId ?? p.id).filter(Boolean)
      )
      setAssignedIds(ids)
    } catch {
      setError('Failed to load permissions. Please try again.')
    } finally {
      setLoadingInit(false)
    }
  }

  const toggle = async (perm) => {
    if (togglingId) return
    setTogglingId(perm.id)
    setError('')
    const wasAssigned = assignedIds.has(perm.id)
    try {
      if (wasAssigned) {
        await api.delete(`/rbac/roles/${role.id}/permissions/${perm.id}`)
        setAssignedIds((prev) => {
          const next = new Set(prev)
          next.delete(perm.id)
          return next
        })
      } else {
        await api.post(`/rbac/roles/${role.id}/permissions`, { permissionId: perm.id })
        setAssignedIds((prev) => new Set([...prev, perm.id]))
      }
      onUpdated?.()
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${wasAssigned ? 'remove' : 'assign'} permission.`
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setTogglingId(null)
    }
  }

  // group by module
  const grouped = allPermissions
    .filter((p) =>
      !search.trim() ||
      p.key?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.module?.toLowerCase().includes(search.toLowerCase())
    )
    .reduce((acc, p) => {
      const mod = p.module || 'Other'
      if (!acc[mod]) acc[mod] = []
      acc[mod].push(p)
      return acc
    }, {})

  const totalAssigned = assignedIds.size
  const totalAll = allPermissions.length

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">
                Permissions — <span className="capitalize">{role?.name}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {totalAssigned} / {totalAll} permissions assigned
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer flex-shrink-0 ml-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {!loadingInit && totalAll > 0 && (
          <div className="px-6 pt-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Coverage</span>
              <span className="text-xs font-semibold text-violet-600">
                {Math.round((totalAssigned / totalAll) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${(totalAssigned / totalAll) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Search */}
        {!loadingInit && (
          <div className="px-6 pt-3 pb-2 flex-shrink-0">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search permissions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-violet-400 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mt-2 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-xs flex-shrink-0">
            <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loadingInit ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <span className="w-8 h-8 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
              <span className="text-sm">Loading permissions...</span>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <span className="text-3xl">🔍</span>
              <p className="text-sm">No permissions match your search</p>
            </div>
          ) : (
            Object.entries(grouped).map(([module, perms]) => {
              const meta = MODULE_ICONS[module] || MODULE_ICONS.System
              const assignedInModule = perms.filter((p) => assignedIds.has(p.id)).length
              return (
                <div key={module}>
                  {/* Module header */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-semibold ${meta.color}`}>
                      <span>{meta.icon}</span>
                      <span>{module}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {assignedInModule}/{perms.length} assigned
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Permission rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((perm) => {
                      const isAssigned = assignedIds.has(perm.id)
                      const isToggling = togglingId === perm.id
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => toggle(perm)}
                          disabled={!!togglingId}
                          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition cursor-pointer disabled:cursor-wait ${
                            isAssigned
                              ? 'bg-violet-50 border-violet-200'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                            isAssigned ? 'bg-violet-600 border-violet-600' : 'border-gray-300'
                          }`}>
                            {isToggling ? (
                              <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                            ) : isAssigned ? (
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="2 6 5 9 10 3" />
                              </svg>
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-mono font-semibold truncate ${isAssigned ? 'text-violet-700' : 'text-gray-700'}`}>
                              {perm.key}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{perm.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            Changes are saved automatically on each click
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
