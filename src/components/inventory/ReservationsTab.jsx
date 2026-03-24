import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'

const RES_STATUSES = ['ACTIVE', 'EXPIRED', 'CONFIRMED', 'CANCELLED']
const STATUS_STYLE = {
  ACTIVE: 'bg-green-50 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-red-50 text-red-600',
}

const INIT_FORM = { linkType: 'unit', unitId: '', listingId: '', userId: '', note: '', expiresAt: '' }

function fmt(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeLeft(expiresAt) {
  if (!expiresAt) return null
  const diff = new Date(expiresAt) - new Date()
  if (diff <= 0) return 'Expired'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m left`
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`
}

export default function ReservationsTab() {
  const [reservations, setReservations] = useState([])
  const [units, setUnits] = useState([])
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(INIT_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState({ open: false, item: null })
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchReservations = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterUserId) params.userId = filterUserId
      const { data } = await api.get('/inventory/reservations', { params })
      setReservations(data?.items ?? [])
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load reservations.')
    } finally { setLoading(false) }
  }, [filterStatus, filterUserId])

  const fetchSupportData = useCallback(async () => {
    try {
      const [unitsRes, listingsRes, usersRes] = await Promise.all([
        api.get('/inventory/units', { params: { status: 'AVAILABLE', limit: 100 } }),
        api.get('/inventory/listings', { params: { status: 'AVAILABLE', limit: 100 } }),
        api.get('/users'),
      ])
      setUnits(unitsRes.data?.items ?? [])
      setListings(listingsRes.data?.items ?? [])
      const ud = usersRes.data
      setUsers(Array.isArray(ud) ? ud : (ud?.users ?? []))
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchReservations() }, [fetchReservations])
  useEffect(() => { fetchSupportData() }, [fetchSupportData])

  const openModal = () => { setForm(INIT_FORM); setFormError(''); setModal(true) }
  const fc = (e) => { setFormError(''); setForm(p => ({ ...p, [e.target.name]: e.target.value })) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.linkType === 'unit' && !form.unitId) { setFormError('Please select a unit.'); return }
    if (form.linkType === 'listing' && !form.listingId) { setFormError('Please select a listing.'); return }
    setFormLoading(true); setFormError('')
    try {
      const payload = {
        unitId: form.linkType === 'unit' ? form.unitId : null,
        listingId: form.linkType === 'listing' ? form.listingId : null,
        userId: form.userId || undefined,
        note: form.note.trim() || undefined,
        expiresAt: form.expiresAt || undefined,
      }
      const { data } = await api.post('/inventory/reservations', payload)
      setReservations(p => [data.data, ...p])
      setModal(false)
    } catch (err) {
      const d = err.response?.data
      setFormError(d?.message || d?.error || 'Failed to create reservation.')
    } finally { setFormLoading(false) }
  }

  const handleCancel = async () => {
    setCancelLoading(true)
    try {
      const { data } = await api.post(`/inventory/reservations/${cancelConfirm.item.id}/cancel`)
      setReservations(p => p.map(x => x.id === cancelConfirm.item.id ? data.data : x))
      setCancelConfirm({ open: false, item: null })
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to cancel reservation.')
    } finally { setCancelLoading(false) }
  }

  const unitLabel = (id) => {
    const u = units.find(x => x.id === id)
    return u ? `Unit ${u.unitNumber || id}` : (id ? id.slice(0, 10) + '…' : '—')
  }
  const listingLabel = (id) => {
    const l = listings.find(x => x.id === id)
    return l ? l.title : (id ? id.slice(0, 12) + '…' : '—')
  }
  const userLabel = (id) => {
    const u = users.find(x => x.id === id)
    return u ? u.name : (id ? id.slice(0, 10) + '…' : '—')
  }

  const stats = {
    active: reservations.filter(r => r.status === 'ACTIVE').length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    expired: reservations.filter(r => r.status === 'EXPIRED').length,
    cancelled: reservations.filter(r => r.status === 'CANCELLED').length,
  }

  return (
    <div className="px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Reservations</h2>
          <p className="text-xs text-gray-500 mt-0.5">{reservations.length} reservation{reservations.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openModal} className="flex items-center gap-1.5 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition cursor-pointer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Reservation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Active', value: stats.active, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Confirmed', value: stats.confirmed, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Expired', value: stats.expired, color: 'text-gray-500', bg: 'bg-gray-50' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 border border-gray-100`}>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-400 transition cursor-pointer">
          <option value="">All Statuses</option>
          {RES_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)}
          className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-indigo-400 transition cursor-pointer">
          <option value="">All Users</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {(filterStatus || filterUserId) && (
          <button onClick={() => { setFilterStatus(''); setFilterUserId('') }} className="h-9 px-3 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 bg-white rounded-lg transition cursor-pointer">
            Clear
          </button>
        )}
        <button onClick={fetchReservations} className="h-9 px-3 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 bg-indigo-50 rounded-lg transition cursor-pointer flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <span className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm">Loading reservations...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button onClick={fetchReservations} className="text-sm text-indigo-600 hover:underline cursor-pointer">Retry</button>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="mx-auto mb-3 text-gray-300" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No reservations found</p>
            <button onClick={openModal} className="mt-1.5 text-sm text-indigo-600 hover:underline cursor-pointer">Create a reservation</button>
          </div>
        ) : (
          <>
            <div className="hidden xl:grid grid-cols-[1.5fr_1.5fr_1fr_1fr_100px_120px_80px] gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100">
              {['Unit / Listing', 'Note', 'Assigned To', 'Reserved At', 'Expires', 'Status', ''].map(h => (
                <span key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {reservations.map(r => {
                const tl = r.status === 'ACTIVE' ? timeLeft(r.expiresAt) : null
                return (
                  <div key={r.id} className="grid xl:grid-cols-[1.5fr_1.5fr_1fr_1fr_100px_120px_80px] gap-3 px-6 py-3.5 items-center hover:bg-gray-50/60 transition">
                    <div className="min-w-0">
                      {r.unitId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">Unit</span>
                          <span className="text-sm font-medium text-gray-800 truncate">{unitLabel(r.unitId)}</span>
                        </div>
                      ) : r.listingId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-600">Listing</span>
                          <span className="text-sm font-medium text-gray-800 truncate">{listingLabel(r.listingId)}</span>
                        </div>
                      ) : <span className="text-sm text-gray-400">—</span>}
                    </div>
                    <p className="hidden xl:block text-sm text-gray-500 truncate">{r.note || <span className="text-gray-300">—</span>}</p>
                    <p className="hidden xl:block text-sm text-gray-600 truncate">{r.userId ? userLabel(r.userId) : <span className="text-gray-300">—</span>}</p>
                    <p className="hidden xl:block text-xs text-gray-500">{fmt(r.reservedAt)}</p>
                    <div className="hidden xl:block">
                      <p className="text-xs text-gray-500">{fmt(r.expiresAt)}</p>
                      {tl && <p className={`text-xs font-medium mt-0.5 ${tl === 'Expired' ? 'text-red-500' : 'text-amber-600'}`}>{tl}</p>}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-500'}`}>
                      {r.status}
                    </span>
                    <div className="flex gap-1">
                      {r.status === 'ACTIVE' && (
                        <button onClick={() => setCancelConfirm({ open: true, item: r })} title="Cancel reservation" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">{reservations.length} reservation{reservations.length !== 1 ? 's' : ''}</p>
            </div>
          </>
        )}
      </div>

      {/* Create Reservation Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">New Reservation</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Hold a unit or listing · Default TTL: 15 min</p>
                </div>
              </div>
              <button onClick={() => setModal(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition cursor-pointer">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{formError}</div>}

              {/* Unit or Listing toggle */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Reserve a <span className="text-red-400">*</span></label>
                <div className="flex rounded-xl border border-gray-200 p-1 gap-1">
                  {['unit', 'listing'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(p => ({ ...p, linkType: t, unitId: '', listingId: '' }))}
                      className={`flex-1 h-8 text-sm font-medium rounded-lg transition cursor-pointer capitalize ${form.linkType === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {form.linkType === 'unit' ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Unit <span className="text-red-400">*</span></label>
                  <select name="unitId" value={form.unitId} onChange={fc}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition cursor-pointer">
                    <option value="">Select an available unit</option>
                    {units.map(u => <option key={u.id} value={u.id}>Unit {u.unitNumber || u.id} — {u.status}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Listing <span className="text-red-400">*</span></label>
                  <select name="listingId" value={form.listingId} onChange={fc}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition cursor-pointer">
                    <option value="">Select an available listing</option>
                    {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Assign To (optional)</label>
                <select name="userId" value={form.userId} onChange={fc}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition cursor-pointer">
                  <option value="">— No assignment —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Expires At (optional)</label>
                <input type="datetime-local" name="expiresAt" value={form.expiresAt} onChange={fc}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition" />
                <p className="text-xs text-gray-400">Leave blank for default 15-minute TTL</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                <input type="text" name="note" value={form.note} onChange={fc} placeholder="e.g. Hold for client walkthrough"
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm placeholder-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} disabled={formLoading} className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition cursor-pointer disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
                  {formLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : 'Create Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirm */}
      {cancelConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCancelConfirm({ open: false, item: null })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Cancel Reservation</h3>
                <p className="text-xs text-gray-500">Unit/listing will be freed</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Cancel this reservation? The linked unit or listing will be restored to <span className="font-medium">AVAILABLE</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelConfirm({ open: false, item: null })} disabled={cancelLoading} className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition cursor-pointer disabled:opacity-60">Keep</button>
              <button onClick={handleCancel} disabled={cancelLoading} className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
                {cancelLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Cancelling...</> : 'Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
