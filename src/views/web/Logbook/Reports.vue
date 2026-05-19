<template>
<div class="logbook-page">
    <LogbookTopNav
        variant="web"
        title="Reports"
        subtitle="Property performance across all owners."
        icon="chart-line"
    />

    <!-- ── Owner page switcher ── -->
    <div class="rpt-switcher">
        <button :class="['rpt-sw-btn', { active: ownerPage === 'mama' }]" type="button" @click="ownerPage = 'mama'">
            <div class="rpt-sw-ic mama-ic"><mdicon name="account-heart-outline" size="20"/></div>
            <div class="rpt-sw-text">
                <strong>Mama</strong>
                <span>Yellow Fantasy · Parking</span>
            </div>
            <div v-if="ownerPage === 'mama'" class="rpt-sw-active-bar"></div>
        </button>
        <button :class="['rpt-sw-btn', { active: ownerPage === 'rc' }]" type="button" @click="ownerPage = 'rc'">
            <div class="rpt-sw-ic rc-ic"><mdicon name="office-building-outline" size="20"/></div>
            <div class="rpt-sw-text">
                <strong>RC</strong>
                <span>Fuji View</span>
            </div>
            <div v-if="ownerPage === 'rc'" class="rpt-sw-active-bar"></div>
        </button>
    </div>

    <!-- ── Shared date range filter ── -->
    <button class="rpt-filter-btn glass-card" type="button" @click="openDateModal()">
        <mdicon name="calendar-range-outline" size="16" class="rpt-fbtn-ic"/>
        <span class="rpt-fbtn-label">{{ dateRangeLabel }}</span>
        <mdicon name="chevron-down" size="15" class="rpt-fbtn-chev"/>
    </button>
    <div v-if="noDataInRange" class="rpt-no-data-banner">
        <mdicon name="calendar-remove-outline" size="16"/>
        No payments recorded in this date range.
    </div>

    <!-- ══════════════════════════════════════ MAMA PAGE ══ -->
    <section v-if="ownerPage === 'mama'" class="rpt-page logbook-section">

        <!-- Stats cards -->
        <div class="rpt-prop-grid">
            <div class="glass-card rpt-prop-card yellow-card">
                <header class="rpt-prop-head">
                    <div class="rpt-prop-ic yellow-ic"><mdicon name="home-outline" size="16"/></div>
                    <span class="rpt-prop-label">Yellow Fantasy</span>
                </header>
                <div class="rpt-prop-rows">
                    <div class="rpt-stat-row"><span>Rent</span><strong class="income">{{ formatMoney(mamaStats.yellowRent) }}</strong></div>
                    <div class="rpt-stat-row"><span>Expense</span><strong class="expense">{{ formatMoney(mamaStats.yellowExpense) }}</strong></div>
                </div>
                <div class="rpt-net" :class="yellowNet >= 0 ? 'pos' : 'neg'">
                    <span>Net Income</span><strong>{{ formatMoney(yellowNet) }}</strong>
                </div>
            </div>

            <div class="glass-card rpt-prop-card parking-card">
                <header class="rpt-prop-head">
                    <div class="rpt-prop-ic parking-ic"><mdicon name="car-outline" size="16"/></div>
                    <span class="rpt-prop-label">Parking</span>
                </header>
                <div class="rpt-prop-rows">
                    <div class="rpt-stat-row"><span>Rent</span><strong class="income">{{ formatMoney(mamaStats.parkingRent) }}</strong></div>
                    <div class="rpt-stat-row" v-if="mamaStats.parkingExpense > 0"><span>Expense</span><strong class="expense">{{ formatMoney(mamaStats.parkingExpense) }}</strong></div>
                </div>
                <div class="rpt-net" :class="parkingNet >= 0 ? 'pos' : 'neg'">
                    <span>Net Income</span><strong>{{ formatMoney(parkingNet) }}</strong>
                </div>
            </div>

            <div class="glass-card rpt-prop-card other-card">
                <header class="rpt-prop-head">
                    <div class="rpt-prop-ic other-ic"><mdicon name="wallet-outline" size="16"/></div>
                    <span class="rpt-prop-label">Other</span>
                </header>
                <div class="rpt-prop-rows">
                    <div class="rpt-stat-row"><span>Mama Expense</span><strong class="muted-val">{{ formatMoney(mamaStats.mamaExpense) }}</strong></div>
                    <div class="rpt-stat-row"><span>Bank Deposit</span><strong class="muted-val">{{ formatMoney(mamaStats.deposit) }}</strong></div>
                </div>
            </div>
        </div>

        <!-- Chart -->
        <div class="glass-card rpt-chart-card">
            <div class="rpt-chart-head">
                <div>
                    <h4>Yellow Fantasy</h4>
                    <p>Monthly rent &amp; expense — {{ selectedYear }}</p>
                </div>
                <select v-model="selectedYear" class="rpt-year-sel">
                    <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
            </div>
            <div class="rpt-chart-legend">
                <span class="rpt-legend-item"><i class="rpt-dot rent-dot"></i>Rental</span>
                <span class="rpt-legend-item"><i class="rpt-dot exp-dot"></i>Expense</span>
            </div>
            <div class="bar-chart">
                <div v-for="point in yellowSeries" :key="point.label" class="bar-col">
                    <div v-if="point.total" class="bar-stack">
                        <span class="bar-value" :title="formatMoney(point.total)">{{ formatCompact(point.total) }}</span>
                        <div class="bar-stack-body">
                            <div class="bar bar-rent" :style="{ height: `${(point.rent / yellowMaxTotal) * 100}%` }"></div>
                            <div class="bar bar-expense" :style="{ height: `${(point.expense / yellowMaxTotal) * 100}%` }"></div>
                        </div>
                    </div>
                    <span v-if="point.total" class="bar-label">{{ point.label }}</span>
                </div>
            </div>
            <div v-if="yellowSeries.every(p => p.total === 0)" class="rpt-chart-empty">No data for {{ selectedYear }}.</div>
        </div>

        <!-- AI Insights inline -->
        <div class="glass-card rpt-ai-panel">
            <div class="rpt-ai-header">
                <div class="rpt-ai-ic-zone"><mdicon name="robot-outline" size="22"/></div>
                <div>
                    <h4 class="rpt-ai-title">AI Insights</h4>
                    <p class="rpt-ai-sub">Property performance analysis powered by AI.</p>
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
                        <mdicon :name="alert.severity === 'HIGH' ? 'alert-circle-outline' : 'information-outline'" size="15"/>
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

        <!-- Stats cards -->
        <div class="rpt-prop-grid">
            <div class="glass-card rpt-prop-card fuji-card">
                <header class="rpt-prop-head">
                    <div class="rpt-prop-ic fuji-ic"><mdicon name="home-outline" size="16"/></div>
                    <span class="rpt-prop-label">Fuji View</span>
                </header>
                <div class="rpt-prop-rows">
                    <div class="rpt-stat-row"><span>Rent</span><strong class="income">{{ formatMoney(rcStats.fujiRent) }}</strong></div>
                    <div class="rpt-stat-row"><span>Expense</span><strong class="expense">{{ formatMoney(rcStats.fujiExpense) }}</strong></div>
                </div>
                <div class="rpt-net" :class="fujiNet >= 0 ? 'pos' : 'neg'">
                    <span>Net Income</span><strong>{{ formatMoney(fujiNet) }}</strong>
                </div>
            </div>

            <div class="glass-card rpt-prop-card other-card">
                <header class="rpt-prop-head">
                    <div class="rpt-prop-ic other-ic"><mdicon name="wallet-outline" size="16"/></div>
                    <span class="rpt-prop-label">Other</span>
                </header>
                <div class="rpt-prop-rows">
                    <div class="rpt-stat-row"><span>RC Expense</span><strong class="muted-val">{{ formatMoney(rcStats.rcExpense) }}</strong></div>
                    <div class="rpt-stat-row"><span>Bank Deposit</span><strong class="muted-val">{{ formatMoney(rcStats.deposit) }}</strong></div>
                </div>
            </div>
        </div>

        <!-- Chart -->
        <div class="glass-card rpt-chart-card">
            <div class="rpt-chart-head">
                <div>
                    <h4>Fuji View</h4>
                    <p>Monthly rent &amp; expense — {{ selectedYear }}</p>
                </div>
                <select v-model="selectedYear" class="rpt-year-sel">
                    <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                </select>
            </div>
            <div class="rpt-chart-legend">
                <span class="rpt-legend-item"><i class="rpt-dot rent-dot"></i>Rental</span>
                <span class="rpt-legend-item"><i class="rpt-dot exp-dot"></i>Expense</span>
            </div>
            <div class="bar-chart">
                <div v-for="point in fujiSeries" :key="point.label" class="bar-col">
                    <div v-if="point.total" class="bar-stack">
                        <span class="bar-value" :title="formatMoney(point.total)">{{ formatCompact(point.total) }}</span>
                        <div class="bar-stack-body">
                            <div class="bar bar-rent" :style="{ height: `${(point.rent / fujiMaxTotal) * 100}%` }"></div>
                            <div class="bar bar-expense" :style="{ height: `${(point.expense / fujiMaxTotal) * 100}%` }"></div>
                        </div>
                    </div>
                    <span v-if="point.total" class="bar-label">{{ point.label }}</span>
                </div>
            </div>
            <div v-if="fujiSeries.every(p => p.total === 0)" class="rpt-chart-empty">No data for {{ selectedYear }}.</div>
        </div>

        <!-- AI Insights inline -->
        <div class="glass-card rpt-ai-panel">
            <div class="rpt-ai-header">
                <div class="rpt-ai-ic-zone"><mdicon name="robot-outline" size="22"/></div>
                <div>
                    <h4 class="rpt-ai-title">AI Insights</h4>
                    <p class="rpt-ai-sub">Property performance analysis powered by AI.</p>
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
                        <mdicon :name="alert.severity === 'HIGH' ? 'alert-circle-outline' : 'information-outline'" size="15"/>
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

    <LogbookBottomNav variant="web" />
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

