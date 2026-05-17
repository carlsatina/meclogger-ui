<template>
<div class="illness-container">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <!-- Header -->
    <div class="header glass-nav">
        <button class="icon-btn" @click="goBack">
            <mdicon name="arrow-left" :size="24"/>
        </button>
        <div class="title-block">
            <h2 class="page-title">Illness</h2>
            <p class="profile-subtitle">{{ activeProfileName }}</p>
        </div>
        <button class="icon-btn" @click="goToAddIllness">
            <mdicon name="plus" :size="24"/>
        </button>
    </div>

    <!-- Status filter tabs -->
    <div class="filter-tabs">
        <button
            v-for="f in filters" :key="f.key"
            class="filter-tab" :class="{ active: activeFilter === f.key }"
            @click="activeFilter = f.key"
        >
            {{ f.label }}
            <span class="filter-count" v-if="f.key !== 'all' && filterCounts[f.key]">
                {{ filterCounts[f.key] }}
            </span>
        </button>
    </div>

    <!-- Scrollable content -->
    <div class="scroll-area">

        <!-- Active/recovering alert banner -->
        <div
            class="active-alert"
            :class="alertIllness.status === 'ACTIVE' || alertIllness.status === 'ONGOING' ? 'alert-red' : 'alert-amber'"
            v-if="alertIllness && activeFilter === 'all'"
        >
            <mdicon name="alert-circle" :size="20" class="alert-icon"/>
            <div class="alert-body">
                <p class="alert-title">{{ alertIllness.diagnosis }}</p>
                <p class="alert-sub">{{ alertIllness.daysText }}</p>
            </div>
            <span class="status-badge" :class="alertIllness.statusCls">{{ alertIllness.statusLabel }}</span>
        </div>

        <!-- Temperature sparkline — only shown when temperature data exists -->
        <div class="temp-card glass-card" v-if="tempSeries.length > 1">
            <div class="temp-header">
                <div>
                    <p class="temp-label">Body Temperature</p>
                    <div class="temp-reading">
                        <p class="temp-value">{{ latestTemp.value }}°{{ latestTemp.unit }}</p>
                        <span class="temp-badge" :class="tempClass">{{ tempLabel }}</span>
                    </div>
                </div>
                <p class="temp-date">{{ latestTemp.date }}</p>
            </div>
            <svg :viewBox="`0 0 ${svgW} ${svgH}`" class="temp-svg" width="100%" height="auto">
                <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="#a78bfa" stop-opacity="0.02"/>
                    </linearGradient>
                </defs>
                <g v-for="yl in tempChart.yLabels" :key="yl.val">
                    <line :x1="padL" :y1="yl.y" :x2="svgW - padR" :y2="yl.y"
                        stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
                    <text :x="padL - 4" :y="yl.y + 3.5" text-anchor="end" font-size="9"
                        fill="rgba(255,255,255,0.3)">{{ yl.val }}</text>
                </g>
                <!-- Fever reference line at 37.5°C -->
                <line v-if="tempChart.feverY !== null"
                    :x1="padL" :y1="tempChart.feverY" :x2="svgW - padR" :y2="tempChart.feverY"
                    stroke="rgba(248,113,113,0.5)" stroke-width="1" stroke-dasharray="4 3"/>
                <path v-if="tempChart.areaPath" :d="tempChart.areaPath" fill="url(#tempGrad)"/>
                <polyline v-if="tempChart.polyline"
                    :points="tempChart.polyline"
                    fill="none" stroke="#a78bfa" stroke-width="2"
                    stroke-linejoin="round" stroke-linecap="round"/>
                <circle v-for="pt in tempChart.points" :key="`tp-${pt.x}`"
                    :cx="pt.x" :cy="pt.y" r="3.5"
                    :fill="pt.dotColor" stroke="#0b1020" stroke-width="1.5"/>
                <g v-for="xl in tempChart.xLabels" :key="`xl-${xl.x}`">
                    <text :x="xl.x" :y="svgH - 2" text-anchor="middle" font-size="9"
                        fill="rgba(255,255,255,0.3)">{{ xl.label }}</text>
                </g>
            </svg>
        </div>

        <!-- Illness list -->
        <template v-if="filteredList.length">
            <p class="section-label">{{ filterLabel }} · {{ filteredList.length }}</p>
            <div class="illness-list">
                <div
                    class="illness-card glass-card"
                    v-for="rec in filteredList" :key="rec.id"
                    @click="openRecord(rec.id)"
                >
                    <div class="card-top">
                        <div class="card-left">
                            <span class="sev-dot" :class="rec.severityCls"></span>
                            <div>
                                <p class="card-diagnosis">{{ rec.diagnosis }}</p>
                                <p class="card-date">{{ rec.date }}</p>
                            </div>
                        </div>
                        <span class="status-badge sm" :class="rec.statusCls">{{ rec.statusLabel }}</span>
                    </div>
                    <div class="card-meta">
                        <span class="meta-pill" :class="rec.severityCls + '-pill'">{{ rec.severity }}</span>
                        <span class="meta-pill temp-pill" v-if="rec.temperature">
                            <mdicon name="thermometer" :size="12"/>{{ rec.temperature }}
                        </span>
                        <span class="meta-pill days-pill" v-if="rec.daysText">{{ rec.daysText }}</span>
                    </div>
                    <div class="symptom-row" v-if="rec.symptoms.length">
                        <span class="symptom-chip" v-for="s in rec.symptoms.slice(0, 4)" :key="s">{{ s }}</span>
                        <span class="more-chip" v-if="rec.symptoms.length > 4">+{{ rec.symptoms.length - 4 }} more</span>
                    </div>
                </div>
            </div>
        </template>

        <!-- Empty state -->
        <div class="empty-state glass-card" v-if="!filteredList.length && !loading">
            <mdicon name="stethoscope" :size="44" class="empty-icon"/>
            <p class="empty-title">{{ emptyTitle }}</p>
            <p class="empty-text">{{ emptyText }}</p>
            <button v-if="activeFilter === 'all'" class="glass-btn-primary empty-btn" @click="goToAddIllness">
                Add illness record
            </button>
        </div>

    </div>
