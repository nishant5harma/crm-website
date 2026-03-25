import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import MyAttendanceTab from '../components/Attendance/MyAttendanceTab'
import TeamViewTab from '../components/Attendance/TeamViewTab'

export default function AttendancePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('my_attendance')

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Area */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="text-xs font-bold text-green-600 tracking-wider uppercase mb-1">
          {user?.roles?.[0]?.name || 'HR'} • ATTENDANCE
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {user?.name || 'User'}
        </h1>
        <div className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
          <span>ID: {user?.id || '—'}</span>
          <span>·</span>
          <span>No push token</span>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('my_attendance')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'my_attendance'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Attendance
          </button>
          {(!user?.roles?.[0]?.name || ['superadmin', 'Super Admin', 'HR Manager', 'Team Manager'].includes(user?.roles?.[0]?.name?.toLowerCase() || user?.roles?.[0]?.name)) && (
            <button
              onClick={() => setActiveTab('team_view')}
              className={`cursor-pointer px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === 'team_view'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Team View
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 bg-gray-50/50 overflow-y-auto w-full">
        {activeTab === 'my_attendance' && <MyAttendanceTab />}
        {activeTab === 'team_view' && <TeamViewTab />}
      </div>
    </div>
  )
}