export default {
    name: "LogbookReportsWeb",
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
            return num.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 })
        }

        const isMain = (item, name) => normalize(item.mainCategory) === name
        const isSub = (item, name) => normalize(item.subCategory) === name

        const toStartOfDay = (value) => {
            if (!value) return null
            const parts = value.slice(0, 10).split('-').map(Number)
            if (parts.length !== 3 || parts.some(isNaN)) return null
            return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
        }

        const toEndOfDay = (value) => {
            if (!value) return null
            const parts = value.slice(0, 10).split('-').map(Number)
            if (parts.length !== 3 || parts.some(isNaN)) return null
            return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
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
            return months.map((label, index) => ({
                label,
                rent: totals[index].rent,
                expense: totals[index].expense,
                total: totals[index].rent + totals[index].expense
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

        const yellowMaxTotal = computed(() => Math.max(1, ...yellowSeries.value.map(item => item.total)))
        const fujiMaxTotal   = computed(() => Math.max(1, ...fujiSeries.value.map(item => item.total)))

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
            yellowSeries, fujiSeries, yellowMaxTotal, fujiMaxTotal,
            formatMoney, formatCompact,
            aiLoading, aiError, aiInsights, generateInsights,
            datePresets: DATE_PRESETS, showDateModal, modalActivePreset,
            dateRangeLabel, customFrom, customTo,
            openDateModal, selectPreset, applyCustomRange
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-web.css"></style>

<style scoped>
/* ── Owner switcher ── */
.rpt-switcher {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 20px 0 16px;
}

.rpt-sw-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 18px;
    cursor: pointer;
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
    text-align: left;
    color: var(--text-primary);
    position: relative;
    overflow: hidden;
}

.rpt-sw-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.rpt-sw-btn.active.mama-active,
.rpt-sw-btn:nth-child(1).active {
    border-color: rgba(34, 197, 94, 0.4);
    box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.15), 0 8px 24px rgba(34, 197, 94, 0.1);
}

.rpt-sw-btn:nth-child(2).active {
    border-color: rgba(56, 189, 248, 0.4);
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.15), 0 8px 24px rgba(56, 189, 248, 0.1);
}

.rpt-sw-ic {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
}

.mama-ic { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
.rc-ic   { background: rgba(56, 189, 248, 0.15); color: #0284c7; }

.rpt-sw-text { display: flex; flex-direction: column; gap: 2px; }
.rpt-sw-text strong { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.rpt-sw-text span   { font-size: 12px; color: var(--text-muted); }

.rpt-sw-active-bar {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
}
.rpt-sw-btn:nth-child(1) .rpt-sw-active-bar { background: linear-gradient(90deg, #22c55e, #38bdf8); }
.rpt-sw-btn:nth-child(2) .rpt-sw-active-bar { background: linear-gradient(90deg, #38bdf8, #818cf8); }

/* ── Date filter button ── */
.rpt-filter-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    margin-bottom: 4px;
    border-radius: 14px;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: border-color 0.18s, box-shadow 0.18s;
}

.rpt-filter-btn:hover {
    border-color: rgba(129,140,248,0.3) !important;
    box-shadow: 0 4px 16px rgba(129,140,248,0.08);
}

.rpt-fbtn-ic   { color: var(--text-muted); flex-shrink: 0; }
.rpt-fbtn-label { flex: 1; font-size: 14px; color: var(--text-primary); }
.rpt-fbtn-chev  { color: var(--text-muted); flex-shrink: 0; margin-left: auto; }

.rpt-no-data-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    margin-bottom: 4px;
    border-radius: 12px;
    background: rgba(255,200,0,0.08);
    border: 1px solid rgba(255,200,0,0.18);
    color: var(--text-muted);
    font-size: 13px;
}

/* ── Page section ── */
.rpt-page { display: grid; gap: 16px; }

/* ── Stats grid ── */
.rpt-prop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
}

.rpt-prop-card {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    overflow: hidden;
}

.rpt-prop-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
}

.yellow-card::before { background: linear-gradient(90deg, #facc15, #f59e0b); }
.parking-card::before { background: linear-gradient(90deg, #a78bfa, #818cf8); }
.fuji-card::before { background: linear-gradient(90deg, #38bdf8, #0284c7); }
.other-card::before { background: linear-gradient(90deg, rgba(148,163,184,0.5), rgba(100,116,139,0.3)); }

.rpt-prop-head {
    display: flex;
    align-items: center;
    gap: 9px;
}

.rpt-prop-ic {
    width: 30px; height: 30px;
    border-radius: 9px;
    display: grid; place-items: center;
    flex-shrink: 0;
}

.yellow-ic  { background: rgba(250, 204, 21, 0.15); color: #d97706; }
.parking-ic { background: rgba(139, 92, 246, 0.15); color: #7c3aed; }
.fuji-ic    { background: rgba(56, 189, 248, 0.15);  color: #0284c7; }
.other-ic   { background: rgba(148,163,184,0.12); color: var(--text-muted); }

.rpt-prop-label { font-size: 13px; font-weight: 700; color: var(--text-primary); }

.rpt-prop-rows { display: flex; flex-direction: column; gap: 0; border-top: 1px solid var(--glass-card-border); }

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

.rpt-stat-row strong { font-size: 15px; font-weight: 700; }

.income  { color: #16a34a; }
.expense { color: #e11d48; }
.muted-val { color: var(--text-secondary); }

.rpt-net {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 13px;
}

.rpt-net strong { font-size: 17px; font-weight: 800; }
.rpt-net.pos { background: rgba(34, 197, 94, 0.08); color: #16a34a; }
.rpt-net.neg { background: rgba(225, 29, 72, 0.08); color: #e11d48; }
.rpt-net span { color: inherit; opacity: 0.8; }

/* ── Chart card ── */
.rpt-chart-card {
    padding: 20px 20px 16px;
    position: relative;
}

.rpt-chart-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
}

.rpt-chart-head h4 { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.rpt-chart-head p  { margin: 3px 0 0; font-size: 12px; color: var(--text-muted); }

.rpt-year-sel {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    padding: 7px 10px;
    color: var(--text-primary);
    font-size: 13px;
    flex-shrink: 0;
}

.rpt-chart-legend { display: flex; gap: 14px; margin-bottom: 12px; }
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
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
    overflow: hidden;
}

.rpt-ai-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #818cf8, #a78bfa, #c084fc);
}

.rpt-ai-header { display: flex; align-items: flex-start; gap: 14px; }

.rpt-ai-ic-zone {
    width: 44px; height: 44px;
    border-radius: 14px;
    background: rgba(129, 140, 248, 0.12);
    border: 1px solid rgba(129, 140, 248, 0.2);
    display: grid; place-items: center;
    color: #818cf8;
    flex-shrink: 0;
}

.rpt-ai-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary); }
.rpt-ai-sub   { margin: 3px 0 0; font-size: 12px; color: var(--text-muted); }


.rpt-ai-run {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    width: 100%;
    padding: 12px;
    font-size: 14px;
    border-radius: 12px;
}

.rpt-ai-error { font-size: 13px; color: #e11d48; padding: 4px 0; }

.rpt-ai-results {
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-top: 1px solid var(--glass-card-border);
    padding-top: 16px;
}

@media (max-width: 640px) {
    .rpt-switcher { grid-template-columns: 1fr; }
    .rpt-prop-grid { grid-template-columns: 1fr; }
    .rpt-sw-btn { padding: 14px 16px; }
    .rpt-chart-card { padding: 14px 12px; }
}

/* ── Date Range Modal ── */
.drp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.drp-sheet {
    background: rgba(12,14,22,0.97);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 22px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    overflow: hidden;
}

.drp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
}

.drp-title { font-size: 16px; font-weight: 700; color: var(--text-primary); }

.drp-close {
    width: 32px; height: 32px;
    border-radius: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.07);
    cursor: pointer;
    display: grid; place-items: center;
    color: var(--text-muted);
    transition: background 0.15s;
}

.drp-close:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }

.drp-options {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.drp-opt {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    transition: background 0.14s, border-color 0.14s;
    text-align: left;
}

.drp-opt:hover { background: rgba(255,255,255,0.05); }

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
    transition: background 0.14s;
}

.drp-opt.active .drp-opt-ic { background: rgba(129,140,248,0.15); color: #818cf8; }
.drp-check { margin-left: auto; color: #818cf8; flex-shrink: 0; }

.drp-custom {
    margin: 0 12px 16px;
    padding: 16px;
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
    padding: 10px 12px;
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
    width: 100%;
    transition: border-color 0.15s, box-shadow 0.15s;
}

.drp-custom-inp:focus {
    border-color: rgba(129,140,248,0.4);
    box-shadow: 0 0 0 3px rgba(129,140,248,0.1);
}

.drp-apply {
    width: 100%;
    padding: 11px;
    font-size: 14px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}
</style>
