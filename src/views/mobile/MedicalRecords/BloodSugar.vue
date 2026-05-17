<template>
<div class="bs-container">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <!-- Header -->
    <div class="header glass-nav">
        <button class="icon-btn" @click="goBack">
            <mdicon name="arrow-left" :size="24"/>
        </button>
        <div class="title-block">
            <h2 class="page-title">Blood Sugar</h2>
            <p class="profile-subtitle">{{ activeProfileName }}</p>
        </div>
        <button class="icon-btn" @click="goToAddRecord">
            <mdicon name="plus" :size="24"/>
        </button>
    </div>

    <!-- Period tabs -->
    <div class="period-tabs">
        <button
            v-for="p in timePeriods" :key="p"
            class="period-tab" :class="{ active: selectedPeriod === p }"
            @click="selectPeriod(p)"
        >{{ p }}</button>
    </div>

    <!-- Scrollable content -->
    <div class="scroll-area">

        <!-- Stats card -->
        <div class="stats-card glass-card" v-if="latestRecord">
            <div class="stats-main">
                <div>
                    <p class="stats-label">Latest Reading</p>
                    <div class="stats-value-row">
                        <p class="stats-value">{{ latestRecord.value }}</p>
                        <p class="stats-unit">mg/dL</p>
                    </div>
                    <span class="type-tag">{{ latestRecord.type }}</span>
                </div>
                <span class="bs-badge" :class="latestRecord.cls">{{ latestRecord.label }}</span>
            </div>
            <div class="stats-row">
                <div class="stat-item">
                    <p class="stat-num">{{ periodStats.avg }}</p>
                    <p class="stat-lbl">Avg</p>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <p class="stat-num">{{ periodStats.min }}</p>
                    <p class="stat-lbl">Min</p>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <p class="stat-num">{{ periodStats.max }}</p>
                    <p class="stat-lbl">Max</p>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <p class="stat-num">{{ periodStats.count }}</p>
                    <p class="stat-lbl">Readings</p>
                </div>
            </div>
        </div>

        <!-- Empty overall state -->
        <div class="stats-empty glass-card" v-else-if="!records.length">
            <mdicon name="water" :size="36" class="empty-icon"/>
            <p>No readings yet</p>
            <button class="glass-btn-primary add-first-btn" @click="goToAddRecord">Add first reading</button>
        </div>

        <!-- Chart -->
        <div class="chart-card glass-card" v-if="chartData.points.length > 1">
            <div class="chart-nav" v-if="selectedPeriod === 'Week'">
                <button class="icon-btn-sm" @click="weekOffset--">
                    <mdicon name="chevron-left" :size="20"/>
                </button>
                <span class="chart-range-label">{{ dateRangeLabel }}</span>
                <button class="icon-btn-sm" @click="weekOffset++" :disabled="weekOffset >= 0">
                    <mdicon name="chevron-right" :size="20"/>
                </button>
            </div>
            <div class="chart-legend">
                <span class="legend-swatch normal-swatch"></span>
                <span class="legend-text">Normal</span>
                <span class="legend-swatch pre-swatch"></span>
                <span class="legend-text">Pre-diabetes</span>
                <span class="legend-swatch high-swatch"></span>
                <span class="legend-text">Diabetes</span>
            </div>
            <svg :viewBox="`0 0 ${svgW} ${svgH}`" class="bs-chart-svg" width="100%" height="auto">
                <defs>
                    <linearGradient id="bsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.18"/>
                        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.02"/>
                    </linearGradient>
                </defs>
                <!-- Grid lines + y labels -->
                <g v-for="yl in chartData.yLabels" :key="yl.val">
                    <line :x1="padL" :y1="yl.y" :x2="svgW - padR" :y2="yl.y"
                        stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
                    <text :x="padL - 4" :y="yl.y + 3.5" text-anchor="end" font-size="9"
                        fill="rgba(255,255,255,0.35)">{{ yl.val }}</text>
                </g>
                <!-- Clinical reference lines -->
                <g v-for="ref in chartData.refLines" :key="ref.label">
                    <line :x1="padL" :y1="ref.y" :x2="svgW - padR" :y2="ref.y"
                        :stroke="ref.color" stroke-width="1" stroke-dasharray="4 3"/>
                </g>
                <!-- Area fill -->
                <path v-if="chartData.areaPath" :d="chartData.areaPath" fill="url(#bsAreaGrad)"/>
                <!-- Main line -->
                <polyline v-if="chartData.polyline"
                    :points="chartData.polyline"
                    fill="none" stroke="#f59e0b" stroke-width="2"
                    stroke-linejoin="round" stroke-linecap="round"/>
                <!-- Dots colored by classification -->
                <circle v-for="pt in chartData.points" :key="`pt-${pt.x}`"
                    :cx="pt.x" :cy="pt.y" r="3.5"
                    :fill="pt.dotColor" stroke="#0b1020" stroke-width="1.5"/>
                <!-- X-axis labels -->
                <g v-for="xl in chartData.xLabels" :key="`xl-${xl.x}`">
                    <text :x="xl.x" :y="svgH - 2" text-anchor="middle" font-size="9"
                        fill="rgba(255,255,255,0.35)">{{ xl.label }}</text>
                </g>
            </svg>
        </div>

        <!-- Readings list -->
        <template v-if="bsList.length">
            <p class="section-label">Readings</p>
            <div class="records-list">
                <div
                    class="record-row glass-card"
                    v-for="rec in bsList" :key="rec.id"
                    @click="openRecordDetail(rec.id)"
                >
                    <div class="rec-left">
                        <p class="rec-value">{{ rec.value }}</p>
                        <p class="rec-unit">mg/dL</p>
                    </div>
                    <div class="rec-mid">
                        <p class="rec-date">{{ rec.date }}</p>
                        <p class="rec-time">{{ rec.time }} · <span class="rec-type">{{ rec.type }}</span></p>
                    </div>
                    <span class="bs-badge sm" :class="rec.cls">{{ rec.label }}</span>
                </div>
            </div>
        </template>

        <!-- No readings in period -->
        <div class="list-empty" v-if="records.length && !bsList.length">
            <p>No readings in this period.</p>
            <button class="period-link" @click="selectPeriod('All')">View all readings</button>
        </div>

    </div>
