import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ label, value, icon, gradient, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-7 w-12 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    employees: null,
    teams: null,
    projects: null,
    availableUnits: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const results = await Promise.allSettled([
        api.get('/users'),
        api.get('/teams'),
        api.get('/inventory/projects'),
        api.get('/inventory/units', { params: { status: 'AVAILABLE', limit: 1 } }),
      ])

      const get = (res, extractor) => {
        if (res.status === 'fulfilled') {
          try { return extractor(res.value.data) } catch { return '—' }
        }
        return '—'
      }

      setStats({
        employees: get(results[0], d => {
          const list = Array.isArray(d) ? d : (d?.users ?? d?.data ?? [])
          return list.length
        }),
        teams: get(results[1], d => {
          const list = Array.isArray(d) ? d : (d?.teams ?? d?.items ?? d?.data ?? [])
          return list.length
        }),
        projects: get(results[2], d => (d?.items ?? []).length),
        availableUnits: get(results[3], d => d?.meta?.total ?? (d?.items ?? []).length),
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const cards = [
    {
      label: 'Total Employees',
      value: stats.employees ?? '—',
      icon: '👥',
      gradient: 'from-indigo-500 to-violet-600',
    },
    {
      label: 'Active Teams',
      value: stats.teams ?? '—',
      icon: '🏆',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Total Projects',
      value: stats.projects ?? '—',
      icon: '🏗️',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Available Units',
      value: stats.availableUnits ?? '—',
      icon: '🏠',
      gradient: 'from-rose-500 to-pink-600',
    },
  ]

  const roleColor = {
    superadmin: 'bg-violet-100 text-violet-700',
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-emerald-100 text-emerald-700',
  }
  const roleName = user?.roles?.[0]?.name ?? 'user'
  const roleStyle = roleColor[roleName] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {getGreeting()}, {user?.name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* User profile card */}
      <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 border border-white/30">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{user?.name}</h2>
            <p className="text-white/70 text-sm truncate">{user?.email}</p>
            <span className="inline-block mt-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-0.5 rounded-full capitalize border border-white/20">
              {roleName}
            </span>
          </div>
        </div>
        <p className="mt-5 text-white/80 text-sm leading-relaxed">
          Welcome to CRM Pro. Use the sidebar to manage employees, teams, inventory and more.
        </p>
      </div>

      {/* Quick stats breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Employees',
            desc: 'Total registered employees in the system',
            value: loading ? null : stats.employees,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            link: '/employees',
          },
          {
            title: 'Teams',
            desc: 'Active teams across your organisation',
            value: loading ? null : stats.teams,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            link: '/teams',
          },
          {
            title: 'Inventory Projects',
            desc: 'Real estate projects in the system',
            value: loading ? null : stats.projects,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            link: '/inventory',
          },
        ].map((item) => (
          <a key={item.title} href={item.link}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-indigo-100 transition cursor-pointer group no-underline">
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
              <p className={`text-lg font-bold ${item.color} tabular-nums`}>
                {item.value === null ? (
                  <span className="block w-6 h-4 bg-gray-100 rounded animate-pulse" />
                ) : item.value}
              </p>
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${item.color} group-hover:underline`}>{item.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.desc}</p>
            </div>
            <svg className="ml-auto text-gray-300 group-hover:text-indigo-400 transition flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}
