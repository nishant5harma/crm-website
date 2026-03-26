import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'

/* ─── constants ─── */
const UNIT_STATUSES = ['AVAILABLE', 'BLOCKED', 'BOOKED', 'SOLD']
const LISTING_TYPES = ['SALE', 'RENT', 'BOTH']
const LISTING_STATUSES = ['AVAILABLE', 'UNDER_OFFER', 'CLOSED']

const UNIT_STATUS_STYLE = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  BLOCKED:   'bg-amber-50 text-amber-700 border border-amber-200',
  BOOKED:    'bg-blue-50 text-blue-700 border border-blue-200',
  SOLD:      'bg-gray-100 text-gray-500 border border-gray-200',
}
const LISTING_STATUS_STYLE = {
  AVAILABLE:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  UNDER_OFFER: 'bg-violet-50 text-violet-700 border border-violet-200',
  CLOSED:      'bg-gray-100 text-gray-500 border border-gray-200',
}
const LISTING_TYPE_STYLE = {
  SALE: 'bg-blue-50 text-blue-700 border border-blue-200',
  RENT: 'bg-orange-50 text-orange-700 border border-orange-200',
  BOTH: 'bg-teal-50 text-teal-700 border border-teal-200',
}

/* ─── small reusable pieces ─── */
function Badge({ label, style }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}

function SmField({ label, name, value, onChange, placeholder, required, type = 'text' }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label} {required && <span className="text-red-400 normal-case">*</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition" />
    </div>
  )
}

function SectionSelect({ label, name, value, onChange, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition cursor-pointer">
        {children}
      </select>
    </div>
  )
}

function Modal({ open, onClose, title, accent = 'indigo', children }) {
  if (!open) return null
  const colors = {
    indigo: 'from-indigo-500 to-violet-600',
    green:  'from-emerald-500 to-teal-600',
    orange: 'from-orange-500 to-amber-600',
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className={`sticky top-0 bg-gradient-to-r ${colors[accent]} flex items-center justify-between px-5 py-4 z-10 rounded-t-2xl`}>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function DeleteConfirm({ open, onClose, label, onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-900 text-base">Delete Confirmation</h3>
          <p className="text-xs text-gray-500 mt-1">This action is permanent and cannot be undone</p>
        </div>
        <p className="text-sm text-gray-600 text-center mb-5">
          Are you sure you want to delete <span className="font-semibold text-gray-900">"{label}"</span>?
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer">Keep it</button>
          <button onClick={onConfirm} className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition cursor-pointer">Yes, Delete</button>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon, title, count, accentColor, filterSlot, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentColor}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{count} record{count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {filterSlot}
        <button onClick={onAdd}
          className="flex items-center gap-1.5 h-8 px-4 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {addLabel}
        </button>
      </div>
    </div>
  )
}

function FilterSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      className="h-8 px-2.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-600 outline-none focus:border-indigo-400 transition cursor-pointer shadow-sm">
      {children}
    </select>
  )
}

function Spinner({ color = 'indigo' }) {
  return (
    <div className="flex items-center justify-center py-10 gap-3 text-gray-400">
      <span className={`w-5 h-5 border-2 border-gray-100 border-t-${color}-500 rounded-full animate-spin`} />
      <span className="text-xs text-gray-400">Loading...</span>
    </div>
  )
}

function EmptyState({ message, cta, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-xs text-gray-500 font-medium">{message}</p>
      {cta && <button onClick={onCta} className="mt-1.5 text-xs text-indigo-600 hover:underline cursor-pointer">{cta}</button>}
    </div>
  )
}

