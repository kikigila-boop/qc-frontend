import axios from 'axios'

// Hardcoded Railway URL as fallback — ensures API calls always reach the backend
// even if NEXT_PUBLIC_API_URL env var is missing from the build.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://qc-backend-production-2c7a.up.railway.app'

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('qc_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('qc_token')
      localStorage.removeItem('qc_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
