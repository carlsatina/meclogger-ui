<template>
<div class="medical-shell vital-page">
    <div class="medical-orb orb-1"></div>
    <div class="medical-orb orb-2"></div>
    <div class="vital-wrapper glass-card">
        <div class="vital-header">
            <button class="icon-btn-ghost" @click="goBack">
                <mdicon name="arrow-left" :size="20" />
            </button>
            <div class="title-block">
                <p class="eyebrow">Vitals · Blood Sugar</p>
                <h2 class="page-title">{{ profileName }}</h2>
            </div>
            <div class="vital-actions">
                <button class="primary-btn" @click="goToAddRecord">
                    <mdicon name="plus" :size="18" />
                    <span>Add record</span>
                </button>
            </div>
        </div>

        <div v-if="loading" class="state-card">Loading blood sugar records...</div>
        <div v-else-if="errorMessage" class="state-card">{{ errorMessage }}</div>

        <div v-else class="vital-grid">
            <section class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">
                        <mdicon name="water-percent" :size="32" />
                    </div>
                    <div>
                        <p class="metric-label">Latest reading</p>
                        <p class="metric-status" :class="latestStatus?.toLowerCase()">
                            {{ latestStatus || 'No data' }}
                        </p>
                    </div>
                </div>
                <div v-if="latestRecord" class="metric-value">
                    <h3>{{ latestRecord.value }}</h3>
                    <p>mg/dL · {{ latestRecord.type }}</p>
                    <p class="metric-date">{{ latestRecord.formattedDate }} · {{ latestRecord.formattedTime }}</p>
                </div>
                <p v-else class="vital-empty">No blood sugar records yet.</p>
            </section>

            <section class="history-card">
                <div class="section-header">
                    <h3 class="section-title">Recent history</h3>
                </div>
                <div v-if="history.length" class="history-list">
                    <div class="history-row" v-for="entry in history" :key="entry.id" @click="openEntry(entry.id)">
                        <div class="history-date">
                            <p class="history-day">{{ entry.formattedDate }}</p>
                            <p class="history-time">{{ entry.formattedTime }}</p>
                        </div>
                        <div class="history-reading">
                            <p class="reading-value">{{ entry.value }} mg/dL</p>
                            <p class="reading-sub">{{ entry.type }}</p>
                        </div>
                        <span class="status-chip" :class="entry.status.toLowerCase()">
                            {{ entry.status }}
                        </span>
                    </div>
                </div>
                <p v-else class="vital-empty">Recent readings will appear here.</p>
            </section>
        </div>
    </div>
</div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBloodSugar } from '@/composables/vitals/bloodSugar'

const formatDateTime = (value) => {
    if (!value) return { date: 'Unknown', time: '' }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return { date: 'Unknown', time: '' }
    return {
        date: parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
}

const classifyStatus = (value, type = '') => {
    const reading = Number(value) || 0
    const ctx = (type || '').toLowerCase()
    if (ctx.includes('after')) {
        if (reading < 140) return 'Normal'
        if (reading < 200) return 'Elevated'
        return 'High'
    }
    if (reading < 100) return 'Normal'
    if (reading < 126) return 'Elevated'
    return 'High'
}

export default {
    name: 'BloodSugarDetailWeb',
    setup() {
        const router = useRouter()
        const { records, fetchRecords } = useBloodSugar()
        const loading = ref(false)
        const errorMessage = ref('')
        const profileId = ref(localStorage.getItem('selectedProfileId'))
        const profileName = ref(localStorage.getItem('selectedProfileName') || 'Select profile')

        const loadRecords = async () => {
            const token = localStorage.getItem('token')
            profileId.value = localStorage.getItem('selectedProfileId')
            profileName.value = localStorage.getItem('selectedProfileName') || 'Select profile'
            if (!token || !profileId.value) {
                records.value = []
                return
            }
            loading.value = true
            errorMessage.value = ''
            try {
                await fetchRecords(token, profileId.value)
            } catch (err) {
                errorMessage.value = err.message || 'Unable to load blood sugar records.'
            } finally {
                loading.value = false
            }
        }

        const latestRecord = computed(() => {
            if (!records.value.length) return null
            const sorted = [...records.value].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            const latest = sorted[0]
            const { date, time } = formatDateTime(latest.recordedAt)
            return {
                id: latest.id,
                value: Number(latest.valueNumber) || 0,
                type: latest.chartGroup || 'Fasting',
                formattedDate: date,
                formattedTime: time
            }
        })

        const latestStatus = computed(() => {
            if (!latestRecord.value) return null
            return classifyStatus(latestRecord.value.value, latestRecord.value.type)
        })

        const history = computed(() => {
            const sorted = [...records.value].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            return sorted.slice(0, 8).map(entry => {
                const { date, time } = formatDateTime(entry.recordedAt)
                const type = entry.chartGroup || 'Fasting'
                return {
                    id: entry.id,
                    value: Number(entry.valueNumber) || 0,
                    type,
                    formattedDate: date,
                    formattedTime: time,
                    status: classifyStatus(entry.valueNumber, type)
                }
            })
        })

        const goBack = () => {
            router.push({ path: '/medical-records', query: { tab: 'health' } })
        }

        const openEntry = (id) => {
            if (!id) return
            router.push({
                path: `/medical-records/blood-sugar/${id}`,
                query: { from: '/medical-records?tab=health' }
            })
        }

        const goToAddRecord = () => {
            router.push('/medical-records/blood-sugar/add')
        }

        const handleStorage = (event) => {
            if (event.key === 'selectedProfileId' || event.key === 'selectedProfileName') {
                loadRecords()
            }
        }

        onMounted(() => {
            loadRecords()
            window.addEventListener('storage', handleStorage)
        })

        onUnmounted(() => {
            window.removeEventListener('storage', handleStorage)
        })

        return {
            profileName,
            loading,
            errorMessage,
            latestRecord,
            latestStatus,
            history,
            goBack,
            openEntry,
            goToAddRecord
        }
    }
}
</script>
