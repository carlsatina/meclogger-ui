<template>
<div class="exp-shell">
    <div class="exp-orb orb-1"></div>
    <div class="exp-orb orb-2"></div>

    <div class="exp-card">
        <!-- Header -->
        <div class="exp-header">
            <button class="icon-btn-ghost" @click="router.push('/')">
                <mdicon name="arrow-left" :size="20"/>
            </button>
            <div class="exp-title-block">
                <p class="exp-eyebrow">My wallet</p>
                <h2 class="exp-title">Expense Tracking</h2>
            </div>
            <div class="header-actions">
                <button class="ghost-btn" @click="router.push('/expense-tracking/web/insights')">
                    <mdicon name="robot-outline" :size="17"/>
                    <span>AI Insights</span>
                </button>
                <button class="primary-btn" @click="openAddExpense">
                    <mdicon name="plus" :size="17"/>
                    <span>Add Expense</span>
                </button>
            </div>
        </div>

        <!-- Tabs -->
        <div class="exp-tabs">
            <button v-for="t in tabs" :key="t.id" class="exp-tab" :class="{ active: activeTab === t.id }" @click="switchTab(t.id)">
                <mdicon :name="t.icon" :size="16"/>
                {{ t.label }}
            </button>
        </div>

        <!-- Quick-add prompt -->
        <div class="exp-quick-add-bar" :class="{ 'qa-done': webQaDone, 'qa-error': !!webQaError }">
            <mdicon v-if="webQaLoading" name="loading" :size="16" class="spin qa-icon qa-spin-icon"/>
            <mdicon v-else-if="webQaDone" name="check-circle-outline" :size="16" class="qa-icon qa-ok-icon"/>
            <mdicon v-else name="creation" :size="16" class="qa-icon qa-spark"/>
            <input
                v-model="webQaText"
                class="exp-qa-input"
                :placeholder="webQaDone ? webQaFeedback : (webQaError || 'Quick add — e.g. myjoy 650, grab 320 transport')"
                :disabled="webQaLoading"
                @keydown.enter="submitWebQa"
                @focus="webQaError = ''; webQaDone = false"
                maxlength="120"
            />
            <button v-if="webQaText.trim() && !webQaLoading" class="exp-qa-btn" @click="submitWebQa">
                <mdicon name="send" :size="15"/>
                Add
            </button>
        </div>

        <!-- ── OVERVIEW TAB ── -->
        <div v-if="activeTab === 'overview'" class="exp-content">
            <div class="stats-row">
                <div class="stat-card">
                    <p class="stat-label">This month</p>
                    <p class="stat-value">{{ fmtMoney(currentMonthTotal) }}</p>
                    <p class="stat-sub">{{ currentMonthCount }} transactions</p>
                </div>
                <div class="stat-card">
                    <p class="stat-label">Active budgets</p>
                    <p class="stat-value">{{ budgets.length }}</p>
                    <p class="stat-sub">{{ activeBudgetLabel }}</p>
                </div>
                <div class="stat-card">
                    <p class="stat-label">Subscriptions</p>
                    <p class="stat-value">{{ fmtMoney(subscriptionTotal) }}</p>
                    <p class="stat-sub">{{ subscriptions.length }} active</p>
                </div>
                <div class="stat-card stat-ai" @click="router.push('/expense-tracking/web/insights')">
                    <p class="stat-label">AI Analysis</p>
                    <p class="stat-value-sm">Spending insights</p>
                    <p class="stat-sub">Budget alerts · Trends</p>
                </div>
            </div>

            <!-- Budget progress -->
            <template v-if="budgets.length">
                <div class="section-head"><h3>Budget status</h3></div>
                <div class="budget-grid">
                    <div class="budget-card" v-for="b in budgets" :key="b.id">
                        <div class="budget-card-top">
                            <span class="budget-name">{{ b.name }}</span>
                            <span class="budget-pct" :class="budgetSevClass(b)">{{ budgetPct(b) }}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" :class="budgetSevClass(b)" :style="{ width: Math.min(budgetPct(b), 100) + '%' }"></div>
                        </div>
                        <div class="budget-card-bottom">
                            <span class="budget-spent">{{ fmtMoney(b.spent) }} spent</span>
                            <span class="budget-limit">of {{ fmtMoney(b.amount) }}</span>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Recent transactions -->
            <div class="section-head mt-section">
                <h3>Recent transactions</h3>
                <button class="text-link" @click="switchTab('transactions')">View all →</button>
            </div>
            <div v-if="recentExpenses.length" class="txn-table">
                <div class="txn-row txn-header">
                    <span>Date</span><span>Title</span><span>Category</span><span class="right">Amount</span>
                </div>
                <div class="txn-row" v-for="exp in recentExpenses" :key="exp.id">
                    <span class="txn-date">{{ fmtDate(exp.expenseDate) }}</span>
                    <span class="txn-title">{{ exp.title }}</span>
                    <span class="txn-cat">
                        <span class="cat-dot" :style="{ background: exp.categoryColor || '#6366f1' }"></span>
                        {{ exp.categoryName || '—' }}
                    </span>
                    <span class="txn-amount right">{{ fmtMoney(exp.amount) }}</span>
                </div>
            </div>
            <p v-else class="empty-hint">No transactions yet. Click "Add Expense" to get started.</p>
        </div>

        <!-- ── TRANSACTIONS TAB ── -->
        <div v-else-if="activeTab === 'transactions'" class="exp-content">
            <div class="txn-controls">
                <div class="month-nav">
                    <button class="icon-btn-ghost sm" @click="changeMonth(-1)"><mdicon name="chevron-left" :size="18"/></button>
                    <span class="month-label">{{ currentMonthLabel }}</span>
                    <button class="icon-btn-ghost sm" @click="changeMonth(1)"><mdicon name="chevron-right" :size="18"/></button>
                </div>
                <div class="filter-chips">
                    <button class="filter-chip" :class="{ active: !budgetFilterId }" @click="budgetFilterId = ''">All</button>
                    <button v-for="b in budgets" :key="b.id" class="filter-chip" :class="{ active: budgetFilterId === b.id }" @click="budgetFilterId = b.id">
                        {{ b.name }}
                    </button>
                </div>
                <button class="primary-btn sm" @click="openAddExpense">
                    <mdicon name="plus" :size="16"/><span>Add</span>
                </button>
            </div>

            <div v-if="filteredTxns.length" class="txn-table">
                <div class="txn-row txn-header">
                    <span>Date</span><span>Title</span><span>Category</span><span>Budget</span><span class="right">Amount</span><span class="right">Actions</span>
                </div>
                <div class="txn-row" v-for="exp in filteredTxns" :key="exp.id">
                    <span class="txn-date">{{ fmtDate(exp.expenseDate) }}</span>
                    <span class="txn-title">{{ exp.title }}</span>
                    <span class="txn-cat">
                        <span class="cat-dot" :style="{ background: exp.categoryColor || '#6366f1' }"></span>
                        {{ exp.categoryName || '—' }}
                    </span>
                    <span class="txn-budget">{{ budgetName(exp.budgetId) }}</span>
                    <span class="txn-amount right">{{ fmtMoney(exp.amount) }}</span>
                    <span class="txn-actions right">
                        <button class="row-action-btn" @click="startEditExpense(exp)"><mdicon name="pencil-outline" :size="14"/></button>
                        <button class="row-action-btn danger" @click="confirmDeleteExpense(exp)"><mdicon name="trash-can-outline" :size="14"/></button>
                    </span>
                </div>
                <div class="txn-footer">
                    <span>{{ filteredTxns.length }} transactions</span>
                    <span class="txn-total">Total: {{ fmtMoney(filteredTxnTotal) }}</span>
                </div>
            </div>
            <p v-else class="empty-hint">No transactions for {{ currentMonthLabel }}.</p>
        </div>

        <!-- ── BUDGETS TAB ── -->
        <div v-else-if="activeTab === 'budgets'" class="exp-content">
            <div class="section-head">
                <h3>Budgets</h3>
                <button class="primary-btn sm" @click="showBudgetForm = true">
                    <mdicon name="plus" :size="16"/><span>New budget</span>
                </button>
            </div>

            <div v-if="showBudgetForm" class="inline-form">
                <h4 class="form-title">{{ editingBudgetId ? 'Edit Budget' : 'New Budget' }}</h4>
                <div class="form-grid-2">
                    <div class="form-field">
                        <label>Name</label>
                        <input v-model="budgetForm.name" class="form-input" placeholder="e.g. Groceries"/>
                    </div>
                    <div class="form-field">
                        <label>Amount</label>
                        <input v-model="budgetForm.amount" type="number" class="form-input" placeholder="0.00"/>
                    </div>
                    <div class="form-field">
                        <label>Category</label>
                        <select v-model="budgetForm.categoryId" class="form-input">
                            <option value="">All spending (assign expenses manually)</option>
                            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Repeats</label>
                        <select v-model="budgetForm.period" class="form-input">
                            <option value="MONTHLY">Every month</option>
                            <option value="WEEKLY">Every week</option>
                            <option value="YEARLY">Every year</option>
                            <option value="ONE_TIME">One-time</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>{{ budgetForm.period === 'ONE_TIME' ? 'Start date' : 'Starts' }}</label>
                        <input v-model="budgetForm.startDate" type="date" class="form-input"/>
                    </div>
                    <div class="form-field" v-if="budgetForm.period === 'ONE_TIME'">
                        <label>End date</label>
                        <input v-model="budgetForm.endDate" type="date" class="form-input"/>
                    </div>
                    <div class="form-field">
                        <label>Alert threshold (%)</label>
                        <input v-model="budgetForm.alertThreshold" type="number" class="form-input" placeholder="80"/>
                    </div>
                </div>
                <p v-if="budgetForm.period !== 'ONE_TIME'" class="form-hint">
                    Renews automatically each {{ budgetForm.period === 'WEEKLY' ? 'week' : budgetForm.period === 'YEARLY' ? 'year' : 'month' }} — spending resets at the start of each period.
                </p>
                <p v-if="budgetError" class="form-error">{{ budgetError }}</p>
                <div class="form-actions">
                    <button class="primary-btn" :disabled="budgetSaving" @click="saveBudget">
                        {{ budgetSaving ? 'Saving…' : (editingBudgetId ? 'Update' : 'Create') }}
                    </button>
                    <button class="ghost-btn" @click="cancelBudgetForm">Cancel</button>
                </div>
            </div>

            <div v-if="budgets.length" class="budget-grid-full">
                <div class="budget-card-full" v-for="b in budgets" :key="b.id">
                    <div class="budget-card-top">
                        <div>
                            <p class="budget-name">{{ b.name }} <span class="budget-period-tag">{{ budgetPeriodLabel(b) }}</span></p>
                            <p class="budget-dates">{{ budgetWindowLabel(b) }}</p>
                        </div>
                        <div class="budget-actions">
                            <button class="row-action-btn" @click="startEditBudget(b)"><mdicon name="pencil-outline" :size="14"/></button>
                            <button class="row-action-btn danger" @click="confirmDeleteBudget(b)"><mdicon name="trash-can-outline" :size="14"/></button>
                        </div>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" :class="budgetSevClass(b)" :style="{ width: Math.min(budgetPct(b), 100) + '%' }"></div>
                    </div>
                    <div class="budget-card-bottom">
                        <span class="budget-spent">{{ fmtMoney(b.spent) }} of {{ fmtMoney(b.amount) }}</span>
                        <span class="budget-pct" :class="budgetSevClass(b)">{{ budgetPct(b) }}%</span>
                    </div>
                </div>
            </div>
            <p v-else class="empty-hint">No budgets yet. Create one to track your spending.</p>
        </div>

        <!-- ── SUBSCRIPTIONS TAB ── -->
        <div v-else-if="activeTab === 'subscriptions'" class="exp-content">
            <div class="section-head">
                <h3>Subscriptions</h3>
                <button class="primary-btn sm" @click="showSubForm = true">
                    <mdicon name="plus" :size="16"/><span>New subscription</span>
                </button>
            </div>

            <div v-if="showSubForm" class="inline-form">
                <h4 class="form-title">{{ editingSubId ? 'Edit Subscription' : 'New Subscription' }}</h4>
                <div class="form-grid-2">
                    <div class="form-field">
                        <label>Title</label>
                        <input v-model="subForm.title" class="form-input" placeholder="e.g. Netflix"/>
                    </div>
                    <div class="form-field">
                        <label>Amount</label>
                        <input v-model="subForm.amount" type="number" class="form-input" placeholder="0.00"/>
                    </div>
                    <div class="form-field">
                        <label>Currency</label>
                        <input v-model="subForm.currency" class="form-input" placeholder="PHP"/>
                    </div>
                    <div class="form-field">
                        <label>Billing cycle</label>
                        <select v-model="subForm.billingCycle" class="form-input">
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="QUARTERLY">Quarterly</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Next billing date</label>
                        <input v-model="subForm.nextBillingDate" type="date" class="form-input"/>
                    </div>
                </div>
                <p v-if="subError" class="form-error">{{ subError }}</p>
                <div class="form-actions">
                    <button class="primary-btn" :disabled="subSaving" @click="saveSub">
                        {{ subSaving ? 'Saving…' : (editingSubId ? 'Update' : 'Create') }}
                    </button>
                    <button class="ghost-btn" @click="cancelSubForm">Cancel</button>
                </div>
            </div>

            <div v-if="subscriptions.length" class="sub-table">
                <div class="txn-row txn-header">
                    <span>Title</span><span>Amount</span><span>Cycle</span><span>Next billing</span><span class="right">Actions</span>
                </div>
                <div class="txn-row" v-for="s in subscriptions" :key="s.id">
                    <span class="txn-title">{{ s.title }}</span>
                    <span class="txn-amount">{{ fmtMoney(s.amount) }}</span>
                    <span><span class="cycle-badge">{{ s.billingCycle }}</span></span>
                    <span class="txn-date">{{ s.nextBillingDate ? fmtDate(s.nextBillingDate) : '—' }}</span>
                    <span class="txn-actions right">
                        <button class="row-action-btn" @click="startEditSub(s)"><mdicon name="pencil-outline" :size="14"/></button>
                        <button class="row-action-btn danger" @click="confirmDeleteSub(s)"><mdicon name="trash-can-outline" :size="14"/></button>
                    </span>
                </div>
                <div class="txn-footer">
                    <span>{{ subscriptions.length }} active</span>
                    <span class="txn-total">Monthly total: {{ fmtMoney(subscriptionTotal) }}</span>
                </div>
            </div>
            <p v-else class="empty-hint">No subscriptions yet.</p>
        </div>
    </div>

    <!-- Add/Edit Expense Overlay -->
    <div v-if="showExpenseForm" class="overlay-bg" @click.self="cancelExpenseForm">
        <div class="overlay-panel">
            <div class="overlay-header">
                <h3>{{ editingExpenseId ? 'Edit Expense' : 'Add Expense' }}</h3>
                <button class="icon-btn-ghost" @click="cancelExpenseForm"><mdicon name="close" :size="20"/></button>
            </div>
            <div class="form-grid-2">
                <div class="form-field span-2">
                    <label>Title</label>
                    <input v-model="expenseForm.title" class="form-input" placeholder="e.g. Grocery run" autofocus/>
                </div>
                <div class="form-field">
                    <label>Amount</label>
                    <input v-model="expenseForm.amount" type="number" class="form-input" placeholder="0.00"/>
                </div>
                <div class="form-field">
                    <label>Date</label>
                    <input v-model="expenseForm.expenseDate" type="date" class="form-input"/>
                </div>
                <div class="form-field">
                    <label>Category</label>
                    <select v-model="expenseForm.categoryId" class="form-input">
                        <option value="">No category</option>
                        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select>
                </div>
                <div class="form-field">
                    <label>Budget</label>
                    <select v-model="expenseForm.budgetId" class="form-input">
                        <option value="">No budget</option>
                        <option v-for="b in budgets" :key="b.id" :value="b.id">{{ b.name }}</option>
                    </select>
                </div>
            </div>
            <p v-if="expenseError" class="form-error">{{ expenseError }}</p>
            <div class="form-actions">
                <button class="primary-btn" :disabled="expenseSaving" @click="saveExpense">
                    {{ expenseSaving ? 'Saving…' : (editingExpenseId ? 'Update' : 'Add') }}
                </button>
                <button class="ghost-btn" @click="cancelExpenseForm">Cancel</button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExpenses } from '@/composables/expenses'
