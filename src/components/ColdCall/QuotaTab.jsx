import { useState, useEffect, useRef } from 'react'
import { setQuota, getQuotas, getQuotaProgress } from '../../api/coldCallApi'

// ── Known teams (extend as needed) ──────────────────────────────────────────
const KNOWN_TEAMS = [
  { label: 'Sales', value: 'cmmz98djx000lpd1mvx0wv07b' },
]

// ── Robust extractors for { ok, data: [...] } or { ok, data: {...} } ─────────
function extractList(resp) {
  if (!resp) return []
  if (Array.isArray(resp)) return resp
  if (Array.isArray(resp.data)) return resp.data
  if (resp.data && typeof resp.data === 'object') {
    const arr = Object.values(resp.data).find(v => Array.isArray(v))
    if (arr) return arr
  }
  return []
}
function extractObj(resp) {
  if (!resp) return null
  if (resp.data && typeof resp.data === 'object' && !Array.isArray(resp.data)) return resp.data
  if (typeof resp === 'object' && !Array.isArray(resp)) return resp
  return null
}

// ── Pill button ──────────────────────────────────────────────────────────────
function Pill({ active, onClick, children, color = 'dark' }) {
  const base = 'px-5 py-2 rounded-full text-xs font-black transition-all'
  const activeClass = color === 'green'
    ? 'bg-emerald-600 text-white shadow'
    : 'bg-[#0d121f] text-white shadow'
  const inactiveClass = 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
  return (
    <button onClick={onClick} className={`${base} ${active ? activeClass : inactiveClass}`}>
      {children}
    </button>
  )
}

