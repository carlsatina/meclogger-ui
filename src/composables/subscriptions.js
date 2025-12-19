import { API_BASE_URL } from '@/constants/config'

export const useSubscriptions = () => {
    const listSubscriptions = async(token) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/subscriptions`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to load subscriptions')
        return data.subscriptions || data.data || []
    }

    const createSubscription = async(token, payload) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to create subscription')
        return data.subscription
    }

    const updateSubscription = async(token, id, payload) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/subscriptions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to update subscription')
        return data.subscription
    }

    const deleteSubscription = async(token, id) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/subscriptions/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to delete subscription')
        return true
    }

    const markSubscriptionPaid = async(token, id) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/subscriptions/${id}/pay`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to mark paid')
        return data
    }

    return { listSubscriptions, createSubscription, updateSubscription, deleteSubscription, markSubscriptionPaid }
}
