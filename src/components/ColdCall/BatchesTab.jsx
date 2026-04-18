import { useState, useEffect } from 'react'
import { listBatches, uploadColdCallBatch, distributeBatch } from '../../api/coldCallApi'
import api from '../../api/axios'

export default function BatchesTab() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  // Upload Form State
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState('manual')
  const [dedupePolicy, setDedupePolicy] = useState('keep')
  const [selectedTeam, setSelectedTeam] = useState('Sales')
  const [routingConfig, setRoutingConfig] = useState('')
  const [recentUpload, setRecentUpload] = useState(null)

  const fetchBatches = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await listBatches()
      
      // Exhaustive data extraction
      let entries = []
      if (Array.isArray(resp)) {
        entries = resp
      } else if (resp && typeof resp === 'object') {
        // Step 1: Check root level
        entries = resp.rows || resp.data || resp.entries || resp.preview || resp.items || []
        
        // Step 2: If we found an object instead of array (e.g. resp.data is the wrapper), dig deeper
        if (!Array.isArray(entries) || entries.length === 0) {
          const body = resp.data || resp
          if (body && typeof body === 'object') {
            entries = body.rows || body.data || body.entries || body.items || body.preview || []
          }
        }
        
        // Step 3: Final fallback - find ANY array in the response (useful for 91kB mystery data)
        if (!Array.isArray(entries) || entries.length === 0) {
          const firstFoundArray = Object.values(resp).find(v => Array.isArray(v) && v.length > 0)
          if (firstFoundArray) entries = firstFoundArray
        }
      }

      // Ensure entries is an array
      const entriesToProcess = Array.isArray(entries) ? entries : []

      // Group entries by batchId
      const batchMap = {}
      entriesToProcess.forEach(entry => {
        if (!entry) return
        const bid = entry.batchId || 'unknown'
        if (!batchMap[bid]) {
          batchMap[bid] = {
            id: bid,
            createdAt: entry.createdAt,
            count: 0,
            stats: { pending: 0, in_progress: 0, completed: 0 }
          }
        }
        batchMap[bid].count++
        const status = (entry.status || '').toLowerCase()
        if (status === 'pending') batchMap[bid].stats.pending++
        else if (status === 'in_progress') batchMap[bid].stats.in_progress++
        else if (status === 'done' || status === 'completed') batchMap[bid].stats.completed++
      })

      const derivedBatches = Object.values(batchMap).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )

      setBatches(derivedBatches)
    } catch (err) {
      console.error('Fetch Batches Error:', err)
      // If it's a 404, we don't want to show a scary error to the user right after a success
      if (err.response?.status === 404) {
        setBatches([])
      } else {
        const msg = err.response?.data?.message || err.response?.data?.error || err.message
        setError(`Error: ${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Please choose a file first')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', mode)
      formData.append('dedupePolicy', dedupePolicy)
      
      // Fixed: Most multi-part parsers expect array fields as key[] or multiple keys
      if (selectedTeam === 'Sales') {
        formData.append('teamIds[]', 'cmmz98djx000lpd1mvx0wv07b')
      }
      
      if (routingConfig) formData.append('routingConfig', routingConfig)

      const res = await uploadColdCallBatch(formData)
      // Store the result locally to show it immediately
      setRecentUpload({
        id: res.batchId || res.data?.batchId || 'new-batch',
        count: res.created || res.total || 0,
        createdAt: new Date().toISOString(),
        stats: { pending: res.created || 0, in_progress: 0, completed: 0 }
      })
      
      alert('Batch uploaded successfully! Now distribute it to the teams.')
      setFile(null)
      fetchBatches()
    } catch (err) {
      console.error('Upload Error:', err)
      const errorData = err.response?.data
      const msg = typeof errorData === 'object' ? JSON.stringify(errorData, null, 2) : (errorData?.message || errorData?.error || err.message)
      alert(`Upload failed: ${msg}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDistribute = async (batchId) => {
    if (!window.confirm('Distribute this batch to teams?')) return
    try {
      await distributeBatch(batchId, { dryRun: false, force: false })
      alert('Batch distributed successfully!')
      fetchBatches()
    } catch (err) {
      alert('Distribution failed: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* All Batches Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">All Batches</h3>
            <p className="text-sm text-gray-500 mt-1">{batches.length} batches found</p>
          </div>
          <button
            onClick={fetchBatches}
            disabled={loading}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-bold bg-gray-50 text-gray-700 rounded-2xl hover:bg-gray-100 border border-gray-100 transition"
          >
            {loading ? '...' : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        {error && (
           <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 text-xs font-bold">
             ⚠️ {error}
           </div>
        )}

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {recentUpload && !batches.find(b => b.id === recentUpload.id) && (
            <div className="p-5 bg-[#0086a8]/5 border border-[#0086a8]/20 rounded-3xl animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <span className="bg-[#0086a8] text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider h-fit">
                    Just Uploaded
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">#{recentUpload.id}</h4>
                    <p className="text-[10px] text-[#0086a8] font-bold mt-0.5">Processing in background...</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-black text-gray-900 text-lg leading-none">{recentUpload.count}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">entries</span>
                </div>
              </div>
            </div>
          )}

          {batches.length === 0 && !loading && !error && !recentUpload && (
            <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No batches found in entries report.</p>
            </div>
          )}
          
          {batches.map((batch) => (
            <div key={batch.id} className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-indigo-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <span className="bg-gray-800 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider h-fit">
                    Batch
                  </span>
                  <div className="flex flex-col">
                    <h4 className="font-bold text-gray-900 text-sm truncate max-w-[150px] lg:max-w-xs">Batch #{batch.id?.substring(0,8)}...</h4>
                    <div className="flex gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      <span>{new Date(batch.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      <span>·</span>
                      <span>{batch.count || 0} items</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block font-black text-gray-900 text-lg leading-none">{batch.count || 0}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">entries</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                 <div className="bg-amber-50 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-100">
                   {batch.stats?.pending || 0} pending
                 </div>
                 <div className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-100">
                   {batch.stats?.in_progress || 0} in progress
                 </div>
                 <div className="bg-gray-50 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full border border-gray-100">
                   {batch.stats?.completed || 0} done
                 </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                <button
                  onClick={() => handleDistribute(batch.id)}
                  className="cursor-pointer bg-[#0086a8] hover:bg-[#007491] text-white text-[11px] font-black px-6 py-2 rounded-xl shadow-lg shadow-[#0086a8]/20 transition active:scale-95"
                >
                  Distribute to Teams
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload New Batch Section */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Upload New Batch</h3>
        <p className="text-xs text-gray-400 mb-6 font-medium">CSV / XLS / XLSX · requires coldcall.upload permission</p>
        
        <div className="space-y-6">
          {/* File Picker */}
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="batchFile"
              accept=".csv,.xls,.xlsx"
            />
            <label
              htmlFor="batchFile"
              className="cursor-pointer w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50/30 transition text-gray-600 font-bold gap-2 text-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {file ? file.name : 'Choose file (.csv / .xls / .xlsx)'}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Mode Toggles */}
             <div>
               <div className="flex bg-gray-50 p-1 rounded-2xl gap-1">
                 {['manual', 'decorator'].map(m => (
                   <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`cursor-pointer flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      mode === m ? 'bg-[#0086a8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
                    }`}
                   >
                     {m}
                   </button>
                 ))}
               </div>
             </div>

             {/* Dedupe Toggles */}
             <div>
               <div className="flex bg-gray-50 p-1 rounded-2xl gap-1">
                 {['keep', 'skip'].map(d => (
                   <button
                    key={d}
                    onClick={() => setDedupePolicy(d)}
                    className={`cursor-pointer flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      dedupePolicy === d ? 'bg-[#057a55] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
                    }`}
                   >
                     {d}
                   </button>
                  ))}
               </div>
             </div>
          </div>

          {/* Team Assignment */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assign to teams (optional)</p>
            <div className="flex gap-2">
               <button
                 onClick={() => setSelectedTeam('Sales')}
                 className={`cursor-pointer px-5 py-2 rounded-full text-xs font-bold border transition-all ${
                   selectedTeam === 'Sales' ? 'bg-[#0086a8] border-[#0086a8] text-white' : 'bg-white border-gray-200 text-gray-600'
                 }`}
               >
                 Sales
               </button>
            </div>
          </div>

          {/* Routing Config */}
          <textarea
            placeholder="routingConfig JSON (optional, decorator mode only)"
            value={routingConfig}
            onChange={(e) => setRoutingConfig(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none h-24 placeholder:text-gray-400"
          />

          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="cursor-pointer w-full bg-[#0086a8]/10 text-[#0086a8] hover:bg-[#0086a8] hover:text-white font-black py-4 rounded-2xl text-base shadow-sm transform active:scale-[0.99] transition-all disabled:opacity-30 flex items-center justify-center"
          >
            {uploading ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : 'Upload Batch'}
          </button>
        </div>
      </div>
    </div>
  )
}
