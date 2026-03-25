import { useState, useEffect } from 'react'
import { getAttendance, checkIn, checkOut } from '../../api/attendanceApi'
import { useAuth } from '../../context/AuthContext'

export default function HrMyAttendanceTab() {
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

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleString('en-US', { month: 'short' })
    const year = d.getFullYear().toString().slice(-2)
    return `${day} ${month} ${year}`
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-gray-500 font-semibold text-xs tracking-wider">
        {todayStr}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 text-[16px]">Today's status</h3>
          <button 
            onClick={fetchAttendance} disabled={loading}
            className="px-4 py-1.5 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading && !todayRecord ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading today's status...</div>
        ) : !todayRecord ? (
          <div className="text-center py-4">
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
          <div className="space-y-4">
            <div>
              <span className="bg-green-50 text-[#059669] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide inline-block mb-2">
                {todayRecord.status || 'ACCEPTED'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[15px] font-bold text-gray-900">
                Check-in: {formatDate(todayRecord.checkinAt)}, {formatTime(todayRecord.checkinAt)}
              </div>
              <div className="text-[15px] text-gray-500">
                Check-out: {todayRecord.checkoutAt ? `${formatDate(todayRecord.checkoutAt)}, ${formatTime(todayRecord.checkoutAt)}` : 'Not checked out yet'}
              </div>
              <div className="text-[15px] text-gray-400">
                Location: {(todayRecord.location?.latitude || 0).toFixed(5)}, {(todayRecord.location?.longitude || 0).toFixed(5)}
              </div>
              <div className="text-[15px] text-gray-400">
                Note: {todayRecord.note || 'Checked in via Web'}
              </div>
            </div>

            {!todayRecord.checkoutAt && (
              <div className="pt-4">
                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  className="w-full bg-[#ef4444] hover:bg-red-600 text-white font-semibold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Checking Out...' : 'Check Out Due'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
