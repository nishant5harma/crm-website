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

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatTime = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return ''
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    } catch { return '' }
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return ''
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch { return '' }
  }

  const getDuration = (start, end) => {
    if (!start) return '0h 0m'
    try {
      const s = new Date(start).getTime()
      const e = end ? new Date(end).getTime() : Date.now()
      if (isNaN(s) || isNaN(e)) return '0h 0m'
      const diff = Math.max(0, Math.floor((e - s) / 60000))
      return `${Math.floor(diff / 60)}h ${diff % 60}m`
    } catch { return '0h 0m' }
  }

  // Check-in location (root level: latitude/longitude)
  const getCheckinMapUrl = (record) => {
    const lat = record?.latitude
    const lng = record?.longitude
    if (!lat || !lng || Number(lat) === 0 || Number(lng) === 0) return null
    return `https://maps.google.com/maps?q=${lat},${lng}&z=17`
  }

  const getCheckinLocationText = (record) => {
    const lat = record?.latitude
    const lng = record?.longitude
    if (!lat || !lng || Number(lat) === 0 || Number(lng) === 0) return 'No location'
    return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)} ±${record?.accuracy || 0}m`
  }

  // Check-out location (checkoutLatitude/checkoutLongitude from backend)
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

  const getCheckoutLocationText = (record) => {
    // Check multiple possible field names from backend
    const lat = record?.checkoutLatitude ?? record?.checkout_latitude ?? record?.checkoutLat
    const lng = record?.checkoutLongitude ?? record?.checkout_longitude ?? record?.checkoutLng
    const acc = record?.checkoutAccuracy ?? record?.accuracy ?? 0
    
    // If we have specific checkout coordinates
    if (lat && lng && Number(lat) !== 0 && Number(lng) !== 0) {
      return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)} ±${acc}m`
    }
    
    // Fallback to check-in location if checked out
    if (record?.checkoutAt && record?.latitude && record?.longitude) {
      return `${Number(record.latitude).toFixed(5)}, ${Number(record.longitude).toFixed(5)} ±${record.accuracy || 0}m`
    }

    return 'Location not captured'
  }

  // ─── API ───────────────────────────────────────────────────────────────────

  const fetchAttendance = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      from.setHours(0, 0, 0, 0)
      const to = new Date()
      to.setHours(23, 59, 59, 999)

      const res = await getAttendance({
        userId: user?.id || 'me',
        from: from.toISOString(),
        to: to.toISOString(),
        limit: 50,
      })

      const records = Array.isArray(res?.rows) ? res.rows : []
      setHistory(records)

      const todayStr = new Date().toISOString().split('T')[0]
      const match = records.find((r) => r.checkinAt?.startsWith(todayStr))
      setTodayRecord(match || null)
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchAttendance()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const getLocation = async () => {
    if (!('geolocation' in navigator)) return { lat: 0, lng: 0, acc: 0 }
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
        })
      )
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }
    } catch { return { lat: 0, lng: 0, acc: 0 } }
  }

  const handleCheckIn = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const { lat, lng, acc } = await getLocation()
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
      setError(err?.response?.data?.error || 'Failed to check in')
    } finally { setActionLoading(false) }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const { lat, lng, acc } = await getLocation()
      await checkOut({
        // Check-in location fields (backend expects these too)
        latitude: lat,
        longitude: lng,
        accuracy: acc,
        locationTs: new Date().toISOString(),
        // Checkout-specific location fields
        checkoutLatitude: lat,
        checkoutLongitude: lng,
        checkoutAccuracy: acc,
        note: 'Checked out via Web'
      })
      await fetchAttendance()
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error || 'Failed to check out')
    } finally { setActionLoading(false) }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }).toUpperCase()

  const MapBtn = ({ url, label, colorClass }) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold rounded-lg transition border ${colorClass}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="3"/><path d="M12 21c-4-4-9-7.5-9-12s5-9 9-9 9 4.5 9 9-5 8-9 12z"/>
      </svg>
      {label}
    </a>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-gray-500 font-semibold text-xs tracking-wider">{todayLabel}</div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>
      )}

      {/* ── Today Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative flex flex-col">
        {loading && !todayRecord ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading today&apos;s status...</div>

        ) : !todayRecord ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M22 6l-3-3"/>
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
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#059669] rounded-t-2xl" />
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
              {/* Check-in node */}
              <div className="relative">
                <div className="absolute -left-[33px] top-1.5 w-3.5 h-3.5 bg-[#059669] rounded-full border-[2.5px] border-white z-10" />
                <h4 className="font-bold text-[#0f172a] text-[15px]">Checked in at {formatTime(todayRecord.checkinAt)}</h4>
                <div className="mt-2 text-left">
                  {getCheckinMapUrl(todayRecord) ? (
                    <>
                      <MapBtn 
                        url={getCheckinMapUrl(todayRecord)} 
                        label="Open in Google Maps" 
                        colorClass="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100" 
                      />
                      <div className="text-[11px] text-gray-400 mt-1.5 font-medium ml-1">
                        {getCheckinLocationText(todayRecord)}
                      </div>
                    </>
                  ) : (
                    <span className="shrink-0 px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg">No Location</span>
                  )}
                </div>
                <div className="text-[13px] text-gray-400 italic mt-1">&quot;{todayRecord.note || 'Checked in via Web'}&quot;</div>
              </div>

              {/* Check-out node */}
              <div className="relative">
                <div className="absolute -left-[33px] top-1.5 w-3.5 h-3.5 bg-[#0f172a] rounded-full border-[2.5px] border-white z-10" />
                <h4 className="font-bold text-[#0f172a] text-[15px]">
                  {todayRecord.checkoutAt ? `Checked out at ${formatTime(todayRecord.checkoutAt)}` : 'Not checked out yet'}
                </h4>
                <div className="text-[13px] text-gray-400 mt-1">
                  Work duration: {getDuration(todayRecord.checkinAt, todayRecord.checkoutAt)}
                </div>
                {todayRecord.checkoutAt && getCheckoutMapUrl(todayRecord) && (
                  <div className="mt-2 text-left">
                    <MapBtn 
                      url={getCheckoutMapUrl(todayRecord)} 
                      label="Open Check-out Location" 
                      colorClass="bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-200" 
                    />
                    <div className="text-[11px] text-gray-400 mt-1.5 font-medium ml-1">
                      {getCheckoutLocationText(todayRecord)}
                    </div>
                  </div>
                )}
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

      {/* ── Refresh ── */}
      <button
        onClick={fetchAttendance}
        disabled={loading}
        className="w-full bg-white border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        <span>Refresh</span>
      </button>

      {/* ── Last 30 Days ── */}
      <div className="pt-4">
        <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-4">LAST 30 DAYS</h3>
        {loading && history.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">Loading history...</p>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">No history available.</p>
        ) : (
          <div className="space-y-3">
            {history.map((record) => {
              const checkinUrl = getCheckinMapUrl(record)
              const checkoutUrl = getCheckoutMapUrl(record)
              return (
                <div key={record.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#0f172a] text-[15px]">{formatDate(record.checkinAt)}</div>
                      <div className="text-[13px] text-gray-500 mt-1">
                        {formatTime(record.checkinAt)} &rarr; {record.checkoutAt ? formatTime(record.checkoutAt) : '...'} &middot; {getDuration(record.checkinAt, record.checkoutAt)}
                      </div>
                      <div className="text-[12px] text-gray-400 mt-1 flex items-center gap-1">
                        <span>📍</span>
                        <span className="truncate">{getCheckinLocationText(record)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full uppercase ${record.status === 'ACCEPTED' ? 'bg-green-50 text-[#059669]' : 'bg-gray-100 text-gray-700'}`}>
                        {record.status || '—'}
                      </span>
                      {checkinUrl ? (
                        <MapBtn 
                          url={checkinUrl} 
                          label="Open Check-in" 
                          colorClass="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100" 
                        />
                      ) : (
                        <span className="px-2.5 py-1.5 bg-gray-100 text-gray-400 text-[11px] font-bold rounded-lg">No Map</span>
                      )}
                      {checkoutUrl && (
                        <MapBtn 
                          url={checkoutUrl} 
                          label="Open Checkout" 
                          colorClass="bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-200" 
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
