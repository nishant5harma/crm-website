import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function LeadsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('all')

  const tabs = [
    { id: 'all', label: 'All leads' },
    { id: 'detail', label: 'Lead detail' },
    { id: 'webhook', label: 'Webhook integrations' },
    { id: 'mapping', label: 'Source mapping' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto text-gray-800">
      {/* Mini Breadcrumb/Context */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Session: {user?.email || 'admin@example.com'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-50/80 p-1.5 rounded-full mb-8 overflow-x-auto ring-1 ring-gray-100 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max py-2.5 px-6 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 min-h-[500px]">
        {activeTab === 'all' && <AllLeadsTab />}
        {activeTab === 'detail' && <LeadDetailTab />}
        {activeTab === 'webhook' && <WebhookIntegrationsTab />}
        {activeTab === 'mapping' && <SourceMappingTab />}
      </div>
    </div>
  )
}

function AllLeadsTab() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState(new Set())
  const [recordsPerPage, setRecordsPerPage] = useState(50)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    stage: 'All',
  })
  
  const fetchLeads = async (customPage) => {
    const targetPage = customPage || page
    setLoading(true)
    console.log('Fetching leads...', { targetPage, recordsPerPage, filters })
    try {
      const params = new URLSearchParams()
      params.append('page', targetPage)
      params.append('limit', recordsPerPage)
      
      if (filters.search) params.append('search', filters.search)
      if (filters.stage && filters.stage !== 'All') params.append('stage', filters.stage)
      
      const { data } = await api.get(`/leads?${params.toString()}`)
      console.log('Leads API Response:', data)
      const list = Array.isArray(data) ? data : (data?.leads ?? data?.items ?? data?.data ?? [])
      setLeads(list)
    } catch (err) {
      console.error('Failed to fetch leads', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [page, recordsPerPage])

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
  }

  const handleStageChange = (e) => {
    const val = e.target.value
    setFilters(prev => ({ ...prev, stage: val }))
    setPage(1)
    setTimeout(() => fetchLeads(1), 0)
  }

  const toggleLeadSelection = (id) => {
    setSelectedLeads(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length && leads.length > 0) setSelectedLeads(new Set())
    else setSelectedLeads(new Set(leads.map(l => l.id)))
  }

  const formatDate = (dt) => {
    if (!dt) return '-'
    const d = new Date(dt)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold italic text-emerald-600 tracking-tight">Leads</h2>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition cursor-pointer">
            <span className="text-lg leading-none">+</span> Add
          </button>
          <button 
             disabled={selectedLeads.size === 0}
             className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            Delete
          </button>
          <div className="relative">
             <input 
                type="text" 
                placeholder="Search leads..." 
                value={filters.search}
                onChange={handleSearchChange}
                onKeyDown={e => e.key === 'Enter' && fetchLeads(1)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 transition-all focus:w-64"
             />
             <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <button className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition cursor-pointer">
            <svg className="rotate-90" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            More Actions
          </button>
        </div>
      </div>

      {/* Sub-header Filter Row */}
      <div className="flex flex-wrap items-center gap-4 bg-white border border-emerald-500/20 p-2 rounded-xl shadow-sm">
         <div className="flex items-center gap-3 ml-4">
            <span className="text-[12px] font-medium text-gray-500 whitespace-nowrap">Records per page</span>
            <select value={recordsPerPage} onChange={e => { setRecordsPerPage(Number(e.target.value)); setPage(1) }} className="bg-gray-50 border border-gray-200 rounded-full px-4 py-1 text-xs font-semibold text-gray-600 outline-none">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
         </div>

         <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setPage(1)} className="p-1 px-2 text-gray-400 hover:text-emerald-600 transition cursor-pointer font-bold">|&lt;</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1 px-2 text-gray-400 hover:text-emerald-600 transition cursor-pointer font-bold">&lt;</button>
            <span className="text-xs font-bold text-gray-500 px-2 min-w-[80px] text-center">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="p-1 px-2 text-gray-400 hover:text-emerald-600 transition cursor-pointer font-bold">&gt;</button>
         </div>

         <button onClick={() => fetchLeads()} className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-full text-xs font-bold shadow-sm hover:bg-gray-50 transition cursor-pointer ml-4">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            Refresh
         </button>

         <div className="relative">
            <select 
               value={filters.stage}
               onChange={handleStageChange}
               className="bg-gray-50 border border-gray-200 rounded-full px-6 py-1.5 text-xs font-semibold text-emerald-700 outline-none pr-10 appearance-none min-w-[170px]"
            >
              <option value="All">All Stages</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="SITE_VISIT">Site Visit</option>
              <option value="CLOSURE">Closure</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
         </div>

         <div className="flex items-center gap-2 ml-2 pr-4 border-l border-gray-100 pl-4">
            <button title="Add" className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition cursor-pointer font-bold text-lg">+</button>
            <button title="Edit" className="text-gray-500 hover:bg-gray-50 p-1.5 rounded transition cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button title="Delete" className="text-gray-500 hover:bg-gray-50 p-1.5 rounded transition cursor-pointer">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
            <button title="Copy" className="text-gray-500 hover:bg-gray-50 p-1.5 rounded transition cursor-pointer">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
         </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-[32px] border border-gray-100 shadow-2xl bg-white min-h-[400px]">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="bg-gray-50/80 text-gray-400 border-b border-gray-100 h-14 uppercase font-bold tracking-wider">
              <th className="px-6 w-12 text-center">
                <input type="checkbox" onChange={toggleSelectAll} checked={leads.length > 0 && selectedLeads.size === leads.length} className="cursor-pointer rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
              </th>
              <th className="px-4 py-2 whitespace-nowrap">Lead Owner</th>
              <th className="px-4 py-2 whitespace-nowrap">Lead Date</th>
              <th className="px-4 py-2 whitespace-nowrap">Contact Name</th>
              <th className="px-4 py-2 whitespace-nowrap">Mobile Number</th>
              <th className="px-4 py-2 whitespace-nowrap">Lead Stage</th>
              <th className="px-4 py-2 whitespace-nowrap">Expected Revenue</th>
              <th className="px-4 py-2 whitespace-nowrap">Next Follow-up On</th>
              <th className="px-4 py-2 whitespace-nowrap">Next Follow-up Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="9" className="py-20 text-center"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan="9" className="py-20 text-center text-gray-400">
                 <div className="flex flex-col items-center gap-2">
                    <svg className="opacity-20" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <p className="font-semibold text-gray-300">No leads found in this view.</p>
                 </div>
              </td></tr>
            ) : leads.map((lead, idx) => {
              const isSelected = selectedLeads.has(lead.id)
              return (
                <tr key={lead.id} className={`transition-all h-14 ${isSelected ? 'bg-emerald-50/80' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'} hover:bg-emerald-50/40 group`}>
                  <td className="px-6 relative text-center">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleLeadSelection(lead.id)} className="cursor-pointer rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                  </td>
                  <td className="px-4 font-bold text-emerald-700 whitespace-nowrap">{lead.assignedTo?.name || lead.user?.name || 'Unassigned'}</td>
                  <td className="px-4 text-gray-600 whitespace-nowrap font-medium">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 font-bold text-gray-900 whitespace-nowrap uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{lead.name || 'Unknown'}</td>
                  <td className="px-4 text-emerald-600 font-bold underline decoration-emerald-100 underline-offset-4 whitespace-nowrap cursor-pointer hover:text-emerald-700 transition-colors">{lead.phone || '9999999999'}</td>
                  <td className="px-4">
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-[9px] font-black inline-block min-w-[130px] text-center uppercase tracking-widest shadow-sm">
                      {lead.stage || 'SITE VISIT COMPLETED'}
                    </span>
                  </td>
                  <td className="px-4 text-gray-900 whitespace-nowrap font-bold">₹ {(lead.revenue || lead.expectedRevenue || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 text-red-500 font-black whitespace-nowrap">
                    28-Aug-2025 12:11 PM
                  </td>
                  <td className="px-4 text-gray-500 max-w-[200px] truncate italic font-medium opacity-70">
                    {lead.note || 'No interaction notes yet...'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LeadDetailTab() {
  const [leadId, setLeadId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLoad = async () => {
    if (!leadId.trim()) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      const [leadRes, followRes, historyRes] = await Promise.all([
        api.get(`/leads/${leadId.trim()}`).catch(() => ({ data: null })),
        api.get(`/leads/followup/${leadId.trim()}/followups`).catch(() => ({ data: [] })),
        api.get(`/leads/followup/${leadId.trim()}/stage-history`).catch(() => ({ data: [] }))
      ])

      if (!leadRes.data) throw new Error("Lead not found or endpoint unimplemented")

      setData({
        lead: leadRes.data?.lead || leadRes.data,
        followups: Array.isArray(followRes.data) ? followRes.data : (followRes.data?.followups ?? []),
        history: Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data?.history ?? [])
      })
    } catch (err) {
      setError(err.message || 'Failed to load details due to missing endpoint implementation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="text-base font-bold text-gray-800 mb-3">Load lead by ID (for follow-ups, status, stage history)</h3>
      <div className="flex flex-col sm:flex-row gap-3 mb-12">
        <input value={leadId} onChange={e => setLeadId(e.target.value)} type="text" placeholder="Enter leadId (cllead...)" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 text-sm" />
        <div className="flex gap-2 sm:gap-3">
          <button className="px-6 py-3 bg-[#0f172a] text-white rounded-xl font-medium hover:bg-gray-800 transition text-sm flex-1 sm:flex-none cursor-pointer">Select</button>
          <button onClick={handleLoad} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition shadow-sm shadow-orange-200 text-sm flex-1 sm:flex-none cursor-pointer flex justify-center items-center gap-2">
            {loading && <div className="w-3 h-3 border-2 border-orange-200 border-t-white rounded-full animate-spin"/>} Load
          </button>
        </div>
      </div>

      {error ? (
         <div className="py-10 text-center text-red-500 text-sm bg-red-50 rounded-xl">{error}</div>
      ) : !data ? (
        <div className="py-16 text-center border-t border-gray-100">
          <p className="text-gray-500 max-w-xs mx-auto leading-relaxed text-sm">
            Enter a lead ID above to view follow-ups, update status, and see stage history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-4 tracking-tight">Lead Info</h4>
            <div className="space-y-3 text-sm">
              <p><span className="text-gray-500 w-24 inline-block">ID:</span> <span className="font-mono text-xs">{data.lead.id}</span></p>
              <p><span className="text-gray-500 w-24 inline-block">Name:</span> <span className="font-medium text-gray-900">{data.lead.name}</span></p>
              <p><span className="text-gray-500 w-24 inline-block">Contact:</span> <span>{data.lead.email} / {data.lead.phone}</span></p>
              <p><span className="text-gray-500 w-24 inline-block">Status/Stage:</span> <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[10px]">{data.lead.status || 'NEW'}</span> <span className="text-gray-400 mx-1">→</span> {data.lead.stage || 'NEW'}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
             <h4 className="font-bold text-gray-900 mb-4 tracking-tight">Timeline ({data.history.length + data.followups.length} items)</h4>
             {data.history.length === 0 && data.followups.length === 0 && (
                <p className="text-sm text-gray-400 italic">No activity recorded yet.</p>
             )}
             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {data.history.map((h, i) => (
                   <div key={`h-${i}`} className="border-l-2 border-indigo-200 pl-3">
                     <p className="text-xs text-gray-400">{new Date(h.createdAt || Date.now()).toLocaleDateString()}</p>
                     <p className="text-sm text-gray-700">Stage changed to <span className="font-bold">{h.stage}</span></p>
                   </div>
                ))}
                {data.followups.map((f, i) => (
                   <div key={`f-${i}`} className="border-l-2 border-orange-200 pl-3">
                     <p className="text-xs text-gray-400">{new Date(f.dueAt || f.createdAt || Date.now()).toLocaleDateString()}</p>
                     <p className="text-sm text-gray-700">Follow-up: {f.note}</p>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WebhookIntegrationsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2">How leads enter the CRM</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          External systems (portals, Google Forms, website, etc.) send leads to <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-indigo-600">/api/leads/webhook</code> using an HMAC signature.
        </p>
      </div>
    </div>
  )
}

function SourceMappingTab() {
  const [teams, setTeams] = useState([])
  const [unmappedSources, setUnmappedSources] = useState([])
  const [activeMappings, setActiveMappings] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({ source: '', teamId: '' })

  const fetchMappingData = async () => {
    setLoading(true)
    try {
      const { data: tData } = await api.get('/teams').catch(() => ({ data: [] }))
      setTeams(Array.isArray(tData) ? tData : (tData?.teams ?? []))

      const { data: uData } = await api.get('/leads/source-pools/unmapped-sources').catch(() => ({ data: [] }))
      setUnmappedSources(Array.isArray(uData) ? uData : (uData?.sources ?? []))

      const { data: aData } = await api.get('/leads/source-pools?active=true').catch(() => ({ data: [] }))
      setActiveMappings(Array.isArray(aData) ? aData : (aData?.pools ?? []))
    } catch (err) {
      console.error('Error fetching mapping data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMappingData()
  }, [])

  const handleSaveMapping = async () => {
    if (!form.source.trim() || !form.teamId.trim()) return alert("Both source and team selection are required.")
    setSaving(true)
    try {
      await api.post('/leads/source-pools', { source: form.source.trim(), teamId: form.teamId })
      alert('Mapping saved successfully!')
      setForm({ source: '', teamId: '' })
      fetchMappingData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save mapping.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
           <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="p-6 rounded-2xl border border-gray-200 shadow-sm bg-white">
        <h3 className="font-bold text-gray-900 mb-1">Add / update mapping</h3>
        <div className="space-y-3 mt-4">
          <input value={form.source} onChange={e => setForm(prev => ({ ...prev, source: e.target.value }))} type="text" placeholder="source (e.g. google_forms)" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          <select value={form.teamId} onChange={e => setForm(prev => ({ ...prev, teamId: e.target.value }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="" disabled>Select team...</option>
              {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <button onClick={handleSaveMapping} disabled={saving} className="w-full p-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">Save mapping</button>
        </div>
      </div>

      {unmappedSources.length > 0 && (
        <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/30">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Unmapped Sources detected</h4>
          <div className="flex flex-wrap gap-2">
            {unmappedSources.map(s => <span key={s} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">{s}</span>)}
          </div>
        </div>
      )}

      <div className="p-6">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Active Mappings</h4>
        <div className="space-y-2">
          {activeMappings.map(m => (
            <div key={m.id} className="flex justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm">
              <span className="font-bold text-gray-700">{m.source}</span>
              <span className="text-gray-400">&rarr;</span>
              <span className="text-emerald-600 font-bold">{m.team?.name || m.teamId}</span>
            </div>
          ))}
          {activeMappings.length === 0 && <p className="text-sm text-gray-400 italic">No active mappings found.</p>}
        </div>
      </div>
    </div>
  )
}
