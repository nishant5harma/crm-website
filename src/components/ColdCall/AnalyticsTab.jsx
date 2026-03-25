import { useState } from 'react'
import { getLeaderboard, getTeamAnalytics, getAgentAnalytics } from '../../api/coldCallApi'

export default function AnalyticsTab() {
  const [metric, setMetric] = useState('conversions')
  const [days, setDays] = useState('7')
  const [top, setTop] = useState('10')
  const [leaderboardData, setLeaderboardData] = useState(null)

  const [from, setFrom] = useState('')
  const [teamId, setTeamId] = useState('')
  const [userId, setUserId] = useState('')
  const [teamAn, setTeamAn] = useState(null)
  const [agentAn, setAgentAn] = useState(null)

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard({ metric, days, top })
      setLeaderboardData(data)
    } catch (err) {
      setLeaderboardData(err.response?.data || { error: err.message })
    }
  }

  const loadTeam = async () => {
    if (!teamId) return
    try {
      const data = await getTeamAnalytics(teamId, { from })
      setTeamAn(data)
    } catch (err) {
      setTeamAn(err.response?.data || { error: err.message })
    }
  }

  const loadAgent = async () => {
    if (!userId) return
    try {
      const data = await getAgentAnalytics(userId, { from })
      setAgentAn(data)
    } catch (err) {
      setAgentAn(err.response?.data || { error: err.message })
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="conversions"
            className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="7"
            className="w-20 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <input
            type="number"
            value={top}
            onChange={(e) => setTop(e.target.value)}
            placeholder="10"
            className="w-20 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>
        <button
          onClick={loadLeaderboard}
          className="cursor-pointer w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg text-sm transition"
        >
          Load leaderboard
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Team / Agent analytics</h3>
        
        <input
          type="text"
          placeholder="from (ISO) optional"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-full border border-gray-200 rounded-lg p-2.5 mb-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
        
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="teamId"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <button
            onClick={loadTeam}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-lg text-sm font-medium transition"
          >
            Team
          </button>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <button
            onClick={loadAgent}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-lg text-sm font-medium transition"
          >
            Agent
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Leaderboard data</h3>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[40px] text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-auto">
          {leaderboardData ? JSON.stringify(leaderboardData, null, 2) : '—'}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Team analytics</h3>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[40px] text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-auto">
          {teamAn ? JSON.stringify(teamAn, null, 2) : '—'}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Agent analytics</h3>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[40px] text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-auto">
          {agentAn ? JSON.stringify(agentAn, null, 2) : '—'}
        </div>
      </div>
    </div>
  )
}
