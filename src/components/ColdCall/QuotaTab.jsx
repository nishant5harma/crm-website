import { useState } from 'react'
import { setQuota, getQuotas, getQuotaProgress } from '../../api/coldCallApi'

export default function QuotaTab() {
  const [teamId, setTeamId] = useState('')
  const [period, setPeriod] = useState('daily')
  const [metric, setMetric] = useState('conversions')
  const [target, setTarget] = useState('10')
  const [loading, setLoading] = useState(false)

  const [quotaList, setQuotaList] = useState(null)
  const [quotaProg, setQuotaProg] = useState(null)

  const handleSave = async () => {
    if (!teamId) return
    setLoading(true)
    try {
      await setQuota({ teamId, target: Number(target), metric, period })
      alert('Quota saved')
      handleLoad()
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving quota')
    } finally {
      setLoading(false)
    }
  }

  const handleLoad = async () => {
    if (!teamId) return
    setLoading(true)
    try {
      const [qList, qProg] = await Promise.all([
        getQuotas(teamId).catch(e => ({ error: e.message })),
        getQuotaProgress(teamId, { period }).catch(e => ({ error: e.message })),
      ])
      setQuotaList(qList)
      setQuotaProg(qProg)
    } catch (err) {
      // Ignored, handled above
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Set quota (admin)</h3>
        
        <input
          type="text"
          placeholder="teamId"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg p-2.5 mb-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
        />

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
          />
          <input
            type="text"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
          />
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-24 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="cursor-pointer flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
          >
            Save quota
          </button>
          <button
            onClick={handleLoad}
            disabled={loading}
            className="cursor-pointer flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
          >
            Load quota
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Quota list</h3>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[40px] text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-auto">
          {quotaList ? JSON.stringify(quotaList, null, 2) : '—'}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Quota progress</h3>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[40px] text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-auto">
          {quotaProg ? JSON.stringify(quotaProg, null, 2) : '—'}
        </div>
      </div>
    </div>
  )
}
