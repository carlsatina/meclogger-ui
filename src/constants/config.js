const LOCAL_API_URL = 'http://localhost:9000'
const PROD_FALLBACK_API_URL = 'https://qkworks-api.vercel.app'

const envUrl =
  import.meta.env.VITE_BACKEND_API || import.meta.env.VUE_APP_BACKEND_API || ''
const sanitizedEnvUrl = envUrl.trim()

const resolveApiBaseUrl = () => {
    if (sanitizedEnvUrl.length) {
        return sanitizedEnvUrl
    }
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return LOCAL_API_URL
    }
    return PROD_FALLBACK_API_URL
}

export const API_BASE_URL = resolveApiBaseUrl()