</div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useIllness } from '@/composables/vitals/illness'

const svgW = 320, svgH = 100
const padL = 36, padR = 10, padT = 10, padB = 18
const chartAreaW = svgW - padL - padR
const chartAreaH = svgH - padT - padB

export default {
    name: 'Illness',
    setup() {
        const router = useRouter()
        const route = useRoute()
        const { records, loading, fetchRecords } = useIllness()

        const activeFilter = ref('all')
        const filters = [
            { key: 'all',        label: 'All'        },
            { key: 'active',     label: 'Active'     },
            { key: 'recovering', label: 'Recovering' },
            { key: 'resolved',   label: 'Resolved'   }
        ]

        const profileIdFromQuery = Array.isArray(route.query.profileId) ? route.query.profileId[0] : route.query.profileId
        const profileNameFromQuery = Array.isArray(route.query.profileName) ? route.query.profileName[0] : route.query.profileName
        const activeProfileId = ref(profileIdFromQuery || localStorage.getItem('selectedProfileId'))
        const activeProfileName = ref(profileNameFromQuery || localStorage.getItem('selectedProfileName') || 'Profile')

        if (activeProfileId.value) localStorage.setItem('selectedProfileId', activeProfileId.value)
        if (activeProfileName.value) localStorage.setItem('selectedProfileName', activeProfileName.value)

        const loadRecords = async () => {
            const token = localStorage.getItem('token')
            if (!token || !activeProfileId.value) return
            await fetchRecords(token, activeProfileId.value)
        }

        const normalizeStatus = (s) => (s || 'ACTIVE').toUpperCase()

        const statusMeta = (raw) => {
            const s = normalizeStatus(raw)
            if (s === 'RESOLVED') return { label: 'Resolved', cls: 'st-resolved' }
            if (s === 'RECOVERING') return { label: 'Recovering', cls: 'st-recovering' }
            return { label: 'Active', cls: 'st-active' }
        }

        const severityMeta = (raw) => {
            const s = (raw || 'MILD').toUpperCase()
            if (s === 'SEVERE') return { cls: 'sev-severe' }
            if (s === 'MODERATE') return { cls: 'sev-moderate' }
            return { cls: 'sev-mild' }
        }

        const daysSince = (dateStr) => {
            const d = new Date(dateStr)
            return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
        }

        const daysText = (entry) => {
            const s = normalizeStatus(entry.status)
            if (s === 'RESOLVED') return null
            const d = daysSince(entry.recordedAt || entry.createdAt)
            const label = s === 'RECOVERING' ? 'Recovering' : 'Active'
            return d === 0 ? `${label} · today` : `${label} · ${d}d`
        }

        // All records sorted newest first
        const sorted = computed(() =>
            [...records.value].sort((a, b) =>
                new Date(b.recordedAt || b.createdAt) - new Date(a.recordedAt || a.createdAt)
            )
        )

        const filterCounts = computed(() => {
            const all = records.value
            return {
                all: all.length,
                active: all.filter(r => ['ACTIVE', 'ONGOING'].includes(normalizeStatus(r.status))).length,
                recovering: all.filter(r => normalizeStatus(r.status) === 'RECOVERING').length,
                resolved: all.filter(r => normalizeStatus(r.status) === 'RESOLVED').length
            }
        })

        const illnessList = computed(() =>
            sorted.value.map(entry => {
                const { label: statusLabel, cls: statusCls } = statusMeta(entry.status)
                const { cls: severityCls } = severityMeta(entry.severity)
                const dt = new Date(entry.recordedAt || entry.createdAt)
                return {
                    id: entry.id,
                    diagnosis: entry.diagnosis || 'Unknown illness',
                    status: normalizeStatus(entry.status),
                    statusLabel,
                    statusCls,
                    severity: (entry.severity || 'MILD').charAt(0) + (entry.severity || 'MILD').slice(1).toLowerCase(),
                    severityCls,
                    temperature: entry.bodyTemperature ? `${entry.bodyTemperature}°${entry.temperatureUnit || 'C'}` : null,
                    date: dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                    daysText: daysText(entry),
                    symptoms: Array.isArray(entry.symptoms) ? entry.symptoms : []
                }
            })
        )

        const filteredList = computed(() => {
            if (activeFilter.value === 'all') return illnessList.value
            if (activeFilter.value === 'active') return illnessList.value.filter(r => r.status === 'ACTIVE' || r.status === 'ONGOING')
            if (activeFilter.value === 'recovering') return illnessList.value.filter(r => r.status === 'RECOVERING')
            return illnessList.value.filter(r => r.status === 'RESOLVED')
        })

        const alertIllness = computed(() => {
            const urgentStatuses = ['ACTIVE', 'ONGOING', 'RECOVERING']
            const found = sorted.value.find(r => urgentStatuses.includes(normalizeStatus(r.status)))
            if (!found) return null
            const { label: statusLabel, cls: statusCls } = statusMeta(found.status)
            return {
                diagnosis: found.diagnosis,
                status: normalizeStatus(found.status),
                statusLabel,
                statusCls,
                daysText: daysText(found)
            }
        })

        const filterLabel = computed(() => {
            const map = { all: 'All records', active: 'Active', recovering: 'Recovering', resolved: 'Resolved' }
            return map[activeFilter.value]
        })

        const emptyTitle = computed(() => {
            const map = {
                all: 'No illness records yet',
                active: 'No active illnesses',
                recovering: 'No ongoing recoveries',
                resolved: 'No resolved records'
            }
            return map[activeFilter.value]
        })

        const emptyText = computed(() => {
            const map = {
                all: 'Add an illness entry to start tracking your recovery.',
                active: 'All clear — no active illness on record.',
                recovering: 'Either fully recovered or no records yet.',
                resolved: 'Resolved illness records will appear here.'
            }
            return map[activeFilter.value]
        })

        // Temperature data from illness records
        const tempSeries = computed(() =>
            [...records.value]
                .filter(r => typeof r.bodyTemperature === 'number' && r.bodyTemperature > 0)
                .sort((a, b) => new Date(a.recordedAt || a.createdAt) - new Date(b.recordedAt || b.createdAt))
        )

        const toCelsius = (v, unit) => unit === 'F' ? (v - 32) * 5 / 9 : v

        const classifyTemp = (value, unit = 'C') => {
            const c = toCelsius(value, unit)
            if (c >= 38.5) return { label: 'High Fever', cls: 'temp-high' }
            if (c >= 37.5) return { label: 'Fever',      cls: 'temp-fever' }
            if (c >= 36.1) return { label: 'Normal',     cls: 'temp-normal' }
            return                 { label: 'Low',        cls: 'temp-low' }
        }

        const latestTemp = computed(() => {
            if (!tempSeries.value.length) return null
            const r = tempSeries.value[tempSeries.value.length - 1]
            return {
                value: r.bodyTemperature,
                unit: r.temperatureUnit || 'C',
                date: new Date(r.recordedAt || r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            }
        })

        const tempLabel = computed(() => latestTemp.value ? classifyTemp(latestTemp.value.value, latestTemp.value.unit).label : '')
        const tempClass = computed(() => latestTemp.value ? classifyTemp(latestTemp.value.value, latestTemp.value.unit).cls : '')

        const tempChart = computed(() => {
            const recs = tempSeries.value.slice(-14)
            const empty = { points: [], polyline: '', areaPath: '', yLabels: [], xLabels: [], feverY: null }
            if (recs.length < 2) return empty

            // Convert all to Celsius for consistent scale
            const vals = recs.map(r => toCelsius(r.bodyTemperature, r.temperatureUnit || 'C'))
            const rawMin = Math.min(...vals)
            const rawMax = Math.max(...vals)
            const yMin = Math.max(35, Math.floor((rawMin - 0.3) * 10) / 10)
            const yMax = Math.ceil((rawMax + 0.3) * 10) / 10
            const yRange = yMax - yMin || 1

            const toY = v => padT + chartAreaH - ((v - yMin) / yRange) * chartAreaH
            const toX = i => recs.length === 1 ? padL + chartAreaW / 2 : padL + (i / (recs.length - 1)) * chartAreaW

            const feverThreshold = 37.5
            const feverY = (feverThreshold > yMin && feverThreshold < yMax) ? toY(feverThreshold) : null

            const points = recs.map((r, i) => {
                const c = toCelsius(r.bodyTemperature, r.temperatureUnit || 'C')
                const { cls } = classifyTemp(r.bodyTemperature, r.temperatureUnit || 'C')
                const dotColor = cls === 'temp-high' ? '#f87171' : cls === 'temp-fever' ? '#fbbf24' : '#a78bfa'
                return { x: toX(i), y: toY(c), dotColor }
            })

            const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
            const bottomY = (padT + chartAreaH).toFixed(1)
            const areaPath = `M ${points[0].x.toFixed(1)},${bottomY} ` +
                points.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
                ` L ${points[points.length - 1].x.toFixed(1)},${bottomY} Z`

            const mid = +((yMin + yMax) / 2).toFixed(1)
            const yLabels = [
                { val: yMax.toFixed(1), y: toY(yMax) },
                { val: mid,             y: toY(mid)   },
                { val: yMin.toFixed(1), y: toY(yMin)  }
            ]

            const step = Math.max(1, Math.ceil(recs.length / 5))
            const xLabels = recs
                .map((r, i) => ({
                    x: toX(i),
                    label: new Date(r.recordedAt || r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    show: i % step === 0 || i === recs.length - 1
                }))
                .filter(xl => xl.show)

            return { points, polyline, areaPath, yLabels, xLabels, feverY }
        })

        const goBack = () => router.push({ path: '/medical-records', query: { tab: 'health' } })

        const goToAddIllness = () => router.push({
            path: '/medical-records/illness/add',
            query: { profileId: activeProfileId.value, profileName: activeProfileName.value }
        })

        const openRecord = (id) => {
            if (!id) return
            router.push({
                path: `/medical-records/illness/${id}`,
                query: { profileId: activeProfileId.value, profileName: activeProfileName.value }
            })
        }

        onMounted(() => loadRecords())

        watch(() => route.query.profileId, (val) => {
            const id = Array.isArray(val) ? val[0] : val
            if (id && id !== activeProfileId.value) {
                activeProfileId.value = id
                localStorage.setItem('selectedProfileId', id)
                loadRecords()
            }
        })

        watch(() => route.query.profileName, (val) => {
            const name = Array.isArray(val) ? val[0] : val
            if (name) {
                activeProfileName.value = name
                localStorage.setItem('selectedProfileName', name)
            }
        })

        return {
            svgW, svgH, padL, padR,
            activeFilter, filters, filterCounts, filterLabel,
            activeProfileName, loading,
            filteredList, alertIllness,
            tempSeries, latestTemp, tempLabel, tempClass, tempChart,
            emptyTitle, emptyText,
            goBack, goToAddIllness, openRecord
        }
    }
}
</script>

<style scoped>
.illness-container {
    height: 100dvh;
    background: var(--bg-main);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
.bg-orb { position: absolute; filter: blur(60px); opacity: 0.28; z-index: 0; pointer-events: none; }
.orb-1 { width: 320px; height: 320px; border-radius: 50%; background: linear-gradient(135deg, #a78bfa, #ec4899); top: -140px; left: -110px; }
.orb-2 { width: 260px; height: 260px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #a78bfa); bottom: -120px; right: -90px; }

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
    display: flex; align-items: center; justify-content: center;
    border-radius: 12px;
    transition: all 0.2s;
}
.icon-btn:active { transform: scale(0.92); background: rgba(255,255,255,0.12); }

/* Filter tabs */
.filter-tabs {
    display: flex;
    padding: 10px 16px 0;
    gap: 0;
    flex-shrink: 0;
    z-index: 1;
    position: relative;
}
.filter-tab {
    flex: 1;
    background: transparent;
    border: none;
    padding: 9px 4px;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}
.filter-tab.active { color: #c4b5fd; }
.filter-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 15%; right: 15%;
    height: 3px;
    background: linear-gradient(135deg, #a78bfa, #ec4899);
    border-radius: 3px 3px 0 0;
}
.filter-count {
    background: rgba(167,139,250,0.2);
    color: #c4b5fd;
    border-radius: 10px;
    padding: 1px 5px;
    font-size: 10px;
    font-weight: 800;
}

/* Scroll area */
.scroll-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 14px 16px 36px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    z-index: 1;
}

/* Active alert banner */
.active-alert {
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid transparent;
}
.alert-red {
    background: rgba(239,68,68,0.1);
    border-color: rgba(239,68,68,0.3);
}
.alert-amber {
    background: rgba(251,191,36,0.1);
    border-color: rgba(251,191,36,0.3);
}
.alert-red .alert-icon  { color: #f87171; flex-shrink: 0; }
.alert-amber .alert-icon { color: #fbbf24; flex-shrink: 0; }
.alert-body { flex: 1; }
.alert-title { margin: 0; font-size: 14px; font-weight: 800; color: var(--text-primary); }
.alert-sub { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }

/* Temperature card */
.temp-card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 14px 30px rgba(0,0,0,0.35);
}
.temp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.temp-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin: 0 0 4px; }
.temp-reading { display: flex; align-items: center; gap: 8px; }
.temp-value { font-size: 26px; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1; }
.temp-date { font-size: 12px; color: var(--text-muted); text-align: right; }
.temp-badge {
    padding: 3px 8px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid transparent;
}
.temp-normal { background: rgba(34,197,94,0.12);  color: #4ade80; border-color: rgba(34,197,94,0.25);  }
.temp-fever  { background: rgba(251,191,36,0.12); color: #fbbf24; border-color: rgba(251,191,36,0.3);  }
.temp-high   { background: rgba(239,68,68,0.12);  color: #f87171; border-color: rgba(239,68,68,0.3);   }
.temp-low    { background: rgba(96,165,250,0.12); color: #60a5fa; border-color: rgba(96,165,250,0.25); }
.temp-svg { display: block; }

/* Status badges */
.status-badge {
    padding: 5px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    border: 1px solid transparent;
    flex-shrink: 0;
}
.status-badge.sm { padding: 3px 9px; font-size: 11px; }
.st-active    { background: rgba(239,68,68,0.14);  color: #f87171; border-color: rgba(239,68,68,0.3);   }
.st-recovering { background: rgba(251,191,36,0.14); color: #fbbf24; border-color: rgba(251,191,36,0.35); }
.st-resolved  { background: rgba(34,197,94,0.14);  color: #4ade80; border-color: rgba(34,197,94,0.3);   }

/* Section label */
.section-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0 2px;
    margin-bottom: -2px;
}

/* Illness cards */
.illness-list { display: flex; flex-direction: column; gap: 10px; }
.illness-card {
    background: rgba(255,255,255,0.05);
    border-radius: 14px;
    padding: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 10px 24px rgba(0,0,0,0.28);
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    transition: background 0.15s;
}
.illness-card:active { background: rgba(255,255,255,0.09); }
.card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.card-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.card-diagnosis { margin: 0; font-size: 15px; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-date { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }

/* Severity dot */
.sev-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.sev-mild     .sev-dot, .sev-dot.sev-mild     { background: #4ade80; box-shadow: 0 0 6px rgba(74,222,128,0.5); }
.sev-moderate .sev-dot, .sev-dot.sev-moderate { background: #fbbf24; box-shadow: 0 0 6px rgba(251,191,36,0.5); }
.sev-severe   .sev-dot, .sev-dot.sev-severe   { background: #f87171; box-shadow: 0 0 6px rgba(248,113,113,0.5); }

/* Meta row */
.card-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.meta-pill {
    padding: 3px 8px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 3px;
    border: 1px solid transparent;
}
.sev-mild-pill     { background: rgba(34,197,94,0.1);  color: #4ade80; border-color: rgba(34,197,94,0.2);  }
.sev-moderate-pill { background: rgba(251,191,36,0.1); color: #fbbf24; border-color: rgba(251,191,36,0.25); }
.sev-severe-pill   { background: rgba(239,68,68,0.1);  color: #f87171; border-color: rgba(239,68,68,0.2);  }
.temp-pill  { background: rgba(167,139,250,0.1); color: #c4b5fd; border-color: rgba(167,139,250,0.2); }
.days-pill  { background: rgba(255,255,255,0.06); color: var(--text-muted); border-color: rgba(255,255,255,0.1); }

/* Symptom chips */
.symptom-row { display: flex; flex-wrap: wrap; gap: 6px; }
.symptom-chip {
    background: rgba(103,232,249,0.1);
    color: #67e8f9;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid rgba(103,232,249,0.25);
}
.more-chip {
    background: rgba(255,255,255,0.06);
    color: var(--text-muted);
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid rgba(255,255,255,0.1);
}

/* Empty state */
.empty-state {
    background: rgba(255,255,255,0.04);
    border-radius: 16px;
    padding: 36px 16px;
    border: 1px solid rgba(255,255,255,0.07);
    text-align: center;
}
.empty-icon { color: var(--text-muted); display: block; margin: 0 auto 12px; }
.empty-title { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; }
.empty-text { font-size: 13px; color: var(--text-muted); margin: 0 0 18px; }
.empty-btn { padding: 10px 24px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }
</style>
