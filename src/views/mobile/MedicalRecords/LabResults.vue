<template>
<div class="page-container">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <div class="header glass-nav">
        <button class="back-btn" @click="router.back()">
            <mdicon name="arrow-left" :size="24"/>
        </button>
        <div class="title-block">
            <h2 class="page-title">Lab Results</h2>
            <p class="profile-subtitle">{{ profileName }}</p>
        </div>
        <div style="width:40px"></div>
    </div>

    <div class="filter-bar">
        <div class="search-wrap">
            <mdicon name="magnify" :size="18" class="search-icon"/>
            <input
                class="search-input"
                v-model="searchQuery"
                placeholder="Search tests…"
                type="search"
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
                <mdicon name="close" :size="16"/>
            </button>
        </div>
        <div class="chip-row">
            <button
                v-for="chip in chips"
                :key="chip.value"
                class="chip"
                :class="{ active: filterStatus === chip.value, [chip.color]: true }"
                @click="filterStatus = chip.value"
            >
                {{ chip.label }}
                <span class="chip-count">{{ chip.count }}</span>
            </button>
        </div>
    </div>

    <div class="content">
        <div v-if="loading" class="state-box">
            <mdicon name="loading" :size="32" class="spin"/>
            <p>Loading lab results…</p>
        </div>

        <template v-else>
            <template v-if="trends.length">
                <p class="section-label">Trends</p>
                <div class="trends-list">
                    <div class="trend-card glass-card" v-for="t in trends" :key="t.testName">
                        <div class="trend-header">
                            <span class="trend-name">{{ t.testName }}</span>
                            <span class="trend-arrow" :class="t.direction">
                                {{ t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : '→' }}
                            </span>
                        </div>
                        <svg class="sparkline" :viewBox="`0 0 120 36`" preserveAspectRatio="none">
                            <polyline
                                :points="t.points"
                                fill="none"
                                :stroke="t.direction === 'up' ? '#fb923c' : t.direction === 'down' ? '#60a5fa' : '#94a3b8'"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <circle
                                v-for="(pt, i) in t.dots"
                                :key="i"
                                :cx="pt.x" :cy="pt.y" r="2.5"
                                :fill="t.direction === 'up' ? '#fb923c' : t.direction === 'down' ? '#60a5fa' : '#94a3b8'"
                            />
                        </svg>
                        <div class="trend-range">
                            <span>{{ t.first }}{{ t.unit }}</span>
                            <span class="trend-dates">{{ t.firstDate }} → {{ t.lastDate }}</span>
                            <span>{{ t.last }}{{ t.unit }}</span>
                        </div>
                    </div>
                </div>
            </template>

            <template v-if="groupedResults.length">
                <p class="section-label">All Results</p>
                <div v-for="group in groupedResults" :key="group.date" class="date-group">
                    <p class="group-date">{{ group.date }}</p>
                    <div class="list">
                        <div class="result-card glass-card" v-for="r in group.items" :key="r.id">
                            <div class="result-icon">
                                <mdicon name="test-tube" :size="20"/>
                            </div>
                            <div class="result-body">
                                <div class="result-name-row">
                                    <span class="result-name">{{ r.testName }}</span>
                                    <span class="status-badge" :class="`status-${r.status?.toLowerCase()}`">{{ r.status }}</span>
                                    <button class="del-btn" :disabled="deletingId === r.id" @click="confirmDelete(r)">
                                        <mdicon name="trash-can-outline" :size="14"/>
                                    </button>
                                </div>
                                <p class="result-value">{{ r.value }}{{ r.unit ? ' ' + r.unit : '' }}</p>
                                <p v-if="r.referenceRange" class="result-ref">Ref: {{ r.referenceRange }}</p>
                                <p v-if="r.labName" class="result-lab">{{ r.labName }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <div v-else class="state-box empty">
                <mdicon :name="labResults.length ? 'filter-off-outline' : 'flask-empty-outline'" :size="56" class="empty-icon"/>
                <p class="empty-title">{{ labResults.length ? 'No matching results' : 'No lab results yet' }}</p>
                <p class="empty-text">{{ labResults.length ? 'Try a different filter or search term.' : 'Add a lab report and use "Extract with AI" to save results here.' }}</p>
                <button v-if="labResults.length" class="clear-filter-btn" @click="filterStatus = 'all'; searchQuery = ''">Clear filters</button>
            </div>

            <p v-if="error" class="error-text">{{ error }}</p>
        </template>
    </div>
</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'LabResultsMobile',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const profileId = route.query.profileId || localStorage.getItem('selectedProfileId') || ''
        const profileName = route.query.profileName || localStorage.getItem('selectedProfileName') || ''
        const labResults = ref([])
        const loading = ref(false)
        const error = ref('')
        const deletingId = ref(null)
        const filterStatus = ref('all')
        const searchQuery = ref('')

        const formatDate = (d) => {
            if (!d) return 'Unknown date'
            return new Date(d).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
        }

        const shortDate = (d) => {
            if (!d) return ''
            return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }

        const buildSparkline = (values, w = 120, h = 36, pad = 4) => {
            if (values.length < 2) return { points: '', dots: [] }
            const min = Math.min(...values)
            const max = Math.max(...values)
            const range = max - min || 1
            const xs = values.map((_, i) => pad + (i / (values.length - 1)) * (w - pad * 2))
            const ys = values.map(v => h - pad - ((v - min) / range) * (h - pad * 2))
            return {
                points: xs.map((x, i) => `${x},${ys[i]}`).join(' '),
                dots: xs.map((x, i) => ({ x, y: ys[i] }))
            }
        }

        const trends = computed(() => {
            const byTest = new Map()
            for (const r of labResults.value) {
                const num = parseFloat(r.value)
                if (isNaN(num)) continue
                const key = r.testName.toLowerCase()
                if (!byTest.has(key)) byTest.set(key, [])
                byTest.get(key).push({ ...r, num })
            }
            const result = []
            for (const [, entries] of byTest) {
                const sorted = [...entries].sort((a, b) => new Date(a.collectedAt) - new Date(b.collectedAt))
                const uniqueDates = new Set(sorted.map(e => e.collectedAt?.slice(0, 10)))
                if (uniqueDates.size < 2) continue
                const values = sorted.map(e => e.num)
                const first = values[0]
                const last = values[values.length - 1]
                const direction = last > first * 1.02 ? 'up' : last < first * 0.98 ? 'down' : 'stable'
                const { points, dots } = buildSparkline(values)
                result.push({
                    testName: sorted[0].testName,
                    unit: sorted[0].unit ? ` ${sorted[0].unit}` : '',
                    first: first.toString(),
                    last: last.toString(),
                    firstDate: shortDate(sorted[0].collectedAt),
                    lastDate: shortDate(sorted[sorted.length - 1].collectedAt),
                    direction,
                    points,
                    dots
                })
            }
            return result
        })

        const ABNORMAL = new Set(['high', 'low', 'critical'])

        const filteredResults = computed(() => {
            const q = searchQuery.value.trim().toLowerCase()
            return labResults.value.filter(r => {
                const statusMatch =
                    filterStatus.value === 'all' ||
                    (filterStatus.value === 'abnormal' && ABNORMAL.has(r.status?.toLowerCase())) ||
                    (filterStatus.value === 'normal' && r.status?.toLowerCase() === 'normal')
                const searchMatch = !q || r.testName.toLowerCase().includes(q)
                return statusMatch && searchMatch
            })
        })

        const chips = computed(() => {
            const all = labResults.value.length
            const abnormal = labResults.value.filter(r => ABNORMAL.has(r.status?.toLowerCase())).length
            const normal = labResults.value.filter(r => r.status?.toLowerCase() === 'normal').length
            return [
                { value: 'all', label: 'All', count: all, color: 'chip-neutral' },
                { value: 'abnormal', label: 'Abnormal', count: abnormal, color: 'chip-red' },
                { value: 'normal', label: 'Normal', count: normal, color: 'chip-green' }
            ]
        })

        const groupedResults = computed(() => {
            const map = new Map()
            for (const r of filteredResults.value) {
                const key = r.collectedAt ? formatDate(r.collectedAt) : 'Date unknown'
                const raw = r.collectedAt ? new Date(r.collectedAt).getTime() : 0
                if (!map.has(key)) map.set(key, { date: key, rawTime: raw, items: [] })
                map.get(key).items.push(r)
            }
            return [...map.values()].sort((a, b) => b.rawTime - a.rawTime)
        })

        const load = async () => {
            if (!profileId) return
            const token = localStorage.getItem('token')
            if (!token) return
            loading.value = true
            error.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/lab-results?profileId=${profileId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (res.ok) {
                    labResults.value = data.labResults || []
                } else {
                    error.value = data.message || 'Unable to load lab results'
                }
            } catch (err) {
                error.value = err.message || 'Network error'
            } finally {
                loading.value = false
            }
        }

        const confirmDelete = async (result) => {
            if (!confirm(`Remove "${result.testName}"?`)) return
            const token = localStorage.getItem('token')
            if (!token) return
            deletingId.value = result.id
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/lab-results/${result.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) labResults.value = labResults.value.filter(r => r.id !== result.id)
            } finally {
                deletingId.value = null
            }
        }

        onMounted(load)

        return {
            router, trends, groupedResults, chips, loading, error, profileName,
            deletingId, filterStatus, searchQuery, labResults, confirmDelete
        }
    }
}
</script>

