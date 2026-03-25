import { useState } from 'react'
import { getEntriesReport } from '../../api/coldCallApi'

export default function ReportsTab() {
  const [filter, setFilter] = useState({ batchId: '', teamId: '', userId: '', status: '', response: '' })
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const handleLoad = async () => {
    setLoading(true)
    try {
      const data = await getEntriesReport({ ...filter, page })
      setEntries(Array.isArray(data) ? data : data.data || [])
    } catch (err) {
      console.error(err)
      alert('Error loading report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Entries report</h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            placeholder="batchId"
            value={filter.batchId}
            onChange={(e) => setFilter({ ...filter, batchId: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <input
            type="text"
            placeholder="teamId"
            value={filter.teamId}
            onChange={(e) => setFilter({ ...filter, teamId: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <input
            type="text"
            placeholder="userId"
            value={filter.userId}
            onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <input
            type="text"
            placeholder="status"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
          <input
            type="text"
            placeholder="response (e.g. interested)"
            value={filter.response}
            onChange={(e) => setFilter({ ...filter, response: e.target.value })}
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none col-span-2"
          />
        </div>

        <button
          onClick={handleLoad}
          disabled={loading}
          className="cursor-pointer w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg text-sm transition"
        >
          {loading ? 'Loading...' : 'Load entries'}
        </button>
      </div>

      {entries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="overflow-x-auto text-sm text-gray-700">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-medium">
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Response</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-2">{e.phone || e.payload?.phone || '-'}</td>
                    <td className="py-2">{e.status}</td>
                    <td className="py-2">{e.response || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center text-sm font-medium text-gray-500 px-2">
        <button
          onClick={() => { setPage(p => Math.max(1, p - 1)); handleLoad(); }}
          className="cursor-pointer px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
        >
          Prev
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => { setPage(p => p + 1); handleLoad(); }}
          className="cursor-pointer px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
        >
          Next
        </button>
      </div>
    </div>
  )
}
