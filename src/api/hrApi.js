import api from './axios'

// -----------------------------------------------------------------
// Location Tracking
// -----------------------------------------------------------------

export const createLocationRequest = async (payload) => {
  // payload: { targetUserId, expiresInSeconds, note }
  const response = await api.post('/hr/location-requests', payload)
  return response.data
}

export const respondToLocationRequest = async (id, payload) => {
  // payload: { latitude, longitude, accuracy, recordedAt }
  const response = await api.post(`/hr/location-requests/${id}/respond`, payload)
  return response.data
}

export const getLocationResult = async (id) => {
  const response = await api.get(`/hr/location-requests/${id}/result`)
  return response.data
}

// -----------------------------------------------------------------
// Device Management
// -----------------------------------------------------------------

export const registerDevice = async (payload) => {
  // payload: { deviceId, platform, pushToken }
  const response = await api.post('/hr/devices/register', payload)
  return response.data
}

export const unregisterDevice = async (payload) => {
  // payload: { deviceId } / etc
  const response = await api.post('/hr/devices/unregister', payload)
  return response.data
}

export const getDevices = async () => {
  const response = await api.get('/hr/devices')
  return response.data
}

// -----------------------------------------------------------------
// Consent Management
// -----------------------------------------------------------------

export const grantConsent = async (payload) => {
  // payload: { type: "LOCATION" | "PHOTO" | "TERMS", version: "1.0", meta: {} }
  const response = await api.post('/hr/consent', payload)
  return response.data
}

export const revokeConsent = async (payload) => {
  // payload: { type } or { id }
  const response = await api.post('/hr/consent/revoke', payload)
  return response.data
}

export const getConsents = async () => {
  const response = await api.get('/hr/consent')
  return response.data
}
