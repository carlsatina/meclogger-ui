import { API_BASE_URL } from '@/constants/config'

export const useBudgets = () => {
    const listBudgetSummary = async(token) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/budgets/summary`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.message || 'Unable to load budget summary')
        }
        return data.budgets || data.data || []
    }

    const listBudgets = async(token) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/budgets`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.message || 'Unable to load budgets')
        }
        return data.budgets || data.data || []
    }

    const createBudget = async(token, payload) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/budgets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.message || 'Unable to create budget')
        }
        return data.budget
    }

    const updateBudget = async(token, budgetId, payload) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/budgets/${budgetId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.message || 'Unable to update budget')
        }
        return data.budget
    }

    const deleteBudget = async(token, budgetId) => {
        if (!token) throw new Error('Missing auth token')
        const res = await fetch(`${API_BASE_URL}/api/v1/expenses/budgets/${budgetId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.message || 'Unable to delete budget')
        }
        return true
    }

    return {
        listBudgetSummary,
        listBudgets,
        createBudget,
        updateBudget,
        deleteBudget
    }
}
