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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto text-gray-800">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-1">
          Leads
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead management</h1>
        <p className="text-gray-600 mb-1 text-sm md:text-base">
          View all leads, manage follow-ups & status, and see how webhook intake works.
        </p>
        <p className="text-xs text-gray-400">
          Session: {user?.email || 'admin@example.com'} &middot; Token: present
        </p>
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
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    status: '',
    stage: '',
    priority: '',
    assignedTo: '',
    from: '',
    to: '',
  })
  
  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.source) params.append('source', filters.source)
      if (filters.status) params.append('status', filters.status)
      if (filters.stage) params.append('stage', filters.stage)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.assignedTo) params.append('assignedTo', filters.assignedTo)
      if (filters.from) params.append('from', new Date(filters.from).toISOString())
      if (filters.to) params.append('to', new Date(filters.to).toISOString())
      
      const { data } = await api.get(`/leads?${params.toString()}`)
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
  }, [])

  const handleChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleClear = () => {
    setFilters({ search: '', source: '', status: '', stage: '', priority: '', assignedTo: '', from: '', to: '' })
  }

  return (
    <div>
      {/* Filter Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input name="search" value={filters.search} onChange={handleChange} type="text" placeholder="Search (~) name/email/phone" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm" />
        <div className="grid grid-cols-2 gap-4">
            <input name="source" value={filters.source} onChange={handleChange} type="text" placeholder="source (e.g. google_form)" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm" />
            <input name="status" value={filters.status} onChange={handleChange} type="text" placeholder="status (e.g. NEW)" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <input name="stage" value={filters.stage} onChange={handleChange} type="text" placeholder="stage (e.g. CONTACTED)" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm" />
            <input name="priority" value={filters.priority} onChange={handleChange} type="text" placeholder="priority (e.g. HOT)" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm" />
        </div>
        <div className="flex gap-2">
            <input name="assignedTo" value={filters.assignedTo} onChange={handleChange} type="text" placeholder="Assigned to: (any)" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 text-sm" />
            <button onClick={handleClear} className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium text-sm transition cursor-pointer">Clear</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <input name="from" value={filters.from} onChange={handleChange} type="datetime-local" placeholder="from (ISO)" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-gray-500 text-sm" />
            <input name="to" value={filters.to} onChange={handleChange} type="datetime-local" placeholder="to (ISO)" className="p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-gray-500 text-sm" />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto text-sm pb-2">
        <span className="text-gray-500 whitespace-nowrap">Showing {leads.length}</span>
        <button onClick={fetchLeads} className="cursor-pointer px-5 py-2.5 border border-gray-200 rounded-full hover:bg-gray-50 bg-white font-medium shadow-sm transition flex gap-2 items-center">
          {loading && <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>} Refresh
        </button>
        <button className="px-5 py-2.5 border border-gray-200 rounded-full hover:bg-gray-50 bg-white font-medium shadow-sm transition">Reload users</button>
        <button className="px-5 py-2.5 border border-gray-100 rounded-full text-gray-300 font-medium cursor-not-allowed">Prev</button>
        <button className="px-5 py-2.5 border border-gray-100 rounded-full text-gray-300 font-medium cursor-not-allowed">Next</button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : leads.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-500 max-w-sm mx-auto leading-relaxed text-sm">
            No leads found. Once your website / forms send data to <code className="bg-gray-50 px-1 rounded">/api/leads/webhook</code>, they will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-3 px-2 font-medium">Name</th>
                <th className="py-3 px-2 font-medium">Contact</th>
                <th className="py-3 px-2 font-medium">Status</th>
                <th className="py-3 px-2 font-medium">Stage</th>
                <th className="py-3 px-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-2 font-medium text-gray-900">{lead.name || 'Unknown'}</td>
                  <td className="py-3 px-2 text-gray-500">{lead.email} <br/><span className="text-xs text-gray-400">{lead.phone}</span></td>
                  <td className="py-3 px-2"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">{lead.status || 'NEW'}</span></td>
                  <td className="py-3 px-2 text-gray-500">{lead.stage || '-'}</td>
                  <td className="py-3 px-2 text-gray-400 font-mono text-xs">{lead.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
                {/* Simplified timeline rendering for demonstration */}
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
          External systems (portals, Google Forms, website, etc.) send leads to <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-indigo-600">/api/leads/webhook</code> using an HMAC signature. The backend normalizes the payload, deduplicates by phone/email/source/externalId, creates or links a Lead, stores a LeadWebhookEvent, and queues automatic assignment.
        </p>
      </div>
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2">Webhook endpoint (backend)</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-indigo-600">POST /api/leads/webhook</code> (HMAC only, no JWT). The frontend should never call this directly. Instead, your website or app posts to your own backend, which signs the JSON body with <code>LEAD_WEBHOOK_SECRET</code> and forwards it to the CRM.
        </p>
      </div>
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2">Typical flow from frontend</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          1) User submits a form on your website / app. 2) Your frontend calls your own API (e.g. <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-indigo-600">/api/contact</code>). 3) Your backend builds the canonical payload (provider, externalId, name, email, phone, source, payload) and computes HMAC SHA256 with <code>LEAD_WEBHOOK_SECRET</code>. 4) Backend posts to /api/leads/webhook. 5) Lead is created or linked and appears in this Leads list.
        </p>
      </div>
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-2">Testing your integration</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Once your website / Google Form integration is live, submit a test lead. Then open the All leads tab here and refresh (or fetch) to see the newly captured lead.
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
      // 1. Fetch Teams
      const { data: tData } = await api.get('/teams').catch(() => ({ data: [] }))
      const tList = Array.isArray(tData) ? tData : (tData?.teams ?? tData?.items ?? tData?.data ?? [])
      setTeams(tList)

      // 2. Fetch Unmapped
      const { data: uData } = await api.get('/leads/source-pools/unmapped-sources').catch(() => ({ data: [] }))
      setUnmappedSources(Array.isArray(uData) ? uData : (uData?.sources ?? []))

      // 3. Fetch Active Mappings
      const { data: aData } = await api.get('/leads/source-pools?active=true').catch(() => ({ data: [] }))
      setActiveMappings(Array.isArray(aData) ? aData : (aData?.pools ?? aData?.items ?? aData?.data ?? []))
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
      await api.post('/leads/source-pools', {
        source: form.source.trim(),
        teamId: form.teamId
      })
      alert('Mapping saved successfully!')
      setForm({ source: '', teamId: '' })
      fetchMappingData() // Refresh lists
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save mapping due to unimplemented backend.')
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
        <p className="text-gray-500 text-xs mb-5">This uses <code className="bg-gray-50 border border-gray-100 px-1 rounded text-gray-700">POST /api/leads/source-pools</code> (upsert).</p>
        <div className="space-y-3">
          <input 
            value={form.source} 
            onChange={e => setForm(prev => ({ ...prev, source: e.target.value }))}
            type="text" 
            placeholder="source (e.g. google_forms)" 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
          />
          <div className="relative">
            <select
              value={form.teamId}
              onChange={e => setForm(prev => ({ ...prev, teamId: e.target.value }))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none cursor-pointer text-gray-800"
            >
              <option value="" disabled>Select team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <button 
            onClick={handleSaveMapping}
            disabled={saving}
            className="w-full flex justify-center items-center gap-2 p-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 mt-2 cursor-pointer disabled:opacity-70"
          >
            {saving && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
            Save mapping
          </button>
        </div>
      </div>

      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-1">Teams</h3>
        <p className="text-gray-500 text-xs mb-4">Tap a team to copy its teamId.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {teams.length === 0 ? <p className="text-gray-400 text-sm py-2">No teams found.</p> : teams.map(team => (
            <div 
              key={team.id}
              onClick={() => { navigator.clipboard.writeText(team.id); alert('TeamId copied!') }}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition hover:shadow-md cursor-pointer hover:border-indigo-100 group"
            >
              <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">{team.name}</p>
              <p className="text-xs text-gray-400 mt-1 font-mono truncate">ID: {team.id}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-1">Unmapped sources</h3>
        <p className="text-gray-400 text-xs mb-4">From <code className="bg-white border border-gray-100 px-1 rounded">GET /api/leads/source-pools/unmapped-sources</code></p>
        {unmappedSources.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No unmapped sources.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unmappedSources.map(source => (
               <span key={source} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-mono">{source}</span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-gray-900">Active mappings</h3>
          <button onClick={fetchMappingData} className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold hover:bg-gray-50 shadow-sm transition text-gray-700 cursor-pointer">Refresh</button>
        </div>
        <p className="text-gray-400 text-xs mb-4">From <code className="bg-white border border-gray-100 px-1 rounded">GET /api/leads/source-pools?active=true</code></p>
        {activeMappings.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No mappings found.</p>
        ) : (
          <div className="space-y-3">
             {activeMappings.map(mapping => (
                <div key={mapping.id || mapping.source} className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                   <div>
                      <p className="font-mono text-sm text-gray-800 font-bold">{mapping.source}</p>
                      <p className="text-xs text-gray-500">Maps to team: {mapping.team?.name || mapping.teamId}</p>
                   </div>
                   <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">ACTIVE</span>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  )
}
