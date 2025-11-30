import axios from 'axios'
import { env } from './env'

export const api = axios.create({ baseURL: env.BACKEND_URL })

api.interceptors.request.use((config) => {
  try {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('fonte:token') : null
    if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
  } catch {}
  return config
})
