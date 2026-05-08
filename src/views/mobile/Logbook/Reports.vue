<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <LogbookTopNav
        variant="mobile"
        title="Reports"
        subtitle="Insights once entries are recorded."
        icon="chart-line"
    />

    <section class="logbook-section">

        <!-- Date range filter -->
        <div class="rpt-range glass-card">
            <mdicon name="calendar-range-outline" size="16" class="rpt-range-icon" />
            <label class="rpt-range-label">
                <span>From</span>
                <input type="date" v-model="startDate" class="rpt-date-input" />
            </label>
            <div class="rpt-range-sep"></div>
            <label class="rpt-range-label">
                <span>To</span>
                <input type="date" v-model="endDate" class="rpt-date-input" />
            </label>
            <button
                class="glass-btn-ghost rpt-range-clear"
                type="button"
                @click="clearRange"
                :disabled="!startDate && !endDate"
                title="Clear range"
            >
                <mdicon name="close-circle-outline" size="16" />
            </button>
        </div>

        <!-- Mama group -->
        <div class="glass-card rpt-group-card">
            <div class="rpt-group-head">
                <div class="rpt-group-icon mama-icon">
                    <mdicon name="account-outline" size="18" />
                </div>
                <div>
                    <h4 class="rpt-group-name">Mama</h4>
                    <p class="rpt-group-sub">Yellow Fantasy · Parking</p>
                </div>
            </div>

            <!-- Yellow Fantasy property -->
            <div class="rpt-property-section">
                <span class="rpt-property-label">
                    <mdicon name="home-outline" size="13" />
                    Yellow Fantasy
                </span>
                <div class="rpt-stat-rows">
                    <div class="rpt-stat-row">
                        <span class="rpt-stat-label">Rent</span>
                        <strong class="rpt-stat-val income">{{ formatMoney(mamaStats.yellowRent) }}</strong>
                    </div>
                    <div class="rpt-stat-row">
                        <span class="rpt-stat-label">Expense</span>
                        <strong class="rpt-stat-val expense">{{ formatMoney(mamaStats.yellowExpense) }}</strong>
                    </div>
                </div>
                <div class="rpt-net-row" :class="yellowNet >= 0 ? 'net-pos' : 'net-neg'">
                    <span>Net</span>
                    <strong>{{ formatMoney(yellowNet) }}</strong>
                </div>
            </div>

            <!-- Parking property -->
            <div class="rpt-property-section">
                <span class="rpt-property-label">
                    <mdicon name="car-outline" size="13" />
                    Parking
                </span>
                <div class="rpt-stat-rows">
                    <div class="rpt-stat-row">
                        <span class="rpt-stat-label">Rent</span>
                        <strong class="rpt-stat-val income">{{ formatMoney(mamaStats.parkingRent) }}</strong>
                    </div>
                    <div class="rpt-stat-row" v-if="mamaStats.parkingExpense > 0">
                        <span class="rpt-stat-label">Expense</span>
                        <strong class="rpt-stat-val expense">{{ formatMoney(mamaStats.parkingExpense) }}</strong>
                    </div>
                </div>
                <div class="rpt-net-row" :class="parkingNet >= 0 ? 'net-pos' : 'net-neg'">
                    <span>Net</span>
                    <strong>{{ formatMoney(parkingNet) }}</strong>
                </div>
            </div>

            <!-- Mama other -->
            <div class="rpt-property-section rpt-other-section">
                <span class="rpt-property-label">
                    <mdicon name="dots-horizontal" size="13" />
                    Other
                </span>
                <div class="rpt-stat-rows">
                    <div class="rpt-stat-row">
                        <span class="rpt-stat-label">Mama Expense</span>
                        <strong class="rpt-stat-val muted">{{ formatMoney(mamaStats.mamaExpense) }}</strong>
                    </div>
                    <div class="rpt-stat-row">
                        <span class="rpt-stat-label">Bank Deposit</span>
                        <strong class="rpt-stat-val muted">{{ formatMoney(mamaStats.deposit) }}</strong>
                    </div>
                </div>
            </div>
        </div>

        <!-- RC group -->
        <div class="glass-card rpt-group-card">
            <div class="rpt-group-head">
                <div class="rpt-group-icon rc-icon">
                    <mdicon name="account-outline" size="18" />
                </div>
                <div>
                    <h4 class="rpt-group-name">RC</h4>
                    <p class="rpt-group-sub">Fuji View</p>
                </div>
            </div>

            <!-- Fuji View property -->
            <div class="rpt-property-section">
                <span class="rpt-property-label">
                    <mdicon name="home-outline" size="13" />
                    Fuji View
                </span>
                <div class="rpt-stat-rows">
                    <div class="rpt-stat-row">
                        <span class="rpt-stat-label">Rent</span>
                        <strong class="rpt-stat-val income">{{ formatMoney(rcStats.fujiRent) }}</strong>
                    </div>
                    <div class="rpt-stat-row">
                        <span class="rpt-stat-label">Expense</span>
                        <strong class="rpt-stat-val expense">{{ formatMoney(rcStats.fujiExpense) }}</strong>
                    </div>
                </div>
                <div class="rpt-net-row" :class="fujiNet >= 0 ? 'net-pos' : 'net-neg'">
                    <span>Net</span>
                    <strong>{{ formatMoney(fujiNet) }}</strong>
                </div>
            </div>

            <!-- RC other -->
            <div class="rpt-property-section rpt-other-section">
                <span class="rpt-property-label">
                    <mdicon name="dots-horizontal" size="13" />
                    Other
                </span>
                <div class="rpt-stat-rows">
                    <div class="rpt-stat-row">
                        <span class="rpt-stat-label">RC Expense</span>
                        <strong class="rpt-stat-val muted">{{ formatMoney(rcStats.rcExpense) }}</strong>
                    </div>
                    <div class="rpt-stat-row">
                        <span class="rpt-stat-label">Bank Deposit</span>
                        <strong class="rpt-stat-val muted">{{ formatMoney(rcStats.deposit) }}</strong>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Chart section -->
    <section class="logbook-section">
        <div class="rpt-chart-toolbar">
            <div class="rpt-chart-tabs">
                <button
                    class="rpt-chart-tab"
                    :class="{ active: chartTab === 'yellow' }"
                    type="button"
                    @click="chartTab = 'yellow'"
                >Yellow Fantasy</button>
                <button
                    class="rpt-chart-tab"
                    :class="{ active: chartTab === 'fuji' }"
                    type="button"
                    @click="chartTab = 'fuji'"
                >Fuji View</button>
            </div>
            <select v-model="selectedYear" class="rpt-year-select">
                <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
            </select>
        </div>

        <div class="glass-card rpt-chart-card">
            <div class="rpt-chart-legend">
                <span class="rpt-legend-item">
                    <i class="rpt-legend-dot rent-dot"></i>
                    Rent
                </span>
                <span class="rpt-legend-item">
                    <i class="rpt-legend-dot expense-dot"></i>
                    Expense
                </span>
            </div>

            <svg
                viewBox="0 0 320 190"
                style="width:100%;display:block"
                aria-label="Monthly rent and expense chart"
            >
                <defs>
                    <linearGradient id="rentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#38bdf8" />
                        <stop offset="100%" stop-color="#22c55e" />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#fb7185" />
                        <stop offset="100%" stop-color="#f97316" />
                    </linearGradient>
                </defs>

                <!-- Grid lines -->
                <g v-for="line in chartGridLines" :key="line.y">
                    <line
                        :x1="line.x1" :y1="line.y"
                        :x2="line.x2" :y2="line.y"
                        stroke="rgba(148,163,184,0.15)" stroke-width="1"
                    />
                    <text
                        :x="line.x1 - 4" :y="line.y + 4"
                        text-anchor="end"
                        font-size="7"
                        fill="rgba(148,163,184,0.7)"
                    >{{ line.label }}</text>
                </g>

                <!-- Bars -->
                <g v-for="bar in svgBars" :key="bar.month">
                    <!-- Rent bar -->
                    <rect
                        v-if="bar.rent.h > 0"
                        :x="bar.rent.x" :y="bar.rent.y"
                        :width="bar.rent.w" :height="bar.rent.h"
                        fill="url(#rentGrad)"
                        rx="2"
                    />
                    <!-- Expense bar -->
                    <rect
                        v-if="bar.expense.h > 0"
                        :x="bar.expense.x" :y="bar.expense.y"
                        :width="bar.expense.w" :height="bar.expense.h"
                        fill="url(#expenseGrad)"
                        rx="2"
                    />
                    <!-- Month label -->
                    <text
                        :x="bar.labelX" :y="bar.labelY"
                        text-anchor="middle"
                        font-size="7.5"
                        fill="rgba(148,163,184,0.8)"
                    >{{ bar.month }}</text>
                </g>

                <!-- Baseline -->
                <line
                    :x1="40" :y1="168"
                    :x2="314" :y2="168"
                    stroke="rgba(148,163,184,0.3)" stroke-width="1"
                />
            </svg>

            <div v-if="chartEmpty" class="rpt-chart-empty">
                No data for {{ selectedYear }}.
            </div>
        </div>
    </section>

    <LogbookBottomNav variant="mobile" />