</div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBloodSugar } from '@/composables/vitals/bloodSugar'

const svgW = 320, svgH = 150
const padL = 36, padR = 10, padT = 12, padB = 22
const chartAreaW = svgW - padL - padR
const chartAreaH = svgH - padT - padB

export default {
    name: 'BloodSugarDetail',
    setup() {
        const router = useRouter()
        const route = useRoute()

        const selectedPeriod = ref('Week')
        const timePeriods = ['Week', 'Month', 'All']
        const weekOffset = ref(0)

        const profileIdFromQuery = Array.isArray(route.query.profileId) ? route.query.profileId[0] : route.query.profileId
        const profileNameFromQuery = Array.isArray(route.query.profileName) ? route.query.profileName[0] : route.query.profileName
        const activeProfileId = ref(profileIdFromQuery || localStorage.getItem('selectedProfileId'))
        const activeProfileName = ref(profileNameFromQuery || localStorage.getItem('selectedProfileName') || 'Profile')

        if (activeProfileId.value) localStorage.setItem('selectedProfileId', activeProfileId.value)
        if (activeProfileName.value) localStorage.setItem('selectedProfileName', activeProfileName.value)

        const { records, fetchRecords } = useBloodSugar()

        const loadRecords = async () => {
            const token = localStorage.getItem('token')
            await fetchRecords(token, activeProfileId.value)
        }

        const selectPeriod = (p) => {
            selectedPeriod.value = p
            weekOffset.value = 0
        }

        const weekWindow = computed(() => {
            const now = new Date()
            const start = new Date(now)
            start.setDate(now.getDate() - now.getDay() + weekOffset.value * 7)
            start.setHours(0, 0, 0, 0)
            const end = new Date(start)
            end.setDate(start.getDate() + 7)
            return { start, end }
        })

        const dateRangeLabel = computed(() => {
            const { start, end } = weekWindow.value
            const fmt = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
            return `${fmt(start)} – ${fmt(new Date(end.getTime() - 86400000))}`
        })

        const filteredRecords = computed(() => {
            const all = records.value.slice().sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            if (selectedPeriod.value === 'Week') {
                const { start, end } = weekWindow.value
                return all.filter(r => {
                    const d = new Date(r.recordedAt)
                    return d >= start && d < end
                })
            }
            if (selectedPeriod.value === 'Month') {
                const cutoff = new Date()
                cutoff.setDate(cutoff.getDate() - 30)
                return all.filter(r => new Date(r.recordedAt) >= cutoff)
            }
            return all
        })

        const normalizeType = (raw) => {
            const t = (raw || '').toLowerCase()
            if (t.includes('after') || t.includes('post') || t.includes('meal') || t.includes('2h')) return 'Post-meal'
            if (t.includes('random')) return 'Random'
            return 'Fasting'
        }

        const classifyBS = (value, rawType = '') => {
            value = Number(value)
            if (Number.isNaN(value) || value === 0) return { label: '—', cls: 'bs-unknown', dotColor: 'rgba(255,255,255,0.3)' }
            if (value < 70) return { label: 'Low', cls: 'bs-low', dotColor: '#60a5fa' }
            const type = normalizeType(rawType)
            if (type === 'Post-meal') {
                if (value < 140) return { label: 'Normal',       cls: 'bs-normal', dotColor: '#4ade80' }
                if (value < 200) return { label: 'Pre-diabetes', cls: 'bs-pre',    dotColor: '#fbbf24' }
                return                   { label: 'Diabetes',    cls: 'bs-high',   dotColor: '#f87171' }
            }
            // Fasting or Random
            if (value < 100) return { label: 'Normal',       cls: 'bs-normal', dotColor: '#4ade80' }
            if (value < 126) return { label: 'Pre-diabetes', cls: 'bs-pre',    dotColor: '#fbbf24' }
            return                   { label: 'Diabetes',    cls: 'bs-high',   dotColor: '#f87171' }
        }

        // Latest reading (most recent overall)
        const latestRecord = computed(() => {
            const all = records.value.slice().sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            if (!all.length) return null
            const r = all[0]
            const value = Number(r.valueNumber) || 0
            const type = normalizeType(r.chartGroup)
            const { label, cls } = classifyBS(value, r.chartGroup)
            return { value, type, label, cls }
        })

        const periodStats = computed(() => {
            const recs = filteredRecords.value
            const vals = recs.map(r => Number(r.valueNumber) || 0).filter(v => v > 0)
            if (!vals.length) return { avg: '--', min: '--', max: '--', count: recs.length }
            return {
                avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
                min: Math.min(...vals),
                max: Math.max(...vals),
                count: recs.length
            }
        })

        const bsList = computed(() => {
            return filteredRecords.value.map(r => {
                const value = Number(r.valueNumber) || 0
                const type = normalizeType(r.chartGroup)
                const dt = new Date(r.recordedAt)
                const { label, cls } = classifyBS(value, r.chartGroup)
                return {
                    id: r.id,
                    value, type, label, cls,
                    date: dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                    time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            })
        })

        const chartData = computed(() => {
            const recs = filteredRecords.value.slice().reverse().slice(-20)
            const empty = { points: [], polyline: '', areaPath: '', yLabels: [], refLines: [], xLabels: [] }
            if (recs.length < 2) return empty

            const vals = recs.map(r => Number(r.valueNumber) || 0).filter(v => v > 0)
            if (!vals.length) return empty

            const rawMin = Math.min(...vals)
            const rawMax = Math.max(...vals)
            const yMin = Math.max(40, Math.floor((rawMin - 15) / 10) * 10)
            const yMax = Math.ceil((rawMax + 15) / 10) * 10
            const yRange = yMax - yMin || 1

            const toY = v => padT + chartAreaH - ((v - yMin) / yRange) * chartAreaH
            const toX = i => recs.length === 1 ? padL + chartAreaW / 2 : padL + (i / (recs.length - 1)) * chartAreaW

            const points = recs.map((r, i) => {
                const v = Number(r.valueNumber) || 0
                const { dotColor } = classifyBS(v, r.chartGroup)
                return { x: toX(i), y: toY(v), dotColor }
            })

            const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

            const bottomY = (padT + chartAreaH).toFixed(1)
            const areaPath = `M ${points[0].x.toFixed(1)},${bottomY} ` +
                points.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
                ` L ${points[points.length - 1].x.toFixed(1)},${bottomY} Z`

            const mid = Math.round((yMin + yMax) / 2 / 5) * 5
            const yLabels = [
                { val: yMax, y: toY(yMax) },
                { val: mid,  y: toY(mid)  },
                { val: yMin, y: toY(yMin) }
            ]

            const refLines = []
            if (70  > yMin && 70  < yMax) refLines.push({ y: toY(70),  label: '70',  color: 'rgba(96,165,250,0.5)'  })
            if (100 > yMin && 100 < yMax) refLines.push({ y: toY(100), label: '100', color: 'rgba(251,191,36,0.5)' })
            if (126 > yMin && 126 < yMax) refLines.push({ y: toY(126), label: '126', color: 'rgba(248,113,113,0.5)' })

            const step = Math.max(1, Math.ceil(recs.length / 5))
            const xLabels = recs
                .map((r, i) => ({
                    x: toX(i),
                    label: new Date(r.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    show: i % step === 0 || i === recs.length - 1
                }))
                .filter(xl => xl.show)

            return { points, polyline, areaPath, yLabels, refLines, xLabels }
        })

        const goBack = () => router.push({ path: '/medical-records', query: { tab: 'health' } })

        const openRecordDetail = (recordId) => {
            if (!recordId) return
            router.push({
                path: `/medical-records/blood-sugar/${recordId}`,
                query: { profileId: activeProfileId.value, profileName: activeProfileName.value }
            })
        }

        const goToAddRecord = () => {
            router.push({
                path: '/medical-records/blood-sugar/add',
                query: { profileId: activeProfileId.value, profileName: activeProfileName.value }
            })
        }

        onMounted(() => loadRecords())

        watch(() => route.query.profileId, (val) => {
            const newId = Array.isArray(val) ? val[0] : val
            if (newId && newId !== activeProfileId.value) {
                activeProfileId.value = newId
                localStorage.setItem('selectedProfileId', newId)
                loadRecords()
            }
        })

        watch(() => route.query.profileName, (val) => {
            const newName = Array.isArray(val) ? val[0] : val
            if (newName) {
                activeProfileName.value = newName
                localStorage.setItem('selectedProfileName', newName)
            }
        })

        return {
            svgW, svgH, padL, padR,
            selectedPeriod, timePeriods, weekOffset,
            activeProfileName, records,
            dateRangeLabel, chartData, bsList,
            latestRecord, periodStats,
            selectPeriod, goBack, goToAddRecord, openRecordDetail
        }
    }
}
</script>

<style scoped>
.bs-container {
    height: 100dvh;
    background: var(--bg-main);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
.bg-orb { position: absolute; filter: blur(60px); opacity: 0.28; z-index: 0; pointer-events: none; }
.orb-1 { width: 320px; height: 320px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #a855f7); top: -140px; left: -110px; }
.orb-2 { width: 260px; height: 260px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #f59e0b); bottom: -120px; right: -90px; }

/* Header */
.header {
    background: var(--glass-ghost-bg);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--glass-card-border);
    z-index: 5;
    backdrop-filter: blur(12px);
    flex-shrink: 0;
}
.title-block { flex: 1; }
.page-title { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0; }
.profile-subtitle { margin: 0; font-size: 12px; color: var(--text-muted); }
.icon-btn {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    padding: 8px;
    cursor: pointer;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    transition: all 0.2s;
}
.icon-btn:active { transform: scale(0.92); background: rgba(255,255,255,0.12); }

/* Period tabs */
.period-tabs {
    display: flex;
    padding: 10px 16px 0;
    flex-shrink: 0;
    z-index: 1;
    position: relative;
}
.period-tab {
    flex: 1;
    background: transparent;
    border: none;
    padding: 10px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
}
.period-tab.active { color: #fbbf24; }
.period-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%; right: 20%;
    height: 3px;
    background: linear-gradient(135deg, #f59e0b, #a855f7);
    border-radius: 3px 3px 0 0;
}

/* Scroll area */
.scroll-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 16px 36px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    z-index: 1;
}

/* Stats card */
.stats-card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 14px 30px rgba(0,0,0,0.35);
}
.stats-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.stats-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin: 0 0 4px; }
.stats-value-row { display: flex; align-items: baseline; gap: 6px; }
.stats-value { font-size: 40px; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1; }
.stats-unit { font-size: 13px; color: var(--text-muted); margin: 0; }
.type-tag {
    display: inline-block;
    margin-top: 6px;
    padding: 3px 8px;
    background: rgba(245,158,11,0.12);
    color: #fbbf24;
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
}
.stats-row { display: flex; align-items: center; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 12px; }
.stat-item { flex: 1; text-align: center; }
.stat-num { font-size: 17px; font-weight: 800; color: var(--text-primary); margin: 0; }
.stat-lbl { font-size: 11px; color: var(--text-muted); margin: 2px 0 0; }
.stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.1); }

