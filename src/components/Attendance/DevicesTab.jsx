import React, { useState, useEffect } from 'react'
import { registerDevice, getDevices } from '../../api/hrApi'

export default function DevicesTab() {
  const [deviceId, setDeviceId] = useState('')
  const [platform, setPlatform] = useState('android')
  const [pushToken, setPushToken] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState(null)

  const [devices, setDevices] = useState([])
  const [listLoading, setListLoading] = useState(false)

  const fetchDevices = async () => {
    setListLoading(true)
    try {
      const res = await getDevices()
      setDevices(res.devices || [])
    } catch (err) {
      console.error(err)
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleRegister = async () => {
    setRegLoading(true)
    setRegError(null)
    try {
      await registerDevice({ deviceId, platform, pushToken: pushToken || undefined })
      setDeviceId('')
      setPushToken('')
      fetchDevices()
    } catch (err) {
      setRegError(err.response?.data?.error || 'Failed to register device')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Register device */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 text-[15px]">Register device</h3>
        <p className="text-sm text-gray-500 mb-4 mt-1">
          Call on every login to enable push notifications for lead assignment, location requests, etc.
        </p>
        
        <div className="space-y-3">
          <input 
            type="text" placeholder="deviceId (unique ID for this device)" 
            value={deviceId} onChange={e => setDeviceId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
          />
          
          <div className="flex gap-2">
            {['android', 'ios', 'web'].map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition cursor-pointer capitalize ${
                  platform === p ? 'bg-[#0f172a] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <input 
            type="text" placeholder="pushToken (optional, ExponentPushToken[...])" 
            value={pushToken} onChange={e => setPushToken(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0f172a]"
          />
          
          <button 
            onClick={handleRegister} disabled={regLoading || !deviceId}
            className="w-full bg-[#0f172a] hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50 mt-2"
          >
            {regLoading ? 'Registering...' : 'Register device'}
          </button>
          {regError && <div className="text-sm mt-2 text-red-500">{regError}</div>}
        </div>
      </div>

      {/* Registered devices */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-[15px]">Registered devices ({devices.length})</h3>
          <button 
            onClick={fetchDevices} disabled={listLoading}
            className="px-4 py-1.5 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            {listLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {devices.length === 0 ? (
          <div className="text-gray-500 text-sm">No devices registered.</div>
        ) : (
          <div className="space-y-3">
            {devices.map(d => (
              <div key={d.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="font-semibold text-gray-800 text-sm">{d.deviceId}</div>
                <div className="text-xs text-gray-500 mt-0.5">Platform: {d.platform} {d.pushToken && `· Has Token`}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
