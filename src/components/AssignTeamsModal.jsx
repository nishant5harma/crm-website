import { useState } from 'react'
import api from '../api/axios'

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

export default function AssignTeamsModal({ manager, teams, currentTeamIds, onClose, onSaved }) {
  const [selected, setSelected] = useState(new Set(currentTeamIds))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const toggleTeam = (teamId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  const filteredTeams = teams.filter(t =>
    !search.trim() || t.name?.toLowerCase().includes(search.toLowerCase())
  )

  const hasChanges = () => {
    const current = new Set(currentTeamIds)
    if (selected.size !== current.size) return true
    for (const id of selected) if (!current.has(id)) return true
    return false
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const toAdd = [...selected].filter(id => !currentTeamIds.includes(id))
      const toRemove = currentTeamIds.filter(id => !selected.has(id))

      await Promise.all([
        ...toAdd.map(id => api.patch(`/teams/${id}`, { managerId: manager.id })),
        ...toRemove.map(id => api.patch(`/teams/${id}`, { managerId: null })),
      ])

      onSaved([...selected])
    } catch (err) {
      const d = err.response?.data
      const msg = d?.message || d?.error || 'Failed to update team assignments.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  if (!manager) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Assign Teams</h2>
              <p className="text-xs text-violet-100 mt-0.5">Select teams to assign to {manager.name}</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Manager info */}
        <div className="px-6 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {manager.name?.[0]?.toUpperCase() ?? 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{manager.name}</p>
              <p className="text-xs text-gray-400 truncate">{manager.email}</p>
            </div>
            <span className="ml-auto text-[10px] font-semibold bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full flex-shrink-0">
              {selected.size} selected
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pb-3 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search teams..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-xs flex-shrink-0">
            {error}
          </div>
        )}

        {/* Teams list */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {filteredTeams.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
              <span className="text-3xl">🏆</span>
              <p className="text-sm">No teams found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTeams.map(team => {
                const isSelected = selected.has(team.id)
                const isOtherManager = team.managerId && team.managerId !== manager.id
                const memberCount = team.memberCount ?? team._count?.members ?? team.members?.length ?? 0
                return (
                  <button
                    key={team.id}
                    onClick={() => !isOtherManager && toggleTeam(team.id)}
                    disabled={loading || isOtherManager}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition text-left ${
                      isSelected
                        ? 'border-violet-200 bg-violet-50'
                        : isOtherManager
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/50 cursor-pointer'
                    } disabled:opacity-60`}
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getTeamColor(team.name)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                      <TeamInitials name={team.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{team.name}</p>
                      <p className="text-xs text-gray-400">
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {isOtherManager ? (
                      <span className="text-[10px] text-amber-500 font-semibold flex-shrink-0">Other mgr</span>
                    ) : (
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                        isSelected ? 'bg-violet-600 border-violet-600' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition disabled:opacity-60 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !hasChanges()}
            className="flex-1 h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : 'Save Changes'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
