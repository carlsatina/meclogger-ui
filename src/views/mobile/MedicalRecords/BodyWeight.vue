<template>
<div class="bw-container">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <!-- Header -->
    <div class="header glass-nav">
        <button class="icon-btn" @click="goBack">
            <mdicon name="arrow-left" :size="24"/>
        </button>
        <div class="title-block">
            <h2 class="page-title">Body Weight</h2>
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
                        <p class="stats-value">{{ latestRecord.weight }}</p>
                        <p class="stats-unit">kg</p>
                    </div>
                    <div class="trend-tag" v-if="periodTrend" :class="periodTrend.cls">
                        {{ periodTrend.icon }} {{ periodTrend.text }}
                    </div>
                </div>
                <div class="trend-ring" :class="periodTrend ? periodTrend.ringCls : 'ring-neutral'">
                    <mdicon :name="periodTrend ? periodTrend.iconName : 'minus'" :size="28"/>
                </div>
            </div>
            <div class="stats-row">
                <div class="stat-item">
                    <p class="stat-num">{{ periodStats.avg }}</p>
                    <p class="stat-lbl">Avg (kg)</p>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <p class="stat-num">{{ periodStats.min }}</p>
                    <p class="stat-lbl">Min (kg)</p>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <p class="stat-num">{{ periodStats.max }}</p>
                    <p class="stat-lbl">Max (kg)</p>
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
            <mdicon name="scale-bathroom" :size="36" class="empty-icon"/>
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
            <svg :viewBox="`0 0 ${svgW} ${svgH}`" class="bw-chart-svg" width="100%" height="auto">
                <defs>
                    <linearGradient id="bwAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="#60a5fa" stop-opacity="0.02"/>
                    </linearGradient>
                </defs>
                <!-- Grid lines + y labels -->
                <g v-for="yl in chartData.yLabels" :key="yl.val">
                    <line :x1="padL" :y1="yl.y" :x2="svgW - padR" :y2="yl.y"
                        stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
                    <text :x="padL - 4" :y="yl.y + 3.5" text-anchor="end" font-size="9"
                        fill="rgba(255,255,255,0.35)">{{ yl.val }}</text>
                </g>
                <!-- Area fill -->
                <path v-if="chartData.areaPath" :d="chartData.areaPath" fill="url(#bwAreaGrad)"/>
                <!-- Main line -->
                <polyline v-if="chartData.polyline"
                    :points="chartData.polyline"
                    fill="none" stroke="#60a5fa" stroke-width="2"
                    stroke-linejoin="round" stroke-linecap="round"/>
                <!-- Dots -->
                <circle v-for="pt in chartData.points" :key="`pt-${pt.x}`"
                    :cx="pt.x" :cy="pt.y" r="3.5"
                    fill="#60a5fa" stroke="#0b1020" stroke-width="1.5"/>
                <!-- X-axis labels -->
                <g v-for="xl in chartData.xLabels" :key="`xl-${xl.x}`">
                    <text :x="xl.x" :y="svgH - 2" text-anchor="middle" font-size="9"
                        fill="rgba(255,255,255,0.35)">{{ xl.label }}</text>
                </g>
            </svg>
        </div>

        <!-- Readings list -->
        <template v-if="weightList.length">
            <p class="section-label">Readings</p>
            <div class="records-list">
                <div
                    class="record-row glass-card"
                    v-for="rec in weightList" :key="rec.id"
                    @click="openRecordDetail(rec.id)"
                >
                    <div class="rec-left">
                        <p class="rec-value">{{ rec.weight }}</p>
                        <p class="rec-unit">kg</p>
                    </div>
                    <div class="rec-mid">
                        <p class="rec-date">{{ rec.date }}</p>
                        <p class="rec-time">{{ rec.time }}</p>
                    </div>
                    <span v-if="rec.delta !== null" class="delta-badge" :class="rec.deltaCls">
                        {{ rec.deltaText }}
                    </span>
                    <span v-else class="delta-badge delta-first">First</span>
                </div>
            </div>
        </template>

        <!-- No readings in period -->
        <div class="list-empty" v-if="records.length && !weightList.length">
            <p>No readings in this period.</p>
            <button class="period-link" @click="selectPeriod('All')">View all readings</button>
        </div>

    </div>
</div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBodyWeight } from '@/composables/vitals/bodyWeight'

const svgW = 320, svgH = 140
const padL = 40, padR = 10, padT = 12, padB = 22
const chartAreaW = svgW - padL - padR
const chartAreaH = svgH - padT - padB

