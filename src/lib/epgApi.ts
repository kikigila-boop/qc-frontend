import axios from 'axios'

// Backend Mirada (EPG Metadata Auto Completion Engine) — Space Hugging Face
// terpisah dari backend Content Ops. Base URL relatif ("/api/epg") supaya
// request lewat Vercel rewrite (proxy server-side, tidak kena CORS) — lihat
// next.config.js. Tidak berbagi token/session dengan `@/lib/api` (Content Ops).
const epgApi = axios.create({
  baseURL: '/api/epg',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

epgApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('epg_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

epgApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('epg_token')
      localStorage.removeItem('epg_user')
      window.location.href = '/epg/login'
    }
    return Promise.reject(err)
  }
)

export default epgApi
