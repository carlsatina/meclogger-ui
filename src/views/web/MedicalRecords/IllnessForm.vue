<template>
<div class="medical-shell">
    <div class="medical-orb orb-1"></div>
    <div class="medical-orb orb-2"></div>
    <div class="add-record-wrapper glass-card">
        <div class="header">
            <button class="icon-btn-ghost" @click="goBack">
                <mdicon name="arrow-left" :size="20" />
            </button>
            <div class="title-block">
                <p class="eyebrow">Vitals · Illness</p>
                <h2 class="page-title">{{ isEdit ? 'Edit illness entry' : 'Add illness entry' }}</h2>
            </div>
        </div>

        <form class="form-grid" @submit.prevent="submit">
            <div class="form-grid two-column">
                <label class="form-group">
                    <span class="form-label">Diagnosis *</span>
                    <input class="form-input" v-model="form.diagnosis" type="text" required placeholder="e.g., Influenza" />
                </label>
                <label class="form-group">
                    <span class="form-label">Date & Time</span>
                    <input class="form-input" v-model="form.recordedAt" type="datetime-local" />
                </label>
            </div>

            <label class="form-group">
                <span class="form-label">Symptoms (comma separated)</span>
                <input class="form-input" v-model="symptomsInput" type="text" placeholder="Fever, Cough, Fatigue" />
            </label>

            <div class="form-grid two-column">
                <label class="form-group">
                    <span class="form-label">Body Temperature</span>
                    <input class="form-input" v-model="form.bodyTemperature" type="number" step="0.1" min="30" max="45" placeholder="37.5" />
                </label>
                <label class="form-group">
                    <span class="form-label">Unit</span>
                    <select class="form-select" v-model="form.temperatureUnit">
                        <option value="C">°C</option>
                        <option value="F">°F</option>
                    </select>
                </label>
            </div>

            <div class="form-grid two-column">
                <label class="form-group">
                    <span class="form-label">Severity</span>
                    <select class="form-select" v-model="form.severity">
                        <option value="MILD">Mild</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="SEVERE">Severe</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                </label>
                <label class="form-group">
                    <span class="form-label">Status</span>
                    <select class="form-select" v-model="form.status">
                        <option value="ONGOING">Ongoing</option>
                        <option value="RECOVERED">Recovered</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CHRONIC">Chronic</option>
                    </select>
                </label>
            </div>

            <label class="form-group">
                <span class="form-label">Medications (comma separated)</span>
                <input class="form-input" v-model="medicationsInput" type="text" placeholder="Ibuprofen, Paracetamol" />
            </label>

            <label class="form-group">
                <span class="form-label">Notes</span>
                <textarea class="form-textarea" v-model="form.notes" rows="4" placeholder="Add observations or advice"></textarea>
            </label>

            <div class="form-actions">
                <button class="icon-btn-ghost" type="button" @click="goBack">Cancel</button>
                <button class="primary-btn" type="submit" :disabled="submitting">
                    {{ submitting ? 'Saving...' : (isEdit ? 'Update entry' : 'Save entry') }}
                </button>
            </div>
        </form>
    </div>
</div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIllness } from '@/composables/vitals/illness'

export default {
    name: 'IllnessFormWeb',
    setup() {
        const route = useRoute()
        const router = useRouter()
        const { addRecord, fetchRecordById, updateRecord } = useIllness()
        const recordId = ref(route.params.id)
        const isEdit = ref(Boolean(recordId.value))
        const submitting = ref(false)
        const symptomsInput = ref('')
        const medicationsInput = ref('')

        const toLocalDateTime = (value) => {
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return ''
            const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()
            return iso.slice(0, 16)
        }

        const form = ref({
            diagnosis: '',
            bodyTemperature: '',
            temperatureUnit: 'C',
            severity: 'MILD',
            status: 'ONGOING',
            notes: '',
            recordedAt: toLocalDateTime(new Date()),
            profileId: Array.isArray(route.query.profileId) ? route.query.profileId[0] : route.query.profileId || localStorage.getItem('selectedProfileId') || ''
        })

        const goBack = () => {
            router.back()
        }

        const parseList = (input) => input.split(',').map(item => item.trim()).filter(Boolean)

        const loadExisting = async () => {
            if (!recordId.value) return
            const token = localStorage.getItem('token')
            if (!token) return
            try {
                const existing = await fetchRecordById(token, recordId.value)
                if (existing) {
                    form.value = {
                        diagnosis: existing.diagnosis || '',
                        bodyTemperature: existing.bodyTemperature ?? '',
                        temperatureUnit: existing.temperatureUnit || 'C',
                        severity: existing.severity || 'MILD',
                        status: existing.status || 'ONGOING',
                        notes: existing.notes || '',
                        recordedAt: existing.recordedAt ? toLocalDateTime(existing.recordedAt) : '',
                        profileId: existing.profileId || form.value.profileId
                    }
                    symptomsInput.value = (existing.symptoms || []).join(', ')
                    medicationsInput.value = (existing.medications || []).join(', ')
                }
            } catch (err) {
                alert(err.message || 'Failed to load entry')
            }
        }

        const submit = async () => {
            if (!form.value.diagnosis) {
                alert('Diagnosis is required.')
                return
            }
            if (!form.value.profileId) {
                alert('Profile is required.')
                return
            }
            submitting.value = true
            try {
                const token = localStorage.getItem('token')
                if (!token) throw new Error('No auth token found.')
                const payload = {
                    ...form.value,
                    symptoms: parseList(symptomsInput.value),
                    medications: parseList(medicationsInput.value)
                }
                if (isEdit.value) {
                    await updateRecord(token, recordId.value, payload)
                } else {
                    await addRecord(token, payload)
                }
                router.push({
                    path: '/medical-records/web/illness',
                    query: {
                        profileId: form.value.profileId,
                        profileName: route.query.profileName || localStorage.getItem('selectedProfileName') || ''
                    }
                })
            } catch (err) {
                alert(err.message || 'Failed to save illness record')
            } finally {
                submitting.value = false
            }
        }

        onMounted(() => {
            loadExisting()
        })

        return {
            form,
            symptomsInput,
            medicationsInput,
            isEdit,
            submitting,
            submit,
            goBack
        }
    }
}
</script>
