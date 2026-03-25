import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import RolesPage from './pages/RolesPage'
import TeamsPage from './pages/TeamsPage'
import ManagersPage from './pages/ManagersPage'
import InventoryPage from './pages/InventoryPage'
import LeadsPage from './pages/LeadsPage'
import ColdCallPage from './pages/ColdCallPage'
import AttendancePage from './pages/AttendancePage'
import HrPage from './pages/HrPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected — all inside sidebar layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="managers" element={<ManagersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="cold-calls" element={<ColdCallPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="hr" element={<HrPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
