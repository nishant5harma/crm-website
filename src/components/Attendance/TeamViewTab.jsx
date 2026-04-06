import { useState, useEffect } from 'react'
import { getAttendance } from '../../api/attendanceApi'
import { useAuth } from '../../context/AuthContext'

export default function TeamViewTab() {
  const { user } = useAuth()
  const [teamId, setTeamId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const formatTime = (isoString) => {
    if (!isoString) return '—'
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return '—'
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch {
      return '—'
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return '—'
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return '—'
    }
  }

  // API returns latitude/longitude at ROOT level (not nested under location)
  const getCheckinMapUrl = (record) => {
    const lat = record?.latitude
    const lng = record?.longitude
    if (!lat || !lng || Number(lat) === 0 || Number(lng) === 0) return null
    return `https://maps.google.com/maps?q=${lat},${lng}&z=17`
  }

  const getCheckoutMapUrl = (record) => {
    // 1. Try specific checkout coordinates from backend
    const lat = record?.checkoutLatitude ?? record?.checkout_latitude ?? record?.checkoutLat
    const lng = record?.checkoutLongitude ?? record?.checkout_longitude ?? record?.checkoutLng
    
    if (lat && lng && Number(lat) !== 0 && Number(lng) !== 0) {
      return `https://maps.google.com/maps?q=${lat},${lng}&z=17`
    }

    // 2. Fallback: If checked out but no specific location, use check-in location
    if (record?.checkoutAt && record?.latitude && record?.longitude) {
      return `https://maps.google.com/maps?q=${record.latitude},${record.longitude}&z=17`
    }

    return null
  }

  const getDurationText = (checkinAt, checkoutAt) => {
    if (!checkinAt || !checkoutAt) return null
    try {
      const start = new Date(checkinAt).getTime()
      const end = new Date(checkoutAt).getTime()
      if (isNaN(start) || isNaN(end)) return null
      const h = Math.floor((end - start) / 3600000)
      const m = Math.floor(((end - start) % 3600000) / 60000)
      return `${h}h ${m}m`
    } catch {
      return null
    }
  }

  const fetchRecords = async (targetPage = 1) => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (teamId.trim()) params.teamId = teamId.trim()

      if (fromDate) {
        const d = new Date(fromDate)
        if (!isNaN(d.getTime())) params.from = d.toISOString()
      }
      if (toDate) {
        const d = new Date(toDate)
        if (!isNaN(d.getTime())) params.to = d.toISOString()
      }

      params.limit = 10
      params.page = targetPage

      const res = await getAttendance(params)
      const list = Array.isArray(res?.rows) ? res.rows : []
      
      // DEBUG: Verify checkout fields in the first record
      if (list.length > 0) {
        console.log('🔍 Team View Record[0]:', {
          id: list[0].id,
          userName: list[0].user?.name,
          latitude: list[0].latitude,
          longitude: list[0].longitude,
          checkoutLatitude: list[0].checkoutLatitude,
          checkoutLongitude: list[0].checkoutLongitude
        })
      }

      setRecords(list)
      setTotalPages(res?.totalPages || Math.ceil((res?.count || 0) / 10) || 1)
      setPage(targetPage)
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error || 'Failed to fetch team records')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchRecords(1)
  }

  useEffect(() => {
    if (user) {
      fetchRecords(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-[#059669] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : records.length === 0 ? (
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
            {records.map((r) => {
              const checkinUrl = getCheckinMapUrl(r)
              const checkoutUrl = getCheckoutMapUrl(r)
              const duration = getDurationText(r.checkinAt, r.checkoutAt)
              return (
                <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-gray-900 text-base">{r.user?.name || 'User'}</div>
                      <div className="text-[12px] text-gray-400 mt-0.5 line-clamp-1">
                        {r.user?.email || 'no-email@example.com'} &bull; ID: {r.user?.id || r.userId || '—'}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-[11px] font-bold tracking-wide rounded-full uppercase ${
                      r.status === 'ACCEPTED' ? 'bg-green-50 text-[#059669]' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {r.status || 'ACCEPTED'}
                    </span>
                  </div>

                  <div className="flex items-center gap-8 py-3 border-t border-gray-50">
                    <div>
                      <span className="text-gray-400 block text-[11px] font-bold uppercase tracking-wider mb-1">IN</span>
                      <div className="text-lg font-bold text-[#059669]">
                        {formatTime(r.checkinAt)}
                      </div>
                      <div className="text-[11px] text-gray-400 font-medium">
                        {formatDate(r.checkinAt)}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400 block text-[11px] font-bold uppercase tracking-wider mb-1">OUT</span>
                      <div className="text-lg font-bold text-gray-800">
                        {formatTime(r.checkoutAt)}
                      </div>
                      {duration && (
                        <div className="text-[11px] text-gray-400 font-medium">{duration}</div>
                      )}
                    </div>

                    <div className="ml-auto border-l border-gray-50 pl-6 text-right">
                      <span className="text-gray-400 block text-[11px] font-bold uppercase tracking-wider mb-2">CHECK-IN MAP</span>
                      {checkinUrl ? (
                        <a
                          href={checkinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="10" r="3" />
                            <path d="M12 21c-4-4-9-7.5-9-12s5-9 9-9 9 4.5 9 9-5 8-9 12z" />
                          </svg>
                          Open Check-in
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No data</span>
                      )}
                    </div>

                    <div className="border-l border-gray-50 pl-6 text-right">
                      <span className="text-gray-400 block text-[11px] font-bold uppercase tracking-wider mb-2">CHECK-OUT MAP</span>
                      {checkoutUrl ? (
                        <a
                          href={checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-bold rounded-lg border border-purple-100 hover:bg-purple-200 transition"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="10" r="3" />
                            <path d="M12 21c-4-4-9-7.5-9-12s5-9 9-9 9 4.5 9 9-5 8-9 12z" />
                          </svg>
                          Open Checkout
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No data</span>
                      )}
                    </div>

                  </div>
                </div>
              )
            })}
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
