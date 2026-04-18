import { useState, useEffect } from 'react'
import { getLeaderboard, getTeamAnalytics, getAgentAnalytics } from '../../api/coldCallApi'

// ─── Known teams & agents (extend as needed) ───────────────────────────────
const KNOWN_TEAMS = [
  { label: 'Sales', value: 'cmmz98djx000lpd1mvx0wv07b' },
]
const KNOWN_AGENTS = [
  { label: 'Arya', value: 'Arya' },
]

// ─── Robust extractor for { ok, data: { ... } } shaped responses ─────────────
function extractData(resp) {
  if (!resp) return {}
  if (resp.data && typeof resp.data === 'object' && !Array.isArray(resp.data)) return resp.data
  return resp
}
function extractArray(resp) {
  if (!resp) return []
  if (Array.isArray(resp)) return resp
  if (resp.data && Array.isArray(resp.data)) return resp.data
  if (resp.data && typeof resp.data === 'object') {
    const arr = Object.values(resp.data).find(v => Array.isArray(v))
    if (arr) return arr
  }
  const topArr = Object.values(resp).find(v => Array.isArray(v))
  return topArr || []
}

// ─── Pill Button ───────────────────────────────────────────────────────────
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-xs font-black transition-all ${
        active ? 'bg-[#0d121f] text-white shadow' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, color = 'indigo', wide = false }) {
  const colors = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-400 text-indigo-900',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-400 text-emerald-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-400 text-amber-900',
    blue: 'bg-blue-50 border-blue-100 text-blue-400 text-blue-900',
    purple: 'bg-purple-50 border-purple-100 text-purple-400 text-purple-900',
    gray: 'bg-gray-50 border-gray-100 text-gray-400 text-gray-900',
  }
  const [label_c, border_c, text_c, val_c] = colors[color]?.split(' ') || colors.indigo.split(' ')
  return (
    <div className={`${wide ? 'col-span-2' : ''} p-5 rounded-2xl border ${colors[color].split(' ').slice(0,2).join(' ')}`}>
      <span className={`text-[10px] font-black uppercase tracking-widest block mb-2 ${colors[color].split(' ')[2]}`}>{label}</span>
      <span className={`text-2xl font-black ${colors[color].split(' ')[3]}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function AnalyticsTab() {
  // ── Leaderboard state ──
  const [metric, setMetric]   = useState('conversions')
  const [days,   setDays]     = useState('7')
  const [topN,   setTopN]     = useState('10')
  const [leaderboard, setLeaderboard]   = useState([])
  const [lbLoading,   setLbLoading]     = useState(false)
  const [lbError,     setLbError]       = useState(null)

  // ── Team Analytics state ──
  const [teamId,    setTeamId]    = useState(KNOWN_TEAMS[0]?.value || '')
  const [teamFrom,  setTeamFrom]  = useState('')
  const [teamData,  setTeamData]  = useState(null)
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamError,   setTeamError]   = useState(null)

  // ── Agent Analytics state ──
  const [agentId,    setAgentId]    = useState(KNOWN_AGENTS[0]?.value || '')
  const [agentFrom,  setAgentFrom]  = useState('')
  const [agentData,  setAgentData]  = useState(null)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentError,   setAgentError]   = useState(null)

  // ── Load Leaderboard ──────────────────────────────────────────────────────
  const loadLeaderboard = async () => {
    setLbLoading(true)
    setLbError(null)
    try {
      const resp = await getLeaderboard({ metric, days, top: topN })
      setLeaderboard(extractArray(resp))
    } catch (err) {
      console.error(err)
      setLbError(err.response?.data?.message || err.message || 'Error loading leaderboard')
      setLeaderboard([])
    } finally {
      setLbLoading(false)
    }
  }

  // ── Load Team Analytics ───────────────────────────────────────────────────
  const loadTeam = async () => {
    if (!teamId) return
    setTeamLoading(true)
    setTeamError(null)
    setTeamData(null)
    try {
      const resp = await getTeamAnalytics(teamId, { ...(teamFrom ? { from: teamFrom } : {}) })
      setTeamData(extractData(resp))
    } catch (err) {
      console.error(err)
      setTeamError(err.response?.data?.message || err.message || 'Error loading team analytics')
    } finally {
      setTeamLoading(false)
    }
  }

  // ── Load Agent Analytics ──────────────────────────────────────────────────
  const loadAgent = async () => {
    if (!agentId) return
    setAgentLoading(true)
    setAgentError(null)
    setAgentData(null)
    try {
      const resp = await getAgentAnalytics(agentId, { ...(agentFrom ? { from: agentFrom } : {}) })
      setAgentData(extractData(resp))
    } catch (err) {
      console.error(err)
      setAgentError(err.response?.data?.message || err.message || 'Error loading agent analytics')
    } finally {
      setAgentLoading(false)
    }
  }

  useEffect(() => { loadLeaderboard() }, [])

  // ── Medal colors ──────────────────────────────────────────────────────────
  const rankStyle = (i) => {
    if (i === 0) return 'bg-amber-100 text-amber-600'
    if (i === 1) return 'bg-gray-100 text-gray-500'
    if (i === 2) return 'bg-orange-100 text-orange-500'
    return 'bg-gray-50 text-gray-400'
  }
  const rankEmoji = (i) => { if(i===0) return '🥇'; if(i===1) return '🥈'; if(i===2) return '🥉'; return i+1 }

  // ── Render arbitrary analytics data ──────────────────────────────────────
  const renderAnalyticsData = (data, errorColor = 'indigo') => {
    if (!data) return null
    const colorMap = ['indigo','emerald','amber','blue','purple','gray']
    const entries = Object.entries(data).filter(([k]) => !['teamId','userId','id'].includes(k))
    if (entries.length === 0) return (
      <p className="text-xs font-bold text-gray-400 text-center py-6">No data fields returned from API.</p>
    )
    return (
      <div className="grid grid-cols-2 gap-3 mt-4">
        {entries.map(([key, val], i) => (
          <StatCard
            key={key}
            label={key.replace(/([A-Z])/g,' $1').trim()}
            value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
            color={colorMap[i % colorMap.length]}
            wide={i === entries.length - 1 && entries.length % 2 !== 0}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Leaderboard ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🏆</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">Leaderboard</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Top performers by metric</p>
          </div>
        </div>

        {/* Metric pills */}
        <div className="mt-5 mb-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Metric</p>
          <div className="flex flex-wrap gap-2">
            {[['conversions','Conversions'],['attempts','Attempts'],['connects','Connects']].map(([v,l]) => (
              <Pill key={v} active={metric===v} onClick={() => setMetric(v)}>{l}</Pill>
            ))}
          </div>
        </div>

        {/* Period + Top N pills */}
        <div className="flex flex-wrap gap-6 mb-5">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Period (days)</p>
            <div className="flex flex-wrap gap-2">
              {['7','14','30','90'].map(d => (
                <Pill key={d} active={days===d} onClick={() => setDays(d)}>{d}d</Pill>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Top N</p>
            <div className="flex gap-2">
              {['5','10','20'].map(n => (
                <Pill key={n} active={topN===n} onClick={() => setTopN(n)}>{n}</Pill>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={loadLeaderboard}
          disabled={lbLoading}
          className="w-full bg-[#0d121f] hover:bg-black text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <span className={lbLoading ? 'animate-spin' : ''}>↻</span>
          {lbLoading ? 'Loading...' : 'Refresh Leaderboard'}
        </button>

        {lbError && (
          <div className="mt-4 bg-red-50 border border-red-100 text-red-600 p-3 rounded-2xl text-xs font-bold">
            ⚠️ {lbError}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {leaderboard.length === 0 && !lbLoading ? (
            <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-gray-300 font-black text-xs uppercase tracking-widest">No leaderboard data yet</p>
            </div>
          ) : (
            leaderboard.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50/60 transition">
                <div className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-sm shrink-0 ${rankStyle(idx)}`}>
                  {rankEmoji(idx)}
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                  {(item.userName || item.name || 'U')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{item.userName || item.name || 'Unknown'}</p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">ID: {(item.userId || item.id || '—').substring(0,10)}...</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-black text-[#0d121f] text-lg leading-none">{item.count ?? item.value ?? item.score ?? 0}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{metric}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Team Analytics ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">👥</span>
          <h3 className="text-xl font-bold text-gray-900">Team Analytics</h3>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Team</p>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#0d121f]/10 appearance-none"
            >
              {KNOWN_TEAMS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="From date (ISO, optional)"
            value={teamFrom}
            onChange={(e) => setTeamFrom(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-gray-300"
          />
        </div>

        <button
          onClick={loadTeam}
          disabled={teamLoading}
          className="w-full bg-[#0d121f] hover:bg-black text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-60"
        >
          {teamLoading ? 'Loading...' : 'Load Team Analytics'}
        </button>

        {teamError && (
          <div className="mt-4 bg-red-50 border border-red-100 text-red-600 p-3 rounded-2xl text-xs font-bold">⚠️ {teamError}</div>
        )}

        {teamData && !teamError && (
          <div className="mt-4">
            {renderAnalyticsData(teamData)}
          </div>
        )}

        {!teamData && !teamError && !teamLoading && (
          <div className="mt-4 py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Select a team and load</p>
          </div>
        )}
      </div>

      {/* ── Agent Analytics ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">🧑</span>
          <h3 className="text-xl font-bold text-gray-900">Agent Analytics</h3>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Agent</p>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#0d121f]/10 appearance-none"
            >
              {KNOWN_AGENTS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="From date (ISO, optional)"
            value={agentFrom}
            onChange={(e) => setAgentFrom(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-gray-300"
          />
        </div>

        <button
          onClick={loadAgent}
          disabled={agentLoading}
          className="w-full bg-[#0d121f] hover:bg-black text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-60"
        >
          {agentLoading ? 'Loading...' : 'Load Agent Analytics'}
        </button>

        {agentError && (
          <div className="mt-4 bg-red-50 border border-red-100 text-red-600 p-3 rounded-2xl text-xs font-bold">⚠️ {agentError}</div>
        )}

        {agentData && !agentError && (
          <div className="mt-4">
            {renderAnalyticsData(agentData)}
          </div>
        )}

        {!agentData && !agentError && !agentLoading && (
          <div className="mt-4 py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Select an agent and load</p>
          </div>
        )}
      </div>

    </div>
  )
}
