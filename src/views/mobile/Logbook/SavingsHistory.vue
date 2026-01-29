<template>
<div class="logbook-shell">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>

    <LogbookTopNav
        variant="mobile"
        title="Savings History"
        subtitle="Review your saved entries."
        icon="history"
    />

    <section class="logbook-section">
        <div class="section-head">
            <div class="section-title-row">
                <h3>Saved entries</h3>
                <button class="glass-btn-ghost back-btn" type="button" @click="goBack">
                    <mdicon name="arrow-left" size="16" />
                    <span>Back</span>
                </button>
            </div>
            <p>All savings records are listed below.</p>
        </div>
        <article class="glass-card table-card">
            <div v-if="loading" class="empty-state">Loading savings…</div>
            <div v-else-if="error" class="empty-state error-text">{{ error }}</div>
            <div v-else class="table-wrap">
                <table class="logbook-table compact-table">
                    <thead>
                        <tr>
                            <th class="date-col">Date</th>
                            <th class="wrap-col">Source</th>
                            <th class="wrap-col">Notes</th>
                            <th class="number amount-col">Amount</th>
                            <th class="number balance-col">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="entry in savings" :key="entry.id">
                            <td class="date-col">{{ formatDate(entry.entryDate) }}</td>
                            <td class="wrap-col">{{ entry.source || '—' }}</td>
                            <td class="wrap-col">{{ entry.notes || '—' }}</td>
                            <td class="number amount-col">{{ formatMoney(entry.amount) }}</td>
                            <td class="number balance-col">{{ formatMoney(balanceMap.get(entry.id) || 0) }}</td>
                        </tr>
                        <tr v-if="!savings.length">
                            <td colspan="5" class="empty-row">No savings entries yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </article>
    </section>

    <LogbookBottomNav variant="mobile" />
</div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookSavingsHistoryMobile",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const router = useRouter()
        const savings = ref([])
        const loading = ref(false)
        const error = ref('')
        const balanceMap = ref(new Map())

        const formatDate = (value) => {
            if (!value) return '—'
            const date = new Date(value)
            if (Number.isNaN(date.getTime())) return '—'
            return date.toLocaleDateString()
        }

        const formatMoney = (value) => {
            const num = Number(value || 0)
            return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }

        const normalize = (value) => String(value || '').trim().toLowerCase()

        const computeBalances = (items) => {
            const sorted = [...items].sort((a, b) => {
                const aDate = new Date(a.entryDate || a.createdAt || 0).getTime()
                const bDate = new Date(b.entryDate || b.createdAt || 0).getTime()
                if (aDate !== bDate) return aDate - bDate
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
            })
            const map = new Map()
            let running = 0
            sorted.forEach((item) => {
                const amount = Math.abs(Number(item.amount || 0))
                const option = normalize(item.option)
                const isCashOut = option.includes('cash-out') || option === 'cash_out' || option === 'cashout'
                running += isCashOut ? -amount : amount
                map.set(item.id, running)
            })
            balanceMap.value = map
        }

        const loadSavings = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            loading.value = true
            error.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/savings`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to load savings history')
                savings.value = Array.isArray(data.savings) ? data.savings : []
                computeBalances(savings.value)
            } catch (err) {
                error.value = err?.message || 'Unable to load savings history'
                savings.value = []
                balanceMap.value = new Map()
            } finally {
                loading.value = false
            }
        }

        onMounted(loadSavings)

        const goBack = () => {
            if (window.history.length > 1) {
                router.back()
                return
            }
            router.push('/logbook/more')
        }

        return {
            savings,
            loading,
            error,
            formatDate,
            formatMoney,
            balanceMap,
            goBack
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-mobile.css"></style>
