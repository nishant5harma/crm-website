import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import AddEmployeeModal from '../components/AddEmployeeModal'

function RoleBadge({ name }) {
  const colors = {
    superadmin: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    admin: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    default: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  }
  const key = name?.toLowerCase()
  const cls = colors[key] || colors.default
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {name}
    </span>
  )
}

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const hue = name
    ? name.charCodeAt(0) * 15 % 360
    : 200
  return (
    <div
      style={{ background: `hsl(${hue}, 60%, 60%)` }}
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
    >
      {initials}
    </div>
  )
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/users')
      // API returns { users: [...] } or plain array
      const list = Array.isArray(data) ? data : (data?.users ?? [])
      setEmployees(list)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleSuccess = (newEmployee) => {
    setEmployees((prev) => [newEmployee, ...prev])
    setSuccessMsg(`Employee "${newEmployee.name}" created successfully!`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const filtered = employees.filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.roles?.some((r) => r.name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your team members and their roles
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Employees', value: employees.length, icon: '👥' },
          { label: 'Showing', value: filtered.length, icon: '🔍' },
          {
            label: 'Roles in Use',
            value: [...new Set(employees.flatMap((e) => e.roles?.map((r) => r.name) ?? []))].length,
            icon: '🎭',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              <span className="mr-1.5">{stat.icon}</span>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, email or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <span className="w-8 h-8 border-3 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm">Loading employees...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm text-red-500 font-medium">{error}</p>
            <button
              onClick={fetchEmployees}
              className="text-sm text-indigo-600 hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">
              {search ? 'No employees match your search' : 'No employees yet'}
            </p>
            {!search && (
              <button
                onClick={() => setModalOpen(true)}
                className="text-sm text-indigo-600 hover:underline cursor-pointer"
              >
                Add your first employee
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_1.5fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Roles</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {filtered.map((emp) => (
                <div
                  key={emp.id}
                  className="grid sm:grid-cols-[1fr_1.5fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-gray-50/60 transition"
                >
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={emp.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                      <p className="text-xs text-gray-400 truncate sm:hidden">{emp.email}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <p className="hidden sm:block text-sm text-gray-500 truncate">{emp.email}</p>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-1.5">
                    {emp.roles?.length > 0 ? (
                      emp.roles.map((r) => <RoleBadge key={r.id} name={r.name} />)
                    ) : (
                      <span className="text-xs text-gray-400">No role</span>
                    )}
                  </div>

                  {/* Date */}
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {emp.createdAt
                      ? new Date(emp.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer count */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">
                Showing {filtered.length} of {employees.length} employees
              </p>
            </div>
          </>
        )}
      </div>

      <AddEmployeeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
