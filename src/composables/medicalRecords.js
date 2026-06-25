import { ref } from 'vue'
import { API_BASE_URL } from '@/constants/config'

export const useMedicalRecords = () => {
    const records = ref([])
    const loading = ref(false)
    const error = ref(null)

    const fetchRecords = async(token, profileId) => {
        if (!token || !profileId) {
            records.value = []
            return
        }
        loading.value = true
        error.value = null
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/medical-records?profileId=${profileId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = await res.json()
            if (res.ok) {
                records.value = data.records || []
            } else {
                throw new Error(data.message || 'Unable to fetch medical records')
            }
        } catch (err) {
            error.value = err
        } finally {
            loading.value = false
        }
    }

    const createRecord = async(token, payload) => {
        const isFormData = payload instanceof FormData
        const headers = {
            Authorization: `Bearer ${token}`
        }
        if (!isFormData) {
            headers['Content-Type'] = 'application/json'
        }
        const res = await fetch(`${API_BASE_URL}/api/v1/medical-records`, {
            method: 'POST',
            headers,
            body: isFormData ? payload : JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.message || 'Unable to create record')
        }
        return data.record
    }

    const updateRecord = async(token, recordId, payload) => {
        const isFormData = payload instanceof FormData
        const headers = {
            Authorization: `Bearer ${token}`
        }
        if (!isFormData) {
            headers['Content-Type'] = 'application/json'
        }
        const res = await fetch(`${API_BASE_URL}/api/v1/medical-records/${recordId}`, {
            method: 'PUT',
            headers,
            body: isFormData ? payload : JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.message || 'Unable to update record')
        }
        return data.record
    }

    const deleteRecord = async(token, recordId) => {
        const res = await fetch(`${API_BASE_URL}/api/v1/medical-records/${recordId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.message || 'Unable to delete record')
        }
        return true
    }

    const fetchRecordById = async(token, recordId) => {
        if (!recordId) {
            throw new Error('Record ID is required')
        }
        const res = await fetch(`${API_BASE_URL}/api/v1/medical-records/${recordId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.message || 'Unable to fetch record details')
        }
        return data.record
    }

    const extractPrescription = async (token, imageBase64, mimeType) => {
        const res = await fetch(`${API_BASE_URL}/api/v1/insights/extract-prescription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ imageBase64, mimeType })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to extract prescription')
        return data.extract
    }

    const saveMedication = async (token, payload) => {
        const res = await fetch(`${API_BASE_URL}/api/v1/medications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to save medication')
        return data.medication
    }

    const extractLabReport = async (token, imageBase64, mimeType) => {
        const res = await fetch(`${API_BASE_URL}/api/v1/insights/extract-lab-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ imageBase64, mimeType })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to extract lab report')
        return data.extract
    }

    const saveLabResult = async (token, payload) => {
        const res = await fetch(`${API_BASE_URL}/api/v1/lab-results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to save lab result')
        return data.labResult
    }

    const fetchLabExplanation = async (token, testName) => {
        const res = await fetch(`${API_BASE_URL}/api/v1/lab-results/explain?testName=${encodeURIComponent(testName)}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to load explanation')
        return data.explanation
    }

    const updateLabResult = async (token, id, payload) => {
        const res = await fetch(`${API_BASE_URL}/api/v1/lab-results/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Unable to update lab result')
        return data.labResult
    }

    return {
        records,
        loading,
        error,
        fetchRecords,
        createRecord,
        updateRecord,
        deleteRecord,
        fetchRecordById,
        extractPrescription,
        saveMedication,
        extractLabReport,
        saveLabResult,
        updateLabResult,
        fetchLabExplanation
    }
}