import { useBudgets } from '@/composables/budgets'
import { useSubscriptions } from '@/composables/subscriptions'
import { API_BASE_URL } from '@/constants/config'

export default {
    name: 'ExpenseTrackingWeb',
    setup() {
        const router = useRouter()
        const { listExpenses, createExpense, updateExpense, deleteExpense, listCategories, quickAddExpense } = useExpenses()
        const { listBudgetSummary, createBudget, updateBudget, deleteBudget } = useBudgets()
        const { listSubscriptions, createSubscription, updateSubscription, deleteSubscription } = useSubscriptions()

        const token = () => localStorage.getItem('token')
        const todayStr = () => new Date().toISOString().slice(0, 10)

        const activeTab = ref('overview')
        const tabs = [
            { id: 'overview',       label: 'Overview',       icon: 'home-outline' },
            { id: 'transactions',   label: 'Transactions',   icon: 'format-list-bulleted' },
            { id: 'budgets',        label: 'Budgets',        icon: 'wallet-outline' },
            { id: 'subscriptions',  label: 'Subscriptions',  icon: 'repeat' },
        ]

        // ── Data ──
        const expenses    = ref([])
        const budgets     = ref([])
        const subscriptions = ref([])
        const categories  = ref([])
        const defaultCurrency = ref('PHP')

        // ── Month navigation ──
        const viewYear  = ref(new Date().getFullYear())
        const viewMonth = ref(new Date().getMonth())
        const currentMonthLabel = computed(() => {
            return new Date(viewYear.value, viewMonth.value, 1)
                .toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
        })
        const changeMonth = (dir) => {
            let m = viewMonth.value + dir
            let y = viewYear.value
            if (m < 0) { m = 11; y-- }
            if (m > 11) { m = 0; y++ }
            viewMonth.value = m
            viewYear.value = y
        }

        const budgetFilterId = ref('')

        // ── Computed ──
        const now = new Date()
        const currentMonthExpenses = computed(() =>
            expenses.value.filter(e => {
                const d = new Date(e.expenseDate)
                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
            })
        )
        const currentMonthTotal = computed(() => currentMonthExpenses.value.reduce((s, e) => s + e.amount, 0))
        const currentMonthCount = computed(() => currentMonthExpenses.value.length)
        const recentExpenses = computed(() =>
            [...expenses.value].sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate)).slice(0, 8)
        )
        const activeBudgetLabel = computed(() => {
            if (!budgets.value.length) return 'No budgets'
            const over = budgets.value.filter(b => budgetPct(b) > 100).length
            return over ? `${over} over limit` : 'All on track'
        })
        const subscriptionTotal = computed(() => {
            return subscriptions.value.reduce((s, sub) => {
                const amt = sub.amount || 0
                if (sub.billingCycle === 'YEARLY') return s + amt / 12
                if (sub.billingCycle === 'WEEKLY')  return s + amt * 4.33
                if (sub.billingCycle === 'QUARTERLY') return s + amt / 3
                return s + amt
            }, 0)
        })
        const txnsForMonth = computed(() =>
            expenses.value.filter(e => {
                const d = new Date(e.expenseDate)
                return d.getFullYear() === viewYear.value && d.getMonth() === viewMonth.value
            })
        )
        const filteredTxns = computed(() => {
            const base = txnsForMonth.value
            if (!budgetFilterId.value) return [...base].sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
            return [...base.filter(e => e.budgetId === budgetFilterId.value)]
                .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
        })
        const filteredTxnTotal = computed(() => filteredTxns.value.reduce((s, e) => s + e.amount, 0))

        // ── Helpers ──
        const fmtMoney = (n) => {
            if (n == null) return '—'
            return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
        }
        const fmtDate = (d) => {
            if (!d) return '—'
            return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        }
        const budgetPct = (b) => b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0
        const budgetSevClass = (b) => {
            const p = budgetPct(b)
            if (p > 100) return 'sev-over'
            if (p > (b.alertThreshold || 80)) return 'sev-warn'
            return 'sev-ok'
        }
        const budgetName = (id) => {
            if (!id) return '—'
            return budgets.value.find(b => b.id === id)?.name || '—'
        }
        const budgetPeriodLabel = (b) => {
            switch (b?.period) {
                case 'WEEKLY': return 'Weekly'
                case 'MONTHLY': return 'Monthly'
                case 'YEARLY': return 'Yearly'
                default: return 'One-time'
            }
        }
        // Recurring budgets store a far-future endDate, so show the current period window instead.
        const budgetWindowLabel = (b) => {
            if (b?.period && b.period !== 'ONE_TIME') {
                const start = b.windowStart || b.startDate
                return b.windowEnd ? `${fmtDate(start)} — ${fmtDate(b.windowEnd)}` : fmtDate(start)
            }
            return `${fmtDate(b.startDate)} — ${fmtDate(b.endDate)}`
        }

        // ── Load ──
        const loadAll = async () => {
            const t = token()
            if (!t) return
            const [exps, buds, subs, cats] = await Promise.all([
                listExpenses(t).catch(() => []),
                listBudgetSummary(t).catch(() => []),
                listSubscriptions(t).catch(() => []),
                listCategories(t).catch(() => []),
            ])
            expenses.value = exps.map(e => ({
                ...e,
                categoryName: e.category?.name || null,
                categoryColor: e.category?.color || null,
            }))
            budgets.value = buds
            subscriptions.value = subs
            categories.value = cats
            if (exps[0]?.currency) defaultCurrency.value = exps[0].currency
        }

        const switchTab = (id) => {
            activeTab.value = id
        }

        // ── Expense form ──
        const showExpenseForm  = ref(false)
        const expenseError     = ref('')
        const expenseSaving    = ref(false)
        const editingExpenseId = ref(null)
        const expenseForm      = ref({ title: '', amount: '', categoryId: '', budgetId: '', expenseDate: todayStr() })

        const openAddExpense = () => {
            editingExpenseId.value = null
            expenseForm.value = { title: '', amount: '', categoryId: '', budgetId: '', expenseDate: todayStr() }
            expenseError.value = ''
            showExpenseForm.value = true
        }
        const startEditExpense = (exp) => {
            editingExpenseId.value = exp.id
            expenseForm.value = {
                title: exp.title,
                amount: exp.amount,
                categoryId: exp.categoryId || '',
                budgetId: exp.budgetId || '',
                expenseDate: exp.expenseDate?.slice(0, 10) || todayStr()
            }
            expenseError.value = ''
            showExpenseForm.value = true
        }
        const cancelExpenseForm = () => {
            showExpenseForm.value = false
            editingExpenseId.value = null
        }
        const saveExpense = async () => {
            if (!expenseForm.value.title.trim() || !expenseForm.value.amount) {
                expenseError.value = 'Title and amount are required.'
                return
            }
            expenseSaving.value = true
            expenseError.value = ''
            try {
                const payload = {
                    title: expenseForm.value.title.trim(),
                    amount: parseFloat(expenseForm.value.amount),
                    categoryId: expenseForm.value.categoryId || null,
                    budgetId: expenseForm.value.budgetId || null,
                    expenseDate: expenseForm.value.expenseDate,
                    currency: defaultCurrency.value,
                }
                if (editingExpenseId.value) {
                    const updated = await updateExpense(token(), editingExpenseId.value, payload)
                    const idx = expenses.value.findIndex(e => e.id === editingExpenseId.value)
                    if (idx >= 0) expenses.value[idx] = { ...expenses.value[idx], ...updated, categoryName: categories.value.find(c => c.id === updated.categoryId)?.name || null }
                } else {
                    const created = await createExpense(token(), payload)
                    expenses.value.unshift({ ...created, categoryName: categories.value.find(c => c.id === created.categoryId)?.name || null })
                }
                cancelExpenseForm()
            } catch (e) {
                expenseError.value = e.message
            } finally {
                expenseSaving.value = false
            }
        }
        const confirmDeleteExpense = async (exp) => {
            if (!confirm(`Delete "${exp.title}"?`)) return
            await deleteExpense(token(), exp.id)
            expenses.value = expenses.value.filter(e => e.id !== exp.id)
        }

        // ── Budget form ──
        const showBudgetForm  = ref(false)
        const budgetError     = ref('')
        const budgetSaving    = ref(false)
        const editingBudgetId = ref(null)
        const budgetForm      = ref({ name: '', categoryId: '', amount: '', period: 'MONTHLY', startDate: todayStr(), endDate: todayStr(), alertThreshold: '80' })

        const startEditBudget = (b) => {
            editingBudgetId.value = b.id
            budgetForm.value = { name: b.name, categoryId: b.categoryId || '', amount: b.amount, period: b.period || 'ONE_TIME', startDate: b.startDate?.slice(0,10) || todayStr(), endDate: b.endDate?.slice(0,10) || todayStr(), alertThreshold: b.alertThreshold ?? 80 }
            showBudgetForm.value = true
        }
        const cancelBudgetForm = () => {
            showBudgetForm.value = false
            editingBudgetId.value = null
            budgetForm.value = { name: '', categoryId: '', amount: '', period: 'MONTHLY', startDate: todayStr(), endDate: todayStr(), alertThreshold: '80' }
        }
        const saveBudget = async () => {
            if (!budgetForm.value.name.trim() || !budgetForm.value.amount) {
                budgetError.value = 'Name and amount are required.'
                return
            }
            const isRecurring = budgetForm.value.period && budgetForm.value.period !== 'ONE_TIME'
            if (!budgetForm.value.startDate || (!isRecurring && !budgetForm.value.endDate)) {
                budgetError.value = isRecurring ? 'Start date is required.' : 'Start and end dates are required.'
                return
            }
            budgetSaving.value = true
            budgetError.value = ''
            try {
                const payload = { name: budgetForm.value.name.trim(), categoryId: budgetForm.value.categoryId || null, amount: parseFloat(budgetForm.value.amount), period: budgetForm.value.period || 'ONE_TIME', startDate: budgetForm.value.startDate, endDate: isRecurring ? null : budgetForm.value.endDate, alertThreshold: parseFloat(budgetForm.value.alertThreshold) || 80, active: true }
                if (editingBudgetId.value) {
                    await updateBudget(token(), editingBudgetId.value, payload)
                } else {
                    await createBudget(token(), payload)
                }
                await loadAll()
                cancelBudgetForm()
            } catch (e) {
                budgetError.value = e.message
            } finally {
                budgetSaving.value = false
            }
        }
        const confirmDeleteBudget = async (b) => {
            if (!confirm(`Delete budget "${b.name}"?`)) return
            await deleteBudget(token(), b.id)
            budgets.value = budgets.value.filter(x => x.id !== b.id)
        }

        // ── Subscription form ──
        const showSubForm  = ref(false)
        const subError     = ref('')
        const subSaving    = ref(false)
        const editingSubId = ref(null)
        const subForm      = ref({ title: '', amount: '', currency: 'PHP', billingCycle: 'MONTHLY', nextBillingDate: todayStr() })

        const startEditSub = (s) => {
            editingSubId.value = s.id
            subForm.value = { title: s.title, amount: s.amount, currency: s.currency || 'PHP', billingCycle: s.billingCycle || 'MONTHLY', nextBillingDate: s.nextBillingDate?.slice(0,10) || todayStr() }
            showSubForm.value = true
        }
        const cancelSubForm = () => {
            showSubForm.value = false
            editingSubId.value = null
            subForm.value = { title: '', amount: '', currency: 'PHP', billingCycle: 'MONTHLY', nextBillingDate: todayStr() }
        }
        const saveSub = async () => {
            if (!subForm.value.title.trim() || !subForm.value.amount) {
                subError.value = 'Title and amount are required.'
                return
            }
            subSaving.value = true
            subError.value = ''
            try {
                const payload = { title: subForm.value.title.trim(), amount: parseFloat(subForm.value.amount), currency: subForm.value.currency, billingCycle: subForm.value.billingCycle, nextBillingDate: subForm.value.nextBillingDate, active: true }
                if (editingSubId.value) {
                    const updated = await updateSubscription(token(), editingSubId.value, payload)
                    const idx = subscriptions.value.findIndex(s => s.id === editingSubId.value)
                    if (idx >= 0) subscriptions.value[idx] = { ...subscriptions.value[idx], ...updated }
                } else {
                    const created = await createSubscription(token(), payload)
                    subscriptions.value.push(created)
                }
                cancelSubForm()
            } catch (e) {
                subError.value = e.message
            } finally {
                subSaving.value = false
            }
        }
        const confirmDeleteSub = async (s) => {
            if (!confirm(`Delete subscription "${s.title}"?`)) return
            await deleteSubscription(token(), s.id)
            subscriptions.value = subscriptions.value.filter(x => x.id !== s.id)
        }

        // Web quick-add
        const webQaText = ref('')
        const webQaLoading = ref(false)
        const webQaDone = ref(false)
        const webQaError = ref('')
        const webQaFeedback = ref('')

        const submitWebQa = async () => {
            const text = webQaText.value.trim()
            if (!text || webQaLoading.value) return
            webQaLoading.value = true
            webQaError.value = ''
            webQaDone.value = false
            webQaFeedback.value = ''
            try {
                const expense = await quickAddExpense(token(), text)
                expenses.value.unshift(expense)
                webQaText.value = ''
                webQaFeedback.value = `Added: ${expense.title} · ${defaultCurrency.value} ${expense.amount}`
                webQaDone.value = true
                setTimeout(() => { webQaDone.value = false; webQaFeedback.value = '' }, 3000)
            } catch (e) {
                webQaError.value = e.message || 'Could not add expense'
                setTimeout(() => { webQaError.value = '' }, 4000)
            } finally {
                webQaLoading.value = false
            }
        }

        onMounted(loadAll)

        return {
            router, activeTab, tabs, switchTab,
            expenses, budgets, subscriptions, categories, defaultCurrency,
            viewYear, viewMonth, currentMonthLabel, changeMonth,
            budgetFilterId, currentMonthTotal, currentMonthCount,
            recentExpenses, activeBudgetLabel, subscriptionTotal,
            filteredTxns, filteredTxnTotal,
            fmtMoney, fmtDate, budgetPct, budgetSevClass, budgetName, budgetPeriodLabel, budgetWindowLabel,
            showExpenseForm, expenseForm, expenseError, expenseSaving, editingExpenseId,
            openAddExpense, startEditExpense, cancelExpenseForm, saveExpense, confirmDeleteExpense,
            showBudgetForm, budgetForm, budgetError, budgetSaving, editingBudgetId,
            startEditBudget, cancelBudgetForm, saveBudget, confirmDeleteBudget,
            showSubForm, subForm, subError, subSaving, editingSubId,
            startEditSub, cancelSubForm, saveSub, confirmDeleteSub,
            webQaText, webQaLoading, webQaDone, webQaError, webQaFeedback, submitWebQa,
        }
    }
}
</script>

