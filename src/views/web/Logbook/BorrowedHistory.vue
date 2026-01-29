<template>
<div class="logbook-page">
    <LogbookTopNav
        variant="web"
        title="Borrowed History"
        subtitle="Review borrowed records without affecting balances."
        icon="history"
        action-icon="tune-variant"
        action-label="Display options"
        @action="showDisplayPanel = !showDisplayPanel"
    />

    <div v-if="showDisplayPanel" class="display-flyout">
        <div class="display-panel glass-card">
            <label class="display-option">
                <input type="checkbox" v-model="showStatus" />
                <span>Status</span>
            </label>
            <label class="display-option">
                <input type="checkbox" v-model="showDue" />
                <span>Due</span>
            </label>
        </div>
    </div>

    <section class="logbook-section">
        <div class="section-head">
            <div class="section-title-row">
                <h3>Borrowed records</h3>
                <button class="glass-btn-ghost back-btn" type="button" @click="goBack">
                    <mdicon name="arrow-left" size="16" />
                    <span>Back</span>
                </button>
            </div>
            <p>Track repayment timelines and statuses.</p>
        </div>
        <div class="glass-card table-card">
            <div v-if="loading" class="empty-state">Loading borrowed history…</div>
            <div v-else-if="error" class="empty-state error-text">{{ error }}</div>
            <div v-else class="table-wrap">
                <table class="logbook-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Person</th>
                            <th v-if="showDue">Due date</th>
                            <th v-if="showStatus">Status</th>
                            <th class="number">Amount</th>
                            <th class="number">Balance</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="entry in borrowed" :key="entry.id">
                            <td>{{ formatDate(entry.entryDate) }}</td>
                            <td>{{ entry.counterparty || '—' }}</td>
                            <td v-if="showDue">{{ formatDate(entry.dueDate) }}</td>
                            <td v-if="showStatus">{{ formatStatus(entry.status) }}</td>
                            <td class="number">{{ formatMoney(entry.amount) }}</td>
                            <td class="number">{{ formatMoney(balanceMap.get(entry.id) || 0) }}</td>
                            <td>{{ entry.notes || '—' }}</td>
                        </tr>
                        <tr v-if="!borrowed.length">
                            <td :colspan="columnCount" class="empty-row">No borrowed entries yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    <LogbookBottomNav variant="web" />
</div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '@/constants/config'
import LogbookBottomNav from '@/components/Logbook/BottomNav.vue'
import LogbookTopNav from '@/components/Logbook/TopNav.vue'

export default {
    name: "LogbookBorrowedHistoryWeb",
    components: {
        LogbookBottomNav,
        LogbookTopNav
    },
    setup() {
        const router = useRouter()
        const borrowed = ref([])
        const loading = ref(false)
        const error = ref('')
        const showDisplayPanel = ref(false)
        const showStatus = ref(true)
        const showDue = ref(true)
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

        const formatStatus = (value) => {
            if (!value) return '—'
            const text = String(value).toLowerCase()
            return text.charAt(0).toUpperCase() + text.slice(1)
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
                const isPayment = option === 'payment'
                running += isPayment ? -amount : amount
                map.set(item.id, running)
            })
            balanceMap.value = map
        }

        const loadBorrowed = async () => {
            const token = localStorage.getItem('token')
            if (!token) return
            loading.value = true
            error.value = ''
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/logbook/borrowed`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.message || 'Unable to load borrowed history')
                borrowed.value = Array.isArray(data.borrowed) ? data.borrowed : []
                computeBalances(borrowed.value)
            } catch (err) {
                error.value = err?.message || 'Unable to load borrowed history'
                borrowed.value = []
                balanceMap.value = new Map()
            } finally {
                loading.value = false
            }
        }

        onMounted(loadBorrowed)

        const goBack = () => {
            if (window.history.length > 1) {
                router.back()
                return
            }
            router.push('/logbook/more')
        }

        const columnCount = computed(() => {
            let count = 5
            if (showDue.value) count += 1
            if (showStatus.value) count += 1
            return count
        })

        return {
            borrowed,
            loading,
            error,
            formatDate,
            formatMoney,
            formatStatus,
            goBack,
            showDisplayPanel,
            showStatus,
            showDue,
            balanceMap,
            columnCount
        }
    }
}
</script>

<style scoped src="@/assets/styles/logbook/subpage-web.css"></style>