</div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

// SVG chart constants (coordinate space)
const PAD_L = 40
const PAD_T = 14
const PAD_B = 22
const PAD_R = 6
const SVG_W = 320
const SVG_H = 190
const CHART_W = SVG_W - PAD_L - PAD_R   // 274
const CHART_H = SVG_H - PAD_T - PAD_B   // 154
const CHART_BOTTOM = PAD_T + CHART_H     // 168
const GROUP_W = CHART_W / 12             // ~22.8
const BAR_W = (GROUP_W - 6) / 2         // ~8.4

export default {
    name: "LogbookReportsMobile",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const payments = ref([])
        const loading = ref(false)
        const error = ref('')
        const selectedYear = ref(new Date().getFullYear())
        const startDate = ref('')
        const endDate = ref('')
        const chartTab = ref('yellow')
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        const normalize = (value) => String(value || '').trim().toLowerCase()

        const formatMoney = (value) => {
            const num = Number(value || 0)
            return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

        const formatCompact = (value) => {
            const num = Number(value || 0)
            if (num === 0) return '0'
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
            if (num >= 1000) return (num / 1000).toFixed(0) + 'k'
            return num.toFixed(0)
        }

        const isMain = (item, name) => normalize(item.mainCategory) === name
        const isSub = (item, name) => normalize(item.subCategory) === name

        const toStartOfDay = (value) => {
            if (!value) return null
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return null
            date.setHours(0, 0, 0, 0)
            return date
        }

        const toEndOfDay = (value) => {
            if (!value) return null
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return null
            date.setHours(23, 59, 59, 999)
            return date
        }

        const summaryPayments = computed(() => {
            const start = toStartOfDay(startDate.value)
            const end = toEndOfDay(endDate.value)
            if (!start && !end) return payments.value
            return payments.value.filter((item) => {
                const date = new Date(item.paymentDate || '')
                if (Number.isNaN(date.getTime())) return false
                if (start && date < start) return false
                if (end && date > end) return false
                return true
            })
        })

        const clearRange = () => {
            startDate.value = ''
            endDate.value = ''
        }

        const sumBy = (predicate) => summaryPayments.value
            .filter(predicate)
            .reduce((total, item) => total + Number(item.amount || 0), 0)

        const mamaStats = computed(() => ({
            yellowRent:    sumBy(item => isMain(item, 'yellow fantasy') && isSub(item, 'rental')),
            yellowExpense: sumBy(item => isMain(item, 'yellow fantasy') && !isSub(item, 'rental')),
            parkingRent:   sumBy(item => isMain(item, 'parking') && isSub(item, 'rental')),
            parkingExpense:sumBy(item => isMain(item, 'parking') && !isSub(item, 'rental')),
            mamaExpense:   sumBy(item => isMain(item, 'mama expense') || (isMain(item, 'misc') && isSub(item, 'mama cash-out'))),
            deposit:       sumBy(item => isMain(item, 'bank deposit') && isSub(item, 'mama'))
        }))

        const rcStats = computed(() => ({
            fujiRent:   sumBy(item => (isMain(item, 'fuji view') || isMain(item, 'fuji')) && isSub(item, 'rental')),
            fujiExpense:sumBy(item => (isMain(item, 'fuji view') || isMain(item, 'fuji')) && !isSub(item, 'rental')),
            rcExpense:  sumBy(item => isMain(item, 'rc expense') || (isMain(item, 'misc') && isSub(item, 'rc cash-out'))),
            deposit:    sumBy(item => isMain(item, 'bank deposit') && isSub(item, 'rc'))
        }))

        const yellowNet  = computed(() => mamaStats.value.yellowRent  - mamaStats.value.yellowExpense)
        const parkingNet = computed(() => mamaStats.value.parkingRent - mamaStats.value.parkingExpense)
        const fujiNet    = computed(() => rcStats.value.fujiRent      - rcStats.value.fujiExpense)

        // ── Charts ─────────────────────────────────────────

        const yearOptions = computed(() => {
            const years = new Set()
            payments.value.forEach((item) => {
                const date = new Date(item.paymentDate)
                if (!Number.isNaN(date.getTime())) years.add(date.getFullYear())
            })
            if (!years.size) years.add(new Date().getFullYear())
            return Array.from(years).sort((a, b) => b - a)
        })

        watch(yearOptions, (list) => {
            if (list.length && !list.includes(selectedYear.value)) selectedYear.value = list[0]
        }, { immediate: true })

        const buildSeries = (rentPredicate, expensePredicate) => {
            const totals = Array.from({ length: 12 }, () => ({ rent: 0, expense: 0 }))
            payments.value.forEach((item) => {
                const date = new Date(item.paymentDate)
                if (Number.isNaN(date.getTime())) return
                if (date.getFullYear() !== Number(selectedYear.value)) return
                const month = date.getMonth()
                const amount = Math.abs(Number(item.amount || 0))
                const sub = normalize(item.subCategory)
                if (rentPredicate(item, sub)) totals[month].rent += amount
                if (expensePredicate(item, sub)) totals[month].expense += amount
            })
            return months.map((label, i) => ({
                label,
                rent: totals[i].rent,
                expense: totals[i].expense,
                total: totals[i].rent + totals[i].expense
            }))
        }

        const yellowSeries = computed(() => buildSeries(
            (item, sub) => isMain(item, 'yellow fantasy') && sub === 'rental',
            (item, sub) => (isMain(item, 'yellow fantasy') && sub !== 'rental')
                || isMain(item, 'mama expense')
                || (isMain(item, 'misc') && isSub(item, 'mama cash-out'))
        ))

        const fujiSeries = computed(() => buildSeries(
            (item, sub) => (isMain(item, 'fuji view') || isMain(item, 'fuji')) && sub === 'rental',
            (item, sub) => ((isMain(item, 'fuji view') || isMain(item, 'fuji')) && sub !== 'rental')
                || isMain(item, 'rc expense')
                || (isMain(item, 'misc') && isSub(item, 'rc cash-out'))
        ))

        const activeSeries = computed(() => chartTab.value === 'yellow' ? yellowSeries.value : fujiSeries.value)
        const activeMax = computed(() => Math.max(1, ...activeSeries.value.map(p => p.total)))

        const chartEmpty = computed(() => activeSeries.value.every(p => p.total === 0))

        const chartGridLines = computed(() => {
            const max = activeMax.value
            return [1, 0.75, 0.5, 0.25].map(frac => ({
                y: PAD_T + CHART_H * (1 - frac),
                label: formatCompact(max * frac),
                x1: PAD_L,
                x2: PAD_L + CHART_W
            }))
        })

        const svgBars = computed(() => {
            const series = activeSeries.value
            const max = activeMax.value
            return series.map((point, i) => {
                const groupX = PAD_L + i * GROUP_W
                const rentH = max > 0 ? (point.rent / max) * CHART_H : 0
                const expH = max > 0 ? (point.expense / max) * CHART_H : 0
                return {
                    month: point.label,
                    labelX: groupX + GROUP_W / 2,
                    labelY: CHART_BOTTOM + 13,
                    rent: {
                        x: groupX + 2,
                        y: CHART_BOTTOM - rentH,
                        w: BAR_W,
                        h: Math.max(rentH, 0)
                    },
                    expense: {
                        x: groupX + 2 + BAR_W + 2,
                        y: CHART_BOTTOM - expH,
                        w: BAR_W,
                        h: Math.max(expH, 0)
                    }
                }
            })
        })

        const loadPayments = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            loading.value = true
            error.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/payments`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to load reports')
                payments.value = Array.isArray(data.payments) ? data.payments : []
            } catch (err) {
                error.value = err?.message || 'Unable to load reports'
            } finally {
                loading.value = false
            }
        }

        onMounted(loadPayments)

        return {
            loading,
            error,
            selectedYear,
            yearOptions,
            startDate,
            endDate,
            clearRange,
            chartTab,
            mamaStats,
            rcStats,
            yellowNet,
            parkingNet,
            fujiNet,
            chartGridLines,
            svgBars,
            chartEmpty,
            formatMoney
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>

<style scoped>
/* ── Date range filter ─────────────────────────────── */
.rpt-range {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
}

.rpt-range-icon {
    color: var(--text-muted);
    flex-shrink: 0;
}

.rpt-range-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
}

.rpt-range-label span {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-weight: 600;
}

.rpt-date-input {
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 13px;
    padding: 0;
    width: 100%;
}

.rpt-range-sep {
    width: 1px;
    height: 32px;
    background: var(--glass-card-border);
    flex-shrink: 0;
}

.rpt-range-clear {
    width: 30px;
    height: 30px;
    padding: 0;
    display: grid;
    place-items: center;
    flex-shrink: 0;
}

/* ── Group cards ───────────────────────────────────── */
.rpt-group-card {
    padding: 14px;
    display: grid;
    gap: 0;
}

.rpt-group-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
}

.rpt-group-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
}

.mama-icon {
    background: rgba(34, 197, 94, 0.18);
    color: #16a34a;
}

.rc-icon {
    background: rgba(56, 189, 248, 0.18);
    color: #0284c7;
}

.rpt-group-name {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
}

.rpt-group-sub {
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--text-muted);
}

.rpt-stat-rows {
    display: grid;
    gap: 0;
    border-top: 1px solid var(--glass-card-border);
}

.rpt-stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.rpt-stat-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
}

.rpt-stat-val {
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
}

.rpt-stat-val.income {
    color: #16a34a;
}

.rpt-stat-val.expense {
    color: #e11d48;
}

.rpt-stat-val.muted {
    color: var(--text-secondary);
}

/* Property sub-sections within group card */
.rpt-property-section {
    border-top: 1px solid var(--glass-card-border);
    padding-top: 10px;
    margin-top: 10px;
    display: grid;
    gap: 0;
}

.rpt-property-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
    margin-bottom: 6px;
}

.rpt-other-section .rpt-property-label {
    color: var(--text-muted);
}

.rpt-other-section .rpt-stat-row {
    border-bottom-color: transparent;
}

.rpt-net-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 0 0;
    font-size: 14px;
    color: var(--text-secondary);
}

.rpt-net-row strong {
    font-size: 16px;
    font-weight: 700;
}

.rpt-net-row.net-pos strong {
    color: #16a34a;
}

.rpt-net-row.net-neg strong {
    color: #e11d48;
}

/* ── Chart toolbar ─────────────────────────────────── */
.rpt-chart-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    padding: 0 14px;
}

.rpt-chart-tabs {
    display: flex;
    gap: 6px;
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    padding: 3px;
    flex: 1;
    min-width: 0;
}

.rpt-chart-tab {
    flex: 1;
    padding: 7px 8px;
    border-radius: 9px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
}

.rpt-chart-tab.active {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(34, 197, 94, 0.18));
    color: var(--text-primary);
    border: 1px solid rgba(56, 189, 248, 0.35);
    font-weight: 600;
}

.rpt-year-select {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    padding: 7px 10px;
    color: var(--text-primary);
    font-size: 13px;
    flex-shrink: 0;
}

/* ── Chart card ────────────────────────────────────── */
.rpt-chart-card {
    padding: 14px 10px 10px;
    display: grid;
    gap: 10px;
    position: relative;
}

.rpt-chart-legend {
    display: flex;
    gap: 16px;
    padding-left: 4px;
}

.rpt-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
}

.rpt-legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    display: inline-block;
}

.rent-dot {
    background: linear-gradient(135deg, #38bdf8, #22c55e);
}

.expense-dot {
    background: linear-gradient(135deg, #fb7185, #f97316);
}

.rpt-chart-empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 13px;
    color: var(--text-muted);
    pointer-events: none;
}
</style>
