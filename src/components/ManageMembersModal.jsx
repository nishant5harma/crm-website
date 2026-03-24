import { useState, useEffect } from 'react'
import api from '../api/axios'

const TEAM_ROLES = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'ASSISTANT_LEAD', label: 'Assistant Lead' },
  { value: 'LEAD', label: 'Lead' },
]

function Avatar({ name, size = 'sm' }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const hue = name ? name.charCodeAt(0) * 15 % 360 : 200
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-xs'
  return (
    <div style={{ background: `hsl(${hue}, 55%, 58%)` }} className={`${sz} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

const ROLE_BADGE = {
  LEAD: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  ASSISTANT_LEAD: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  MEMBER: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
}

export default function ManageMembersModal({ open, onClose, team, onUpdated }) {
  const [members, setMembers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loadingInit, setLoadingInit] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [addingIds, setAddingIds] = useState(new Set())
  const [selectedToAdd, setSelectedToAdd] = useState(new Set())
  const [addRole, setAddRole] = useState('MEMBER')
  const [addingBulk, setAddingBulk] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('members') // 'members' | 'add'
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open || !team) return
    setError('')
    setTab('members')
    setSearch('')
    setSelectedToAdd(new Set())
    setAddRole('MEMBER')
    loadData()
  }, [open, team])

  const loadData = async () => {
    setLoadingInit(true)
    try {
      const [membersRes, usersRes] = await Promise.all([
        api.get(`/teams/${team.id}/members`),
        api.get('/users'),
      ])
      const membersData = membersRes.data
      // backend returns { count, rows } or { members: [...] } or plain array
      setMembers(
        Array.isArray(membersData)
          ? membersData
          : (membersData?.rows ?? membersData?.members ?? membersData?.items ?? [])
      )
      const usersData = usersRes.data
      setAllUsers(Array.isArray(usersData) ? usersData : (usersData?.users ?? []))
    } catch {
      setError('Failed to load data.')
    } finally {
      setLoadingInit(false)
    }
  }

  const memberUserIds = new Set(
    members.map((m) => m.userId ?? m.user?.id ?? m.id).filter(Boolean)
  )

  const nonMembers = allUsers.filter(
    (u) => !memberUserIds.has(u.id)
  )

  const filteredNonMembers = nonMembers.filter(
    (u) =>
      !search.trim() ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredMembers = members.filter(
    (m) =>
      !search.trim() ||
      (m.user?.name ?? m.name)?.toLowerCase().includes(search.toLowerCase()) ||
      (m.user?.email ?? m.email)?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedToAdd(new Set(filteredNonMembers.map((u) => u.id)))
  }

  const clearAll = () => setSelectedToAdd(new Set())

  const handleAddMembers = async () => {
    if (selectedToAdd.size === 0) return
    setAddingBulk(true)
    setError('')
    const ids = [...selectedToAdd]
    try {
      // Try format 1: { userIds, role }
      try {
        await api.post(`/teams/${team.id}/members/bulk`, { userIds: ids, role: addRole })
      } catch (e1) {
        if (e1.response?.status === 400 || e1.response?.status === 422) {
          // Try format 2: { members: [{ userId, role }] }
          await api.post(`/teams/${team.id}/members/bulk`, {
            members: ids.map(userId => ({ userId, role: addRole })),
          })
        } else if (e1.response?.status === 404) {
          // Try without /bulk: add members individually
          await Promise.all(ids.map(userId =>
            api.post(`/teams/${team.id}/members`, { userId, role: addRole })
          ))
        } else {
          throw e1
        }
      }
      await loadData()
      setSelectedToAdd(new Set())
      setTab('members')
      onUpdated?.()
    } catch (err) {
      const d = err.response?.data
      const status = err.response?.status
      const raw = d?.message || d?.error || d?.errors
      const msg = typeof raw === 'string' ? raw : (raw ? JSON.stringify(raw) : null)
      setError(msg || `Failed to add members (${status ?? 'network error'}).`)
    } finally {
      setAddingBulk(false)
    }
  }

  const handleRemove = async (member) => {
    const memberId = member.userId ?? member.user?.id ?? member.id
    if (!memberId) return
    setRemovingId(memberId)
    setError('')
    try {
      await api.delete(`/teams/${team.id}/members/${memberId}`)
      setMembers((prev) => prev.filter(
        (m) => (m.userId ?? m.user?.id ?? m.id) !== memberId
      ))
      onUpdated?.()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove member.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setRemovingId(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 truncate">{team?.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer flex-shrink-0 ml-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-1 flex-shrink-0">
          {[
            { key: 'members', label: `Members (${members.length})` },
            { key: 'add', label: `Add Employees (${nonMembers.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch('') }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                tab === t.key
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-6 pt-3 pb-1 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={tab === 'members' ? 'Search members...' : 'Search employees...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-400 focus:bg-white"
            />
          </div>
        </div>

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
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loadingInit ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
              <span className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : tab === 'members' ? (
            filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <span className="text-3xl">👥</span>
                <p className="text-sm">{search ? 'No members match your search' : 'No members yet'}</p>
                {!search && (
                  <button onClick={() => setTab('add')} className="text-sm text-emerald-600 hover:underline cursor-pointer mt-1">
                    Add employees to this team
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member) => {
                  const userId = member.userId ?? member.user?.id ?? member.id
                  const name = member.user?.name ?? member.name ?? 'Unknown'
                  const email = member.user?.email ?? member.email ?? ''
                  const role = member.role ?? 'MEMBER'
                  const isRemoving = removingId === userId
                  return (
                    <div key={userId} className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition">
                      <Avatar name={name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                        <p className="text-xs text-gray-400 truncate">{email}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${ROLE_BADGE[role] || ROLE_BADGE.MEMBER}`}>
                        {role.replace('_', ' ').toLowerCase()}
                      </span>
                      <button
                        onClick={() => handleRemove(member)}
                        disabled={!!removingId}
                        title="Remove from team"
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer disabled:opacity-40 flex-shrink-0"
                      >
                        {isRemoving ? (
                          <span className="w-3.5 h-3.5 border border-red-300 border-t-red-500 rounded-full animate-spin block" />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            /* Add tab */
            <>
              {/* Role selector + select all */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Assign as:</span>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="h-8 px-3 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    {TEAM_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-emerald-600 hover:underline cursor-pointer">Select all</button>
                  {selectedToAdd.size > 0 && (
                    <button onClick={clearAll} className="text-xs text-gray-400 hover:underline cursor-pointer">Clear</button>
                  )}
                </div>
              </div>

              {filteredNonMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                  <span className="text-3xl">✅</span>
                  <p className="text-sm">{search ? 'No employees match your search' : 'All employees are already in this team!'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNonMembers.map((user) => {
                    const isSelected = selectedToAdd.has(user.id)
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleSelect(user.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                          isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </div>
                        <Avatar name={user.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        {user.roles?.[0] && (
                          <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize flex-shrink-0">
                            {user.roles[0].name}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50 rounded-b-2xl">
          {tab === 'add' && selectedToAdd.size > 0 ? (
            <button
              onClick={handleAddMembers}
              disabled={addingBulk}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {addingBulk ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding...</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add {selectedToAdd.size} Employee{selectedToAdd.size !== 1 ? 's' : ''} as {TEAM_ROLES.find(r => r.value === addRole)?.label}
                </>
              )}
            </button>
          ) : (
            <button onClick={onClose} className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition cursor-pointer">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
