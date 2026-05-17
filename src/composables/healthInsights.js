import { ref } from 'vue'
import { API_BASE_URL } from '@/constants/config'

export const useHealthInsights = () => {
    const insights = ref(null)
    const loading = ref(false)
    const error = ref(null)

    const fetchInsights = async (profileId, days = 30) => {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Not authenticated')
        loading.value = true
        error.value = null
        insights.value = null
        try {
            const params = new URLSearchParams({ profileId, days: String(days) })
            const res = await fetch(`${API_BASE_URL}/api/v1/insights/health?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Unable to generate insights')
            insights.value = data.insights
            return data.insights
        } catch (err) {
            error.value = err.message || 'Something went wrong'
            throw err
        } finally {
            loading.value = false
        }
    }

    return { insights, loading, error, fetchInsights }
}
