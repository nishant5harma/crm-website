import { useState } from 'react'
import AgentTab from '../components/ColdCall/AgentTab'
import BatchesTab from '../components/ColdCall/BatchesTab'
import ReportsTab from '../components/ColdCall/ReportsTab'
import AnalyticsTab from '../components/ColdCall/AnalyticsTab'
import QuotaTab from '../components/ColdCall/QuotaTab'

const TABS = [
  { id: 'agent', label: 'Agent', component: AgentTab, desc: 'Call and log attempts' },
  { id: 'batches', label: 'Batches', component: BatchesTab, desc: 'Upload and distribute' },
  { id: 'reports', label: 'Reports', component: ReportsTab, desc: 'View call history' },
  { id: 'analytics', label: 'Analytics', component: AnalyticsTab, desc: 'Performance metrics' },
  { id: 'quota', label: 'Quotas', component: QuotaTab, desc: 'Set team targets' },
]

export default function ColdCallPage() {
  const [activeTab, setActiveTab] = useState('agent')

  const tab = TABS.find((t) => t.id === activeTab)
  const ActiveComponent = tab?.component
  const activeDesc = tab?.desc || ''

  return (
    <div className="p-6 w-full flex flex-col h-full bg-white">
      <div className="mb-6">
        <div className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-1">
          Cold Calls
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cold call module</h1>
        <p className="text-gray-500 text-sm">{activeDesc}</p>
      </div>

      <div className="bg-gray-100 rounded-full p-1 inline-flex mb-8 self-start border border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div className="p-10 text-center text-gray-400">Loading component...</div>
        )}
      </div>
    </div>
  )
}
