import { useState } from 'react'
import { previewBatch, distributeBatch } from '../../api/coldCallApi'

export default function BatchesTab() {
  const [batchId, setBatchId] = useState('')
  const [dryRun, setDryRun] = useState(true)
  const [force, setForce] = useState(false)
  const [previewResult, setPreviewResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handlePreview = async () => {
    if (!batchId) return
    setLoading(true)
    try {
      const data = await previewBatch(batchId)
      setPreviewResult(data)
    } catch (err) {
      setPreviewResult(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDistribute = async () => {
    if (!batchId) return
    setLoading(true)
    try {
      const data = await distributeBatch(batchId, { dryRun, force })
      setPreviewResult(data)
    } catch (err) {
      setPreviewResult(err.response?.data || { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Batch preview / distribute</h3>
        
        <input
          type="text"
          placeholder="batchId"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg p-2.5 mb-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
        />

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="cursor-pointer bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            Preview
          </button>
          <button
            onClick={() => setDryRun(!dryRun)}
            className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition ${
              dryRun ? 'bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-500'
            }`}
          >
            dryRun: {dryRun.toString()}
          </button>
          <button
            onClick={() => setForce(!force)}
            className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition ${
              force ? 'bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-500'
            }`}
          >
            force: {force.toString()}
          </button>
        </div>

        <button
          onClick={handleDistribute}
          disabled={loading}
          className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
        >
          Distribute
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Preview result</h3>
        <p className="text-gray-500 text-xs mb-3">This is whatever backend returns for preview/distribute.</p>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px] max-h-[400px] overflow-auto text-xs font-mono text-gray-700 whitespace-pre-wrap">
          {previewResult ? JSON.stringify(previewResult, null, 2) : '—'}
        </div>
      </div>
    </div>
  )
}