<style scoped>
.exp-shell {
    min-height: 100vh;
    background: var(--bg-main);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 32px 24px 60px;
    position: relative;
    overflow: hidden;
}
.exp-orb {
    position: absolute;
    filter: blur(90px);
    opacity: 0.15;
    z-index: 0;
    border-radius: 50%;
    pointer-events: none;
}
.orb-1 { width: 500px; height: 500px; background: linear-gradient(135deg, #4f46e5, #06b6d4); top: -180px; left: -150px; }
.orb-2 { width: 360px; height: 360px; background: linear-gradient(135deg, #22c55e, #f59e0b); bottom: -120px; right: -100px; }

.exp-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1100px;
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 22px;
    padding: 28px 32px 36px;
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* Header */
.exp-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
}
.icon-btn-ghost {
    background: transparent;
    border: 1px solid var(--glass-card-border);
    border-radius: 10px;
    padding: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
}
.icon-btn-ghost:hover { background: var(--glass-ghost-bg); }
.icon-btn-ghost.sm { padding: 6px; }
.exp-title-block { flex: 1; }
.exp-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin: 0; }
.exp-title   { font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 2px 0 0; }
.header-actions { display: flex; gap: 10px; }
.primary-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #4f46e5, #06b6d4);
    border: none;
    border-radius: 11px;
    padding: 9px 16px;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
}
.primary-btn.sm { padding: 7px 12px; font-size: 12px; }
.primary-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.ghost-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 11px;
    padding: 9px 16px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}
