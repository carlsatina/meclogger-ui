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
                <p class="eyebrow">Vitals · Body Weight</p>
                <h2 class="page-title">{{ profileName }}</h2>
            </div>
            <div class="vital-actions">
                <button class="primary-btn" @click="goToAddRecord">
                    <mdicon name="plus" :size="18" />
                    <span>Add record</span>
                </button>
            </div>
        </div>

        <div v-if="loading" class="state-card">Loading body weight records...</div>
        <div v-else-if="errorMessage" class="state-card">{{ errorMessage }}</div>

        <div v-else class="vital-grid">
            <section class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">
                        <mdicon name="scale-bathroom" :size="32" />
                    </div>
                    <div>
                        <p class="metric-label">Latest measurement</p>
                        <p class="metric-status" :class="weightTrendClass">
                            {{ weightTrendLabel }}
                        </p>
                    </div>
                </div>
                <div v-if="latestRecord" class="metric-value">
                    <h3>{{ latestRecord.value }}</h3>
                    <p>kg</p>
                    <p class="metric-date">{{ latestRecord.formattedDate }} · {{ latestRecord.formattedTime }}</p>
                </div>
                <p v-else class="vital-empty">No body weight records yet.</p>
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
                            <p class="reading-value">{{ entry.value }} kg</p>
                            <p class="reading-sub" :class="entry.deltaClass">
                                {{ entry.deltaLabel }}
                            </p>
                        </div>
                    </div>
                </div>
                <p v-else class="vital-empty">Recent measurements will appear here.</p>
            </section>
        </div>
    </div>
</div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBodyWeight } from '@/composables/vitals/bodyWeight'

const formatDateTime = (value) => {
    if (!value) return { date: 'Unknown', time: '' }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return { date: 'Unknown', time: '' }
    return {
        date: parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
}

export default {
    name: 'BodyWeightDetailWeb',
    setup() {
        const router = useRouter()
        const { records, fetchRecords } = useBodyWeight()
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
                errorMessage.value = err.message || 'Unable to load body weight records.'
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
                formattedDate: date,
                formattedTime: time
            }
        })

        const previousRecord = computed(() => {
            if (records.value.length < 2) return null
            const sorted = [...records.value].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            return Number(sorted[1].valueNumber) || 0
        })

        const weightDelta = computed(() => {
            if (!latestRecord.value || previousRecord.value === null) return 0
            return +(latestRecord.value.value - previousRecord.value).toFixed(1)
        })

        const weightTrendLabel = computed(() => {
            if (!latestRecord.value) return 'No history'
            if (weightDelta.value > 0) return `+${weightDelta.value} kg since last entry`
            if (weightDelta.value < 0) return `${weightDelta.value} kg since last entry`
            return 'Stable since last entry'
        })

        const weightTrendClass = computed(() => {
            if (weightDelta.value > 0) return 'up'
            if (weightDelta.value < 0) return 'down'
            return 'stable'
        })

        const history = computed(() => {
            const sorted = [...records.value].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            return sorted.slice(0, 8).map((entry, index, arr) => {
                const { date, time } = formatDateTime(entry.recordedAt)
                const prev = arr[index + 1] ? Number(arr[index + 1].valueNumber) || 0 : null
                const value = Number(entry.valueNumber) || 0
                const delta = prev !== null ? +(value - prev).toFixed(1) : null
                let deltaLabel = '—'
                let deltaClass = 'stable'
                if (delta !== null) {
                    if (delta > 0) {
                        deltaLabel = `+${delta} kg`
                        deltaClass = 'up'
                    } else if (delta < 0) {
                        deltaLabel = `${delta} kg`
                        deltaClass = 'down'
                    } else {
                        deltaLabel = 'No change'
                    }
                }
                return {
                    id: entry.id,
                    value,
                    formattedDate: date,
                    formattedTime: time,
                    deltaLabel,
                    deltaClass
                }
            })
        })

        const goBack = () => {
            router.push({ path: '/medical-records', query: { tab: 'health' } })
        }

        const openEntry = (id) => {
            if (!id) return
            router.push({
                path: `/medical-records/body-weight/${id}`,
                query: { from: '/medical-records?tab=health' }
            })
        }

        const goToAddRecord = () => {
            router.push('/medical-records/body-weight/add')
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
            weightTrendLabel,
            weightTrendClass,
            history,
            goBack,
            openEntry,
            goToAddRecord
        }
    }
}
</script>
