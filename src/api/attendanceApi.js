import api from './axios'

// Check in (employee)
export const checkIn = async (data = {}) => {
  const response = await api.post('/hr/attendance/checkin', data)
  return response.data
}

// Check out (employee)
export const checkOut = async () => {
  const response = await api.post('/hr/attendance/checkout')
  return response.data
}

// Get attendance records (manager/self based on userId/teamId)
export const getAttendance = async (params = {}) => {
  const response = await api.get('/hr/attendance', { params })
  return response.data
}
