<template>
<div class="logbook-page">
    <LogbookTopNav
        variant="web"
        title="Reports"
        subtitle="Summaries across payments, renters, and activity."
        icon="chart-line"
    />

    <section class="logbook-section">
        <div class="section-head">
            <h3>Totals</h3>
            <p>Quick totals across rent, expenses, and deposits.</p>
        </div>
        <div class="range-filter glass-card">
            <label>
                <span>From</span>
                <input type="date" v-model="startDate" />
            </label>
            <label>
                <span>To</span>
                <input type="date" v-model="endDate" />
            </label>
            <button class="glass-btn-ghost" type="button" @click="clearRange" :disabled="!startDate && !endDate">
                Clear
            </button>
        </div>
        <div class="summary-grid">
            <div v-for="item in summaryItems" :key="item.label" class="glass-card summary-card">
                <span>{{ item.label }}</span>
                <strong>{{ formatMoney(item.value) }}</strong>
            </div>
        </div>
    </section>

    <section class="logbook-section">
        <div class="section-head">
            <h3>Yearly charts</h3>
            <p>Monthly totals for Yellow Fantasy and Fuji View.</p>
        </div>
        <div class="chart-header">
            <span>Select year</span>
            <select v-model="selectedYear" class="chart-select">
                <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
            </select>
        </div>
        <div class="chart-grid">
            <div class="glass-card chart-card">
                <div class="chart-title">
                    <h4>Yellow Fantasy</h4>
                    <span>{{ selectedYear }}</span>
                </div>
                <div class="chart-legend">
                    <span class="legend-item">
                        <i class="legend-dot rent"></i>
                        Rental
                    </span>
                    <span class="legend-item">
                        <i class="legend-dot expense"></i>
                        Expense
                    </span>
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
            </div>
            <div class="glass-card chart-card">
                <div class="chart-title">
                    <h4>Fuji View</h4>
                    <span>{{ selectedYear }}</span>
                </div>
                <div class="chart-legend">
                    <span class="legend-item">
                        <i class="legend-dot rent"></i>
                        Rental
                    </span>
                    <span class="legend-item">
                        <i class="legend-dot expense"></i>
                        Expense
                    </span>
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
            </div>
        </div>
    </section>

    <LogbookBottomNav variant="web" />
</div>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookReportsWeb",
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

        const sumBy = (predicate) => summaryPayments.value
            .filter(predicate)
            .reduce((total, item) => total + Number(item.amount || 0), 0)

        const isMain = (item, name) => normalize(item.mainCategory) === name
        const isSub = (item, name) => normalize(item.subCategory) === name
        const isExpense = (item) => {
            const main = normalize(item.mainCategory)
            const sub = normalize(item.subCategory)
            if (main === 'mama expense') return true
            if (main === 'misc' && sub === 'mama cash-out') return true
            if (main === 'rc expense') return true
            if (main === 'misc' && sub === 'rc cash-out') return true
            if (main === 'bank deposit') return true
            if (main.includes('expense')) return true
            if (sub.includes('cash-out')) return true
            if (sub.includes('refund')) return true
            if (sub.includes('repair')) return true
            if (sub.includes('labor')) return true
            if (sub.includes('permit')) return true
            return false
        }

        const isGroupA = (item) => {
            const main = normalize(item.mainCategory)
            const sub = normalize(item.subCategory)
            const mama = main === 'mama expense' || sub.startsWith('mama')
            const yellowFantasy = main === 'yellow fantasy'
            const parking = main === 'parking'
            return mama || yellowFantasy || parking
        }

        const isGroupB = (item) => {
            const main = normalize(item.mainCategory)
            const sub = normalize(item.subCategory)
            const rc = main === 'rc expense' || sub.startsWith('rc')
            const fuji = main === 'fuji' || main === 'fuji view'
            return rc || fuji
        }

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

        const summaryItems = computed(() => ([
            { label: 'Total Fuji Rent', value: sumBy(item => (isMain(item, 'fuji view') || isMain(item, 'fuji')) && isSub(item, 'rental')) },
            { label: 'Total Fuji Expense', value: sumBy(item => (isMain(item, 'fuji view') || isMain(item, 'fuji')) && !isSub(item, 'rental')) },
            { label: 'RC Total Bank Deposit', value: sumBy(item => isMain(item, 'bank deposit') && isSub(item, 'rc')) },
            { label: 'RC Total Expense', value: sumBy(item => isMain(item, 'rc expense') || (isMain(item, 'misc') && isSub(item, 'rc cash-out'))) },
            { label: 'Total Yellow Rent', value: sumBy(item => isMain(item, 'yellow fantasy') && isSub(item, 'rental')) },
            { label: 'Total Yellow Expense', value: sumBy(item => isMain(item, 'yellow fantasy') && !isSub(item, 'rental')) },
            { label: 'Mama Total Bank Deposit', value: sumBy(item => isMain(item, 'bank deposit') && isSub(item, 'mama')) },
            { label: 'Mama Total Expense', value: sumBy(item => isMain(item, 'mama expense') || (isMain(item, 'misc') && isSub(item, 'mama cash-out'))) },
            { label: 'Total Parking Rent', value: sumBy(item => isMain(item, 'parking') && isSub(item, 'rental')) }
        ]))

        const getYear = (value) => {
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return null
            return date.getFullYear()
        }

        const yearOptions = computed(() => {
            const years = new Set()
            payments.value.forEach((item) => {
                const year = getYear(item.paymentDate)
                if (year) years.add(year)
            })
            if (!years.size) years.add(new Date().getFullYear())
            return Array.from(years).sort((a, b) => b - a)
        })

        watch(yearOptions, (list) => {
            if (!list.length) return
            if (!list.includes(selectedYear.value)) {
                selectedYear.value = list[0]
            }
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
                if (rentPredicate(item, sub)) {
                    totals[month].rent += amount
                }
                if (expensePredicate(item, sub)) {
                    totals[month].expense += amount
                }
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

        const yellowMaxTotal = computed(() => Math.max(1, ...yellowSeries.value.map(item => item.total)))
        const fujiMaxTotal = computed(() => Math.max(1, ...fujiSeries.value.map(item => item.total)))

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
            payments,
            loading,
            error,
            summaryItems,
            selectedYear,
            yearOptions,
            yellowSeries,
            fujiSeries,
            yellowMaxTotal,
            fujiMaxTotal,
            formatMoney,
            formatCompact,
            startDate,
            endDate,
            clearRange
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-web.css"></style>
