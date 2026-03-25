import { useState, useEffect } from 'react'
import { getAttendance, checkIn, checkOut } from '../../api/attendanceApi'
import { useAuth } from '../../context/AuthContext'

export default function MyAttendanceTab() {
  const { user } = useAuth()
  const [todayRecord, setTodayRecord] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAttendance = async () => {
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      // We need last 30 days
      const pastDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const fromDate = new Date(pastDate.setHours(0, 0, 0, 0)).toISOString()
      const toDate = new Date(today.setHours(23, 59, 59, 999)).toISOString()
      
      const res = await getAttendance({
        userId: user.id || 'me',
        from: fromDate,
        to: toDate,
        limit: 50
      })

      const records = res.rows || []
      setHistory(records)

      // Find today's record specifically
      const todayDateStr = new Date().toISOString().split('T')[0]
      const todayMatch = records.find(r => r.checkinAt && r.checkinAt.startsWith(todayDateStr))
      setTodayRecord(todayMatch || null)

    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [])

  const handleCheckIn = async () => {
    setActionLoading(true)
    setError(null)
    try {
      let lat = 0
      let lng = 0
      let acc = 0
      
      // Try HTML5 Geolocation loosely
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
          })
          lat = pos.coords.latitude
          lng = pos.coords.longitude
          acc = pos.coords.accuracy
        } catch (e) {
          console.warn('Geolocation failed, relying on defaults', e)
        }
      }

      await checkIn({
        latitude: lat,
        longitude: lng,
        accuracy: acc,
        locationTs: new Date().toISOString(),
        note: 'Checked in via Web'
      })

      await fetchAttendance()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to check in')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    setError(null)
    try {
      await checkOut()
      await fetchAttendance()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to check out')
    } finally {
      setActionLoading(false)
    }
  }

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()

  const formatTime = (isoString) => {
    if (!isoString) return ''
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  }

  const getDuration = (start, end) => {
    if (!start) return '0h 0m'
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : new Date().getTime()
    const diffMins = Math.max(0, Math.floor((endTime - startTime) / 60000))
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-gray-500 font-semibold text-xs tracking-wider">
        {todayStr}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative flex flex-col">
        {loading && !todayRecord ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading today's status...</div>
        ) : !todayRecord ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2 2" />
                <path d="M5 3L2 6" />
                <path d="M22 6l-3-3" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Not checked in</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Tap below to mark your attendance for today. Your GPS location will be captured automatically.
            </p>
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? 'Checking In...' : 'Check In Now'}
            </button>
          </div>
        ) : (
          <>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#059669] rounded-t-2xl"></div>
            <div className="flex justify-between items-start mb-6 pt-2">
              <div>
                <h3 className="text-gray-500 font-medium text-sm mb-1">Today</h3>
                <div className="text-3xl font-extrabold text-[#0f172a] tracking-tight">{formatTime(todayRecord.checkinAt)}</div>
                <div className="text-gray-400 text-sm mt-0.5">Check-in</div>
              </div>
              <span className="bg-green-50 text-[#059669] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                {todayRecord.status || 'ACCEPTED'}
              </span>
            </div>

            <div className="relative pl-7 space-y-7 mt-2 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-gray-200">
              {/* Check In Node */}
              <div className="relative">
                <div className="absolute -left-[33px] top-1.5 w-3.5 h-3.5 bg-[#059669] rounded-full border-[2.5px] border-white z-10"></div>
                <h4 className="font-bold text-[#0f172a] text-[15px]">Checked in at {formatTime(todayRecord.checkinAt)}</h4>
                <div className="text-[13px] text-gray-500 mt-1.5 flex items-center gap-1">
                  <span className="text-red-500 mr-0.5">📍</span>
                  {(todayRecord.location?.latitude || 0).toFixed(5)}, {(todayRecord.location?.longitude || 0).toFixed(5)} ±{todayRecord.location?.accuracy || 0}m
                </div>
                <div className="text-[13px] text-gray-400 italic mt-1">"{todayRecord.note || 'Checked in via Web'}"</div>
              </div>

              {/* Check Out Node */}
              <div className="relative">
                <div className="absolute -left-[33px] top-1.5 w-3.5 h-3.5 bg-[#0f172a] rounded-full border-[2.5px] border-white z-10"></div>
                <h4 className="font-bold text-[#0f172a] text-[15px]">
                  {todayRecord.checkoutAt ? `Checked out at ${formatTime(todayRecord.checkoutAt)}` : 'Not checked out yet'}
                </h4>
                <div className="text-[13px] text-gray-400 mt-1 flex items-center gap-1">
                  Work duration: {getDuration(todayRecord.checkinAt, todayRecord.checkoutAt)}
                </div>
              </div>
            </div>

            <div className="mt-8">
              {todayRecord.checkoutAt ? (
                <div className="w-full bg-gray-50 text-gray-500 font-semibold text-sm py-4 rounded-xl text-center">
                  Attendance complete for today ✓
                </div>
              ) : (
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="w-full bg-[#ef4444] hover:bg-red-600 text-white font-semibold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Checking Out...' : 'Check Out Due'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <button
        onClick={fetchAttendance}
        disabled={loading}
        className="w-full bg-white border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span>Refresh</span>
      </button>

      <div className="pt-4">
        <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-4">LAST 30 DAYS</h3>
        {loading && history.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">No history available.</p>
        ) : (
          <div className="space-y-3">
            {history.map((record) => (
              <div key={record.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <div className="font-semibold text-[#0f172a] text-[15px]">
                    {new Date(record.checkinAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-1">
                    {formatTime(record.checkinAt)} &rarr; {record.checkoutAt ? formatTime(record.checkoutAt) : '...'} · {getDuration(record.checkinAt, record.checkoutAt)}
                  </div>
                  <div className="text-[12px] text-gray-400 mt-1 flex items-center gap-1">
                    <span className="text-red-400">📍</span>
                    {(record.location?.latitude || 0).toFixed(4)}, {(record.location?.longitude || 0).toFixed(4)}
                  </div>
                </div>
                <div>
                  <span className={`px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full uppercase ${
                    record.status === 'ACCEPTED' ? 'bg-green-50 text-[#059669]' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