.ghost-btn:hover { background: rgba(255,255,255,0.08); }

/* Tabs */
.exp-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--glass-card-border);
    margin-bottom: 24px;
    padding-bottom: 0;
}
.exp-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    border-radius: 8px 8px 0 0;
    transition: color 0.15s;
}
.exp-tab:hover { color: var(--text-secondary); }
.exp-tab.active { color: #818cf8; border-bottom-color: #818cf8; background: rgba(99,102,241,0.06); }

/* Quick-add bar */
.exp-quick-add-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    margin-bottom: 20px;
    border-radius: 12px;
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    transition: border-color 0.2s;
}
.exp-quick-add-bar.qa-done  { border-color: rgba(34,197,94,0.4); }
.exp-quick-add-bar.qa-error { border-color: rgba(248,113,113,0.4); }
.qa-icon { flex-shrink: 0; }
.qa-spark { color: #818cf8; }
.qa-ok-icon { color: #4ade80; }
.qa-spin-icon { color: var(--text-muted); }
.exp-qa-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 14px;
    color: var(--text-primary);
    min-width: 0;
}
.exp-qa-input::placeholder { color: var(--text-muted); }
.exp-qa-input:disabled::placeholder { color: #4ade80; font-weight: 600; }
.exp-qa-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid rgba(129,140,248,0.3);
    background: rgba(99,102,241,0.1);
    color: #818cf8;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
}
.exp-qa-btn:hover { background: rgba(99,102,241,0.18); }

.exp-content { display: flex; flex-direction: column; gap: 20px; }

/* Stats row */
.stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
}
.stat-card {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.stat-card.stat-ai {
    cursor: pointer;
    background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(34,197,94,0.07));
    border-color: rgba(99,102,241,0.22);
    transition: background 0.15s;
}
.stat-card.stat-ai:hover { background: linear-gradient(135deg, rgba(99,102,241,0.16), rgba(34,197,94,0.12)); }
.stat-label    { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin: 0; }
.stat-value    { font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 0; }
.stat-value-sm { font-size: 16px; font-weight: 700; color: #818cf8; margin: 0; }
.stat-sub      { font-size: 12px; color: var(--text-muted); margin: 0; }

/* Section head */
.section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0;
}
.section-head h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
.mt-section { margin-top: 4px; }
.text-link { background: none; border: none; color: #818cf8; font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; }
.text-link:hover { text-decoration: underline; }

/* Budget grid */
.budget-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}
.budget-grid-full {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
}
.budget-card, .budget-card-full {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.budget-card-top    { display: flex; justify-content: space-between; align-items: flex-start; }
.budget-card-bottom { display: flex; justify-content: space-between; align-items: center; }
.budget-name  { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0; }
.budget-period-tag {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    vertical-align: middle;
    color: #a78bfa;
    background: rgba(167, 139, 250, 0.14);
    border: 1px solid rgba(167, 139, 250, 0.3);
}
.form-hint { font-size: 12px; color: var(--text-muted); margin: 8px 0 0; }
.budget-dates { font-size: 11px; color: var(--text-muted); margin: 2px 0 0; }
.budget-spent { font-size: 12px; color: var(--text-muted); }
.budget-limit { font-size: 12px; color: var(--text-muted); }
.budget-pct   { font-size: 13px; font-weight: 800; }
.budget-actions { display: flex; gap: 6px; }
.sev-over { color: #f87171; }
.sev-warn { color: #fb923c; }
.sev-ok   { color: #4ade80; }
.progress-bar-bg   { width: 100%; height: 5px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s; }
.progress-bar-fill.sev-over { background: #f87171; }
.progress-bar-fill.sev-warn { background: #fb923c; }
.progress-bar-fill.sev-ok   { background: #4ade80; }

/* Transaction table */
.txn-table { display: flex; flex-direction: column; border: 1px solid var(--glass-card-border); border-radius: 12px; overflow: hidden; }
.txn-row {
    display: grid;
    grid-template-columns: 110px 1fr 140px 140px 110px 80px;
    gap: 12px;
    padding: 11px 16px;
    border-bottom: 1px solid var(--glass-card-border);
    align-items: center;
    font-size: 13px;
    color: var(--text-secondary);
}
.txn-row:last-child { border-bottom: none; }
.txn-header {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    background: rgba(255,255,255,0.03);
}
.txn-footer {
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
    font-size: 12px;
    color: var(--text-muted);
    background: rgba(255,255,255,0.03);
}
.txn-date   { color: var(--text-muted); }
.txn-title  { font-weight: 600; color: var(--text-primary); }
.txn-amount { font-weight: 700; color: var(--text-primary); }
.txn-total  { font-weight: 700; color: var(--text-primary); }
.txn-cat    { display: flex; align-items: center; gap: 6px; }
.txn-budget { color: var(--text-muted); font-size: 12px; }
.txn-actions { display: flex; gap: 6px; justify-content: flex-end; }
.cat-dot    { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.right      { text-align: right; }
.row-action-btn {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 7px;
    padding: 5px 7px;
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: background 0.1s;
}
.row-action-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
.row-action-btn.danger:hover { background: rgba(248,113,113,0.12); color: #f87171; border-color: rgba(248,113,113,0.3); }

/* Sub table */
.sub-table .txn-row { grid-template-columns: 1fr 120px 120px 140px 80px; }

/* Controls */
.txn-controls { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.month-nav { display: flex; align-items: center; gap: 8px; }
.month-label { font-size: 14px; font-weight: 700; color: var(--text-primary); min-width: 140px; text-align: center; }
.filter-chips { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
.filter-chip {
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid var(--glass-card-border);
    background: var(--glass-ghost-bg);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.12s;
}
.filter-chip.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.35); color: #818cf8; }

.cycle-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(99,102,241,0.12);
    color: #818cf8;
    border: 1px solid rgba(99,102,241,0.25);
    text-transform: uppercase;
}

/* Inline form */
.inline-form {
    background: var(--glass-ghost-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 14px;
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.form-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
.form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-field.span-2 { grid-column: 1 / -1; }
.form-field label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.form-input {
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--glass-card-border);
    border-radius: 9px;
    color: var(--text-primary);
    padding: 9px 12px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
}
.form-input:focus { border-color: rgba(99,102,241,0.5); }
.form-error  { font-size: 13px; color: #fca5a5; margin: 0; }
.form-actions { display: flex; gap: 10px; }
.empty-hint  { font-size: 14px; color: var(--text-muted); text-align: center; padding: 32px 0; }

/* Expense overlay */
.overlay-bg {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.overlay-panel {
    background: var(--glass-card-bg);
    border: 1px solid var(--glass-card-border);
    border-radius: 18px;
    padding: 24px 28px;
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.overlay-header { display: flex; align-items: center; justify-content: space-between; }
.overlay-header h3 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0; }
</style>