export default function QuotaTab() {
  const [teamId, setTeamId]   = useState(KNOWN_TEAMS[0]?.value || '')
  const [period, setPeriod]   = useState('daily')
  const [metric, setMetric]   = useState('conversions')
  const [target, setTarget]   = useState('10')
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(false)

  const [quotaList, setQuotaList] = useState([])
  const [quotaProg, setQuotaProg] = useState(null)

  const [saveMsg,  setSaveMsg]  = useState(null)   // { type: 'ok'|'err', text }
  const [loadMsg,  setLoadMsg]  = useState(null)

  // Track whether user has loaded at least once (to avoid mount auto-fire)
  const hasLoadedOnce = useRef(false)

  // ── Save quota ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      await setQuota({ teamId, target: Number(target), metric, period })
      setSaveMsg({ type: 'ok', text: '✅ Quota saved successfully!' })
      handleLoad()
    } catch (err) {
      setSaveMsg({ type: 'err', text: `⚠️ ${err.response?.data?.error || err.message || 'Error saving quota'}` })
    } finally {
      setSaving(false)
    }
  }

  // ── Load quota + progress ─────────────────────────────────────────────────
  const handleLoad = async () => {
    if (!teamId) return
    hasLoadedOnce.current = true   // mark that user has manually loaded
    setLoading(true)
    setLoadMsg(null)
    setQuotaList([])
    setQuotaProg(null)
    try {
      const [qList, qProg] = await Promise.all([
        getQuotas(teamId).catch(() => null),
        getQuotaProgress(teamId, { period }).catch(() => null),
      ])

      const list = extractList(qList)
      const prog = extractObj(qProg)

      setQuotaList(list)
      setQuotaProg(prog)

      if (list.length === 0 && !prog) {
        setLoadMsg({ type: 'info', text: 'No quota data found for this team.' })
      }
    } catch (err) {
      console.error(err)
      setLoadMsg({ type: 'err', text: `⚠️ ${err.response?.data?.message || err.message || 'Error loading quota'}` })
    } finally {
      setLoading(false)
    }
  }

  // Re-load when period changes — but ONLY after user has manually loaded once
  // This prevents the mount auto-fire (which React Strict Mode doubles anyway)
  useEffect(() => {
    if (hasLoadedOnce.current && teamId) handleLoad()
  }, [period])

  // ── Progress % ────────────────────────────────────────────────────────────
  const current   = quotaProg?.current ?? quotaProg?.achieved ?? 0
  const tgt       = quotaProg?.target  ?? 1
  const pct       = Math.min(100, Math.round((current / tgt) * 100))
  const dashArray = 552.92
  const dashOffset = dashArray - (dashArray * pct / 100)

  // ── Period badge color ────────────────────────────────────────────────────
  const periodColor = (p) => {
    if (p === 'daily')   return 'bg-amber-100 text-amber-700'
    if (p === 'weekly')  return 'bg-blue-100 text-blue-700'
    if (p === 'monthly') return 'bg-emerald-100 text-emerald-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Set Quota Form ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Manage Quotas</h3>

        <div className="space-y-5">

          {/* Team Dropdown */}
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

          {/* Period Pills */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Period</p>
            <div className="flex flex-wrap gap-2">
              {['daily', 'weekly', 'monthly'].map(p => (
                <Pill key={p} active={period === p} onClick={() => setPeriod(p)}>{p}</Pill>
              ))}
            </div>
          </div>

          {/* Metric Pills */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Metric</p>
            <div className="flex flex-wrap gap-2">
              {['conversions', 'calls', 'connects'].map(m => (
                <Pill key={m} active={metric === m} onClick={() => setMetric(m)} color="green">{m}</Pill>
              ))}
            </div>
          </div>

          {/* Target Count */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Count</p>
            <input
              type="number"
              min="1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0d121f]/10"
            />
          </div>

          {/* Save Message */}
          {saveMsg && (
            <div className={`text-xs font-bold p-3 rounded-2xl border ${
              saveMsg.type === 'ok'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-red-50 border-red-100 text-red-600'
            }`}>
              {saveMsg.text}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleLoad}
              disabled={loading}
              className="flex-1 bg-white border border-gray-200 hover:border-gray-400 text-gray-700 font-black py-4 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Loading...' : '↻ Load Data'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#0d121f] hover:bg-black text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Set Quota'}
            </button>
          </div>
        </div>
      </div>

      {/* Load message */}
      {loadMsg && (
        <div className={`text-xs font-bold p-4 rounded-2xl border ${
          loadMsg.type === 'err'
            ? 'bg-red-50 border-red-100 text-red-600'
            : 'bg-blue-50 border-blue-100 text-blue-600'
        }`}>
          {loadMsg.text}
        </div>
      )}

      {/* ── Progress Card ──────────────────────────────────────────────── */}
      {quotaProg ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Target Progress</h3>
          <div className="flex flex-col items-center space-y-6">

            {/* Circle SVG */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                <circle cx="96" cy="96" r="80" stroke="#f3f4f6" strokeWidth="14" fill="transparent" />
                <circle
                  cx="96" cy="96" r="80"
                  stroke="#0d121f"
                  strokeWidth="14"
                  fill="transparent"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-gray-900 tracking-tighter">{pct}%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</span>
              </div>
            </div>

            {/* Current / Target */}
            <div className="grid grid-cols-2 w-full gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Current</span>
                <span className="text-2xl font-black text-[#0d121f]">{current}</span>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Target</span>
                <span className="text-2xl font-black text-gray-900">{tgt}</span>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-400 italic">
              Tracking <span className="text-gray-700">{quotaProg.metric || metric}</span> over <span className="text-gray-700">{quotaProg.period || period}</span>
            </p>
          </div>
        </div>
      ) : !loading && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Target Progress</h3>
          <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Load team data to view progress</p>
          </div>
        </div>
      )}

      {/* ── Configured Quotas List ─────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Configured Rules</h3>

        {quotaList.length === 0 && !loading ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No quotas defined for this team</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quotaList.map((q, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${periodColor(q.period)}`}>
                    {q.period}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Target</span>
                    <span className="text-2xl font-black text-gray-900">{q.target}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-tight">
                    Metric: <span className="text-gray-900 normal-case">{q.metric}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Active since {new Date(q.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
