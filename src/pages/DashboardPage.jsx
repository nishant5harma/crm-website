import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('30D')
  
  // Real stats
  const [stats, setStats] = useState({
    projectsCount: 2,
    projectsList: [],
    employeesList: [],
    availableUnits: 0,
    soldUnits: 0,
    presentList: [],
    activeLeads: 0,
    dueToday: 0
  })

  useEffect(() => {
    const fetchMinimalData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const todayStart = `${today}T00:00:00.000Z`
        const todayEnd = `${today}T23:59:59.999Z`

        const [usersRes, projRes, availUnitsRes, soldUnitsRes, attRes, leadsRes, followRes] = await Promise.allSettled([
          api.get('/users'),
          api.get('/inventory/projects'),
          api.get('/api/inventory/units', { params: { status: 'AVAILABLE', limit: 1 } }).catch(() => api.get('/inventory/units', { params: { status: 'AVAILABLE', limit: 1 } })),
          api.get('/api/inventory/units', { params: { status: 'SOLD', limit: 1 } }).catch(() => api.get('/inventory/units', { params: { status: 'SOLD', limit: 1 } })),
          api.get('/hr/attendance', { params: { from: todayStart, to: todayEnd, limit: 500 } }).catch(() => api.get('/api/hr/attendance', { params: { from: todayStart, to: todayEnd, limit: 500 } })),
          api.get('/leads', { params: { limit: 1 } }),
          api.get('/leads/followup/admin', { params: { from: todayStart, to: todayEnd, limit: 1 } })
        ])
        
        let eList = []
        if (usersRes.status === 'fulfilled') eList = Array.isArray(usersRes.value.data) ? usersRes.value.data : (usersRes.value.data?.users || [])
        
        let pList = []
        if (projRes.status === 'fulfilled') pList = projRes.value.data?.items || projRes.value.data?.data || []

        const getCount = (res) => {
          if (res.status !== 'fulfilled') return 0
          const d = res.value.data
          return d?.total ?? d?.meta?.total ?? d?.count ?? Array.isArray(d?.items) ? d.items.length : 0
        }

        const presentItems = attRes.status === 'fulfilled' ? (attRes.value.data?.rows || attRes.value.data?.data || []) : []
        
        setStats({
          projectsCount: getCount(projRes) || 2,
          projectsList: pList.slice(0, 2),
          employeesList: eList,
          availableUnits: getCount(availUnitsRes),
          soldUnits: getCount(soldUnitsRes),
          presentList: presentItems,
          activeLeads: getCount(leadsRes),
          dueToday: getCount(followRes)
        })
      } catch (e) {
        // Safe fail
      } finally {
        setLoading(false)
      }
    }
    fetchMinimalData()
  }, [])

  // Derived state
  const totalEmps = stats.employeesList.length || 3
  const presentCount = stats.presentList.length
  const absentCount = Math.max(0, totalEmps - presentCount)
  const presentPct = totalEmps > 0 ? Math.round((presentCount / totalEmps) * 100) : 0
  const absentPct = totalEmps > 0 ? 100 - presentPct : 100

  const presentIds = new Set(stats.presentList.map(a => a.userId))
  const absentNames = stats.employeesList.filter(e => !presentIds.has(e.id)).map(e => e.name || e.email)
  
  const totalUnits = stats.availableUnits + stats.soldUnits
  const unitsSoldPct = totalUnits > 0 ? Math.round((stats.soldUnits / totalUnits) * 100) : 0

  return (
    <div className="bg-[#f8fafc] min-h-full pb-20 overflow-x-hidden">
      {/* Header Area */}
      <div className="pt-6 px-4 md:px-8 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
            High-Velocity CRM
          </h1>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex justify-between items-center mb-6 text-sm">
          <div className="flex gap-2">
            <div 
              onClick={() => setActiveFilter('30D')}
              className={`${activeFilter === '30D' ? 'bg-[#2563eb] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'} font-bold px-4 py-1.5 rounded-full cursor-pointer transition`}
            >
              30D
            </div>
            <div 
              onClick={() => setActiveFilter('Team')}
              className={`${activeFilter === 'Team' ? 'bg-[#2563eb] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'} font-medium px-4 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition`}
            >
              Team
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
          <div className="text-gray-400 font-medium flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
            Updated just now
          </div>
        </div>

        {/* Horizontal Carousel Summary Cards */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
          {/* Card 1: Active Leads */}
          <div className={`min-w-[280px] w-[85%] md:w-[320px] bg-[#2563eb] rounded-3xl p-6 text-white shadow-lg relative flex-shrink-0 snap-center transition-all duration-300 ${activeFilter === '30D' ? 'order-1' : 'order-2'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full blur-2xl"></div>
            <div className="flex justify-between items-start mb-2 relative z-10">
              <span className="font-semibold tracking-wide text-white/90">Active Leads</span>
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                ↑ +5%
              </span>
            </div>
            <div className="text-5xl font-extrabold mb-1 relative z-10 tracking-tight">{stats.activeLeads}</div>
            <div className="text-white/70 text-xs font-medium relative z-10 w-full truncate">Requires immediate follow-up</div>
          </div>

          {/* Card 2: Teams & Members */}
          <div className={`min-w-[280px] w-[85%] md:w-[320px] bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-shrink-0 snap-center flex flex-col justify-between transition-all duration-300 ${activeFilter === '30D' ? 'order-2' : 'order-1'}`}>
            <div>
              <div className="text-sm font-bold text-gray-900">Teams & Members</div>
              <div className="text-xs text-gray-400 mt-0.5">{stats.employeesList.length > 0 ? 'Active' : '1 teams'}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mt-4">
              <div className="text-sm font-bold text-gray-800">Sales</div>
              <div className="text-[11px] font-semibold text-gray-500 mt-0.5">{stats.employeesList.length} members</div>
              <div className="text-xs text-gray-400 mt-1 truncate">{stats.employeesList.map(e=>e.name?.split(' ')[0]||'User').slice(0,3).join(', ')}</div>
            </div>
          </div>

          {/* Card 3: Win Rate */}
          <div className="min-w-[280px] w-[85%] md:w-[320px] bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-shrink-0 snap-center flex flex-col justify-center order-3">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10c1.7 0 3 1.3 3 3t-3 3H7c-1.7 0-3-1.3-3-3s1.3-3 3-3zM7 10v7c0 2.8 2.2 5 5 5s5-2.2 5-5v-7"/></svg>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">0%</div>
            <div className="text-sm font-bold text-gray-900 mt-1">Win Rate</div>
            <div className="text-xs text-gray-400 mt-0.5">Last 30 days</div>
          </div>
        </div>



        {/* Action Block */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Today's Action Block</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            {/* Row 1 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <span className="font-semibold text-[15px] text-gray-800">Due Today</span>
              </div>
              <span className="bg-blue-50 text-blue-600 font-bold px-3 py-0.5 rounded-full text-sm">{stats.dueToday}</span>
            </div>
            {/* Row 2 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <span className="font-semibold text-[15px] text-red-500">Overdue</span>
              </div>
              <span className="bg-red-50 text-red-500 font-bold px-3 py-0.5 rounded-full text-sm">0</span>
            </div>
            {/* Row 3 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-blue-100 flex items-center justify-center text-blue-500 bg-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <span className="font-semibold text-[15px] text-gray-800">Due This Week</span>
              </div>
              <span className="bg-blue-50 text-blue-600 font-bold px-3 py-0.5 rounded-full text-sm">0</span>
            </div>
            {/* Row 4 */}
            <div className="flex justify-between items-center p-4 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
                </div>
                <span className="font-semibold text-[15px] text-gray-800">No Activity 3+ Days</span>
              </div>
              <span className="bg-purple-50 text-purple-600 font-bold px-3 py-0.5 rounded-full text-sm">0</span>
            </div>
          </div>
          
          <button className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer">
            Open Task Queue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>

        {/* Attendance Block */}
        <div className="mb-10 w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Today Attendance</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 w-full">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-sm text-gray-900">Total employees: {totalEmps}</span>
              <span className="text-xs font-semibold text-gray-400">Present {presentCount} &bull; Absent {absentCount}</span>
            </div>

            {/* Vertical Bars Chart Mock */}
            <div className="flex max-w-[200px] mx-auto justify-around items-end h-32 mb-4 w-full">
               <div className="flex flex-col items-center gap-3 w-16">
                  <div className="w-12 h-24 bg-[#e2e8f0] rounded-t-xl rounded-b-sm relative overflow-hidden flex items-end">
                     <div className="w-full bg-[#10b981] transition-all" style={{ height: `${presentPct}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-[#059669]">Present {presentPct}%</span>
               </div>
               <div className="flex flex-col items-center gap-3 w-16">
                  <div className="w-12 h-24 bg-[#fef2f2] rounded-t-xl rounded-b-sm relative overflow-hidden flex items-end border border-red-50">
                     <div className="w-full bg-[#f87171] transition-all" style={{ height: `${absentPct}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-[#b91c1c]">Absent {absentPct}%</span>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
               <div className="flex-1 bg-[#f0fdf4] rounded-xl p-4 border border-[#bbf7d0]/50">
                  <div className="text-[13px] font-bold text-[#166534] mb-1">Present Employees</div>
                  <div className="text-xs text-[#15803d]">
                    {stats.presentList.length > 0 ? stats.presentList.map(p => p?.user?.name || 'User').join(', ') : 'No one marked present yet.'}
                  </div>
               </div>
               <div className="flex-1 bg-[#fef2f2] rounded-xl p-4 border border-[#fecaca]/50">
                  <div className="text-[13px] font-bold text-[#991b1b] mb-1">Absent Employees</div>
                  <div className="text-xs text-[#b91c1c] truncate">
                    {absentNames.length > 0 ? absentNames.slice(0, 3).join(', ') + (absentNames.length > 3 ? '...' : '') : 'None'}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Inventory Health */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Inventory Health</h2>
          <div className="bg-[#0b132b] rounded-3xl p-6 shadow-lg">
            <div className="flex gap-10 mb-6">
              <div>
                <div className="text-[11px] font-semibold tracking-wider text-gray-400 mb-1">TOTAL PROJECTS</div>
                <div className="text-4xl font-extrabold text-white tracking-tight">{stats.projectsCount}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-wider text-gray-400 mb-1">TOTAL UNITS</div>
                <div className="text-4xl font-extrabold text-white tracking-tight">{totalUnits}</div>
              </div>
            </div>

            <div className="w-full bg-[#1c2642] h-2 rounded-full mb-3 flex overflow-hidden">
               <div className="bg-[#10b981] h-full transition-all" style={{ width: `${unitsSoldPct}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 font-medium pb-5 border-b border-[#1c2642]">
              <span>{stats.availableUnits} Available</span>
              <span>{stats.soldUnits} Sold/Booked</span>
            </div>

            <div className="mt-4 space-y-3 mb-6">
              {stats.projectsList.length > 0 ? stats.projectsList.map((proj, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-[#1c2642] last:border-0 last:pb-0">
                  <span className="text-[13px] font-semibold text-gray-200">{proj.name || 'Project Name'}</span>
                  <span className="bg-[#064e3b] text-[#10b981] text-[11px] font-bold px-2.5 py-1 rounded-md">
                    {proj.stats?.soldPct || '0% Sold'}
                  </span>
                </div>
              )) : (
                <div className="text-sm text-gray-500">No active inventory entries</div>
              )}
            </div>

            <Link to="/inventory" className="w-full border border-[#1e293b] hover:bg-[#1e293b]/50 text-white font-bold py-3.5 rounded-2xl transition flex items-center justify-center shadow-sm cursor-pointer block text-center mt-2 group text-sm">
              Open Inventory <span className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-2 transition-all">→</span>
            </Link>
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-lg font-bold text-[#b91c1c] flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              Risk Alerts
            </h2>
            <svg className="text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </div>
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            {/* Risk Alert 1 */}
            <div className="flex items-start gap-4 p-3 border-b border-gray-50 mb-1 last:border-0 last:mb-0">
              <div className="w-10 h-10 rounded-2xl bg-[#fff1f2] flex items-center justify-center text-[#e11d48] flex-shrink-0">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-gray-900 text-[14px] mb-0.5">High-value leads expired</h3>
                <p className="text-gray-400 font-medium text-[12px]">0 leads with total 0.0 value are uncontacted</p>
              </div>
            </div>
            
            {/* Risk Alert 2 */}
            <div className="flex items-start gap-4 p-3 border-b border-gray-50 mb-1 last:border-0 last:mb-0">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-gray-900 text-[14px] mb-0.5">Unassigned leads</h3>
                <p className="text-gray-400 font-medium text-[12px]">0 leads from Website source need owners</p>
              </div>
            </div>

            {/* Risk Alert 3 */}
            <div className="flex items-start gap-4 p-3 border-b border-gray-50 mb-1 last:border-0 last:mb-0">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-gray-900 text-[14px] mb-0.5">Follow-ups overdue {'>'}24h</h3>
                <p className="text-gray-400 font-medium text-[12px]">0 critical tasks missed across the team</p>
              </div>
            </div>
          </div>
        </div>

        {/* Org Overview */}
        <div className="mb-10 w-full">
           <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Org Overview</h2>
           <div className="flex gap-4">
              <div className="flex-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                 <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                 </div>
                 <div className="text-3xl font-extrabold text-gray-900">{totalEmps}</div>
                 <div className="text-xs text-gray-400 font-semibold mt-1">Employees</div>
              </div>
              
              <div className="flex-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10c1.7 0 3 1.3 3 3t-3 3H7c-1.7 0-3-1.3-3-3s1.3-3 3-3zM7 10v7c0 2.8 2.2 5 5 5s5-2.2 5-5v-7"/></svg>
                 </div>
                 <div className="text-3xl font-extrabold text-gray-900">1</div>
                 <div className="text-xs text-gray-400 font-semibold mt-1">Teams</div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
