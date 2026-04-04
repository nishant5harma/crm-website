import React, { useState, useEffect } from 'react'
import { getAuditLogs } from '../api/auditApi'

export default function ActivityPage() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [filters, setFilters] = useState({
    q: '',
    resource: '',
    actionPrefix: '',
    action: '',
    resourceId: '',
    userId: '',
    from: '',
    to: '',
    page: 1,
    limit: 50
  })

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      )
      const res = await getAuditLogs(activeFilters)
      setLogs(res.rows || res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Failed to fetch audit logs', err)
      setError(err.response?.data?.error || 'Failed to fetch audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filters.page])

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const applyFilters = () => {
    if (filters.page !== 1) {
      setFilters({ ...filters, page: 1 }) // This will trigger fetch
    } else {
      fetchLogs()
    }
  }

  const clearFilters = () => {
    setFilters({
      q: '',
      resource: '',
      actionPrefix: '',
      action: '',
      resourceId: '',
      userId: '',
      from: '',
      to: '',
      page: 1,
      limit: 50
    })
    // we wait for state to update, so just fetch with default
    fetchLogs()
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleString('en-US', { month: 'short' })
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    return `${day} ${month}, ${time}`
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 overflow-y-auto w-full">
      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start pt-2">
          <div>
            <div className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-1">
              ACTIVITY
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Audit logs
            </h1>
            <div className="text-sm text-gray-500">
              Showing {logs.length > 0 ? (filters.page - 1) * filters.limit + 1 : 0}–{Math.min(filters.page * filters.limit, total)} of {total}
            </div>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="bg-[#4f46e5] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Filters Grid */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100/80 space-y-3">
          <div>
            <input
              type="text"
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Search (q)"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="resource"
              value={filters.resource}
              onChange={handleFilterChange}
              placeholder="resource (e.g. lead)"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <input
              type="text"
              name="actionPrefix"
              value={filters.actionPrefix}
              onChange={handleFilterChange}
              placeholder="actionPrefix (e.g. lead.)"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <input
              type="text"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              placeholder="action (exact)"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <input
              type="text"
              name="resourceId"
              value={filters.resourceId}
              onChange={handleFilterChange}
              placeholder="resourceId"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div>
            <input
              type="text"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="userId"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              placeholder="from (ISO)"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <input
              type="text"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              placeholder="to (ISO)"
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={applyFilters}
              className="bg-[#0f172a] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition cursor-pointer"
            >
              Apply
            </button>
            <button
              onClick={fetchLogs}
              className="bg-white border border-gray-200 text-[#0f172a] px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 transition cursor-pointer"
            >
              Reload users
            </button>
            <button
              onClick={clearFilters}
              className="bg-white border border-gray-200 text-[#0f172a] px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-50 transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-4 pt-2">
          {loading && logs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Loading activity...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No logs found matching criteria.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[13px] text-gray-500">Page: <span className="font-semibold text-gray-700 capitalize">{(log.resource || 'System')}</span></div>
                    <div className="text-[17px] font-bold text-gray-900 mt-1">{log.action}</div>
                  </div>
                  <div className="text-[13px] text-gray-400">
                    {formatDate(log.createdAt)}
                  </div>
                </div>
                
                <div className="text-[14px] text-gray-600 mt-3 wrap-break-word">
                  {log.userId ? (
                    <div>
                      {log?.user?.name || log.userId} {log.action}
                    </div>
                  ) : (
                    <div>System / Webhook {log.action}</div>
                  )}
                  <div className="mt-1 text-[13px] text-gray-500">Key: <span className="font-mono text-gray-700">{log.action}</span></div>
                  {log.payload && typeof log.payload === 'object' && (
                    <div className="mt-1 text-[13px] text-gray-500">
                      Target: {JSON.stringify(log.payload)}
                    </div>
                  )}
                  <div className="mt-2 text-[13px] text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-100 inline-block truncate max-w-full">
                    User: {log?.user?.name || 'Unknown'} ({log.userId || 'system'})
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
