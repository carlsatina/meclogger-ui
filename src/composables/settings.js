import { API_BASE_URL } from '@/constants/config'

export const useSettings = () => {
    const getSettings = async (token) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/settings`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to load settings')
        return data.settings
    }

    const saveSettings = async (token, payload) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to save settings')
        return data.settings
    }

    return { getSettings, saveSettings }
}