/* BS classification badges */
.bs-badge {
    padding: 5px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    border: 1px solid transparent;
}
.bs-badge.sm { padding: 4px 10px; font-size: 11px; }
.bs-normal  { background: rgba(34,197,94,0.15);  color: #4ade80; border-color: rgba(34,197,94,0.3);   }
.bs-pre     { background: rgba(251,191,36,0.15); color: #fbbf24; border-color: rgba(251,191,36,0.35); }
.bs-high    { background: rgba(239,68,68,0.15);  color: #f87171; border-color: rgba(239,68,68,0.35);  }
.bs-low     { background: rgba(96,165,250,0.15); color: #60a5fa; border-color: rgba(96,165,250,0.3);  }
.bs-unknown { background: rgba(255,255,255,0.07); color: var(--text-muted); border-color: rgba(255,255,255,0.1); }

/* Chart */
.chart-card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 14px 14px 10px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 14px 30px rgba(0,0,0,0.35);
}
.chart-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.chart-range-label { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.icon-btn-sm {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    padding: 5px;
    cursor: pointer;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    border-radius: 8px;
    transition: all 0.15s;
}
.icon-btn-sm:disabled { opacity: 0.3; cursor: default; }
.chart-legend { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.legend-swatch { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.normal-swatch { background: #4ade80; }
.pre-swatch    { background: #fbbf24; }
.high-swatch   { background: #f87171; }
.legend-text { font-size: 11px; color: var(--text-muted); }
.bs-chart-svg { width: 100%; display: block; }

/* Readings list */
.section-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0 2px;
    margin-bottom: -4px;
}
.records-list { display: flex; flex-direction: column; gap: 10px; }
.record-row {
    background: rgba(255,255,255,0.05);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 10px 24px rgba(0,0,0,0.28);
    cursor: pointer;
    transition: background 0.15s;
}
.record-row:active { background: rgba(255,255,255,0.09); }
.rec-left { min-width: 60px; }
.rec-value { font-size: 20px; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1; }
.rec-unit { font-size: 10px; color: var(--text-muted); margin: 3px 0 0; }
.rec-mid { flex: 1; }
.rec-date { font-size: 13px; color: var(--text-primary); margin: 0; font-weight: 600; }
.rec-time { font-size: 11px; color: var(--text-muted); margin: 2px 0 0; }
.rec-type { color: #fbbf24; font-weight: 700; }

/* Empty states */
.stats-empty {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 36px 16px;
    border: 1px solid rgba(255,255,255,0.08);
    text-align: center;
}
.empty-icon { color: var(--text-muted); display: block; margin: 0 auto 10px; }
.stats-empty p { color: var(--text-muted); margin: 0 0 16px; font-size: 15px; }
.add-first-btn { padding: 10px 24px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }
.list-empty { text-align: center; padding: 20px; color: var(--text-muted); font-size: 14px; }
.period-link { background: none; border: none; color: #fbbf24; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: underline; }
</style>
