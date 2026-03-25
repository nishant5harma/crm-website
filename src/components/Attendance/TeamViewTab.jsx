import { useState, useEffect } from 'react'
import { getAttendance } from '../../api/attendanceApi'

export default function TeamViewTab() {
  const [teamId, setTeamId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchRecords = async (targetPage = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (teamId.trim()) params.teamId = teamId.trim()
      if (fromDate) params.from = new Date(fromDate).toISOString()
      if (toDate) params.to = new Date(toDate).toISOString()
      params.limit = 10
      params.page = targetPage

      const res = await getAttendance(params)
      setRecords(res.rows || [])
      setTotalPages(res.totalPages || Math.ceil((res.count || 0) / 10) || 1)
      setPage(targetPage)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to fetch team records')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchRecords(1)
  }

  // Load initially
  useEffect(() => {
    handleSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0]
    setFromDate(today)
    setToDate(today)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-4 uppercase">Filters</h3>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Team ID (leave blank for all)"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
          />

          <div className="flex gap-3">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl p-3 text-sm text-gray-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl p-3 text-sm text-gray-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-[3] bg-[#0f172a] hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={setToday}
              className="flex-1 bg-green-50 text-green-700 border border-green-200 font-semibold py-3 rounded-xl hover:bg-green-100 transition cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="mt-8">
        {!loading && records.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <div className="mx-auto w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No records found</h3>
            <p className="text-sm">Apply filters and tap Search to view attendance.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{r.user?.name || r.userId}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{new Date(r.checkinAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${
                    r.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-50">
                  <div>
                    <span className="text-gray-400 block text-xs mb-0.5">Check In</span>
                    <span className="font-medium text-gray-800">
                      {new Date(r.checkinAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs mb-0.5">Check Out</span>
                    <span className="font-medium text-gray-800">
                      {r.checkoutAt ? new Date(r.checkoutAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => fetchRecords(page - 1)}
                disabled={page === 1 || loading}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <div className="text-sm text-gray-500 font-medium">
                Page <span className="text-gray-900">{page}</span> of {totalPages}
              </div>
              <button
                onClick={() => fetchRecords(page + 1)}
                disabled={page === totalPages || loading}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
