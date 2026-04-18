import { useState, useEffect } from 'react'
import { getEntriesReport } from '../../api/coldCallApi'

export default function ReportsTab() {
  const [filter, setFilter] = useState({ batchId: '', teamId: '', userId: '', status: '', response: '' })
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(null)

  const handleLoad = async () => {
    setLoading(true)
    setError(null)
    try {
      // Create clean filter object (remove empty strings)
      const cleanFilter = {}
      Object.keys(filter).forEach(key => {
        if (filter[key]) cleanFilter[key] = filter[key]
      })

      const resp = await getEntriesReport({ ...cleanFilter, page, limit: 100 })
      
      // Exhaustive extraction logic
      let items = []
      if (resp && resp.data && Array.isArray(resp.data.rows)) {
        items = resp.data.rows
      } else if (Array.isArray(resp)) {
        items = resp
      } else if (resp && typeof resp === 'object') {
        items = resp.rows || resp.data || resp.entries || resp.items || resp.leads || []
        // Nested fallback
        if (items.length === 0 && resp.data && typeof resp.data === 'object') {
          items = resp.data.rows || resp.data.data || resp.data.items || (Array.isArray(resp.data) ? resp.data : [])
        }
        // Last resort: find any array
        if (items.length === 0) {
          const firstArray = Object.values(resp).find(v => Array.isArray(v) && v.length > 0)
          if (firstArray) items = firstArray
        }
      }
      
      setEntries(Array.isArray(items) ? items : [])
    } catch (err) {
      console.error(err)
      let msg = err.response?.data?.message || err.message || 'Error loading report'
      // Try to parse Zod error if it's a stringified JSON
      try { if (msg.startsWith('[')) msg = 'Validation Error: Check your filter values.' } catch(e) {}
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleLoad()
  }, [page])

  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100'
    if (s === 'in_progress') return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    if (s === 'done' || s === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    return 'bg-gray-50 text-gray-600 border-gray-100'
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Entries report</h3>
        
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="batchId"
            value={filter.batchId}
            onChange={(e) => setFilter({ ...filter, batchId: e.target.value })}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm outline-none"
          />

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400">Team filter</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilter({...filter, teamId: ''})}
                className={`px-6 py-3 rounded-full text-xs font-black transition-all ${!filter.teamId ? 'bg-gray-900 text-white' : 'bg-white border text-gray-500'}`}
              >
                Any team
              </button>
              <button 
                onClick={() => setFilter({...filter, teamId: 'Sales'})}
                className={`px-6 py-3 rounded-full text-xs font-black transition-all ${filter.teamId === 'Sales' ? 'bg-gray-900 text-white' : 'bg-white border text-gray-500'}`}
              >
                Sales
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setFilter({...filter, userId: ''})}
              className={`px-6 py-3 rounded-full text-xs font-black transition-all ${!filter.userId ? 'bg-gray-900 text-white' : 'bg-white border text-gray-500'}`}
            >
              Any user
            </button>
            <button 
              onClick={() => setFilter({...filter, userId: 'Arya'})}
              className={`px-6 py-3 rounded-full text-xs font-black transition-all ${filter.userId === 'Arya' ? 'bg-gray-900 text-white' : 'bg-white border text-gray-500'}`}
            >
              Arya
            </button>
            <input
              type="text"
              placeholder="status"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm outline-none"
            />
          </div>

          <input
            type="text"
            placeholder="response (e.g. interested)"
            value={filter.response}
            onChange={(e) => setFilter({ ...filter, response: e.target.value })}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm outline-none"
          />
        </div>

        <button
          onClick={() => { setPage(1); handleLoad(); }}
          disabled={loading}
          className="w-full bg-[#0d121f] hover:bg-black text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg active:scale-[0.98]"
        >
          {loading ? 'Loading...' : 'Load entries'}
        </button>
      </div>

      {error && (
         <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 text-xs font-bold whitespace-pre-wrap">
           ⚠️ {error}
         </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-3xl border border-gray-100 p-1 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Phone / Contact</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Batch</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Response / Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.length === 0 && !loading ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center">
                    <p className="font-bold text-sm text-gray-300">No results found.</p>
                  </td>
                </tr>
              ) : (
                entries.map((e, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <div className="font-bold text-gray-900 text-sm tracking-tight">
                        {e?.phone || e?.payload?.phone || e?.name || '—'}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">ID: {e?.id?.substring(0,8)}...</div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(e?.status)}`}>
                        {e?.status || '—'}
                      </span>
                    </td>
                    <td className="p-5 text-xs font-bold text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-md">#{e?.batchId?.substring(0,6)}...</span>
                    </td>
                    <td className="p-5">
                      <div className="text-sm font-bold text-gray-900 line-clamp-1">{e?.response || '—'}</div>
                      <div className="text-[10px] text-gray-400 font-medium line-clamp-1">{e?.summary || 'No summary'}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center px-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-600"
        >
          Previous
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={entries.length === 0 || loading}
          className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-black text-gray-600"
        >
          Next
        </button>
      </div>
    </div>
  )
}
