import React, { useState, useEffect } from 'react'
import { grantConsent, revokeConsent, getConsents } from '../../api/hrApi'

export default function ConsentTab() {
  const [consentType, setConsentType] = useState('LOCATION')
  const [grantLoading, setGrantLoading] = useState(false)
  
  const [revokeInput, setRevokeInput] = useState('')
  const [revokeLoading, setRevokeLoading] = useState(false)

  const [consents, setConsents] = useState([])
  const [listLoading, setListLoading] = useState(false)

  const fetchConsents = async () => {
    setListLoading(true)
    try {
      const res = await getConsents()
      setConsents(res.consents || [])
    } catch (err) {
      console.error(err)
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    fetchConsents()
  }, [])

  const handleGrant = async () => {
    setGrantLoading(true)
    try {
      await grantConsent({ type: consentType, version: '1.0' })
      fetchConsents()
    } catch (err) {
      console.error(err)
    } finally {
      setGrantLoading(false)
    }
  }

  const handleRevoke = async () => {
    setRevokeLoading(true)
    try {
      // API payload expects { type }
      await revokeConsent({ type: revokeInput })
      setRevokeInput('')
      fetchConsents()
    } catch (err) {
      console.error(err)
    } finally {
      setRevokeLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Grant consent */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 text-[15px]">Grant consent</h3>
        <p className="text-sm text-gray-500 mb-4 mt-1">Required before check-in with GPS or photo.</p>
        
        <div className="flex gap-2 mb-4">
          {['LOCATION', 'PHOTO', 'TERMS'].map(t => (
            <button
              key={t}
              onClick={() => setConsentType(t)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition cursor-pointer uppercase ${
                consentType === t ? 'bg-[#059669] text-white tracking-wide shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 tracking-wide'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        
        <button 
          onClick={handleGrant} disabled={grantLoading}
          className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold tracking-wide py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          {grantLoading ? 'Granting...' : `Grant ${consentType} consent`}
        </button>
      </div>

      {/* Revoke consent */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 text-[15px] mb-3">Revoke consent</h3>
        
        <div className="space-y-3">
          <input 
            type="text" placeholder="LOCATION / PHOTO / TERMS" 
            value={revokeInput} onChange={e => setRevokeInput(e.target.value.toUpperCase())}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 uppercase placeholder:normal-case"
          />
          <button 
            onClick={handleRevoke} disabled={revokeLoading || !revokeInput}
            className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-bold tracking-wide py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {revokeLoading ? 'Revoking...' : 'Revoke consent'}
          </button>
        </div>
      </div>

      {/* My consents */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-[15px]">My consents ({consents.length})</h3>
          <button 
            onClick={fetchConsents} disabled={listLoading}
            className="px-4 py-1.5 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            {listLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {consents.length === 0 ? (
          <div className="text-gray-500 text-sm">No consent records found.</div>
        ) : (
          <div className="space-y-3">
            {consents.map(c => (
              <div key={c.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 flex justify-between items-center">
                <div className="font-bold text-[#059669] text-[13px] tracking-wider">{c.type}</div>
                <div className="text-xs text-gray-500">v{c.version}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
