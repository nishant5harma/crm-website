import React, { useState } from 'react'
import { createLocationRequest, getLocationResult, respondToLocationRequest } from '../../api/hrApi'

export default function LocationTab() {
  // Request State
  const [reqTargetData, setReqTargetData] = useState({ targetUserId: '', note: '', expiresInSeconds: 60 })
  const [reqLoading, setReqLoading] = useState(false)
  const [reqMsg, setReqMsg] = useState(null)

  // Read State
  const [readId, setReadId] = useState('')
  const [readLoading, setReadLoading] = useState(false)
  const [readMsg, setReadMsg] = useState(null)

  // Respond State
  const [respData, setRespData] = useState({ requestId: '', latitude: '', longitude: '' })
  const [respLoading, setRespLoading] = useState(false)
  const [respMsg, setRespMsg] = useState(null)

  const handleRequest = async () => {
    setReqLoading(true)
    setReqMsg(null)
    try {
      const res = await createLocationRequest({
        targetUserId: reqTargetData.targetUserId,
        note: reqTargetData.note || undefined,
        expiresInSeconds: parseInt(reqTargetData.expiresInSeconds) || 60
      })
      setReqMsg({ type: 'success', text: `Request created: ${res.requestId}` })
    } catch (err) {
      setReqMsg({ type: 'error', text: err.response?.data?.error || 'Failed to create request' })
    } finally {
      setReqLoading(false)
    }
  }

  const handleRead = async () => {
    setReadLoading(true)
    setReadMsg(null)
    try {
      const res = await getLocationResult(readId)
      const c = res.coords
      setReadMsg({ type: 'success', text: `Lat: ${c.latitude}, Lng: ${c.longitude}, Acc: ${c.accuracy}m` })
    } catch (err) {
      setReadMsg({ type: 'error', text: err.response?.data?.error || 'Failed to read result' })
    } finally {
      setReadLoading(false)
    }
  }

  const handleRespond = async () => {
    setRespLoading(true)
    setRespMsg(null)
    try {
      await respondToLocationRequest(respData.requestId, {
        latitude: parseFloat(respData.latitude),
        longitude: parseFloat(respData.longitude),
        accuracy: 10,
        recordedAt: new Date().toISOString()
      })
      setRespMsg({ type: 'success', text: 'Responded successfully' })
    } catch (err) {
      setRespMsg({ type: 'error', text: err.response?.data?.error || 'Failed to respond' })
    } finally {
      setRespLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Request employee location */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 text-lg">Request employee location</h3>
        <p className="text-sm text-gray-500 mb-4 mt-1">Needs <span className="text-gray-400">location.request</span> permission.</p>
        
        <div className="space-y-3">
          <input 
            type="text" placeholder="Target userId" 
            value={reqTargetData.targetUserId} onChange={e => setReqTargetData({...reqTargetData, targetUserId: e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5b5fd8]"
          />
          <input 
            type="text" placeholder="Note (optional)" 
            value={reqTargetData.note} onChange={e => setReqTargetData({...reqTargetData, note: e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5b5fd8]"
          />
          <input 
            type="number" placeholder="Expires in seconds" 
            value={reqTargetData.expiresInSeconds} onChange={e => setReqTargetData({...reqTargetData, expiresInSeconds: e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5b5fd8]"
          />
          <button 
            onClick={handleRequest} disabled={reqLoading || !reqTargetData.targetUserId}
            className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50 mt-2"
          >
            {reqLoading ? 'Sending...' : 'Send location request'}
          </button>
          {reqMsg && <div className={`text-sm mt-2 ${reqMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{reqMsg.text}</div>}
        </div>
      </div>

      {/* Read location result */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 text-[15px] mb-3">Read location result (one-time)</h3>
        
        <div className="space-y-3">
          <input 
            type="text" placeholder="requestId" 
            value={readId} onChange={e => setReadId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
          />
          <button 
            onClick={handleRead} disabled={readLoading || !readId}
            className="w-full bg-[#0f172a] hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {readLoading ? 'Reading...' : 'Read result'}
          </button>
          {readMsg && <div className={`text-sm mt-2 ${readMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{readMsg.text}</div>}
        </div>
      </div>

      {/* Respond to location request */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 text-[15px]">Respond to location request</h3>
        <p className="text-sm text-gray-500 mb-4 mt-1">Employee responds with GPS when supervisor requests location.</p>
        
        <div className="space-y-3">
          <input 
            type="text" placeholder="requestId" 
            value={respData.requestId} onChange={e => setRespData({...respData, requestId: e.target.value})}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
          />
          <div className="flex gap-3">
            <input 
              type="number" placeholder="Latitude" 
              value={respData.latitude} onChange={e => setRespData({...respData, latitude: e.target.value})}
              className="w-1/2 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
            <input 
              type="number" placeholder="Longitude" 
              value={respData.longitude} onChange={e => setRespData({...respData, longitude: e.target.value})}
              className="w-1/2 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
          </div>
          <button 
            onClick={handleRespond} disabled={respLoading || !respData.requestId || !respData.latitude}
            className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50 mt-2"
          >
            {respLoading ? 'Sending...' : 'Send location response'}
          </button>
          {respMsg && <div className={`text-sm mt-2 ${respMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{respMsg.text}</div>}
        </div>
      </div>

    </div>
  )
}
