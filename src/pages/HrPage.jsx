import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import HrMyAttendanceTab from '../components/Attendance/HrMyAttendanceTab'
import TeamViewTab from '../components/Attendance/TeamViewTab'
import LocationTab from '../components/Attendance/LocationTab'
import DevicesTab from '../components/Attendance/DevicesTab'
import ConsentTab from '../components/Attendance/ConsentTab'

export default function HrPage() {
  const { user } = useAuth()
  
  // Default to my_attendance
  const [activeTab, setActiveTab] = useState('my_attendance')

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Area */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="text-xs font-bold text-[#059669] tracking-wider uppercase mb-1">
          HR
        </div>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-1">
          HR & Attendance
        </h1>
        <div className="text-[13px] text-gray-500 mb-6">
          {user?.roles?.[0]?.name || 'Employee'} &middot; Attendance, location, devices, consent.
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveTab('my_attendance')}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'my_attendance' ? 'bg-[#059669] text-white shadow-sm' : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            My Attendance
          </button>

          {(!user?.roles?.[0]?.name || ['superadmin', 'Super Admin', 'HR Manager', 'Team Manager'].includes(user?.roles?.[0]?.name?.toLowerCase() || user?.roles?.[0]?.name)) && (
            <button
              onClick={() => setActiveTab('team_view')}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'team_view' ? 'bg-[#059669] text-white shadow-sm' : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
              }`}
            >
              Team View
            </button>
          )}

          <button
            onClick={() => setActiveTab('location')}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'location' ? 'bg-[#059669] text-white shadow-sm' : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            Location
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'devices' ? 'bg-[#059669] text-white shadow-sm' : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            Devices
          </button>

          <button
            onClick={() => setActiveTab('consent')}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'consent' ? 'bg-[#059669] text-white shadow-sm' : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
            }`}
          >
            Consent
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 bg-gray-50/30 overflow-y-auto w-full">
        {activeTab === 'my_attendance' && <HrMyAttendanceTab />}
        {activeTab === 'team_view' && <TeamViewTab />}
        {activeTab === 'location' && <LocationTab />}
        {activeTab === 'devices' && <DevicesTab />}
        {activeTab === 'consent' && <ConsentTab />}
      </div>
    </div>
  )
}
