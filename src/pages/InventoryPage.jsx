import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import ProjectDetail from '../components/inventory/ProjectDetail'
import ReservationsTab from '../components/inventory/ReservationsTab'

const INIT_FORM = { name: '', developer: '', city: '', locality: '', address: '' }

function Field({ label, name, value, onChange, placeholder, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-400">*</span>}</label>
      <input type="text" name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white placeholder-gray-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition" />
    </div>
  )
}

const TABS = [
  { id: 'inventory', label: 'Projects', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
  { id: 'reservations', label: 'Reservations', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
]

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('inventory')
  const [selectedProject, setSelectedProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [del, setDel] = useState({ open: false, item: null })
  const [form, setForm] = useState(INIT_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchProjects = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { data } = await api.get('/inventory/projects')
      setProjects(data?.items ?? [])
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load projects.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const openCreate = () => { setForm(INIT_FORM); setFormError(''); setModal({ open: true, mode: 'create', item: null }) }
  const openEdit = (item, e) => {
    e?.stopPropagation()
    setForm({ name: item.name || '', developer: item.developer || '', city: item.city || '', locality: item.locality || '', address: item.address || '' })
    setFormError('')
    setModal({ open: true, mode: 'edit', item })
  }
  const closeModal = () => setModal({ open: false, mode: 'create', item: null })
  const fc = (e) => { setFormError(''); setForm(p => ({ ...p, [e.target.name]: e.target.value })) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Project name is required.'); return }
    setFormLoading(true); setFormError('')
    try {
      const payload = { name: form.name.trim(), developer: form.developer.trim() || undefined, city: form.city.trim() || undefined, locality: form.locality.trim() || undefined, address: form.address.trim() || undefined }
      if (modal.mode === 'create') {
        const { data } = await api.post('/inventory/projects', payload)
        setProjects(p => [data.project, ...p])
      } else {
        const { data } = await api.put(`/inventory/projects/${modal.item.id}`, payload)
        setProjects(p => p.map(x => x.id === modal.item.id ? data.project : x))
        if (selectedProject?.id === modal.item.id) setSelectedProject(data.project)
      }
      closeModal()
    } catch (err) {
      const d = err.response?.data
      setFormError(d?.message || d?.error || 'Failed to save project.')
    } finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/inventory/projects/${del.item.id}`)
      setProjects(p => p.filter(x => x.id !== del.item.id))
      if (selectedProject?.id === del.item.id) setSelectedProject(null)
      setDel({ open: false, item: null })
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to delete project.')
    }
  }

  const filtered = projects.filter(p =>
    !search || [p.name, p.developer, p.city, p.locality].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-0 bg-gray-50">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
            <p className="text-xs text-gray-500 mt-0.5">Real estate projects, units, listings & reservations</p>
          </div>
        </div>
        <div className="flex gap-0.5 border-b border-gray-200">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedProject(null) }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}>
              <span className={activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'reservations' ? (
          <ReservationsTab />
        ) : selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
            onEdit={(item) => openEdit(item)}
            onDelete={(item) => setDel({ open: true, item })}
          />
        ) : (
          /* ─────────── Projects Grid ─────────── */
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">All Projects</h2>
                <p className="text-xs text-gray-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''} · Click a project to manage its towers, units & listings</p>
              </div>
              <button onClick={openCreate} className="flex items-center gap-1.5 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition cursor-pointer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Project
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 transition" />
            </div>

            {/* States */}
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                <span className="w-7 h-7 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-sm">Loading projects...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-sm text-red-500 mb-2">{error}</p>
                <button onClick={fetchProjects} className="text-sm text-indigo-600 hover:underline cursor-pointer">Retry</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">{search ? 'No projects match your search' : 'No projects yet'}</p>
                {!search && <button onClick={openCreate} className="mt-2 text-sm text-indigo-600 hover:underline cursor-pointer">Create your first project</button>}
              </div>
            ) : (
              /* Project Cards Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(p => (
                  <div key={p.id} onClick={() => setSelectedProject(p)}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer p-5 relative">
                    {/* Active badge */}
                    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${p.active !== false ? 'bg-green-400' : 'bg-gray-300'}`} title={p.active !== false ? 'Active' : 'Inactive'} />

                    {/* Icon + name */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center flex-shrink-0 group-hover:from-indigo-100 group-hover:to-blue-200 transition-all">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors">{p.name}</h3>
                        {p.developer && <p className="text-xs text-gray-500 mt-0.5 truncate">{p.developer}</p>}
                      </div>
                    </div>

                    {/* Location */}
                    {(p.city || p.locality) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="truncate">{[p.locality, p.city].filter(Boolean).join(', ')}</span>
                      </div>
                    )}

                    {/* Footer: actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                      <span className="text-xs text-indigo-600 font-medium group-hover:underline">View details →</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => openEdit(p, e)} title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDel({ open: true, item: p }) }} title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900">{modal.mode === 'create' ? 'New Project' : 'Edit Project'}</h2>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition cursor-pointer">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{formError}</div>}
              <Field label="Project Name" required name="name" value={form.name} onChange={fc} placeholder="e.g. Skyline Heights" />
              <Field label="Developer" name="developer" value={form.developer} onChange={fc} placeholder="e.g. ICB Developers" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" name="city" value={form.city} onChange={fc} placeholder="e.g. Mumbai" />
                <Field label="Locality" name="locality" value={form.locality} onChange={fc} placeholder="e.g. Andheri West" />
              </div>
              <Field label="Address" name="address" value={form.address} onChange={fc} placeholder="Full address..." />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} disabled={formLoading} className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition cursor-pointer disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer">
                  {formLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : (modal.mode === 'create' ? 'Create Project' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {del.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDel({ open: false, item: null })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Project</h3>
                <p className="text-xs text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">Delete <span className="font-semibold text-gray-900">"{del.item?.name}"</span>? All towers, units and listings under it will also be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDel({ open: false, item: null })} className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-xl transition cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
