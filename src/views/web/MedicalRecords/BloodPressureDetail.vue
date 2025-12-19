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
                <p class="eyebrow">Vitals · Blood Pressure</p>
                <h2 class="page-title">{{ profileName }}</h2>
            </div>
            <div class="vital-actions">
                <button class="primary-btn" @click="goToAddRecord">
                    <mdicon name="plus" :size="18" />
                    <span>Add record</span>
                </button>
            </div>
        </div>

        <div v-if="loading" class="state-card">Loading blood pressure records...</div>
        <div v-else-if="errorMessage" class="state-card">{{ errorMessage }}</div>

        <div v-else class="vital-grid">
            <section class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">
                        <mdicon name="heart-pulse" :size="32" />
                    </div>
                    <div>
                        <p class="metric-label">Latest reading</p>
                        <p class="metric-status" :class="latestStatus?.toLowerCase()">
                            {{ latestStatus || 'No data' }}
                        </p>
                    </div>
                </div>
                <div v-if="latestRecord" class="metric-value">
                    <h3>{{ latestRecord.systolic }}/{{ latestRecord.diastolic }}</h3>
                    <p>mmHg</p>
                    <p class="metric-date">{{ latestRecord.formattedDate }} · {{ latestRecord.formattedTime }}</p>
                </div>
                <p v-else class="vital-empty">No blood pressure records yet.</p>
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
                            <p class="reading-value">{{ entry.systolic }}/{{ entry.diastolic }}</p>
                            <p class="reading-sub">mmHg</p>
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
import { useBloodPressure } from '@/composables/vitals/bloodPressure'

const formatDateTime = (value) => {
    if (!value) return { date: 'Unknown', time: '' }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return { date: 'Unknown', time: '' }
    return {
        date: parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
}

const classifyStatus = (systolic, diastolic) => {
    const sys = Number(systolic) || 0
    const dia = Number(diastolic) || 0
    if (sys < 120 && dia < 80) return 'Normal'
    if (sys < 130 && dia < 80) return 'Elevated'
    return 'High'
}

export default {
    name: 'BloodPressureDetailWeb',
    setup() {
        const router = useRouter()
        const { records, fetchRecords } = useBloodPressure()
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
                errorMessage.value = err.message || 'Unable to load blood pressure records.'
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
                systolic: latest.systolic || latest.valueNumber,
                diastolic: latest.diastolic || 0,
                formattedDate: date,
                formattedTime: time
            }
        })

        const latestStatus = computed(() => {
            if (!latestRecord.value) return null
            return classifyStatus(latestRecord.value.systolic, latestRecord.value.diastolic)
        })

        const history = computed(() => {
            const sorted = [...records.value].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            return sorted.slice(0, 8).map(entry => {
                const { date, time } = formatDateTime(entry.recordedAt)
                return {
                    id: entry.id,
                    systolic: entry.systolic || entry.valueNumber,
                    diastolic: entry.diastolic || 0,
                    formattedDate: date,
                    formattedTime: time,
                    status: classifyStatus(entry.systolic || entry.valueNumber, entry.diastolic || 0)
                }
            })
        })

        const goBack = () => {
            router.push({ path: '/medical-records', query: { tab: 'health' } })
        }

        const openEntry = (id) => {
            if (!id) return
            router.push({
                path: `/medical-records/blood-pressure/${id}`,
                query: { from: '/medical-records?tab=health' }
            })
        }

        const goToAddRecord = () => {
            router.push('/medical-records/blood-pressure/add')
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
