import { useState, useEffect } from 'react'
import { getMyTasks, pullNextCall, logAttempt, completeCall, getEntriesReport } from '../../api/coldCallApi'

export default function AgentTab() {
  const [tasks, setTasks] = useState({ pending: 0, locked: 0 })
  const [lockedEntries, setLockedEntries] = useState([])
  const [pendingPreview, setPendingPreview] = useState([])
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
      const dataRaw = await getMyTasks()
      // Extract data object correctly handling 'rows' or 'data'
      const data = dataRaw?.data || dataRaw?.rows || dataRaw || {}
      
      const locked = Array.isArray(data.locked) ? data.locked : (Array.isArray(data.data?.locked) ? data.data.locked : [])
      
      setTasks({
        pending: data.pendingCount || data.pending || 0,
        locked: locked.length
      })
      
      setLockedEntries(locked)

      if (data.currentEntry) {
        setCurrentEntry(data.currentEntry)
      } else if (locked.length > 0 && !currentEntry) {
        setCurrentEntry(locked[0])
      }

      setError(null)
    } catch (err) {
      console.error('Agent Fetch Error:', err)
      const errorData = err.response?.data
      const msg = typeof errorData === 'object' ? JSON.stringify(errorData, null, 2) : (errorData?.message || errorData?.error || err.message)
      setError(`Error: ${msg}`)
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handlePull = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = preferredTeamId ? { preferredTeamIds: [preferredTeamId] } : {}
      const res = await pullNextCall(payload)
      if (res.entry) {
        setCurrentEntry(res.entry)
        fetchTasks()
      } else {
        setError('No calls available')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message)
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
      fetchTasks()
    } catch (err) {
      alert(err.response?.data?.error || 'Error logging attempt')
    }
  }

  const handleComplete = async () => {
    if (!currentEntry) return
    try {
      await completeCall(currentEntry.id, {
        response: attemptResult,
        disposition: 'call_back',
        summary: attemptNotes,
        leadConversion: { createLead: false }
      })
      setCurrentEntry(null)
      alert('Call completed')
      fetchTasks()
    } catch (err) {
      alert(err.response?.data?.error || 'Error completing call')
    }
  }

  return (
    <div className="space-y-4 w-full py-6">
      {/* My Tasks Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#334155]">My tasks</h3>
          <button 
            onClick={fetchTasks} 
            disabled={loadingTasks}
            className="px-6 py-2 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {loadingTasks ? '...' : 'Refresh'}
          </button>
        </div>
        
        <p className="text-sm font-medium text-gray-400 mb-6">
          Pending (your teams): {tasks.pending} · Locked: {tasks.locked}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-2">
            <div className="text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Sync Error
            </div>
            <div className="text-xs text-red-900 border-l-2 border-red-200 pl-3 py-1 italic bg-white/50 rounded-r-lg">
              {error}
            </div>
            <button 
              onClick={fetchTasks}
              className="mt-2 w-fit px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
            >
              Retry Fetch
            </button>
          </div>
        )}

        <div className="space-y-3">
          {lockedEntries.length === 0 ? (
            <div className="text-center py-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 italic">
              <p className="text-gray-400 text-sm">No tasks currently locked.</p>
              {tasks.pending > 0 && (
                <p className="text-[#0086a8] text-[10px] font-bold mt-2 animate-bounce">
                  ↑ Click "Pull" below to claim one of the {tasks.pending} pending tasks!
                </p>
              )}
            </div>
          ) : (
            lockedEntries.map(entry => (
              <div 
                key={entry.id}
                onClick={() => setCurrentEntry(entry)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  currentEntry?.id === entry.id 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-[#F8FAFC] border-transparent hover:border-gray-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-900 text-base">
                    {entry.phone || entry.payload?.phone || entry.name || entry.payload?.name || 'Unknown'}
                  </h4>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Locked</span>
                </div>
                <div className="flex gap-2 mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>Batch: #{entry.batchId?.substring(0,8)}</span>
                  <span>·</span>
                  <span>Team: {entry.assignedTeam?.name || 'Sales'}</span>
                </div>
              </div>
            ))
          )}

          {/* Pending Preview - only shows if no tasks are locked to help user see their data */}
          {lockedEntries.length === 0 && pendingPreview.length > 0 && (
             <div className="mt-4 pt-4 border-t border-gray-50">
               <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-3">Next in Queue (Available)</div>
               <div className="space-y-2 opacity-50 grayscale">
                 {pendingPreview.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50/30 rounded-xl border border-gray-100/50">
                       <span className="text-xs font-bold text-gray-400">{p.payload?.name || p.name || 'Available Lead'}</span>
                       <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase font-black">Pending</span>
                    </div>
                 ))}
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Pull Next Call Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-[#334155] mb-6">Pull next call</h3>
        
        <p className="text-sm font-medium text-gray-400 mb-4">Preferred team (optional)</p>
        <div className="flex gap-3 mb-6">
          <button 
            onClick={() => setPreferredTeamId('')}
            className={`px-6 py-3 rounded-2xl text-sm font-bold border transition-all ${
              !preferredTeamId ? 'bg-white border-gray-200 shadow-sm' : 'bg-white border-transparent text-gray-400'
            }`}
          >
            Any
          </button>
          <button 
            onClick={() => setPreferredTeamId('cmmz98djx000lpd1mvx0wv07b')}
            className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
              preferredTeamId === 'cmmz98djx000lpd1mvx0wv07b' ? 'bg-[#0086a8] text-white' : 'bg-[#E2E8F0] text-gray-700'
            }`}
          >
            Sales
          </button>
        </div>

        <button
          onClick={handlePull}
          disabled={loading || tasks.pending === 0}
          className={`w-full font-bold py-4 rounded-xl text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            tasks.pending > 0 
            ? 'bg-[#0086a8] hover:bg-[#007491] text-white shadow-lg shadow-[#0086a8]/20 ring-2 ring-[#0086a8]/10' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              {tasks.pending > 0 && <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>}
              {tasks.pending > 0 ? `Pull Next (${tasks.pending} available)` : 'No tasks to pull'}
            </>
          )}
        </button>
        {error && <p className="text-red-500 text-xs mt-3 text-center font-bold px-2">{error}</p>}
      </div>

      {/* Current Entry Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm min-h-[120px]">
        <h3 className="text-xl font-bold text-[#334155] mb-4">Current entry</h3>
        
        {!currentEntry ? (
          <p className="text-sm font-medium text-gray-400">No entry pulled yet.</p>
        ) : (
          <div className="space-y-6 pt-2 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-2xl font-black text-gray-900 tracking-tight">
                  {currentEntry.payload?.name || currentEntry.name}
                </h4>
                <p className="text-[#0086a8] font-bold text-lg mt-1">
                  {currentEntry.payload?.phone || currentEntry.phone || 'No phone'}
                </p>
              </div>
              <a 
                href={`tel:${currentEntry.payload?.phone || currentEntry.phone}`}
                className="bg-[#0086a8] text-white p-4 rounded-2xl shadow-lg shadow-[#0086a8]/20"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            </div>

            {/* Credential Context */}
            {(currentEntry.payload?.user_name || currentEntry.payload?.password) && (
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-3 bg-[#0086a8] rounded-full"></div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Credentials</h5>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">User Name</span>
                    <span className="text-sm font-black text-gray-900">{currentEntry.payload.user_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Password</span>
                    <code className="text-sm bg-white px-2 py-1 rounded border border-gray-200 font-mono font-black text-[#0086a8]">
                      {currentEntry.payload.password}
                    </code>
                  </div>
                </div>

                {currentEntry.payload?.console_signin_url && (
                  <div className="pt-2 border-t border-gray-200/50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">AWS Console Link</span>
                    <a 
                      href={currentEntry.payload.console_signin_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-[#0086a8] font-black hover:underline break-all"
                    >
                      {currentEntry.payload.console_signin_url}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Call result</label>
                <select
                  value={attemptResult}
                  onChange={(e) => setAttemptResult(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 text-base font-bold focus:bg-white focus:border-[#0086a8]/20 outline-none transition-all appearance-none"
                >
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="call_back">Follow Up Required</option>
                  <option value="no_answer">No Answer / Busy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes</label>
                <textarea
                  placeholder="Notes about the call..."
                  value={attemptNotes}
                  onChange={(e) => setAttemptNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent rounded-2xl p-4 text-base font-medium focus:bg-white focus:border-[#0086a8]/20 outline-none h-24 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAttempt}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl text-sm transition-all active:scale-95"
                >
                  Log attempt
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-[1.5] bg-[#0086a8] text-white font-bold py-4 rounded-2xl text-sm shadow-xl shadow-[#0086a8]/20 transition-all active:scale-95"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