export default {
    name: 'BodyWeightDetail',
    setup() {
        const router = useRouter()
        const route = useRoute()

        const selectedPeriod = ref('Month')
        const timePeriods = ['Week', 'Month', 'All']
        const weekOffset = ref(0)

        const profileIdFromQuery = Array.isArray(route.query.profileId) ? route.query.profileId[0] : route.query.profileId
        const profileNameFromQuery = Array.isArray(route.query.profileName) ? route.query.profileName[0] : route.query.profileName
        const activeProfileId = ref(profileIdFromQuery || localStorage.getItem('selectedProfileId'))
        const activeProfileName = ref(profileNameFromQuery || localStorage.getItem('selectedProfileName') || 'Profile')

        if (activeProfileId.value) localStorage.setItem('selectedProfileId', activeProfileId.value)
        if (activeProfileName.value) localStorage.setItem('selectedProfileName', activeProfileName.value)

        const { records, fetchRecords } = useBodyWeight()

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

        // All records sorted newest first
        const sortedRecords = computed(() =>
            records.value.slice().sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
        )

        const filteredRecords = computed(() => {
            const all = sortedRecords.value
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

        const latestRecord = computed(() => {
            if (!sortedRecords.value.length) return null
            return { weight: Number(sortedRecords.value[0].valueNumber).toFixed(1) }
        })

        // Period trend: compare newest to oldest in filtered period
        const periodTrend = computed(() => {
            const recs = filteredRecords.value
            if (recs.length < 2) return null
            const newest = Number(recs[0].valueNumber)
            const oldest = Number(recs[recs.length - 1].valueNumber)
            const delta = +(newest - oldest).toFixed(1)
            if (delta > 0.1) return {
                text: `+${delta} kg this period`,
                icon: '↑', cls: 'trend-up', ringCls: 'ring-up', iconName: 'trending-up'
            }
            if (delta < -0.1) return {
                text: `${delta} kg this period`,
                icon: '↓', cls: 'trend-down', ringCls: 'ring-down', iconName: 'trending-down'
            }
            return {
                text: 'Stable this period',
                icon: '→', cls: 'trend-stable', ringCls: 'ring-neutral', iconName: 'minus'
            }
        })

        const periodStats = computed(() => {
            const vals = filteredRecords.value.map(r => Number(r.valueNumber)).filter(v => v > 0)
            if (!vals.length) return { avg: '--', min: '--', max: '--', count: 0 }
            return {
                avg: (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
                min: Math.min(...vals).toFixed(1),
                max: Math.max(...vals).toFixed(1),
                count: vals.length
            }
        })

        // Reading list: newest first, delta vs. the reading immediately before it (chronologically)
        const weightList = computed(() => {
            const recs = filteredRecords.value
            // Build a lookup of the overall sorted records to find the prior reading
            const allSorted = sortedRecords.value
            return recs.map(r => {
                const w = Number(r.valueNumber)
                const dt = new Date(r.recordedAt)
                // Find the previous chronological record (the one recorded just before this one)
                const idx = allSorted.findIndex(x => x.id === r.id)
                const prevRec = allSorted[idx + 1]
                let delta = null, deltaCls = '', deltaText = ''
                if (prevRec) {
                    delta = +(w - Number(prevRec.valueNumber)).toFixed(1)
                    if (delta > 0.05) {
                        deltaCls = 'delta-up'
                        deltaText = `+${delta} kg`
                    } else if (delta < -0.05) {
                        deltaCls = 'delta-down'
                        deltaText = `${delta} kg`
                    } else {
                        deltaCls = 'delta-stable'
                        deltaText = '± 0'
                    }
                }
                return {
                    id: r.id,
                    weight: w.toFixed(1),
                    delta,
                    deltaCls,
                    deltaText,
                    date: dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                    time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            })
        })

        const chartData = computed(() => {
            const recs = filteredRecords.value.slice().reverse().slice(-20)
            const empty = { points: [], polyline: '', areaPath: '', yLabels: [], xLabels: [] }
            if (recs.length < 2) return empty

            const vals = recs.map(r => Number(r.valueNumber)).filter(v => v > 0)
            if (!vals.length) return empty

            const rawMin = Math.min(...vals)
            const rawMax = Math.max(...vals)
            // Keep scale tight around actual values (weight charts look better with tight range)
            const padding = Math.max(1, Math.ceil((rawMax - rawMin) * 0.2))
            const yMin = Math.floor(rawMin - padding)
            const yMax = Math.ceil(rawMax + padding)
            const yRange = yMax - yMin || 1

            const toY = v => padT + chartAreaH - ((v - yMin) / yRange) * chartAreaH
            const toX = i => recs.length === 1 ? padL + chartAreaW / 2 : padL + (i / (recs.length - 1)) * chartAreaW

            const points = recs.map((r, i) => ({
                x: toX(i),
                y: toY(Number(r.valueNumber))
            }))

            const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

            const bottomY = (padT + chartAreaH).toFixed(1)
            const areaPath = `M ${points[0].x.toFixed(1)},${bottomY} ` +
                points.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
                ` L ${points[points.length - 1].x.toFixed(1)},${bottomY} Z`

            const mid = +((yMin + yMax) / 2).toFixed(1)
            const yLabels = [
                { val: yMax.toFixed(1), y: toY(yMax) },
                { val: mid,             y: toY(mid)  },
                { val: yMin.toFixed(1), y: toY(yMin) }
            ]

            const step = Math.max(1, Math.ceil(recs.length / 5))
            const xLabels = recs
                .map((r, i) => ({
                    x: toX(i),
                    label: new Date(r.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    show: i % step === 0 || i === recs.length - 1
                }))
                .filter(xl => xl.show)

            return { points, polyline, areaPath, yLabels, xLabels }
        })

        const goBack = () => router.push({ path: '/medical-records', query: { tab: 'health' } })

        const openRecordDetail = (recordId) => {
            if (!recordId) return
            router.push({
                path: `/medical-records/body-weight/${recordId}`,
                query: { profileId: activeProfileId.value, profileName: activeProfileName.value }
            })
        }

        const goToAddRecord = () => {
            router.push({
                path: '/medical-records/body-weight/add',
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
            dateRangeLabel, chartData, weightList,
            latestRecord, periodStats, periodTrend,
            selectPeriod, goBack, goToAddRecord, openRecordDetail
        }
    }
}
</script>

<style scoped>
.bw-container {
    height: 100dvh;
    background: var(--bg-main);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
.bg-orb { position: absolute; filter: blur(60px); opacity: 0.28; z-index: 0; pointer-events: none; }
.orb-1 { width: 320px; height: 320px; border-radius: 50%; background: linear-gradient(135deg, #60a5fa, #a855f7); top: -140px; left: -110px; }
.orb-2 { width: 260px; height: 260px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #60a5fa); bottom: -120px; right: -90px; }

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
.period-tab.active { color: #93c5fd; }
.period-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%; right: 20%;
    height: 3px;
    background: linear-gradient(135deg, #60a5fa, #a855f7);
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
.stats-unit { font-size: 13px; color: var(--text-muted); }
.trend-tag {
    display: inline-block;
    margin-top: 6px;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid transparent;
}
.trend-up     { background: rgba(248,113,113,0.12); color: #f87171; border-color: rgba(248,113,113,0.25); }
.trend-down   { background: rgba(34,197,94,0.12);  color: #4ade80; border-color: rgba(34,197,94,0.25);  }
.trend-stable { background: rgba(255,255,255,0.07); color: var(--text-muted); border-color: rgba(255,255,255,0.12); }

/* Trend ring icon */
.trend-ring {
    width: 56px; height: 56px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}
.ring-up     { background: rgba(248,113,113,0.12); color: #f87171; border: 1.5px solid rgba(248,113,113,0.3); }
.ring-down   { background: rgba(34,197,94,0.12);  color: #4ade80; border: 1.5px solid rgba(34,197,94,0.3);  }
.ring-neutral { background: rgba(96,165,250,0.1);  color: #60a5fa; border: 1.5px solid rgba(96,165,250,0.25); }

.stats-row { display: flex; align-items: center; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 12px; }
.stat-item { flex: 1; text-align: center; }
.stat-num { font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0; }
.stat-lbl { font-size: 11px; color: var(--text-muted); margin: 2px 0 0; }
.stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,0.1); }

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
.bw-chart-svg { width: 100%; display: block; }

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

/* Delta badges */
.delta-badge {
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    border: 1px solid transparent;
}
.delta-up     { background: rgba(248,113,113,0.12); color: #f87171; border-color: rgba(248,113,113,0.25); }
.delta-down   { background: rgba(34,197,94,0.12);  color: #4ade80; border-color: rgba(34,197,94,0.25);  }
.delta-stable { background: rgba(255,255,255,0.06); color: var(--text-muted); border-color: rgba(255,255,255,0.1); }
.delta-first  { background: rgba(96,165,250,0.1);  color: #60a5fa; border-color: rgba(96,165,250,0.2);  }

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
.period-link { background: none; border: none; color: #93c5fd; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: underline; }
</style>
