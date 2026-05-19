<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <LogbookTopNav
        variant="mobile"
        title="Reports"
        subtitle="Property performance summaries."
        icon="chart-line"
    />

    <!-- ── Owner page switcher ── -->
    <div class="rpt-switcher">
        <button :class="['rpt-sw-btn', { active: ownerPage === 'mama' }]" type="button" @click="ownerPage = 'mama'">
            <div class="rpt-sw-ic mama-ic"><mdicon name="account-heart-outline" size="18"/></div>
            <div class="rpt-sw-text">
                <strong>Mama</strong>
                <span>Yellow Fantasy · Parking</span>
            </div>
        </button>
        <button :class="['rpt-sw-btn', { active: ownerPage === 'rc' }]" type="button" @click="ownerPage = 'rc'">
            <div class="rpt-sw-ic rc-ic"><mdicon name="office-building-outline" size="18"/></div>
            <div class="rpt-sw-text">
                <strong>RC</strong>
                <span>Fuji View</span>
            </div>
        </button>
    </div>

    <!-- ── Shared date range filter ── -->
    <button class="rpt-filter-btn glass-card" type="button" @click="openDateModal()">
        <mdicon name="calendar-range-outline" size="15" class="rpt-fbtn-ic"/>
        <span class="rpt-fbtn-label">{{ dateRangeLabel }}</span>
        <mdicon name="chevron-down" size="14" class="rpt-fbtn-chev"/>
    </button>
    <div v-if="noDataInRange" class="rpt-no-data-banner">
        <mdicon name="calendar-remove-outline" size="15"/>
        No payments recorded in this date range.
    </div>

    <!-- ══════════════════════════════════════ MAMA PAGE ══ -->
    <section v-if="ownerPage === 'mama'" class="rpt-page logbook-section">

        <!-- Yellow Fantasy card -->
        <div class="glass-card rpt-prop-card yellow-card">
            <div class="rpt-card-accent yellow-accent"></div>
            <div class="rpt-prop-head">
                <div class="rpt-prop-ic yellow-ic"><mdicon name="home-outline" size="15"/></div>
                <span class="rpt-prop-label">Yellow Fantasy</span>
            </div>
            <div class="rpt-stat-rows">
                <div class="rpt-stat-row"><span>Rent</span><strong class="income">{{ formatMoney(mamaStats.yellowRent) }}</strong></div>
                <div class="rpt-stat-row"><span>Expense</span><strong class="expense">{{ formatMoney(mamaStats.yellowExpense) }}</strong></div>
            </div>
            <div class="rpt-net" :class="yellowNet >= 0 ? 'pos' : 'neg'">
                <span>Net Income</span>
                <strong>{{ formatMoney(yellowNet) }}</strong>
            </div>
        </div>

        <!-- Parking card -->
        <div class="glass-card rpt-prop-card parking-card">
            <div class="rpt-card-accent parking-accent"></div>
            <div class="rpt-prop-head">
                <div class="rpt-prop-ic parking-ic"><mdicon name="car-outline" size="15"/></div>
                <span class="rpt-prop-label">Parking</span>
            </div>
            <div class="rpt-stat-rows">
                <div class="rpt-stat-row"><span>Rent</span><strong class="income">{{ formatMoney(mamaStats.parkingRent) }}</strong></div>
                <div class="rpt-stat-row" v-if="mamaStats.parkingExpense > 0"><span>Expense</span><strong class="expense">{{ formatMoney(mamaStats.parkingExpense) }}</strong></div>
            </div>
            <div class="rpt-net" :class="parkingNet >= 0 ? 'pos' : 'neg'">
                <span>Net Income</span>
                <strong>{{ formatMoney(parkingNet) }}</strong>
            </div>
        </div>

        <!-- Mama Other card -->
        <div class="glass-card rpt-prop-card other-card">
            <div class="rpt-card-accent other-accent"></div>
            <div class="rpt-prop-head">
                <div class="rpt-prop-ic other-ic"><mdicon name="wallet-outline" size="15"/></div>
                <span class="rpt-prop-label">Other</span>
            </div>
            <div class="rpt-stat-rows">
                <div class="rpt-stat-row"><span>Mama Expense</span><strong class="muted-val">{{ formatMoney(mamaStats.mamaExpense) }}</strong></div>
                <div class="rpt-stat-row"><span>Bank Deposit</span><strong class="muted-val">{{ formatMoney(mamaStats.deposit) }}</strong></div>
            </div>
        </div>

        <!-- Chart -->
        <div class="rpt-chart-wrap">
            <div class="rpt-chart-toolbar">
                <span class="rpt-chart-title">Yellow Fantasy</span>
                <select v-model="selectedYear" class="rpt-year-sel">
                    <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
            </div>
            <div class="glass-card rpt-chart-card">
                <div class="rpt-chart-legend">
                    <span class="rpt-legend-item"><i class="rpt-dot rent-dot"></i>Rental</span>
                    <span class="rpt-legend-item"><i class="rpt-dot exp-dot"></i>Expense</span>
                </div>
                <svg viewBox="0 0 320 190" style="width:100%;display:block" aria-label="Yellow Fantasy monthly chart">
                    <defs>
                        <linearGradient id="mRentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#38bdf8"/>
                            <stop offset="100%" stop-color="#22c55e"/>
                        </linearGradient>
                        <linearGradient id="mExpGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#fb7185"/>
                            <stop offset="100%" stop-color="#f97316"/>
                        </linearGradient>
                    </defs>
                    <g v-for="line in yellowGridLines" :key="line.y">
                        <line :x1="line.x1" :y1="line.y" :x2="line.x2" :y2="line.y" stroke="rgba(148,163,184,0.12)" stroke-width="1"/>
                        <text :x="line.x1 - 4" :y="line.y + 4" text-anchor="end" font-size="7" fill="rgba(148,163,184,0.6)">{{ line.label }}</text>
                    </g>
                    <g v-for="bar in yellowSvgBars" :key="bar.month">
                        <rect v-if="bar.rent.h > 0" :x="bar.rent.x" :y="bar.rent.y" :width="bar.rent.w" :height="bar.rent.h" fill="url(#mRentGrad)" rx="2"/>
                        <rect v-if="bar.expense.h > 0" :x="bar.expense.x" :y="bar.expense.y" :width="bar.expense.w" :height="bar.expense.h" fill="url(#mExpGrad)" rx="2"/>
                        <text :x="bar.labelX" :y="bar.labelY" text-anchor="middle" font-size="7.5" fill="rgba(148,163,184,0.75)">{{ bar.month }}</text>
                    </g>
                    <line :x1="40" :y1="168" :x2="314" :y2="168" stroke="rgba(148,163,184,0.25)" stroke-width="1"/>
                </svg>
                <div v-if="yellowChartEmpty" class="rpt-chart-empty">No data for {{ selectedYear }}.</div>
            </div>
        </div>

        <!-- AI Insights inline -->
        <div class="glass-card rpt-ai-panel">
            <div class="rpt-ai-acc"></div>
            <div class="rpt-ai-head">
                <div class="rpt-ai-ic"><mdicon name="robot-outline" size="18"/></div>
                <div>
                    <p class="rpt-ai-title">AI Insights</p>
                    <p class="rpt-ai-sub">AI analysis of your properties.</p>
                </div>
            </div>
            <button class="glass-btn-primary rpt-ai-run" type="button" :disabled="aiLoading" @click="generateInsights">
                <mdicon :name="aiLoading ? 'loading' : 'creation-outline'" size="16"/>
                {{ aiLoading ? 'Analyzing…' : 'Generate Insights' }}
            </button>
            <div v-if="aiError" class="rpt-ai-error">{{ aiError }}</div>
            <div v-if="aiInsights" class="rpt-ai-results">
                <p class="ai-result-summary">{{ aiInsights.summary }}</p>
                <div v-if="aiInsights.propertyInsights?.length" class="ai-result-section">
                    <span class="ai-result-label">Properties</span>
                    <div v-for="p in aiInsights.propertyInsights" :key="p.property" class="ai-property-row">
                        <div class="ai-property-header">
                            <strong>{{ p.property }}</strong>
                            <span class="ai-trend-badge" :class="'trend-' + p.trend.toLowerCase()">{{ p.trend }}</span>
                        </div>
                        <p>{{ p.observation }}</p>
                    </div>
                </div>
                <div v-if="aiInsights.alerts?.length" class="ai-result-section">
                    <span class="ai-result-label">Alerts</span>
                    <div v-for="(alert, i) in aiInsights.alerts" :key="i" class="ai-alert-row" :class="'sev-' + alert.severity.toLowerCase()">
                        <mdicon :name="alert.severity === 'HIGH' ? 'alert-circle-outline' : 'information-outline'" size="14"/>
                        <span>{{ alert.message }}</span>
                    </div>
                </div>
                <div v-if="aiInsights.recommendations?.length" class="ai-result-section">
                    <span class="ai-result-label">Recommendations</span>
                    <ul class="ai-rec-list">
                        <li v-for="(rec, i) in aiInsights.recommendations" :key="i">{{ rec }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- ══════════════════════════════════════ RC PAGE ════ -->
    <section v-else class="rpt-page logbook-section">

        <!-- Fuji View card -->
        <div class="glass-card rpt-prop-card fuji-card">
            <div class="rpt-card-accent fuji-accent"></div>
            <div class="rpt-prop-head">
                <div class="rpt-prop-ic fuji-ic"><mdicon name="home-outline" size="15"/></div>
                <span class="rpt-prop-label">Fuji View</span>
            </div>
            <div class="rpt-stat-rows">
                <div class="rpt-stat-row"><span>Rent</span><strong class="income">{{ formatMoney(rcStats.fujiRent) }}</strong></div>
                <div class="rpt-stat-row"><span>Expense</span><strong class="expense">{{ formatMoney(rcStats.fujiExpense) }}</strong></div>
            </div>
            <div class="rpt-net" :class="fujiNet >= 0 ? 'pos' : 'neg'">
                <span>Net Income</span>
                <strong>{{ formatMoney(fujiNet) }}</strong>
            </div>
        </div>

        <!-- RC Other card -->
        <div class="glass-card rpt-prop-card other-card">
            <div class="rpt-card-accent other-accent"></div>
            <div class="rpt-prop-head">
                <div class="rpt-prop-ic other-ic"><mdicon name="wallet-outline" size="15"/></div>
                <span class="rpt-prop-label">Other</span>
            </div>
            <div class="rpt-stat-rows">
                <div class="rpt-stat-row"><span>RC Expense</span><strong class="muted-val">{{ formatMoney(rcStats.rcExpense) }}</strong></div>
                <div class="rpt-stat-row"><span>Bank Deposit</span><strong class="muted-val">{{ formatMoney(rcStats.deposit) }}</strong></div>
            </div>
        </div>

        <!-- Chart -->
        <div class="rpt-chart-wrap">
            <div class="rpt-chart-toolbar">
                <span class="rpt-chart-title">Fuji View</span>
                <select v-model="selectedYear" class="rpt-year-sel">
                    <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
            </div>
            <div class="glass-card rpt-chart-card">
                <div class="rpt-chart-legend">
                    <span class="rpt-legend-item"><i class="rpt-dot rent-dot"></i>Rental</span>
                    <span class="rpt-legend-item"><i class="rpt-dot exp-dot"></i>Expense</span>
                </div>
                <svg viewBox="0 0 320 190" style="width:100%;display:block" aria-label="Fuji View monthly chart">
                    <defs>
                        <linearGradient id="fRentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#38bdf8"/>
                            <stop offset="100%" stop-color="#22c55e"/>
                        </linearGradient>
                        <linearGradient id="fExpGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#fb7185"/>
                            <stop offset="100%" stop-color="#f97316"/>
                        </linearGradient>
                    </defs>
                    <g v-for="line in fujiGridLines" :key="line.y">
                        <line :x1="line.x1" :y1="line.y" :x2="line.x2" :y2="line.y" stroke="rgba(148,163,184,0.12)" stroke-width="1"/>
                        <text :x="line.x1 - 4" :y="line.y + 4" text-anchor="end" font-size="7" fill="rgba(148,163,184,0.6)">{{ line.label }}</text>
                    </g>
                    <g v-for="bar in fujiSvgBars" :key="bar.month">
                        <rect v-if="bar.rent.h > 0" :x="bar.rent.x" :y="bar.rent.y" :width="bar.rent.w" :height="bar.rent.h" fill="url(#fRentGrad)" rx="2"/>
                        <rect v-if="bar.expense.h > 0" :x="bar.expense.x" :y="bar.expense.y" :width="bar.expense.w" :height="bar.expense.h" fill="url(#fExpGrad)" rx="2"/>
                        <text :x="bar.labelX" :y="bar.labelY" text-anchor="middle" font-size="7.5" fill="rgba(148,163,184,0.75)">{{ bar.month }}</text>
                    </g>
                    <line :x1="40" :y1="168" :x2="314" :y2="168" stroke="rgba(148,163,184,0.25)" stroke-width="1"/>
                </svg>
                <div v-if="fujiChartEmpty" class="rpt-chart-empty">No data for {{ selectedYear }}.</div>
            </div>
        </div>

        <!-- AI Insights inline -->
        <div class="glass-card rpt-ai-panel">
            <div class="rpt-ai-acc"></div>
            <div class="rpt-ai-head">
                <div class="rpt-ai-ic"><mdicon name="robot-outline" size="18"/></div>
                <div>
                    <p class="rpt-ai-title">AI Insights</p>
                    <p class="rpt-ai-sub">AI analysis of your properties.</p>
                </div>
            </div>
            <button class="glass-btn-primary rpt-ai-run" type="button" :disabled="aiLoading" @click="generateInsights">
                <mdicon :name="aiLoading ? 'loading' : 'creation-outline'" size="16"/>
                {{ aiLoading ? 'Analyzing…' : 'Generate Insights' }}
            </button>
            <div v-if="aiError" class="rpt-ai-error">{{ aiError }}</div>
            <div v-if="aiInsights" class="rpt-ai-results">
                <p class="ai-result-summary">{{ aiInsights.summary }}</p>
                <div v-if="aiInsights.propertyInsights?.length" class="ai-result-section">
                    <span class="ai-result-label">Properties</span>
                    <div v-for="p in aiInsights.propertyInsights" :key="p.property" class="ai-property-row">
                        <div class="ai-property-header">
                            <strong>{{ p.property }}</strong>
                            <span class="ai-trend-badge" :class="'trend-' + p.trend.toLowerCase()">{{ p.trend }}</span>
                        </div>
                        <p>{{ p.observation }}</p>
                    </div>
                </div>
                <div v-if="aiInsights.alerts?.length" class="ai-result-section">
                    <span class="ai-result-label">Alerts</span>
                    <div v-for="(alert, i) in aiInsights.alerts" :key="i" class="ai-alert-row" :class="'sev-' + alert.severity.toLowerCase()">
                        <mdicon :name="alert.severity === 'HIGH' ? 'alert-circle-outline' : 'information-outline'" size="14"/>
                        <span>{{ alert.message }}</span>
                    </div>
                </div>
                <div v-if="aiInsights.recommendations?.length" class="ai-result-section">
                    <span class="ai-result-label">Recommendations</span>
                    <ul class="ai-rec-list">
                        <li v-for="(rec, i) in aiInsights.recommendations" :key="i">{{ rec }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- ── Date Range Modal ── -->
    <div v-if="showDateModal" class="drp-overlay" @click.self="showDateModal = false">
        <div class="drp-sheet">
            <div class="drp-handle"></div>
            <div class="drp-header">
                <span class="drp-title">Select Date Range</span>
                <button type="button" class="drp-close" @click="showDateModal = false">
                    <mdicon name="close" size="18"/>
                </button>
            </div>
            <div class="drp-options">
                <button v-for="p in datePresets" :key="p.key"
                    :class="['drp-opt', { active: modalActivePreset === p.key }]"
                    type="button"
                    @click="selectPreset(p.key)">
                    <div class="drp-opt-ic"><mdicon :name="p.icon" size="16"/></div>
                    <span>{{ p.label }}</span>
                    <mdicon v-if="modalActivePreset === p.key" name="check" size="14" class="drp-check"/>
                </button>
            </div>
            <div v-if="modalActivePreset === 'custom'" class="drp-custom">
                <div class="drp-custom-fields">
                    <label class="drp-custom-field">
                        <span>From</span>
                        <input type="date" v-model="customFrom" class="drp-custom-inp"/>
                    </label>
                    <label class="drp-custom-field">
                        <span>To</span>
                        <input type="date" v-model="customTo" class="drp-custom-inp"/>
                    </label>
                </div>
                <button type="button" class="glass-btn-primary drp-apply" @click="applyCustomRange">
                    Apply Range
                </button>
            </div>
        </div>
    </div>

    <LogbookBottomNav variant="mobile" />
</div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

const DATE_PRESETS = [
    { key: 'all',       label: 'All Time',     icon: 'calendar-range-outline' },
    { key: 'last7',     label: 'Last 7 Days',  icon: 'calendar-week' },
    { key: 'last30',    label: 'Last 30 Days', icon: 'calendar-month-outline' },
    { key: 'thisMonth', label: 'This Month',   icon: 'calendar-blank-outline' },
    { key: 'lastMonth', label: 'Last Month',   icon: 'calendar-blank' },
    { key: 'thisYear',  label: 'This Year',    icon: 'calendar-text-outline' },
    { key: 'custom',    label: 'Custom Range', icon: 'calendar-edit' },
]

const PAD_L = 40, PAD_T = 14, PAD_B = 22, PAD_R = 6
const SVG_W = 320, SVG_H = 190
const CHART_W = SVG_W - PAD_L - PAD_R
const CHART_H = SVG_H - PAD_T - PAD_B
const CHART_BOTTOM = PAD_T + CHART_H
const GROUP_W = CHART_W / 12
const BAR_W = (GROUP_W - 6) / 2

export default {
    name: "LogbookReportsMobile",
    components: { LogbookBottomNav, LogbookTopNav },
    setup() {
        const payments = ref([])
        const loading = ref(false)
        const error = ref('')
        const selectedYear = ref(new Date().getFullYear())
        const startDate = ref('')
        const endDate = ref('')
        const ownerPage = ref('mama')
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
        const isSub  = (item, name) => normalize(item.subCategory)  === name

        const toStartOfDay = (v) => {
            if (!v) return null
            const p = v.slice(0, 10).split('-').map(Number)
            if (p.length !== 3 || p.some(isNaN)) return null
            return new Date(p[0], p[1] - 1, p[2], 0, 0, 0, 0)
        }
        const toEndOfDay = (v) => {
            if (!v) return null
            const p = v.slice(0, 10).split('-').map(Number)
            if (p.length !== 3 || p.some(isNaN)) return null
            return new Date(p[0], p[1] - 1, p[2], 23, 59, 59, 999)
        }

        const toLocalDateStr = (value) => {
            if (!value) return ''
            const d = new Date(value)
            if (isNaN(d.getTime())) return ''
            const y  = d.getFullYear()
            const m  = String(d.getMonth() + 1).padStart(2, '0')
            const dy = String(d.getDate()).padStart(2, '0')
            return `${y}-${m}-${dy}`
        }

        const summaryPayments = computed(() => {
            const start = startDate.value || null
            const end   = endDate.value   || null
            if (!start && !end) return payments.value
            return payments.value.filter((item) => {
                const d = toLocalDateStr(item.paymentDate || '')
                if (!d) return false
                if (start && d < start) return false
                if (end   && d > end)   return false
                return true
            })
        })

        const noDataInRange = computed(() => {
            if (!startDate.value && !endDate.value) return false
            return summaryPayments.value.length === 0 && payments.value.length > 0
        })

        const clearRange = () => { startDate.value = ''; endDate.value = '' }

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

        const yearOptions = computed(() => {
            const years = new Set()
            payments.value.forEach((item) => {
                const date = new Date(item.paymentDate)
                if (!isNaN(date.getTime())) years.add(date.getFullYear())
            })
            if (!years.size) years.add(new Date().getFullYear())
            return Array.from(years).sort((a, b) => b - a)
        })

        watch(yearOptions, (list) => {
            if (list.length && !list.includes(selectedYear.value)) selectedYear.value = list[0]
        }, { immediate: true })

        const buildSeries = (rentPred, expPred) => {
            const totals = Array.from({ length: 12 }, () => ({ rent: 0, expense: 0 }))
            payments.value.forEach((item) => {
                const date = new Date(item.paymentDate)
                if (isNaN(date.getTime())) return
                if (date.getFullYear() !== Number(selectedYear.value)) return
                const month = date.getMonth()
                const amount = Math.abs(Number(item.amount || 0))
                const sub = normalize(item.subCategory)
                if (rentPred(item, sub)) totals[month].rent += amount
                if (expPred(item, sub))  totals[month].expense += amount
            })
            return months.map((label, i) => ({
                label,
                rent:    totals[i].rent,
                expense: totals[i].expense,
                total:   totals[i].rent + totals[i].expense
            }))
        }

        const yellowSeries = computed(() => buildSeries(
            (item, sub) => isMain(item, 'yellow fantasy') && sub === 'rental',
            (item, sub) => isMain(item, 'yellow fantasy') && sub !== 'rental'
        ))

        const fujiSeries = computed(() => buildSeries(
            (item, sub) => (isMain(item, 'fuji view') || isMain(item, 'fuji')) && sub === 'rental',
            (item, sub) => (isMain(item, 'fuji view') || isMain(item, 'fuji')) && sub !== 'rental'
        ))

        const buildGridLines = (series) => {
            const max = Math.max(1, ...series.map(p => p.total))
            return [1, 0.75, 0.5, 0.25].map(frac => ({
                y: PAD_T + CHART_H * (1 - frac),
                label: formatCompact(max * frac),
                x1: PAD_L,
                x2: PAD_L + CHART_W
            }))
        }

        const buildSvgBars = (series) => {
            const max = Math.max(1, ...series.map(p => p.total))
            return series.map((point, i) => {
                const groupX = PAD_L + i * GROUP_W
                const rentH = max > 0 ? (point.rent / max) * CHART_H : 0
                const expH  = max > 0 ? (point.expense / max) * CHART_H : 0
                return {
                    month: point.label,
                    labelX: groupX + GROUP_W / 2,
                    labelY: CHART_BOTTOM + 13,
                    rent:    { x: groupX + 2,           y: CHART_BOTTOM - rentH, w: BAR_W, h: Math.max(rentH, 0) },
                    expense: { x: groupX + 2 + BAR_W + 2, y: CHART_BOTTOM - expH,  w: BAR_W, h: Math.max(expH, 0) }
                }
            })
        }

        const yellowGridLines = computed(() => buildGridLines(yellowSeries.value))
        const yellowSvgBars   = computed(() => buildSvgBars(yellowSeries.value))
        const yellowChartEmpty = computed(() => yellowSeries.value.every(p => p.total === 0))

        const fujiGridLines  = computed(() => buildGridLines(fujiSeries.value))
        const fujiSvgBars    = computed(() => buildSvgBars(fujiSeries.value))
        const fujiChartEmpty = computed(() => fujiSeries.value.every(p => p.total === 0))

        // AI Insights
        const aiLoading  = ref(false)
        const aiError    = ref('')
        const aiInsights = ref(null)
        // Date Range Modal (unified — controls both stats and AI insights)
        const showDateModal     = ref(false)
        const datePreset        = ref('all')
        const modalActivePreset = ref('all')
        const customFrom        = ref('')
        const customTo          = ref('')

        const toDateStr = (d) => {
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            return `${y}-${m}-${day}`
        }

        const resolvePreset = (key) => {
            const now = new Date()
            switch (key) {
                case 'all':       return { from: '', to: '' }
                case 'last7':     { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6); return { from: toDateStr(d), to: toDateStr(now) } }
                case 'last30':    { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29); return { from: toDateStr(d), to: toDateStr(now) } }
                case 'thisMonth': { return { from: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), to: toDateStr(now) } }
                case 'lastMonth': { const f = new Date(now.getFullYear(), now.getMonth() - 1, 1); const l = new Date(now.getFullYear(), now.getMonth(), 0); return { from: toDateStr(f), to: toDateStr(l) } }
                case 'thisYear':  { return { from: `${now.getFullYear()}-01-01`, to: toDateStr(now) } }
                default: return null
            }
        }

        const openDateModal = () => {
            modalActivePreset.value = datePreset.value
            if (datePreset.value === 'custom') {
                customFrom.value = startDate.value
                customTo.value   = endDate.value
            }
            showDateModal.value = true
        }

        const selectPreset = (key) => {
            modalActivePreset.value = key
            if (key === 'custom') {
                customFrom.value = startDate.value
                customTo.value   = endDate.value
                return
            }
            const range = resolvePreset(key)
            startDate.value  = range.from
            endDate.value    = range.to
            datePreset.value = key
            showDateModal.value = false
        }

        const applyCustomRange = () => {
            startDate.value  = customFrom.value
            endDate.value    = customTo.value
            datePreset.value = 'custom'
            showDateModal.value = false
        }

        const dateRangeLabel = computed(() => {
            if (datePreset.value === 'custom') {
                if (startDate.value && endDate.value) return `${startDate.value} → ${endDate.value}`
                if (startDate.value) return `From ${startDate.value}`
                if (endDate.value)   return `To ${endDate.value}`
                return 'Custom Range'
            }
            return DATE_PRESETS.find(p => p.key === datePreset.value)?.label || 'All Time'
        })

        const generateInsights = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            aiLoading.value = true
            aiError.value = ''
            aiInsights.value = null
            try {
                const params = new URLSearchParams()
                if (startDate.value) params.set('from', startDate.value)
                if (endDate.value)   params.set('to', endDate.value)
                const qs = params.toString() ? `?${params.toString()}` : ''
                const res = await fetch(`${API_BASE_URL}/api/v1/insights/logbook${qs}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to generate insights')
                aiInsights.value = data.insights
            } catch (err) {
                aiError.value = err?.message || 'Unable to generate insights'
            } finally {
                aiLoading.value = false
            }
        }

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
            payments, loading, error,
            ownerPage, selectedYear, yearOptions,
            startDate, endDate, noDataInRange,
            mamaStats, rcStats,
            yellowNet, parkingNet, fujiNet,
            yellowGridLines, yellowSvgBars, yellowChartEmpty,
            fujiGridLines, fujiSvgBars, fujiChartEmpty,
            formatMoney, formatCompact,
            aiLoading, aiError, aiInsights, generateInsights,
            datePresets: DATE_PRESETS, showDateModal, modalActivePreset,
            dateRangeLabel, customFrom, customTo,
            openDateModal, selectPreset, applyCustomRange
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>

<style scoped>
/* ── Owner switcher ── */
.rpt-switcher {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 14px 14px 0;
    position: relative;
    z-index: 1;
}

.rpt-sw-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 12px;
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 16px;
    cursor: pointer;
    transition: border-color 0.18s, box-shadow 0.18s;
    text-align: left;
    color: var(--text-primary);
    position: relative;
    overflow: hidden;
}

.rpt-sw-btn:nth-child(1).active {
    border-color: rgba(34, 197, 94, 0.45);
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.12);
}

.rpt-sw-btn:nth-child(2).active {
    border-color: rgba(56, 189, 248, 0.45);
    box-shadow: 0 4px 16px rgba(56, 189, 248, 0.12);
}

.rpt-sw-btn:nth-child(1).active::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #22c55e, #38bdf8);
}

.rpt-sw-btn:nth-child(2).active::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #38bdf8, #818cf8);
}

.rpt-sw-ic {
    width: 36px; height: 36px;
    border-radius: 11px;
    display: grid; place-items: center;
    flex-shrink: 0;
}

.mama-ic { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
.rc-ic   { background: rgba(56, 189, 248, 0.15); color: #0284c7; }

.rpt-sw-text { display: flex; flex-direction: column; gap: 1px; }
.rpt-sw-text strong { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.rpt-sw-text span   { font-size: 11px; color: var(--text-muted); }

/* ── Date filter button ── */
.rpt-filter-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 14px 0;
    padding: 10px 14px;
    border-radius: 0;
    cursor: pointer;
    width: calc(100% - 28px);
    text-align: left;
    transition: border-color 0.18s;
}

.rpt-fbtn-ic    { color: var(--text-muted); flex-shrink: 0; }
.rpt-fbtn-label { flex: 1; font-size: 13px; color: var(--text-primary); }
.rpt-fbtn-chev  { color: var(--text-muted); flex-shrink: 0; margin-left: auto; }

.rpt-no-data-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    margin: 0 0 4px;
    border-radius: 12px;
    background: rgba(255,200,0,0.08);
    border: 1px solid rgba(255,200,0,0.18);
    color: var(--text-muted);
    font-size: 13px;
}

/* ── Page section ── */
.rpt-page { gap: 0; margin-top: 14px; }

/* ── Property cards (flush style matching logbook-shell) ── */
.rpt-prop-card {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    overflow: hidden;
    margin-bottom: 0;
    border-radius: 0 !important;
}

.rpt-card-accent {
    position: absolute;
    top: 0; left: 0;
    width: 4px;
    bottom: 0;
}

.yellow-accent  { background: linear-gradient(180deg, #facc15, #f59e0b); }
.parking-accent { background: linear-gradient(180deg, #a78bfa, #818cf8); }
.fuji-accent    { background: linear-gradient(180deg, #38bdf8, #0284c7); }
.other-accent   { background: rgba(148,163,184,0.3); }

.rpt-prop-head {
    display: flex;
    align-items: center;
    gap: 9px;
    padding-left: 8px;
}

.rpt-prop-ic {
    width: 28px; height: 28px;
    border-radius: 8px;
    display: grid; place-items: center;
    flex-shrink: 0;
}

.yellow-ic  { background: rgba(250, 204, 21, 0.15); color: #d97706; }
.parking-ic { background: rgba(139, 92, 246, 0.15); color: #7c3aed; }
.fuji-ic    { background: rgba(56, 189, 248, 0.15);  color: #0284c7; }
.other-ic   { background: rgba(148,163,184,0.12); color: var(--text-muted); }

.rpt-prop-label { font-size: 13px; font-weight: 700; color: var(--text-primary); }

.rpt-stat-rows {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid var(--glass-card-border);
    padding-left: 8px;
}

.rpt-stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 9px 0;
    border-bottom: 1px solid rgba(148,163,184,0.06);
    font-size: 13px;
    color: var(--text-muted);
}

.rpt-stat-row strong { font-size: 14px; font-weight: 700; }

.income    { color: #16a34a; }
.expense   { color: #e11d48; }
.muted-val { color: var(--text-secondary); }

.rpt-net {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 12px 9px 20px;
    border-radius: 10px;
    font-size: 13px;
    margin: 0 0 0 8px;
}

.rpt-net strong { font-size: 16px; font-weight: 800; }
.rpt-net.pos { background: rgba(34, 197, 94, 0.08); color: #16a34a; }
.rpt-net.neg { background: rgba(225, 29, 72, 0.08); color: #e11d48; }

/* ── Chart ── */
.rpt-chart-wrap { padding: 0 0 4px; position: relative; z-index: 1; }

.rpt-chart-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px 10px;
}

.rpt-chart-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }

.rpt-year-sel {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    padding: 6px 10px;
    color: var(--text-primary);
    font-size: 13px;
}

.rpt-chart-card {
    padding: 12px 10px 10px;
    position: relative;
    border-radius: 0 !important;
}

.rpt-chart-legend { display: flex; gap: 14px; padding-left: 4px; margin-bottom: 8px; }
.rpt-legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }

.rpt-dot { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.rent-dot { background: linear-gradient(135deg, #38bdf8, #22c55e); }
.exp-dot  { background: linear-gradient(135deg, #fb7185, #f97316); }

.rpt-chart-empty {
    position: absolute; inset: 0;
    display: grid; place-items: center;
    font-size: 13px; color: var(--text-muted);
    pointer-events: none;
}

/* ── AI Insights panel ── */
.rpt-ai-panel {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    overflow: hidden;
    border-radius: 0 !important;
    margin-top: 12px;
}

.rpt-ai-acc {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #818cf8, #a78bfa, #c084fc);
}

.rpt-ai-head { display: flex; align-items: flex-start; gap: 12px; }

.rpt-ai-ic {
    width: 36px; height: 36px;
    border-radius: 11px;
    background: rgba(129, 140, 248, 0.12);
    border: 1px solid rgba(129, 140, 248, 0.2);
    display: grid; place-items: center;
    color: #818cf8;
    flex-shrink: 0;
}

.rpt-ai-title { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-primary); }
.rpt-ai-sub   { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); }


.rpt-ai-run {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    font-size: 14px;
    border-radius: 12px;
}

.rpt-ai-error { font-size: 13px; color: #e11d48; padding: 2px 0; }

.rpt-ai-results {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 1px solid var(--glass-card-border);
    padding-top: 12px;
}

/* ── Date Range Modal (bottom sheet) ── */
.drp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 2000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.drp-sheet {
    background: rgba(12,14,22,0.98);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 24px 24px 0 0;
    width: 100%;
    max-height: 82vh;
    overflow-y: auto;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.5);
    padding-bottom: env(safe-area-inset-bottom, 0);
}

.drp-handle {
    width: 36px; height: 4px;
    background: rgba(255,255,255,0.15);
    border-radius: 2px;
    margin: 12px auto 0;
}

.drp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
}

.drp-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }

.drp-close {
    width: 30px; height: 30px;
    border-radius: 9px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.07);
    cursor: pointer;
    display: grid; place-items: center;
    color: var(--text-muted);
}

.drp-options {
    padding: 8px 12px 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.drp-opt {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 12px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    transition: background 0.13s;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
}

.drp-opt:active { background: rgba(255,255,255,0.05); }

.drp-opt.active {
    background: rgba(129,140,248,0.1);
    border-color: rgba(129,140,248,0.25);
    color: #818cf8;
}

.drp-opt-ic {
    width: 32px; height: 32px;
    border-radius: 9px;
    background: rgba(255,255,255,0.05);
    display: grid; place-items: center;
    flex-shrink: 0;
    color: var(--text-muted);
}

.drp-opt.active .drp-opt-ic { background: rgba(129,140,248,0.15); color: #818cf8; }
.drp-check { margin-left: auto; color: #818cf8; flex-shrink: 0; }

.drp-custom {
    margin: 4px 12px 16px;
    padding: 14px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.drp-custom-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.drp-custom-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.drp-custom-field span {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
}

.drp-custom-inp {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 10px 10px;
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
    width: 100%;
}

.drp-apply {
    width: 100%;
    padding: 12px;
    font-size: 14px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
</style>