<style scoped>
.page-container {
    height: 100dvh;
    background: var(--bg-main);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.bg-orb { position: absolute; filter: blur(60px); opacity: 0.25; z-index: 0; }
.orb-1 { width: 300px; height: 300px; border-radius: 50%; background: linear-gradient(135deg, #22d3ee, #6366f1); top: -130px; left: -100px; }
.orb-2 { width: 240px; height: 240px; border-radius: 50%; background: linear-gradient(135deg, #a855f7, #22c55e); bottom: -100px; right: -80px; }

.header {
    background: var(--glass-ghost-bg);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 10;
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--glass-card-border);
    flex-shrink: 0;
}

.back-btn {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    padding: 8px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.title-block { flex: 1; }
.page-title { font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0; }
.profile-subtitle { font-size: 13px; color: var(--text-muted); margin: 0; }

.filter-bar {
    z-index: 9;
    background: var(--bg-main);
    border-bottom: 1px solid var(--glass-card-border);
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
}

.search-wrap {
    position: relative;
    display: flex;
    align-items: center;
}
.search-icon {
    position: absolute;
    left: 10px;
    color: var(--text-muted);
    pointer-events: none;
}
.search-input {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 8px 36px;
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
}
.search-input:focus { border-color: rgba(99,102,241,0.5); }
.search-input::placeholder { color: var(--text-muted); }
.search-clear {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
}

.chip-row { display: flex; gap: 8px; }

.chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid transparent;
    background: rgba(255,255,255,0.05);
    color: var(--text-muted);
    transition: all 0.15s;
}
.chip-count {
    font-size: 11px;
    font-weight: 800;
    background: rgba(255,255,255,0.1);
    border-radius: 999px;
    padding: 0 5px;
    min-width: 18px;
    text-align: center;
}

.chip-neutral.active { background: rgba(148,163,184,0.15); border-color: rgba(148,163,184,0.3); color: #cbd5e1; }
.chip-red.active     { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.35); color: #f87171; }
.chip-green.active   { background: rgba(34,197,94,0.12);  border-color: rgba(34,197,94,0.3);   color: #4ade80; }

.clear-filter-btn {
    margin-top: 8px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    padding: 8px 20px;
    cursor: pointer;
}

.content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 18px 16px 32px;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.section-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin: 0 0 8px;
    padding: 0 2px;
}

.trends-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }

.trend-card {
    padding: 12px 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.trend-header { display: flex; align-items: center; justify-content: space-between; }
.trend-name { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.trend-arrow { font-size: 18px; font-weight: 800; }
.trend-arrow.up { color: #fb923c; }
.trend-arrow.down { color: #60a5fa; }
.trend-arrow.stable { color: #94a3b8; }

.sparkline { width: 100%; height: 36px; display: block; }

.trend-range {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-secondary);
}
.trend-dates { font-size: 11px; color: var(--text-muted); }

.date-group { display: flex; flex-direction: column; gap: 8px; }
.group-date { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin: 0; padding: 0 2px; }
.list { display: flex; flex-direction: column; gap: 8px; }

.result-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
}

.result-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.2));
    border: 1px solid rgba(34,211,238,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #67e8f9;
    flex-shrink: 0;
}

.result-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }

.result-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.result-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }

.status-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.status-normal   { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
.status-high     { background: rgba(251,146,60,0.15); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }
.status-low      { background: rgba(96,165,250,0.15); color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); }
.status-critical { background: rgba(248,113,113,0.15);color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
.status-unknown  { background: rgba(148,163,184,0.1); color: var(--text-muted); border: 1px solid rgba(148,163,184,0.2); }

.del-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: rgba(248,113,113,0.5);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: color 0.15s;
}
.del-btn:hover { color: #f87171; }
.del-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.result-value { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; }
.result-ref   { font-size: 12px; color: var(--text-muted); margin: 0; }
.result-lab   { font-size: 12px; color: var(--text-muted); font-style: italic; margin: 0; }

.state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--text-secondary);
    gap: 12px;
}

.empty-icon { color: #64748b; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.empty-text  { font-size: 14px; color: var(--text-muted); margin: 0; max-width: 280px; line-height: 1.5; }

.error-text { color: #f87171; font-size: 13px; text-align: center; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