function ActionBtn({ onClick, title, variant }) {
  const styles = {
    edit:   'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50',
    sell:   'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50',
    close:  'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50',
    delete: 'text-gray-400 hover:text-red-500 hover:bg-red-50',
  }
  const icons = {
    edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    sell: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="16 8 12 12 8 16" /><line x1="16" y1="16" x2="8" y2="16" /></svg>,
    close: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="20 6 9 17 4 12" /></svg>,
    delete: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  }
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-lg transition cursor-pointer ${styles[variant]}`}>
      {icons[variant]}
    </button>
  )
}

/* ═══════════════════════════════════════
   TOWERS SECTION
═══════════════════════════════════════ */
function TowersSection({ projectId }) {
  const [towers, setTowers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [del, setDel] = useState({ open: false, item: null })
  const [form, setForm] = useState({ name: '', floors: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/inventory/towers', { params: { projectId } })
      setTowers(data?.items ?? [])
    } catch { setTowers([]) } finally { setLoading(false) }
  }, [projectId])

  useEffect(() => { fetch() }, [fetch])

  const fc = (e) => { setFormError(''); setForm(p => ({ ...p, [e.target.name]: e.target.value })) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('')
    try {
      const payload = { projectId, name: form.name.trim() || undefined, floors: form.floors !== '' ? Number(form.floors) : undefined }
      if (modal.mode === 'create') {
        const { data } = await api.post('/inventory/towers', payload)
        setTowers(p => [...p, data.data])
      } else {
        const { data } = await api.put(`/inventory/towers/${modal.item.id}`, payload)
        setTowers(p => p.map(x => x.id === modal.item.id ? data.data : x))
      }
      setModal({ open: false, mode: 'create', item: null })
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to save.')
    } finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/inventory/towers/${del.item.id}`)
      setTowers(p => p.filter(x => x.id !== del.item.id))
      setDel({ open: false, item: null })
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete.') }
  }

  const openCreate = () => { setForm({ name: '', floors: '' }); setFormError(''); setModal({ open: true, mode: 'create', item: null }) }
  const openEdit = (t) => { setForm({ name: t.name || '', floors: t.floors?.toString() || '' }); setFormError(''); setModal({ open: true, mode: 'edit', item: t }) }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" /></svg>}
          title="Towers" count={towers.length}
          accentColor="bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
          onAdd={openCreate} addLabel="Add Tower"
        />
      </div>

      <div className="px-6 pb-5 pt-4">
        {loading ? <Spinner color="indigo" /> : towers.length === 0 ? (
          <EmptyState message="No towers added yet" cta="Add the first tower" onCta={openCreate} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {towers.map(t => (
              <div key={t.id} className="group relative bg-gradient-to-b from-indigo-50/50 to-white border border-indigo-100 rounded-2xl p-4 hover:shadow-md hover:border-indigo-200 transition-all">
                {/* Floor bar indicator */}
                {t.floors && (
                  <div className="w-full bg-indigo-100 rounded-full h-1 mb-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1 rounded-full" style={{ width: `${Math.min(100, (t.floors / 50) * 100)}%` }} />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{t.name || <span className="text-gray-400 italic font-normal">Unnamed</span>}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                        <line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      <span className="text-xs text-indigo-600 font-medium">{t.floors != null ? `${t.floors} floors` : 'No floor info'}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <ActionBtn onClick={() => openEdit(t)} title="Edit" variant="edit" />
                    <ActionBtn onClick={() => setDel({ open: true, item: t })} title="Delete" variant="delete" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'create', item: null })}
        title={modal.mode === 'create' ? '🏢 Add Tower' : '✏️ Edit Tower'} accent="indigo">
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs">{formError}</div>}
          <SmField label="Tower Name" name="name" value={form.name} onChange={fc} placeholder="e.g. Tower A" />
          <SmField label="Number of Floors" name="floors" value={form.floors} onChange={fc} placeholder="e.g. 20" type="number" />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', item: null })} disabled={formLoading}
              className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={formLoading}
              className="flex-1 h-10 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-60 cursor-pointer">
              {formLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (modal.mode === 'create' ? 'Add Tower' : 'Save Changes')}
            </button>
          </div>
        </form>
      </Modal>
      <DeleteConfirm open={del.open} onClose={() => setDel({ open: false, item: null })} label={del.item?.name || 'this tower'} onConfirm={handleDelete} />
    </section>
  )
}

/* ═══════════════════════════════════════
   UNITS SECTION
═══════════════════════════════════════ */
function UnitsSection({ projectId }) {
  const [units, setUnits] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 })
  const [towers, setTowers] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTower, setFilterTower] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [del, setDel] = useState({ open: false, item: null })
  const [sellModal, setSellModal] = useState({ open: false, item: null })
  const [form, setForm] = useState({ towerId: '', floor: '', unitNumber: '', sizeSqFt: '', bedrooms: '', bathrooms: '', facing: '', price: '', status: 'AVAILABLE' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [sellForm, setSellForm] = useState({ price: '', note: '' })
  const [sellLoading, setSellLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchTowers = useCallback(async () => {
    try { const { data } = await api.get('/inventory/towers', { params: { projectId } }); setTowers(data?.items ?? []) }
    catch { setTowers([]) }
  }, [projectId])

  const fetchUnits = useCallback(async () => {
    setLoading(true)
    try {
      const params = { projectId, page, limit: 10 }
      if (filterStatus) params.status = filterStatus
      if (filterTower) params.towerId = filterTower
      const { data } = await api.get('/inventory/units', { params })
      setUnits(data?.items ?? [])
      setMeta(data?.meta ?? { page: 1, limit: 10, total: 0 })
    } catch { setUnits([]) } finally { setLoading(false) }
  }, [projectId, page, filterStatus, filterTower])

  useEffect(() => { fetchTowers() }, [fetchTowers])
  useEffect(() => { fetchUnits() }, [fetchUnits])

  const fc = (e) => { setFormError(''); setForm(p => ({ ...p, [e.target.name]: e.target.value })) }

  const openCreate = () => { setForm({ towerId: '', floor: '', unitNumber: '', sizeSqFt: '', bedrooms: '', bathrooms: '', facing: '', price: '', status: 'AVAILABLE' }); setFormError(''); setModal({ open: true, mode: 'create', item: null }) }
  const openEdit = (u) => {
    setForm({ towerId: u.towerId || '', floor: u.floor?.toString() || '', unitNumber: u.unitNumber || '', sizeSqFt: u.sizeSqFt?.toString() || '', bedrooms: u.bedrooms?.toString() || '', bathrooms: u.bathrooms?.toString() || '', facing: u.facing || '', price: u.price?.toString() || '', status: u.status || 'AVAILABLE' })
    setFormError(''); setModal({ open: true, mode: 'edit', item: u })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('')
    try {
      const n = v => v !== '' ? Number(v) : undefined
      const s = v => v?.trim() || undefined
      const payload = { projectId, towerId: s(form.towerId), floor: n(form.floor), unitNumber: s(form.unitNumber), sizeSqFt: n(form.sizeSqFt), bedrooms: n(form.bedrooms), bathrooms: n(form.bathrooms), facing: s(form.facing), price: n(form.price), status: form.status || undefined }
      if (modal.mode === 'create') {
        const { data } = await api.post('/inventory/units', payload)
        setUnits(p => [data.data, ...p]); setMeta(m => ({ ...m, total: m.total + 1 }))
      } else {
        const { data } = await api.put(`/inventory/units/${modal.item.id}`, payload)
        setUnits(p => p.map(x => x.id === modal.item.id ? data.data : x))
      }
      setModal({ open: false, mode: 'create', item: null })
    } catch (err) { setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to save unit.') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/inventory/units/${del.item.id}`)
      setUnits(p => p.filter(x => x.id !== del.item.id)); setMeta(m => ({ ...m, total: m.total - 1 }))
      setDel({ open: false, item: null })
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete.') }
  }

  const handleSell = async (e) => {
    e.preventDefault(); setSellLoading(true)
    try {
      const payload = {}
      if (sellForm.price) payload.price = Number(sellForm.price)
      if (sellForm.note.trim()) payload.note = sellForm.note.trim()
      const { data } = await api.post(`/inventory/units/${sellModal.item.id}/sell`, payload)
      setUnits(p => p.map(x => x.id === sellModal.item.id ? data.data : x))
      setSellModal({ open: false, item: null })
    } catch (err) { alert(err.response?.data?.error || 'Failed to sell unit.') }
    finally { setSellLoading(false) }
  }

  const towerName = id => towers.find(t => t.id === id)?.name || (id ? 'Tower' : '—')
  const totalPages = Math.ceil(meta.total / meta.limit) || 1
  const fmt = v => v ? `₹${(Number(v) / 100000).toFixed(1)}L` : '—'

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>}
          title="Units" count={meta.total}
          accentColor="bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
          filterSlot={
            <>
              <FilterSelect value={filterTower} onChange={e => { setFilterTower(e.target.value); setPage(1) }}>
                <option value="">All Towers</option>
                {towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </FilterSelect>
              <FilterSelect value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
                <option value="">All Statuses</option>
                {UNIT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </FilterSelect>
            </>
          }
          onAdd={openCreate} addLabel="Add Unit"
        />
      </div>

      <div className="overflow-hidden">
        {loading ? <Spinner color="emerald" /> : units.length === 0 ? (
          <EmptyState message="No units found" cta="Add the first unit" onCta={openCreate} />
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[56px_100px_64px_80px_64px_64px_90px_110px_88px] text-xs font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100 px-6 py-2.5">
              {['Unit', 'Tower', 'Floor', 'Size sqft', 'BHK', 'Bath', 'Facing', 'Status', 'Price'].map(h => <span key={h}>{h}</span>)}
            </div>
            <div className="divide-y divide-gray-50/80">
              {units.map(u => (
                <div key={u.id} className="group grid lg:grid-cols-[56px_100px_64px_80px_64px_64px_90px_110px_88px] gap-0 px-6 py-3.5 items-center hover:bg-indigo-50/20 transition-colors">
                  <p className="text-sm font-bold text-gray-900">{u.unitNumber || <span className="text-gray-300">—</span>}</p>
                  <p className="hidden lg:block text-xs text-gray-500 truncate">{towerName(u.towerId)}</p>
                  <p className="hidden lg:block text-xs text-gray-500">{u.floor ?? '—'}</p>
                  <p className="hidden lg:block text-xs text-gray-600">{u.sizeSqFt ? Number(u.sizeSqFt).toLocaleString() : '—'}</p>
                  <p className="hidden lg:block text-xs text-gray-600">{u.bedrooms ?? '—'}</p>
                  <p className="hidden lg:block text-xs text-gray-600">{u.bathrooms ?? '—'}</p>
                  <p className="hidden lg:block text-xs text-gray-500">{u.facing || '—'}</p>
                  <div className="hidden lg:block">
                    <Badge label={u.status} style={UNIT_STATUS_STYLE[u.status] || 'bg-gray-100 text-gray-500'} />
                  </div>
                  <div className="flex items-center justify-between lg:justify-start lg:gap-1">
                    <span className="text-xs font-bold text-gray-700 lg:hidden">{fmt(u.price)}</span>
                    <span className="hidden lg:block text-xs font-bold text-emerald-700">{fmt(u.price)}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                      {u.status !== 'SOLD' && <ActionBtn onClick={() => openEdit(u)} title="Edit" variant="edit" />}
                      {u.status === 'AVAILABLE' && <ActionBtn onClick={() => { setSellForm({ price: u.price?.toString() || '', note: '' }); setSellModal({ open: true, item: u }) }} title="Mark Sold" variant="sell" />}
                      {u.status !== 'SOLD' && <ActionBtn onClick={() => setDel({ open: true, item: u })} title="Delete" variant="delete" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-400">Page <span className="font-semibold text-gray-600">{page}</span> of {totalPages} · {meta.total} units</p>
                <div className="flex gap-1.5">
                  {[
                    { dir: -1, icon: <polyline points="15 18 9 12 15 6" /> },
                    { dir: 1, icon: <polyline points="9 18 15 12 9 6" /> },
                  ].map(({ dir, icon }) => (
                    <button key={dir} onClick={() => setPage(p => p + dir)} disabled={dir === -1 ? page <= 1 : page >= totalPages}
                      className="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'create', item: null })}
        title={modal.mode === 'create' ? '➕ Add Unit' : '✏️ Edit Unit'} accent="green">
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs">{formError}</div>}
          <SectionSelect label="Tower" name="towerId" value={form.towerId} onChange={fc}>
            <option value="">No tower</option>
            {towers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </SectionSelect>
          <div className="grid grid-cols-2 gap-3">
            <SmField label="Unit Number" name="unitNumber" value={form.unitNumber} onChange={fc} placeholder="e.g. 501" />
            <SmField label="Floor" name="floor" value={form.floor} onChange={fc} placeholder="e.g. 5" type="number" />
            <SmField label="Size (sqft)" name="sizeSqFt" value={form.sizeSqFt} onChange={fc} placeholder="1200" type="number" />
            <SmField label="Price (₹)" name="price" value={form.price} onChange={fc} placeholder="8500000" type="number" />
            <SmField label="Bedrooms" name="bedrooms" value={form.bedrooms} onChange={fc} placeholder="3" type="number" />
            <SmField label="Bathrooms" name="bathrooms" value={form.bathrooms} onChange={fc} placeholder="2" type="number" />
            <SmField label="Facing" name="facing" value={form.facing} onChange={fc} placeholder="e.g. North" />
            <SectionSelect label="Status" name="status" value={form.status} onChange={fc}>
              {UNIT_STATUSES.filter(s => s !== 'SOLD').map(s => <option key={s} value={s}>{s}</option>)}
            </SectionSelect>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', item: null })} disabled={formLoading}
              className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={formLoading}
              className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
              {formLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (modal.mode === 'create' ? 'Add Unit' : 'Save Changes')}
            </button>
          </div>
        </form>
      </Modal>

      {sellModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSellModal({ open: false, item: null })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4">
              <h3 className="text-sm font-bold text-white">Mark Unit as Sold</h3>
              <p className="text-xs text-emerald-100 mt-0.5">Unit {sellModal.item?.unitNumber} · Irreversible action</p>
            </div>
            <div className="p-5">
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-2 text-xs mb-4">
                This will cancel all active reservations on this unit.
              </div>
              <form onSubmit={handleSell} className="space-y-3">
                <SmField label="Final Sale Price (₹)" name="price" value={sellForm.price} onChange={e => setSellForm(p => ({ ...p, price: e.target.value }))} placeholder="e.g. 9000000" type="number" />
                <SmField label="Note" name="note" value={sellForm.note} onChange={e => setSellForm(p => ({ ...p, note: e.target.value }))} placeholder="e.g. Sold to Mr. X" />
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setSellModal({ open: false, item: null })} disabled={sellLoading}
                    className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer">Cancel</button>
                  <button type="submit" disabled={sellLoading}
                    className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
                    {sellLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Sale'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <DeleteConfirm open={del.open} onClose={() => setDel({ open: false, item: null })} label={`Unit ${del.item?.unitNumber || ''}`} onConfirm={handleDelete} />
    </section>
  )
}

/* ═══════════════════════════════════════
   LISTINGS SECTION
═══════════════════════════════════════ */
function ListingsSection({ projectId }) {
  const [listings, setListings] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 })
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [del, setDel] = useState({ open: false, item: null })
  const [closeModal, setCloseModal] = useState({ open: false, item: null })
  const [form, setForm] = useState({ title: '', type: 'SALE', ownerName: '', ownerPhone: '', ownerEmail: '', city: '', locality: '', price: '', bedrooms: '', bathrooms: '', sqft: '', status: 'AVAILABLE' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [closeNote, setCloseNote] = useState('')
  const [closeLoading, setCloseLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = { projectId, page, limit: 10 }
      if (filterStatus) params.status = filterStatus
      if (filterType) params.type = filterType
      const { data } = await api.get('/inventory/listings', { params })
      setListings(data?.items ?? [])
      setMeta(data?.meta ?? { page: 1, limit: 10, total: 0 })
    } catch { setListings([]) } finally { setLoading(false) }
  }, [projectId, page, filterStatus, filterType])

  useEffect(() => { fetchListings() }, [fetchListings])

  const fc = (e) => { setFormError(''); setForm(p => ({ ...p, [e.target.name]: e.target.value })) }

  const openCreate = () => {
    setForm({ title: '', type: 'SALE', ownerName: '', ownerPhone: '', ownerEmail: '', city: '', locality: '', price: '', bedrooms: '', bathrooms: '', sqft: '', status: 'AVAILABLE' })
    setFormError(''); setModal({ open: true, mode: 'create', item: null })
  }
  const openEdit = (l) => {
    setForm({ title: l.title || '', type: l.type || 'SALE', ownerName: l.ownerName || '', ownerPhone: l.ownerPhone || '', ownerEmail: l.ownerEmail || '', city: l.city || '', locality: l.locality || '', price: l.price?.toString() || '', bedrooms: l.bedrooms?.toString() || '', bathrooms: l.bathrooms?.toString() || '', sqft: l.sqft?.toString() || '', status: l.status || 'AVAILABLE' })
    setFormError(''); setModal({ open: true, mode: 'edit', item: l })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('Title is required.'); return }
    setFormLoading(true); setFormError('')
    try {
      const n = v => v !== '' ? Number(v) : undefined
      const s = v => v?.trim() || undefined
      const payload = { projectId, title: form.title.trim(), type: form.type, ownerName: s(form.ownerName), ownerPhone: s(form.ownerPhone), ownerEmail: s(form.ownerEmail), city: s(form.city), locality: s(form.locality), price: n(form.price), bedrooms: n(form.bedrooms), bathrooms: n(form.bathrooms), sqft: n(form.sqft), status: form.status || undefined }
      if (modal.mode === 'create') {
        const { data } = await api.post('/inventory/listings', payload)
        setListings(p => [data.data, ...p]); setMeta(m => ({ ...m, total: m.total + 1 }))
      } else {
        const { data } = await api.put(`/inventory/listings/${modal.item.id}`, payload)
        setListings(p => p.map(x => x.id === modal.item.id ? data.data : x))
      }
      setModal({ open: false, mode: 'create', item: null })
    } catch (err) { setFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to save listing.') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/inventory/listings/${del.item.id}`)
      setListings(p => p.filter(x => x.id !== del.item.id)); setMeta(m => ({ ...m, total: m.total - 1 }))
      setDel({ open: false, item: null })
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete.') }
  }

  const handleClose = async () => {
    setCloseLoading(true)
    try {
      const { data } = await api.post(`/inventory/listings/${closeModal.item.id}/close`, closeNote.trim() ? { note: closeNote.trim() } : {})
      setListings(p => p.map(x => x.id === closeModal.item.id ? data.data : x))
      setCloseModal({ open: false, item: null }); setCloseNote('')
    } catch (err) { alert(err.response?.data?.error || 'Failed to close listing.') }
    finally { setCloseLoading(false) }
  }

  const totalPages = Math.ceil(meta.total / meta.limit) || 1
  const fmtPrice = v => v ? `₹${(Number(v) / 100000).toFixed(1)}L` : '—'

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>}
          title="Listings" count={meta.total}
          accentColor="bg-gradient-to-br from-orange-500 to-rose-500 text-white"
          filterSlot={
            <>
              <FilterSelect value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}>
                <option value="">All Types</option>
                {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </FilterSelect>
              <FilterSelect value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
                <option value="">All Statuses</option>
                {LISTING_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </FilterSelect>
            </>
          }
          onAdd={openCreate} addLabel="Add Listing"
        />
      </div>

      <div className="overflow-hidden">
        {loading ? <Spinner color="orange" /> : listings.length === 0 ? (
          <EmptyState message="No listings yet" cta="Create the first listing" onCta={openCreate} />
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[2fr_70px_1.5fr_64px_80px_110px_96px] text-xs font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100 px-6 py-2.5">
              {['Title', 'Type', 'Owner', 'BHK', 'Price', 'Status', ''].map(h => <span key={h}>{h}</span>)}
            </div>
            <div className="divide-y divide-gray-50/80">
              {listings.map(l => (
                <div key={l.id} className="group grid lg:grid-cols-[2fr_70px_1.5fr_64px_80px_110px_96px] px-6 py-3.5 items-center hover:bg-orange-50/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{[l.locality, l.city].filter(Boolean).join(', ') || '—'}</p>
                  </div>
                  <div className="hidden lg:block">
                    <Badge label={l.type} style={LISTING_TYPE_STYLE[l.type] || 'bg-gray-100 text-gray-500'} />
                  </div>
                  <p className="hidden lg:block text-xs text-gray-500 truncate">{l.ownerName || <span className="text-gray-300">—</span>}</p>
                  <p className="hidden lg:block text-xs text-gray-600">{l.bedrooms ? `${l.bedrooms}/${l.bathrooms || 0}` : '—'}</p>
                  <p className="hidden lg:block text-xs font-bold text-orange-600">{fmtPrice(l.price)}</p>
                  <div className="hidden lg:block">
                    <Badge label={l.status?.replace('_', ' ')} style={LISTING_STATUS_STYLE[l.status] || 'bg-gray-100 text-gray-500'} />
                  </div>
                  <div className="flex gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    {l.status !== 'CLOSED' && (
                      <>
                        <ActionBtn onClick={() => openEdit(l)} title="Edit" variant="edit" />
                        <ActionBtn onClick={() => { setCloseNote(''); setCloseModal({ open: true, item: l }) }} title="Close listing" variant="close" />
                        <ActionBtn onClick={() => setDel({ open: true, item: l })} title="Delete" variant="delete" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-400">Page <span className="font-semibold text-gray-600">{page}</span> of {totalPages} · {meta.total} listings</p>
                <div className="flex gap-1.5">
                  {[{ dir: -1, pts: '15 18 9 12 15 6' }, { dir: 1, pts: '9 18 15 12 9 6' }].map(({ dir, pts }) => (
                    <button key={dir} onClick={() => setPage(p => p + dir)} disabled={dir === -1 ? page <= 1 : page >= totalPages}
                      className="h-8 w-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points={pts} /></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'create', item: null })}
        title={modal.mode === 'create' ? '➕ Add Listing' : '✏️ Edit Listing'} accent="orange">
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs">{formError}</div>}
          <SmField label="Title" required name="title" value={form.title} onChange={fc} placeholder="e.g. Spacious 3BHK in Andheri" />
          <div className="grid grid-cols-2 gap-3">
            <SectionSelect label="Type *" name="type" value={form.type} onChange={fc}>
              {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </SectionSelect>
            <SectionSelect label="Status" name="status" value={form.status} onChange={fc}>
              {LISTING_STATUSES.filter(s => s !== 'CLOSED').map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </SectionSelect>
            <SmField label="Owner Name" name="ownerName" value={form.ownerName} onChange={fc} placeholder="Rahul Mehta" />
            <SmField label="Owner Phone" name="ownerPhone" value={form.ownerPhone} onChange={fc} placeholder="+91..." />
            <SmField label="City" name="city" value={form.city} onChange={fc} placeholder="Mumbai" />
            <SmField label="Locality" name="locality" value={form.locality} onChange={fc} placeholder="Andheri" />
            <SmField label="Price (₹)" name="price" value={form.price} onChange={fc} placeholder="8500000" type="number" />
            <SmField label="Area (sqft)" name="sqft" value={form.sqft} onChange={fc} placeholder="1200" type="number" />
            <SmField label="Bedrooms" name="bedrooms" value={form.bedrooms} onChange={fc} placeholder="3" type="number" />
            <SmField label="Bathrooms" name="bathrooms" value={form.bathrooms} onChange={fc} placeholder="2" type="number" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', item: null })} disabled={formLoading}
              className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer">Cancel</button>
            <button type="submit" disabled={formLoading}
              className="flex-1 h-10 bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-90 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
              {formLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (modal.mode === 'create' ? 'Add Listing' : 'Save Changes')}
            </button>
          </div>
        </form>
      </Modal>

      {closeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCloseModal({ open: false, item: null })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4">
              <h3 className="text-sm font-bold text-white">Close Listing</h3>
              <p className="text-xs text-emerald-100 mt-0.5 truncate">{closeModal.item?.title}</p>
            </div>
            <div className="p-5">
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-2 text-xs mb-4">
                Cancels all active reservations on this listing.
              </div>
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Note (optional)</label>
                <input type="text" value={closeNote} onChange={e => setCloseNote(e.target.value)} placeholder="e.g. Deal finalized"
                  className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm placeholder-gray-300 outline-none focus:border-emerald-400 transition" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCloseModal({ open: false, item: null })} disabled={closeLoading}
                  className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer">Cancel</button>
                <button onClick={handleClose} disabled={closeLoading}
                  className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
                  {closeLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Close Listing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <DeleteConfirm open={del.open} onClose={() => setDel({ open: false, item: null })} label={del.item?.title || 'this listing'} onConfirm={handleDelete} />
    </section>
  )
}

/* ═══════════════════════════════════════
   RESERVATIONS SECTION
═══════════════════════════════════════ */
const RES_STATUSES = ['ACTIVE', 'EXPIRED', 'CONFIRMED', 'CANCELLED']
const RES_STATUS_STYLE = {
  ACTIVE:    'bg-green-50 text-green-700 border border-green-200',
  EXPIRED:   'bg-gray-100 text-gray-500 border border-gray-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border border-blue-200',
  CANCELLED: 'bg-red-50 text-red-600 border border-red-200',
}

function fmtDt(dt) {
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

function ReservationsSection({ projectId }) {
  const [reservations, setReservations] = useState([])
  const [projectUnitIds, setProjectUnitIds] = useState([])
  const [projectListingIds, setProjectListingIds] = useState([])
  const [units, setUnits] = useState([])
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ linkType: 'unit', unitId: '', listingId: '', userId: '', note: '', expiresAt: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState({ open: false, item: null })
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resRes, unitsRes, listingsRes, usersRes] = await Promise.all([
        api.get('/inventory/reservations'),
        api.get('/inventory/units', { params: { projectId, limit: 500 } }),
        api.get('/inventory/listings', { params: { projectId, limit: 500 } }),
        api.get('/users'),
      ])
      const projectUnits = unitsRes.data?.items ?? []
      const projectListings = listingsRes.data?.items ?? []
      setUnits(projectUnits)
      setListings(projectListings)
      setProjectUnitIds(projectUnits.map(u => u.id))
      setProjectListingIds(projectListings.map(l => l.id))
      const ud = usersRes.data
      setUsers(Array.isArray(ud) ? ud : (ud?.users ?? []))

      const allRes = resRes.data?.items ?? []
      const unitIds = new Set(projectUnits.map(u => u.id))
      const listingIds = new Set(projectListings.map(l => l.id))
      const filtered = allRes.filter(r =>
        (r.unitId && unitIds.has(r.unitId)) || (r.listingId && listingIds.has(r.listingId))
      )
      setReservations(filtered)
    } catch { setReservations([]) }
    finally { setLoading(false) }
  }, [projectId])

  useEffect(() => { fetchData() }, [fetchData])

  const fc = (e) => { setFormError(''); setForm(p => ({ ...p, [e.target.name]: e.target.value })) }

  const openModal = () => { setForm({ linkType: 'unit', unitId: '', listingId: '', userId: '', note: '', expiresAt: '' }); setFormError(''); setModal(true) }

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

  const filtered = reservations.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const uName = r.unitId ? unitLabel(r.unitId) : ''
      const lName = r.listingId ? listingLabel(r.listingId) : ''
      const userName = r.userId ? userLabel(r.userId) : ''
      if (![uName, lName, userName, r.note || ''].some(v => v.toLowerCase().includes(q))) return false
    }
    return true
  })

  const availableUnits = units.filter(u => u.status === 'AVAILABLE')
  const availableListings = listings.filter(l => l.status === 'AVAILABLE')

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <SectionHeader
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          title="Reservations" count={reservations.length}
          accentColor="bg-gradient-to-br from-rose-500 to-pink-600 text-white"
          filterSlot={
            <>
              <FilterSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {RES_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </FilterSelect>
            </>
          }
          onAdd={openModal} addLabel="+ Reserve"
        />
      </div>

      {/* Search */}
      <div className="px-6 pt-4">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search reservations..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition" />
        </div>
      </div>

      <div className="px-6 pb-5 pt-3">
        {loading ? <Spinner color="rose" /> : filtered.length === 0 ? (
          <EmptyState message="No reservations yet" cta="Create a reservation" onCta={openModal} />
        ) : (
          <div className="space-y-2.5 mt-2">
            {filtered.map(r => {
              const tl = r.status === 'ACTIVE' ? timeLeft(r.expiresAt) : null
              return (
                <div key={r.id} className="group flex items-center gap-4 p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 hover:border-rose-200 hover:shadow-sm transition-all">
                  <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-[1.5fr_1.5fr_1fr_100px_80px] gap-2 items-center">
                    {/* Unit / Listing */}
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
                      {r.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.note}</p>}
                    </div>
                    {/* Assigned to */}
                    <p className="hidden lg:block text-xs text-gray-500 truncate">{r.userId ? userLabel(r.userId) : <span className="text-gray-300">—</span>}</p>
                    {/* Reserved at */}
                    <p className="hidden lg:block text-xs text-gray-500">{fmtDt(r.reservedAt)}</p>
                    {/* Expires */}
                    <div className="hidden lg:block">
                      <p className="text-xs text-gray-500">{fmtDt(r.expiresAt)}</p>
                      {tl && <p className={`text-xs font-medium mt-0.5 ${tl === 'Expired' ? 'text-red-500' : 'text-amber-600'}`}>{tl}</p>}
                    </div>
                    {/* Status */}
                    <Badge label={r.status} style={RES_STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-500'} />
                  </div>
                  {/* Cancel button */}
                  {r.status === 'ACTIVE' && (
                    <button onClick={() => setCancelConfirm({ open: true, item: r })} title="Cancel reservation" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer opacity-0 group-hover:opacity-100">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Reservation Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">New Reservation</h3>
                <p className="text-xs text-rose-100 mt-0.5">Hold a unit or listing · Default TTL: 15 min</p>
              </div>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{formError}</div>}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Reserve a <span className="text-red-400">*</span></label>
                <div className="flex rounded-xl border border-gray-200 p-1 gap-1">
                  {['unit', 'listing'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(p => ({ ...p, linkType: t, unitId: '', listingId: '' }))}
                      className={`flex-1 h-8 text-sm font-medium rounded-lg transition cursor-pointer capitalize ${form.linkType === t ? 'bg-rose-500 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {form.linkType === 'unit' ? (
                <SectionSelect label="Unit *" name="unitId" value={form.unitId} onChange={fc}>
                  <option value="">Select an available unit</option>
                  {availableUnits.map(u => <option key={u.id} value={u.id}>Unit {u.unitNumber || u.id}</option>)}
                </SectionSelect>
              ) : (
                <SectionSelect label="Listing *" name="listingId" value={form.listingId} onChange={fc}>
                  <option value="">Select an available listing</option>
                  {availableListings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </SectionSelect>
              )}
              <SectionSelect label="Assign To (optional)" name="userId" value={form.userId} onChange={fc}>
                <option value="">— No assignment —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </SectionSelect>
              <SmField label="Expires At (optional)" name="expiresAt" value={form.expiresAt} onChange={fc} type="datetime-local" placeholder="" />
              <SmField label="Note (optional)" name="note" value={form.note} onChange={fc} placeholder="e.g. Hold for client walkthrough" />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setModal(false)} disabled={formLoading}
                  className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer">Cancel</button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 h-10 bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
                  {formLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirm */}
      <DeleteConfirm open={cancelConfirm.open} onClose={() => setCancelConfirm({ open: false, item: null })} label="this reservation" onConfirm={handleCancel} />
    </section>
  )
}

/* ═══════════════════════════════════════
   PROJECT DETAIL — main export
═══════════════════════════════════════ */
export default function ProjectDetail({ project, onBack, onEdit, onDelete }) {
  return (
    <div className="px-8 py-6 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-600 font-medium transition cursor-pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All Projects
        </button>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-700 font-semibold truncate max-w-xs">{project.name}</span>
      </div>

      {/* Project hero card */}
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Top color strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
        <div className="px-6 py-5 flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${project.active !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${project.active !== false ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {project.active !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {project.developer && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                  </div>
                  <span className="font-medium text-gray-700">{project.developer}</span>
                </span>
              )}
              {(project.city || project.locality) && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  </div>
                  <span className="font-medium text-gray-700">{[project.locality, project.city].filter(Boolean).join(', ')}</span>
                </span>
              )}
              {project.address && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                  </div>
                  {project.address}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onEdit(project)}
              className="flex items-center gap-1.5 h-9 px-4 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit
            </button>
            <button onClick={() => onDelete(project)}
              className="flex items-center gap-1.5 h-9 px-4 border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-500 hover:text-red-600 text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Three sections */}
      <div className="space-y-5">
        <TowersSection projectId={project.id} />
        <UnitsSection projectId={project.id} />
        <ListingsSection projectId={project.id} />
        <ReservationsSection projectId={project.id} />
      </div>
    </div>
  )
}
