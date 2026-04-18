import axios from 'axios'

const api = axios.create({
  // Ensure baseURL ends with a slash for relative path resolution
  baseURL: import.meta.env.VITE_BASE_APP_URL?.endsWith('/') 
    ? import.meta.env.VITE_BASE_APP_URL 
    : `${import.meta.env.VITE_BASE_APP_URL}/`,
  timeout: 15000,
  headers: {},
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Clean up URL: remove leading slash if it exists to respect baseURL
  if (config.url?.startsWith('/')) {
    config.url = config.url.substring(1)
  }
  
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
