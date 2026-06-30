import axios from 'axios'

// Use relative URL so requests go through Vercel rewrite (server-side proxy, no CORS)
const api = axios.create({
  baseURL: '/api/v1',
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
