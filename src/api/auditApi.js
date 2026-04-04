import api from './axios'

export const getAuditLogs = async (params = {}) => {
  const { data } = await api.get('/audit-logs', { params })
  return data
}

export const getAuditLogById = async (id) => {
  const { data } = await api.get(`/audit-logs/${id}`)
  return data
}
