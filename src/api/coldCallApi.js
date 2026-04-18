import api from './axios'

// -----------------------------------------------------
// Upload & Batches
// -----------------------------------------------------

export const uploadColdCallBatch = async (formData) => {
  // formData expects: file, mode, dedupePolicy, teamIds, routingConfig
  const response = await api.post('/coldcall/upload', formData)
  return response.data
}

export const previewBatch = async (id) => {
  const response = await api.get(`/coldcall/batches/${id}/preview`)
  return response.data
}

export const distributeBatch = async (id, params) => {
  // params: dryRun (boolean), force (boolean)
  const response = await api.post(`/coldcall/batches/${id}/distribute`, null, { params })
  return response.data
}

// Derived from entries report since no dedicated list endpoint exists
export const listBatches = async () => {
  // Use a higher limit to see more history
  const response = await api.get('/coldcall/report/entries', { params: { limit: 500 } })
  return response.data
}

// -----------------------------------------------------
// Agent Workflow
// -----------------------------------------------------

export const getMyTasks = async () => {
  const response = await api.get('/coldcall/pull/my-tasks')
  return response.data
}

export const pullNextCall = async (data = {}) => {
  // data: { preferredTeamIds: ["id"] }
  const response = await api.post('/coldcall/pull', data)
  return response.data
}

export const refreshLock = async (id) => {
  const response = await api.post(`/coldcall/pull/entries/${id}/refresh-lock`)
  return response.data
}

export const releaseLock = async (id) => {
  const response = await api.post(`/coldcall/pull/entries/${id}/release`)
  return response.data
}

export const logAttempt = async (id, payload) => {
  // payload: { result, notes }
  const response = await api.post(`/coldcall/pull/entries/${id}/attempt`, payload)
  return response.data
}

export const completeCall = async (id, payload) => {
  // payload: { response, disposition, summary, leadConversion: { ... } }
  const response = await api.post(`/coldcall/pull/entries/${id}/complete`, payload)
  return response.data
}

export const reassignEntry = async (id, payload) => {
  const response = await api.post(`/coldcall/pull/entries/${id}/reassign`, payload)
  return response.data
}

// -----------------------------------------------------
// Reports & Analytics
// -----------------------------------------------------

export const getBatchSummary = async (batchId) => {
  const response = await api.get(`/coldcall/report/batches/${batchId}/summary`)
  return response.data
}

export const getEntriesReport = async (params) => {
  // params: batchId, status, teamId, userId
  const response = await api.get('/coldcall/report/entries', { params })
  return response.data
}

export const getTeamsReport = async (params) => {
  const response = await api.get('/coldcall/report/teams', { params })
  return response.data
}

export const getAgentsReport = async (params) => {
  const response = await api.get('/coldcall/report/agents', { params })
  return response.data
}

export const getAgentAnalytics = async (userId, params) => {
  const response = await api.get(`/coldcall/analytics/agents/${userId}`, { params })
  return response.data
}

export const getTeamAnalytics = async (teamId, params) => {
  const response = await api.get(`/coldcall/analytics/teams/${teamId}`, { params })
  return response.data
}

export const getLeaderboard = async (params) => {
  // params: metric, days, top
  const response = await api.get('/coldcall/analytics/leaderboard', { params })
  return response.data
}

// -----------------------------------------------------
// Quota
// -----------------------------------------------------

export const setQuota = async (payload) => {
  // payload: { teamId, target, metric, period }
  const response = await api.post('/coldcall/quota', payload)
  return response.data
}

export const getQuotas = async (teamId) => {
  const response = await api.get(`/coldcall/quota/${teamId}`)
  return response.data
}

export const getQuotaProgress = async (teamId, params) => {
  const response = await api.get(`/coldcall/quota/${teamId}/progress`, { params })
  return response.data
}
