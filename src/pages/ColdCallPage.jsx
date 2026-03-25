import { useState } from 'react'
import AgentTab from '../components/ColdCall/AgentTab'
import BatchesTab from '../components/ColdCall/BatchesTab'
import ReportsTab from '../components/ColdCall/ReportsTab'
import AnalyticsTab from '../components/ColdCall/AnalyticsTab'
import QuotaTab from '../components/ColdCall/QuotaTab'

const TABS = [
  { id: 'agent', label: 'Agent', component: AgentTab, desc: 'Pull, lock, attempt, and complete calls.' },
  { id: 'batches', label: 'Batches', component: BatchesTab, desc: 'Preview and distribute uploaded batches to teams.' },
  { id: 'reports', label: 'Reports', component: ReportsTab, desc: 'Filterable report of entries and distribution.' },
  { id: 'analytics', label: 'Analytics', component: AnalyticsTab, desc: 'Leaderboard and performance analytics.' },
  { id: 'quota', label: 'Quota', component: QuotaTab, desc: 'Quota targets and progress.' },
]

export default function ColdCallPage() {
  const [activeTab, setActiveTab] = useState('agent')

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || AgentTab
  const activeDesc = TABS.find((t) => t.id === activeTab)?.desc

  return (
    <div className="p-6 w-full flex flex-col h-full">
      <div className="mb-6">
        <div className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-1">
          Cold Calls
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cold call module</h1>
        <p className="text-gray-500 text-sm">{activeDesc}</p>
      </div>

      <div className="bg-gray-50 rounded-full p-1 inline-flex mb-8 self-start shadow-sm border border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-900/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        <ActiveComponent />
      </div>
    </div>
  )
}
