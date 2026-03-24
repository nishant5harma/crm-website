import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import CreateTeamModal from '../components/CreateTeamModal'
import ManageMembersModal from '../components/ManageMembersModal'

/* ── Edit Team Modal ── */
function EditTeamModal({ team, onClose, onSaved }) {
  const [form, setForm] = useState({ name: team?.name || '', leadId: team?.leadId ?? team?.lead?.id ?? '' })
  const [leaders, setLeaders] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({ name: team?.name || '', leadId: team?.leadId ?? team?.lead?.id ?? '' })
    setError('')
    setUsersLoading(true)
    api.get('/users')
      .then(({ data }) => {
        const all = Array.isArray(data) ? data : (data?.users ?? [])
        setLeaders(all.filter(u => u.roles?.some(r => r.name?.toLowerCase().includes('lead'))))
      })
      .catch(() => setLeaders([]))
      .finally(() => setUsersLoading(false))
  }, [team])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Team name must be at least 2 characters.')
      return
    }
    setLoading(true); setError('')
    try {
      const payload = { name: form.name.trim() }
      if (form.leadId) payload.leadId = form.leadId
      // Try PATCH first (partial update), fall back to PUT
      let data
      try {
        ;({ data } = await api.patch(`/teams/${team.id}`, payload))
      } catch (e) {
        if (e.response?.status === 404 || e.response?.status === 405) {
          ;({ data } = await api.put(`/teams/${team.id}`, payload))
        } else {
          throw e
        }
      }
      onSaved(data?.team ?? data)
      onClose()
    } catch (err) {
      const d = err.response?.data
      const status = err.response?.status
      const raw = d?.message || d?.error || d?.errors
      const msg = typeof raw === 'string' ? raw : (raw ? JSON.stringify(raw) : null)
      setError(msg || `Failed to update team (${status ?? 'network error'}). The backend may not support this endpoint yet.`)
    } finally { setLoading(false) }
  }

  if (!team) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
          <h2 className="text-base font-bold text-white">Edit Team</h2>
          <p className="text-xs text-emerald-100 mt-0.5">Update team name or change the lead</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}
          {/* Team name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Team Name <span className="text-red-400">*</span></label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <input
                type="text"
                value={form.name}
                onChange={e => { setError(''); setForm(p => ({ ...p, name: e.target.value })) }}
                placeholder="e.g. Sales Team North"
                disabled={loading}
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition disabled:opacity-60"
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
                value={form.leadId}
                onChange={e => setForm(p => ({ ...p, leadId: e.target.value }))}
                disabled={loading || usersLoading}
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition disabled:opacity-60 appearance-none cursor-pointer"
              >
                <option value="">— No team lead —</option>
                {leaders.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
              <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {!usersLoading && leaders.length === 0 && (
              <p className="text-xs text-amber-500">No employees with a Team Lead role found.</p>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition cursor-pointer disabled:opacity-60">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Delete Team Confirm ── */
function DeleteTeamConfirm({ team, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)

  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    setLoading(true)
    setDeleteError('')
    try {
      await api.delete(`/teams/${team.id}`)
      onDeleted(team.id)
      onClose()
    } catch (err) {
      const d = err.response?.data
      const status = err.response?.status
      const raw = d?.message || d?.error
      const msg = typeof raw === 'string' ? raw : (raw ? JSON.stringify(raw) : null)
      setDeleteError(msg || `Failed to delete team (${status ?? 'network error'}). The backend may not support this endpoint yet.`)
      setLoading(false)
    }
  }

  if (!team) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-3">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">Delete Team</h3>
          <p className="text-xs text-gray-500 mt-1">This action cannot be undone</p>
        </div>
        <p className="text-sm text-gray-600 text-center mb-5">
          Delete <span className="font-semibold text-gray-900">"{team.name}"</span>? All member assignments will be removed.
        </p>
        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-xs mb-4">{deleteError}</div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition cursor-pointer disabled:opacity-60">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</> : 'Delete Team'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TEAM_COLORS = [
  'from-emerald-500 to-teal-500',
  'from-indigo-500 to-violet-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-blue-500',
  'from-fuchsia-500 to-purple-500',
]

function getTeamColor(name = '') {
  return TEAM_COLORS[name.charCodeAt(0) % TEAM_COLORS.length]
}

function TeamInitials({ name }) {
  const words = (name || '').split(' ').filter(Boolean)
  return words.length >= 2
    ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
    : (name?.[0] ?? '?').toUpperCase()
}

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [managingTeam, setManagingTeam] = useState(null)
  const [editingTeam, setEditingTeam] = useState(null)
  const [deletingTeam, setDeletingTeam] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/teams')
      // backend may return plain array, { teams: [...] }, { items: [...] }, or { data: [...] }
      const list = Array.isArray(data) ? data : (data?.teams ?? data?.items ?? data?.data ?? [])
      setTeams(list)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teams.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleCreated = (team) => {
    setTeams((prev) => [team, ...prev])
    setSuccessMsg(`Team "${team.name}" created successfully!`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleSaved = (updated) => {
    setTeams(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))
    setSuccessMsg(`Team "${updated.name}" updated successfully!`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const handleDeleted = (teamId) => {
    setTeams(prev => prev.filter(t => t.id !== teamId))
    setSuccessMsg('Team deleted successfully.')
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const refreshTeam = async (teamId) => {
    try {
      const { data } = await api.get(`/teams/${teamId}`)
      // unwrap { team: {...} } or use data directly
      const updated = data?.team ?? data
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...updated } : t)))
    } catch {
      // silently refresh all
      fetchTeams()
    }
  }

  const filtered = teams.filter(
    (t) =>
      !search.trim() ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      (t.teamLead ?? t.lead)?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Teams</h1>
          <p className="text-sm text-gray-500 mt-1">Create teams and assign employees to them</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Team
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Teams', value: teams.length, icon: '🏆' },
          { label: 'Showing', value: filtered.length, icon: '🔍' },
          {
            label: 'Total Members',
            value: teams.reduce((sum, t) => sum + (t.memberCount ?? t._count?.members ?? 0), 0) || '—',
            icon: '👥',
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.icon} {s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by team name or lead..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <span className="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm">Loading teams...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-red-500 font-medium">{error}</p>
          <button onClick={fetchTeams} className="text-sm text-emerald-600 hover:underline cursor-pointer">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl">🏆</div>
          <p className="text-sm font-medium text-gray-500">
            {search ? 'No teams match your search' : 'No teams yet'}
          </p>
          {!search && (
            <button onClick={() => setCreateOpen(true)} className="text-sm text-emerald-600 hover:underline cursor-pointer">
              Create your first team
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((team) => (
            <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden">
              {/* Color top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${getTeamColor(team.name)}`} />

              <div className="p-5 flex flex-col flex-1">
                {/* Team identity */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTeamColor(team.name)} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                    <TeamInitials name={team.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{team.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Created {team.createdAt ? new Date(team.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>

                {/* Team Lead */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-gray-50 rounded-xl">
                  <svg className="text-gray-400 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" />
                  </svg>
                  {(team.teamLead ?? team.lead) ? (
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{(team.teamLead ?? team.lead).name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{(team.teamLead ?? team.lead).email}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No team lead assigned</span>
                  )}
                  {(team.teamLead ?? team.lead) && (
                    <span className="ml-auto text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex-shrink-0">Lead</span>
                  )}
                </div>

                {/* Member count */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="font-medium text-gray-700">
                      {team.memberCount ?? team._count?.members ?? team.members?.length ?? 0} member{(team.memberCount ?? team._count?.members ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => setManagingTeam(team)}
                    className="flex-1 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <line x1="12" y1="14" x2="12" y2="20" /><line x1="9" y1="17" x2="15" y2="17" />
                    </svg>
                    Members
                  </button>
                  <button
                    onClick={() => setEditingTeam(team)}
                    className="h-10 w-10 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center transition cursor-pointer flex-shrink-0"
                    title="Edit team"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeletingTeam(team)}
                    className="h-10 w-10 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition cursor-pointer flex-shrink-0"
                    title="Delete team"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add team card */}
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-200 hover:border-emerald-300 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-emerald-500 transition cursor-pointer min-h-[220px] group"
          >
            <div className="w-12 h-12 rounded-xl bg-white group-hover:bg-emerald-50 border border-gray-200 group-hover:border-emerald-200 flex items-center justify-center transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-sm font-medium">Create new team</span>
          </button>
        </div>
      )}

      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={handleCreated} />

      <ManageMembersModal
        open={!!managingTeam}
        team={managingTeam}
        onClose={() => setManagingTeam(null)}
        onUpdated={() => managingTeam && refreshTeam(managingTeam.id)}
      />

      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onSaved={handleSaved}
        />
      )}

      {deletingTeam && (
        <DeleteTeamConfirm
          team={deletingTeam}
          onClose={() => setDeletingTeam(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
