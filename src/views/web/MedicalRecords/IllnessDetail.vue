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
                <p class="eyebrow">Vitals · Illness</p>
                <h2 class="page-title">{{ activeProfileName || 'Select profile' }}</h2>
            </div>
            <div class="vital-actions">
                <button class="icon-btn-ghost" @click="loadRecords">
                    <mdicon name="refresh" :size="18" />
                </button>
                <button class="primary-btn" @click="goToAdd">
                    <mdicon name="plus" :size="18" />
                    <span>Add entry</span>
                </button>
            </div>
        </div>

        <div v-if="loading" class="state-card">Loading illness records...</div>
        <div v-else-if="errorMessage" class="state-card">{{ errorMessage }}</div>

        <div v-else class="vital-grid">
            <section class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">
                        <mdicon name="stethoscope" :size="32" />
                    </div>
                    <div>
                        <p class="metric-label">Latest diagnosis</p>
                        <p class="metric-status" :class="latestStatusClass">
                            {{ latestStatusLabel }}
                        </p>
                    </div>
                </div>
                <div v-if="latestRecord" class="metric-value">
                    <h3>{{ latestRecord.diagnosis }}</h3>
                    <div class="vital-meta-row">
                        <span class="pill subtle">{{ latestRecord.severity }}</span>
                        <span v-if="latestRecord.temperature" class="pill subtle">{{ latestRecord.temperature }}</span>
                    </div>
                    <p class="metric-date">{{ latestRecord.date }} · {{ latestRecord.time }}</p>
                    <div v-if="latestRecord.symptoms.length" class="symptom-row">
                        <span class="chip tiny" v-for="symptom in latestRecord.symptoms" :key="symptom">{{ symptom }}</span>
                    </div>
                </div>
                <p v-else class="vital-empty">No illness records yet.</p>
            </section>

            <section class="history-card">
                <div class="section-header">
                    <h3 class="section-title">Recent history</h3>
                </div>
                <div v-if="history.length" class="history-list">
                    <div class="history-row" v-for="entry in history" :key="entry.id" @click="openEntry(entry.id)">
                        <div class="history-date">
                            <p class="history-day">{{ entry.date }}</p>
                            <p class="history-time">{{ entry.time }}</p>
                        </div>
                        <div class="history-reading">
                            <p class="reading-value">{{ entry.diagnosis }}</p>
                            <p class="reading-sub">
                                <span class="pill tiny" :class="entry.statusClass">{{ entry.status }}</span>
                                <span class="pill tiny subtle">{{ entry.severity }}</span>
                                <span v-if="entry.temperature" class="pill tiny subtle">{{ entry.temperature }}</span>
                            </p>
                            <div v-if="entry.symptoms.length" class="symptom-row">
                                <span class="chip tiny" v-for="symptom in entry.symptoms" :key="symptom">{{ symptom }}</span>
                            </div>
                        </div>
                        <button class="icon-btn-ghost" @click.stop="openEntry(entry.id)">Open</button>
                    </div>
                </div>
                <p v-else class="vital-empty">Recent illness entries will appear here.</p>
            </section>
        </div>
    </div>
</div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useIllness } from '@/composables/vitals/illness'

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
    name: 'IllnessDetailWeb',
    setup() {
        const router = useRouter()
        const { records, fetchRecords } = useIllness()
        const activeProfileId = ref(localStorage.getItem('selectedProfileId') || '')
        const activeProfileName = ref(localStorage.getItem('selectedProfileName') || 'Select profile')
        const loading = ref(false)
        const errorMessage = ref('')

        const loadRecords = async () => {
            const token = localStorage.getItem('token')
            activeProfileId.value = localStorage.getItem('selectedProfileId') || ''
            activeProfileName.value = localStorage.getItem('selectedProfileName') || 'Select profile'
            if (!token || !activeProfileId.value) {
                records.value = []
                return
            }
            loading.value = true
            errorMessage.value = ''
            try {
                await fetchRecords(token, activeProfileId.value)
            } catch (err) {
                errorMessage.value = err.message || 'Unable to load illness records.'
            } finally {
                loading.value = false
            }
        }

        const sortedRecords = computed(() => {
            return [...records.value].sort((a, b) => new Date(b.recordedAt || b.createdAt) - new Date(a.recordedAt || a.createdAt))
        })

        const latestIllness = computed(() => sortedRecords.value[0] || null)

        const listItems = computed(() => sortedRecords.value.map(entry => {
            const { date, time } = formatDateTime(entry.recordedAt || entry.createdAt)
            return {
                id: entry.id,
                diagnosis: entry.diagnosis,
                status: entry.status || 'ONGOING',
                statusClass: (entry.status || 'ONGOING').toLowerCase(),
                severity: entry.severity || 'MILD',
                temperature: entry.bodyTemperature ? `${entry.bodyTemperature}°${entry.temperatureUnit || 'C'}` : '',
                date,
                time,
                symptoms: entry.symptoms || []
            }
        }))

        const latestRecord = computed(() => {
            if (!latestIllness.value) return null
            const { date, time } = formatDateTime(latestIllness.value.recordedAt || latestIllness.value.createdAt)
            return {
                diagnosis: latestIllness.value.diagnosis,
                severity: latestIllness.value.severity || 'MILD',
                temperature: latestIllness.value.bodyTemperature ? `${latestIllness.value.bodyTemperature}°${latestIllness.value.temperatureUnit || 'C'}` : '',
                date,
                time,
                symptoms: latestIllness.value.symptoms || []
            }
        })

        const latestStatusLabel = computed(() => latestIllness.value?.status || 'No status')
        const latestStatusClass = computed(() => (latestIllness.value?.status || 'ongoing').toLowerCase())

        const history = computed(() => listItems.value.slice(0, 8))

        const goBack = () => {
            router.push({ path: '/medical-records', query: { tab: 'health' } })
        }

        const goToAdd = () => {
            router.push({
                path: '/medical-records/web/illness/add',
                query: {
                    profileId: activeProfileId.value,
                    profileName: activeProfileName.value
                }
            })
        }

        const openEntry = (id) => {
            router.push({
                path: `/medical-records/illness/${id}`,
                query: {
                    profileId: activeProfileId.value,
                    profileName: activeProfileName.value,
                    from: '/medical-records?tab=health'
                }
            })
        }

        onMounted(() => {
            loadRecords()
        })

        return {
            activeProfileName,
            latestRecord,
            latestStatusLabel,
            latestStatusClass,
            history,
            loadRecords,
            goToAdd,
            openEntry,
            goBack,
            loading,
            errorMessage
        }
    }
}
</script>
