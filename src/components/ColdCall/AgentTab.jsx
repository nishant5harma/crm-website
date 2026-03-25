import { useState, useEffect } from 'react'
import { getMyTasks, pullNextCall, logAttempt, completeCall } from '../../api/coldCallApi'

export default function AgentTab() {
  const [tasks, setTasks] = useState({ pending: 0, locked: 0 })
  const [currentEntry, setCurrentEntry] = useState(null)
  const [preferredTeamId, setPreferredTeamId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [error, setError] = useState(null)

  const [attemptResult, setAttemptResult] = useState('interested')
  const [attemptNotes, setAttemptNotes] = useState('')

  const fetchTasks = async () => {
    setLoadingTasks(true)
    try {
      const data = await getMyTasks()
      // Fallback depending on actual API response structure
      setTasks({
        pending: data.pending ?? 0,
        locked: data.locked ?? 0,
      })
      if (data.currentEntry) {
        setCurrentEntry(data.currentEntry)
      }
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Error fetching tasks. Check backend.')
    } finally {
      setLoadingTasks(false)
    }
  }

  // Removed useEffect so it doesn't fetch on mount

  const handlePull = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = preferredTeamId ? { preferredTeamIds: [preferredTeamId] } : {}
      const res = await pullNextCall(payload)
      if (res.entry) {
        setCurrentEntry(res.entry)
      } else {
        setError('No entry pulled.')
      }
      fetchTasks()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error pulling call')
    } finally {
      setLoading(false)
    }
  }

  const handleAttempt = async () => {
    if (!currentEntry) return
    try {
      await logAttempt(currentEntry.id, { result: attemptResult, notes: attemptNotes })
      setAttemptNotes('')
      alert('Attempt logged')
    } catch (err) {
      alert(err.response?.data?.error || 'Error logging attempt')
    }
  }

  const handleComplete = async () => {
    if (!currentEntry) return
    try {
      await completeCall(currentEntry.id, {
        response: attemptResult,
        disposition: 'call_back', // dummy default
        summary: attemptNotes,
        leadConversion: { createLead: false } // default
      })
      setCurrentEntry(null)
      fetchTasks()
    } catch (err) {
      alert(err.response?.data?.error || 'Error completing call')
    }
  }

  return (
    <div className="space-y-4">
      {/* My Tasks */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">My tasks</h3>
          <button
            onClick={fetchTasks}
            disabled={loadingTasks}
            className="cursor-pointer px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-full hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
          >
            {loadingTasks ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className="text-gray-500 text-sm">
          Pending (your teams): {tasks.pending} · Locked: {tasks.locked}
        </p>
      </div>

      {/* Pull Next Call */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Pull next call</h3>
        <input
          type="text"
          placeholder="preferredTeamId (optional)"
          value={preferredTeamId}
          onChange={(e) => setPreferredTeamId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg p-2.5 mb-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
        />
        <button
          onClick={handlePull}
          disabled={loading}
          className="cursor-pointer w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
        >
          {loading ? 'Pulling...' : 'Pull'}
        </button>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Current Entry */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Current entry</h3>
        {!currentEntry ? (
          <p className="text-gray-500 text-sm">No entry pulled yet.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p><strong>Name:</strong> {currentEntry.payload?.name || currentEntry.name || 'N/A'}</p>
              <p><strong>Phone:</strong> {currentEntry.payload?.phone || currentEntry.phone || 'N/A'}</p>
              <p><strong>Email:</strong> {currentEntry.payload?.email || currentEntry.email || 'N/A'}</p>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <h4 className="font-medium mb-2">Log Attempt / Complete</h4>
              <div className="space-y-3">
                <select
                  value={attemptResult}
                  onChange={(e) => setAttemptResult(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="no_answer">No Answer</option>
                  <option value="call_back">Call Back</option>
                </select>
                <textarea
                  placeholder="Notes..."
                  value={attemptNotes}
                  onChange={(e) => setAttemptNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none h-20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAttempt}
                    className="cursor-pointer flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium py-2 rounded-lg transition"
                  >
                    Log Attempt
                  </button>
                  <button
                    onClick={handleComplete}
                    className="cursor-pointer flex-1 bg-indigo-600 text-white hover:bg-indigo-700 font-medium py-2 rounded-lg transition"
                  >
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
