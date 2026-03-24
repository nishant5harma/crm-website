import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import AssignTeamsModal from '../components/AssignTeamsModal'

const MANAGER_COLORS = [
  'from-violet-500 to-purple-600',
  'from-indigo-500 to-blue-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-teal-500 to-emerald-600',
  'from-sky-500 to-cyan-600',
]

const TEAM_COLORS = [
  'from-emerald-500 to-teal-500',
  'from-indigo-500 to-violet-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-blue-500',
  'from-fuchsia-500 to-purple-500',
]

function getColor(arr, name = '') {
  return arr[name.charCodeAt(0) % arr.length]
}

function Initials({ name }) {
  const words = (name || '').split(' ').filter(Boolean)
  return words.length >= 2
    ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
    : (name?.[0] ?? '?').toUpperCase()
}

// localStorage key for persisting manager → team assignments
const STORAGE_KEY = 'crm_manager_team_assignments'

function loadStoredAssignments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveAssignments(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

// Merge API teams with locally-stored managerId assignments
function applyStoredAssignments(teams) {
  const stored = loadStoredAssignments()
  return teams.map(t => ({
    ...t,
    managerId: stored[t.id] ?? t.managerId ?? null,
  }))
}

export default function ManagersPage() {
  const [users, setUsers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [assigningManager, setAssigningManager] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, teamsRes] = await Promise.all([
        api.get('/users'),
        api.get('/teams'),
      ])
      const allUsers = Array.isArray(usersRes.data)
        ? usersRes.data
        : (usersRes.data?.users ?? [])
      const rawTeams = Array.isArray(teamsRes.data)
        ? teamsRes.data
        : (teamsRes.data?.teams ?? teamsRes.data?.items ?? teamsRes.data?.data ?? [])
      setUsers(allUsers)
      // overlay stored assignments so they survive page refresh
      setTeams(applyStoredAssignments(rawTeams))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Managers = users whose role name contains "manager"
  const managers = users.filter(u =>
    u.roles?.some(r => r.name?.toLowerCase().includes('manager'))
  )
  // Fall back to all users if no manager role exists yet
  const displayManagers = managers.length > 0 ? managers : users

  const getManagerTeams = (managerId) => teams.filter(t => t.managerId === managerId)

  const handleAssigned = (managerId, assignedTeamIds) => {
    // Update state
    setTeams(prev => {
      const next = prev.map(t => {
        if (assignedTeamIds.includes(t.id)) return { ...t, managerId }
        if (t.managerId === managerId && !assignedTeamIds.includes(t.id)) return { ...t, managerId: null }
        return t
      })
      // Persist the full managerId map to localStorage so it survives refresh
      const stored = loadStoredAssignments()
      // Clear previous assignments for this manager
      Object.keys(stored).forEach(tid => { if (stored[tid] === managerId) delete stored[tid] })
      // Write new assignments
      assignedTeamIds.forEach(tid => { stored[tid] = managerId })
      // Remove entries whose managerId was cleared by this operation
      next.forEach(t => { if (!t.managerId && stored[t.id]) delete stored[t.id] })
      saveAssignments(stored)
      return next
    })
    const mgr = displayManagers.find(m => m.id === managerId)
    setSuccessMsg(`Teams updated for ${mgr?.name ?? 'manager'}.`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const filteredManagers = displayManagers.filter(m =>
    !search.trim() ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )

  const assignedCount = teams.filter(t => t.managerId).length
  const unassignedCount = teams.filter(t => !t.managerId).length

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Managers</h1>
          <p className="text-sm text-gray-500 mt-1">Assign teams to managers and track team ownership</p>
        </div>
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
          { label: 'Total Managers', value: managers.length || users.length, icon: '👔' },
          { label: 'Teams Assigned', value: assignedCount, icon: '✅' },
          { label: 'Teams Unassigned', value: unassignedCount, icon: '📋' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.icon} {s.value}</p>
          </div>
        ))}
      </div>

      {/* No manager-role warning */}
      {!loading && managers.length === 0 && users.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 mb-5 text-sm">
          <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            No users with a Manager role found. Showing all users — assign a role containing
            <strong className="font-semibold"> "manager" </strong>
            to an employee to designate them as a manager.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <span className="w-8 h-8 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-sm">Loading managers...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-red-500 font-medium">{error}</p>
          <button onClick={fetchData} className="text-sm text-violet-600 hover:underline cursor-pointer">Try again</button>
        </div>
      ) : filteredManagers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl">👔</div>
          <p className="text-sm font-medium text-gray-500">
            {search ? 'No managers match your search' : 'No users found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredManagers.map(manager => {
            const assignedTeams = getManagerTeams(manager.id)
            const mColor = getColor(MANAGER_COLORS, manager.name)
            return (
              <div
                key={manager.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden"
              >
                {/* Color top bar */}
                <div className={`h-1.5 bg-gradient-to-r ${mColor}`} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Manager identity */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mColor} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
                      <Initials name={manager.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight truncate">{manager.name}</h3>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{manager.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {manager.roles?.slice(0, 2).map(r => (
                          <span key={r.id} className="inline-block text-[10px] font-semibold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Assigned teams */}
                  <div className="flex-1 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500">Assigned Teams</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        assignedTeams.length > 0 ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {assignedTeams.length}
                      </span>
                    </div>
                    {assignedTeams.length === 0 ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl">
                        <svg className="text-gray-300 flex-shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        </svg>
                        <span className="text-xs text-gray-400">No teams assigned yet</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedTeams.slice(0, 3).map(t => (
                          <span
                            key={t.id}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r ${getColor(TEAM_COLORS, t.name)} text-white`}
                          >
                            {t.name}
                          </span>
                        ))}
                        {assignedTeams.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                            +{assignedTeams.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Assign button */}
                  <button
                    onClick={() => setAssigningManager(manager)}
                    className="w-full h-10 bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Manage Teams
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Assign Teams Modal */}
      {assigningManager && (
        <AssignTeamsModal
          manager={assigningManager}
          teams={teams}
          currentTeamIds={getManagerTeams(assigningManager.id).map(t => t.id)}
          onClose={() => setAssigningManager(null)}
          onSaved={assignedIds => {
            handleAssigned(assigningManager.id, assignedIds)
            setAssigningManager(null)
          }}
        />
      )}
    </div>
  )
}
